import React, { useEffect, useMemo, useState } from "react";
import {
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  Frown,
  Meh,
  Smile,
  Sparkles,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Task } from "../types";
import {
  GeneratePlanResponse,
  generatePlan,
  UserState as ApiUserState,
} from "@/lib/endpoints";

interface UserStatusWidgetProps {
  tasks?: Task[];
  initialUserState?: ApiUserState | null;
  onSaveUserState?: (
    payload: Pick<
      ApiUserState,
      "energy_level" | "fatigue_level" | "sleep_hours"
    >,
  ) => Promise<void> | void;
  onUpdateTask?: (task: Task) => Promise<void> | void;
}

interface SuggestedAction {
  task_id: number | string;
  action: string;
  new_hours?: number;
}

interface SuggestedPlan {
  plan_type: string;
  stance: string;
  actions: SuggestedAction[];
  score?: number;
}

interface Agent2Critique {
  plan_type: string;
  overall_critique: string;
  mutations: Array<{
    task_id: number | string;
    original_action: string;
    mutated_action: string;
    new_hours?: number;
    reason: string;
  }>;
  unchanged: Array<number | string>;
  task_reviews?: Array<{
    task_id: number | string;
    action: string;
    new_hours?: number;
    changed: boolean;
    statement: string;
  }>;
}

interface SimulationResult {
  plan_type: string;
  score: number;
  metrics: {
    completion: number;
    fatigue: number;
    overload: number;
    stability: number;
  };
  summary: string;
  actions: SuggestedAction[];
}

interface PlanningDecision {
  selected_plan: string;
  score: number;
  metrics: {
    completion: number;
    fatigue: number;
    overload: number;
    stability: number;
  };
  reasoning: string;
}

interface PlanningWorkspaceData {
  topReasoning: string;
  decision: PlanningDecision | null;
  agent1Reasoning: string;
  agent1Plans: SuggestedPlan[];
  agent2Critiques: Agent2Critique[];
  mutatedPlans: SuggestedPlan[];
  simulations: SimulationResult[];
  benchmark?: {
    wall_time_seconds: number;
    plans_simulated: number;
  };
  mathBest?: string;
  reviewRowsByPlan: Record<
    string,
    Array<{
      task_id: number | string;
      task_name: string;
      action: string;
      new_hours?: number;
      changed: boolean;
      statement: string;
    }>
  >;
}

interface TaskReviewRow {
  taskId: string;
  task: Task;
  action: string;
  newHours?: number;
  statement: string;
  apply: boolean;
  changed: boolean;
}

const emptyPlanningData: PlanningWorkspaceData = {
  topReasoning: "",
  decision: null,
  agent1Reasoning: "",
  agent1Plans: [],
  agent2Critiques: [],
  mutatedPlans: [],
  simulations: [],
  reviewRowsByPlan: {},
};

const enumToSliderValue = (
  level: ApiUserState["energy_level"] | ApiUserState["fatigue_level"],
) => {
  if (level === "low") return 20;
  if (level === "high") return 80;
  return 50;
};

const sliderValueToEnum = (value: number): ApiUserState["energy_level"] => {
  if (value <= 33) return "low";
  if (value <= 66) return "medium";
  return "high";
};

const normalizeTaskId = (value: number | string) => String(value);
const clampPercent = (value: number) =>
  Math.max(0, Math.min(100, Math.round(value * 100)));
const formatMetricPercent = (value: number) => `${clampPercent(value)}%`;

function MetricBar({
  label,
  value,
  invert = false,
}: {
  label: string;
  value: number;
  invert?: boolean;
}) {
  const normalized = invert ? 1 - value : value;
  const percent = clampPercent(normalized);

  return (
    <div className="bg-[#F4F7F5] border border-[#BFD8B8] rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[#2F3E34]/65">{label}</span>
        <span className="text-sm font-bold text-[#2F3E34]">{percent}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-[#D9E7DC] overflow-hidden">
        <div
          className="h-full rounded-full bg-[#7FB77E] transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function UserStatusWidget({
  tasks = [],
  initialUserState,
  onSaveUserState,
  onUpdateTask,
}: UserStatusWidgetProps) {
  const [savedHours, setSavedHours] = useState<number>(8);
  const [savedSleep, setSavedSleep] = useState<number>(8);
  const [savedFatigue, setSavedFatigue] = useState<number>(30);
  const [savedEnergy, setSavedEnergy] = useState<number>(70);

  const [hours, setHours] = useState<number>(8);
  const [sleep, setSleep] = useState<number>(8);
  const [fatigue, setFatigue] = useState<number>(30);
  const [energy, setEnergy] = useState<number>(70);

  const [showPrompt, setShowPrompt] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "recommendation" | "agent1" | "agent2" | "simulation"
  >("recommendation");
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionsPhase, setSuggestionsPhase] = useState<
    "idle" | "waiting" | "fetching"
  >("idle");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<SuggestedPlan | null>(null);
  const [planningData, setPlanningData] =
    useState<PlanningWorkspaceData>(emptyPlanningData);
  const [taskReviews, setTaskReviews] = useState<TaskReviewRow[]>([]);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );

  const taskLookup = useMemo(
    () =>
      tasks.reduce<Record<string, Task>>((acc, task) => {
        const taskId = normalizeTaskId(task.id);
        acc[taskId] = task;
        return acc;
      }, {}),
    [tasks],
  );

  const actionToStatement = (action: string, task: Task, newHours?: number) => {
    if (action === "compress") {
      return typeof newHours === "number"
        ? `Suggest compressing this task from ${task.estimatedHours}h to ${newHours}h to reduce workload while keeping it moving.`
        : "Suggest compressing this task to reduce workload while keeping it moving.";
    }
    if (action === "delay") {
      return "Suggest delaying this task because the current plan prioritizes other work first.";
    }
    if (action === "drop") {
      return "Suggest dropping this task from the current plan so the user can protect time and energy.";
    }
    if (action === "miss") {
      return "This task is unlikely to happen in the current plan, so it is marked as missed.";
    }
    if (action === "outsource") {
      return "Suggest outsourcing or delegating this task instead of doing it directly.";
    }
    return "Leave this task unchanged. No grounded risk was detected for it in this plan.";
  };

  useEffect(() => {
    if (
      hours !== savedHours ||
      sleep !== savedSleep ||
      fatigue !== savedFatigue ||
      energy !== savedEnergy
    ) {
      setShowPrompt(true);
    } else {
      setShowPrompt(false);
    }
  }, [
    hours,
    sleep,
    fatigue,
    energy,
    savedHours,
    savedSleep,
    savedFatigue,
    savedEnergy,
  ]);

  useEffect(() => {
    if (!initialUserState) return;

    const nextSleep = Math.max(
      0,
      Math.min(24, Number(initialUserState.sleep_hours) || 0),
    );
    const nextFatigue = enumToSliderValue(initialUserState.fatigue_level);
    const nextEnergy = enumToSliderValue(initialUserState.energy_level);

    setSavedSleep(nextSleep);
    setSavedFatigue(nextFatigue);
    setSavedEnergy(nextEnergy);

    setSleep(nextSleep);
    setFatigue(nextFatigue);
    setEnergy(nextEnergy);
  }, [initialUserState]);

  useEffect(() => {
    if (saveStatus === "idle") return;
    const timeoutId = setTimeout(() => setSaveStatus("idle"), 2200);
    return () => clearTimeout(timeoutId);
  }, [saveStatus]);

  useEffect(() => {
    if (!isLoadingSuggestions) {
      setGenerationProgress(0);
      return;
    }

    if (suggestionsPhase === "waiting") {
      setGenerationProgress(18);
      return;
    }

    if (suggestionsPhase !== "fetching") return;

    setGenerationProgress(34);

    const milestones = [48, 61, 74, 86, 94];
    let index = 0;
    const interval = setInterval(() => {
      setGenerationProgress((current) => {
        const next = milestones[index] ?? current;
        index += 1;
        return next > current ? next : current;
      });

      if (index >= milestones.length) {
        clearInterval(interval);
      }
    }, 850);

    return () => clearInterval(interval);
  }, [isLoadingSuggestions, suggestionsPhase]);

  const handleCancelPrompt = () => {
    setHours(savedHours);
    setSleep(savedSleep);
    setFatigue(savedFatigue);
    setEnergy(savedEnergy);
    setShowPrompt(false);
  };

  const persistUserState = async (showSuccessBanner: boolean) => {
    await onSaveUserState?.({
      energy_level: sliderValueToEnum(energy),
      fatigue_level: sliderValueToEnum(fatigue),
      sleep_hours: Math.round(sleep),
    });
    setSavedHours(hours);
    setSavedSleep(sleep);
    setSavedFatigue(fatigue);
    setSavedEnergy(energy);
    setShowPrompt(false);
    if (showSuccessBanner) {
      setSaveStatus("success");
    }
  };

  const normalizePlanningData = (
    payload: GeneratePlanResponse,
  ): PlanningWorkspaceData => {
    const nestedDecision = payload.best_plan?.plan_decision;
    const nestedDebug = payload.best_plan?.debug;
    const decision = payload.decision ?? nestedDecision ?? null;
    const debug = payload.debug ?? nestedDebug;
    const topReasoning =
      payload.reasoning ??
      debug?.agent1?.reasoning ??
      decision?.reasoning ??
      "No reasoning returned.";

    const agent1Plans =
      payload.plans?.map((plan) => ({
        plan_type: plan.plan_type ?? "unknown",
        stance: plan.stance ?? "",
        actions: Array.isArray(plan.actions) ? plan.actions : [],
      })) ??
      debug?.agent1?.plans ??
      [];

    return {
      topReasoning,
      decision,
      agent1Reasoning: debug?.agent1?.reasoning ?? "",
      agent1Plans,
      agent2Critiques: debug?.agent2?.critiques ?? [],
      mutatedPlans: debug?.agent2?.mutated_plans ?? [],
      simulations: debug?.layer4?.all_simulations ?? [],
      benchmark: debug?.layer4?.benchmark,
      mathBest: debug?.layer4?.math_best,
      reviewRowsByPlan: debug?.reviews ?? {},
    };
  };

  const findPlanByName = (planType: string): SuggestedPlan | null => {
    const inAgent1 = planningData.agent1Plans.find(
      (plan) => plan.plan_type === planType,
    );
    if (inAgent1) return inAgent1;

    const inMutated = planningData.mutatedPlans.find(
      (plan) => plan.plan_type === planType,
    );
    if (inMutated) return inMutated;

    const inSimulations = planningData.simulations.find(
      (plan) => plan.plan_type === planType,
    );
    if (inSimulations) {
      return {
        plan_type: inSimulations.plan_type,
        stance: inSimulations.summary,
        actions: inSimulations.actions,
        score: inSimulations.score,
      };
    }

    return null;
  };

  const handleSave = async () => {
    try {
      await persistUserState(true);
    } catch (error) {
      setSaveStatus("error");
      setShowPrompt(true);
      console.error(error);
    }
  };

  const handleGeneratePlan = async () => {
    if (!initialUserState?.id) {
      setSuggestionsError("Missing user id for planning.");
      setShowSuggestions(true);
      return;
    }

    setSuggestionsError(null);
    setSelectedPlan(null);
    setTaskReviews([]);
    setPlanningData(emptyPlanningData);
    setActiveTab("recommendation");
    setShowSuggestions(true);
    setIsLoadingSuggestions(true);
    setSuggestionsPhase("waiting");
    setGenerationProgress(10);

    try {
      await persistUserState(false);
      setSaveStatus("success");

      await new Promise((resolve) => setTimeout(resolve, 350));
      setSuggestionsPhase("fetching");

      const payload = await generatePlan({
        user: initialUserState.id,
        available_hours: Math.max(0, Number(hours) || 0),
      });

      setGenerationProgress(100);
      const normalized = normalizePlanningData(payload);
      setPlanningData(normalized);

      if (
        !normalized.decision &&
        normalized.agent1Plans.length === 0 &&
        normalized.agent2Critiques.length === 0
      ) {
        setSuggestionsError("No planning data was returned by the API.");
      }
    } catch (error) {
      setPlanningData(emptyPlanningData);
      setSuggestionsError("Could not generate a plan from the API.");
      console.error(error);
    } finally {
      setIsLoadingSuggestions(false);
      setSuggestionsPhase("idle");
    }
  };

  const handleChoosePlan = (plan: SuggestedPlan) => {
    const apiReviewRows = planningData.reviewRowsByPlan[plan.plan_type];
    if (apiReviewRows?.length) {
      const reviews = apiReviewRows
        .map((row) => {
          const taskId = normalizeTaskId(row.task_id);
          const task = taskLookup[taskId];
          if (!task) return null;

          return {
            taskId,
            task,
            action: row.action,
            newHours: row.new_hours,
            statement: row.statement,
            apply: row.changed,
            changed: row.changed,
          };
        })
        .filter((review): review is TaskReviewRow => review !== null)
        .sort((left, right) =>
          left.task.startDate.localeCompare(right.task.startDate),
        );

      setSelectedPlan(plan);
      setTaskReviews(reviews);
      setActiveTab("recommendation");
      return;
    }

    const critique = planningData.agent2Critiques.find(
      (entry) =>
        entry.plan_type === plan.plan_type ||
        `${entry.plan_type}_mutated` === plan.plan_type,
    );
    const mutationMap = new Map(
      (critique?.mutations ?? []).map((mutation) => [
        normalizeTaskId(mutation.task_id),
        mutation,
      ]),
    );
    const actionMap = new Map(
      plan.actions.map((action) => [normalizeTaskId(action.task_id), action]),
    );

    const reviews = tasks
      .map((task) => {
        const taskId = normalizeTaskId(task.id);
        const action = actionMap.get(taskId);
        const mutation = mutationMap.get(taskId);
        const actionName = action?.action ?? "proceed";
        const changed = actionName !== "proceed";
        const statement =
          mutation?.reason ??
          actionToStatement(actionName, task, action?.new_hours);

        return {
          taskId,
          task,
          action: actionName,
          newHours: action?.new_hours,
          statement,
          apply: changed,
          changed,
        };
      })
      .sort((left, right) => left.task.startDate.localeCompare(right.task.startDate));

    setSelectedPlan(plan);
    setTaskReviews(reviews);
    setActiveTab("recommendation");
  };

  const handleApplyRecommendedPlan = () => {
    if (!planningData.decision?.selected_plan) return;
    const recommendedPlan = findPlanByName(planningData.decision.selected_plan);
    if (!recommendedPlan) return;
    handleChoosePlan(recommendedPlan);
  };

  const updateReviewApproval = (taskId: string, apply: boolean) => {
    setTaskReviews((current) =>
      current.map((review) =>
        review.taskId === taskId ? { ...review, apply } : review,
      ),
    );
  };

  const setAllActionableApprovals = (apply: boolean) => {
    setTaskReviews((current) =>
      current.map((review) =>
        review.changed ? { ...review, apply } : review,
      ),
    );
  };

  const buildUpdatedTask = (review: TaskReviewRow): Task => {
    const actionNote = `[Plan suggestion] ${review.statement}`;
    const description = review.task.description
      ? `${review.task.description}\n${actionNote}`
      : actionNote;

    if (review.action === "compress") {
      return {
        ...review.task,
        estimatedHours: review.newHours ?? review.task.estimatedHours,
        description,
      };
    }
    if (review.action === "delay") {
      return { ...review.task, status: "delayed", description };
    }
    if (review.action === "drop") {
      return { ...review.task, status: "dropped", description };
    }
    if (review.action === "miss") {
      return { ...review.task, status: "missed", description };
    }
    if (review.action === "outsource") {
      return { ...review.task, description };
    }
    return review.task;
  };

  const handleApplyApprovedTasks = async () => {
    if (!onUpdateTask || !selectedPlan) return;

    try {
      const approved = taskReviews.filter((review) => review.changed && review.apply);
      for (const review of approved) {
        await onUpdateTask(buildUpdatedTask(review));
      }
      setShowSuggestions(false);
      setSelectedPlan(null);
      setTaskReviews([]);
      setSuggestionsError(null);
    } catch (error) {
      setSuggestionsError("Could not apply the approved task suggestions.");
      console.error(error);
    }
  };

  const getEnergyIcon = () => {
    if (energy > 66)
      return <BatteryFull className="text-[#7FB77E]" size={20} />;
    if (energy > 33)
      return <BatteryMedium className="text-yellow-500" size={20} />;
    return <BatteryLow className="text-red-400" size={20} />;
  };

  const getFatigueIcon = () => {
    if (fatigue > 66) return <Frown className="text-red-400" size={20} />;
    if (fatigue > 33) return <Meh className="text-yellow-500" size={20} />;
    return <Smile className="text-[#7FB77E]" size={20} />;
  };

  const renderActionSummary = (actions: SuggestedAction[]) => {
    if (actions.length === 0) return "No actions";
    return actions
      .slice(0, 2)
      .map((action) => {
        const name =
          taskLookup[normalizeTaskId(action.task_id)]?.name ??
          normalizeTaskId(action.task_id);
        return `${name}: ${action.action}`;
      })
      .join(" | ");
  };

  const renderMetricMiniBar = (value: number, invert = false) => {
    const normalized = invert ? 1 - value : value;
    const percent = clampPercent(normalized);
    return (
      <div className="min-w-[90px]">
        <div className="text-xs font-semibold text-[#2F3E34] mb-1">
          {percent}%
        </div>
        <div className="h-2 rounded-full bg-[#D9E7DC] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#7FB77E]"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#E3EFE6] p-4 rounded-xl shadow-sm border border-[#BFD8B8] relative">
      <h2 className="text-lg font-bold text-[#2F3E34] mb-3">User Status</h2>

      {showPrompt && (
        <div className="absolute -top-12 left-0 right-0 bg-[#2F3E34] text-white p-3 rounded-lg shadow-xl flex items-center justify-between z-10 animate-in fade-in slide-in-from-bottom-2">
          <span className="text-sm font-medium">
            Do you wish to save changes?
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleCancelPrompt}
              className="text-xs px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="text-xs px-3 py-1.5 rounded bg-[#7FB77E] hover:bg-[#68a367] transition-colors font-bold"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {saveStatus === "success" && (
        <div className="absolute -top-12 left-0 right-0 bg-[#7FB77E] text-white p-3 rounded-lg shadow-xl z-10 animate-in fade-in slide-in-from-bottom-2 text-sm font-medium">
          User state saved to Django.
        </div>
      )}

      {saveStatus === "error" && (
        <div className="absolute -top-12 left-0 right-0 bg-red-600 text-white p-3 rounded-lg shadow-xl z-10 animate-in fade-in slide-in-from-bottom-2 text-sm font-medium">
          Failed to save user state. Please try again.
        </div>
      )}

      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-[#2F3E34] mb-1">
              Hours Available
            </label>
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="bg-[#F4F7F5] border border-[#BFD8B8] text-[#2F3E34] text-sm rounded-lg focus:ring-[#7FB77E] focus:border-[#7FB77E] outline-none block w-full p-1.5"
              min="0"
              max="24"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-[#2F3E34] mb-1">
              Total Sleep (hrs)
            </label>
            <input
              type="number"
              value={sleep}
              onChange={(e) => setSleep(Number(e.target.value))}
              className="bg-[#F4F7F5] border border-[#BFD8B8] text-[#2F3E34] text-sm rounded-lg focus:ring-[#7FB77E] focus:border-[#7FB77E] outline-none block w-full p-1.5"
              min="0"
              max="24"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-[#2F3E34]">
                Fatigue
              </label>
              {getFatigueIcon()}
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={fatigue}
              onChange={(e) => setFatigue(Number(e.target.value))}
              className="w-full h-1.5 bg-[#BFD8B8] rounded-lg appearance-none cursor-pointer accent-[#7FB77E]"
            />
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-[#2F3E34]">
                Energy
              </label>
              {getEnergyIcon()}
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={energy}
              onChange={(e) => setEnergy(Number(e.target.value))}
              className="w-full h-1.5 bg-[#BFD8B8] rounded-lg appearance-none cursor-pointer accent-[#7FB77E]"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleSave}
            className="sm:flex-1 text-sm bg-[#F4F7F5] text-[#2F3E34] font-semibold px-4 py-2.5 rounded-lg border border-[#BFD8B8] hover:bg-white transition-colors"
          >
            Save Status
          </button>
          <button
            onClick={handleGeneratePlan}
            className="sm:flex-1 text-sm bg-[#2F3E34] text-white font-semibold px-4 py-2.5 rounded-lg border border-[#2F3E34] hover:bg-[#3b4d40] transition-colors inline-flex items-center justify-center gap-2"
          >
            <Sparkles size={16} />
            Generate Plan
          </button>
        </div>
      </div>

      {showSuggestions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2F3E34]/40 backdrop-blur-sm">
          <div className="bg-[#F4F7F5] rounded-xl shadow-xl border border-[#BFD8B8] w-full max-w-6xl overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-[#BFD8B8] bg-[#E3EFE6]">
              <h3 className="text-xl font-bold text-[#2F3E34]">
                Planning Suggestions
              </h3>
              <p className="text-sm text-[#2F3E34]/80 mt-1">
                {isLoadingSuggestions
                  ? suggestionsPhase === "waiting"
                    ? "Saving user status and preparing plan request..."
                    : "Generating plan from backend agents..."
                  : planningData.topReasoning || "No reasoning returned."}
              </p>
              {isLoadingSuggestions && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-[#2F3E34]/65 mb-1.5">
                    <span>
                      {suggestionsPhase === "waiting"
                        ? "Preparing request"
                        : "Running planner, critic, and simulation"}
                    </span>
                    <span>{generationProgress}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/70 overflow-hidden border border-[#BFD8B8]">
                    <div
                      className="h-full rounded-full bg-[#7FB77E] transition-[width] duration-500 ease-out"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 min-h-[420px] max-h-[75vh] overflow-y-auto">
              {suggestionsError && (
                <p className="text-sm text-red-600 mb-4">{suggestionsError}</p>
              )}

              {isLoadingSuggestions ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-[#BFD8B8] rounded-xl p-4 min-h-[180px] animate-pulse"
                    >
                      <div className="h-4 w-1/3 bg-[#E3EFE6] rounded mb-4" />
                      <div className="h-3 w-full bg-[#F4F7F5] rounded mb-2" />
                      <div className="h-3 w-5/6 bg-[#F4F7F5] rounded mb-2" />
                      <div className="h-3 w-2/3 bg-[#F4F7F5] rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                <Tabs
                  value={activeTab}
                  onValueChange={(value) =>
                    setActiveTab(
                      value as
                        | "recommendation"
                        | "agent1"
                        | "agent2"
                        | "simulation",
                    )
                  }
                  className="w-full"
                >
                  <TabsList className="w-full md:w-auto bg-white border border-[#BFD8B8]">
                    <TabsTrigger value="recommendation">Recommendation</TabsTrigger>
                    <TabsTrigger value="agent1">Agent 1</TabsTrigger>
                    <TabsTrigger value="agent2">Agent 2</TabsTrigger>
                    <TabsTrigger value="simulation">Simulation</TabsTrigger>
                  </TabsList>

                  <TabsContent value="recommendation" className="mt-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="lg:col-span-2 bg-white border border-[#BFD8B8] rounded-xl p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                          <div>
                            <h4 className="text-xl font-bold text-[#2F3E34]">
                              {planningData.decision?.selected_plan ?? "No recommended plan"}
                            </h4>
                            <p className="text-sm text-[#2F3E34]/70 mt-1">
                              Best recommendation from the planning pipeline.
                            </p>
                          </div>
                          {planningData.decision && (
                            <button
                              onClick={handleApplyRecommendedPlan}
                              className="text-sm bg-[#7FB77E] text-white font-semibold px-4 py-2 rounded-lg hover:bg-[#68a367] transition-colors"
                            >
                              Review Recommended Plan
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                          {planningData.decision ? (
                            <>
                              <div className="bg-[#F4F7F5] border border-[#BFD8B8] rounded-lg p-3">
                                <div className="text-xs text-[#2F3E34]/65">Score</div>
                                <div className="text-lg font-bold text-[#2F3E34]">
                                  {planningData.decision.score.toFixed(3)}
                                </div>
                              </div>
                              <div className="bg-[#F4F7F5] border border-[#BFD8B8] rounded-lg p-3">
                                <div className="text-xs text-[#2F3E34]/65">Completion</div>
                                <div className="text-lg font-bold text-[#2F3E34]">
                                  {formatMetricPercent(
                                    planningData.decision.metrics.completion,
                                  )}
                                </div>
                              </div>
                              <div className="bg-[#F4F7F5] border border-[#BFD8B8] rounded-lg p-3">
                                <div className="text-xs text-[#2F3E34]/65">Fatigue</div>
                                <div className="text-lg font-bold text-[#2F3E34]">
                                  {formatMetricPercent(
                                    planningData.decision.metrics.fatigue,
                                  )}
                                </div>
                              </div>
                              <div className="bg-[#F4F7F5] border border-[#BFD8B8] rounded-lg p-3">
                                <div className="text-xs text-[#2F3E34]/65">Stability</div>
                                <div className="text-lg font-bold text-[#2F3E34]">
                                  {formatMetricPercent(
                                    planningData.decision.metrics.stability,
                                  )}
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="col-span-full text-sm text-[#2F3E34]/65">
                              No recommendation metrics returned.
                            </div>
                          )}
                        </div>

                        {planningData.decision && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                            <MetricBar
                              label="Completion Progress"
                              value={planningData.decision.metrics.completion}
                            />
                            <MetricBar
                              label="Fatigue Headroom"
                              value={planningData.decision.metrics.fatigue}
                              invert
                            />
                            <MetricBar
                              label="Capacity Relief"
                              value={planningData.decision.metrics.overload}
                            />
                            <MetricBar
                              label="Plan Stability"
                              value={planningData.decision.metrics.stability}
                            />
                          </div>
                        )}

                        <div className="text-sm text-[#2F3E34]/80 leading-relaxed">
                          {planningData.decision?.reasoning ?? planningData.topReasoning}
                        </div>

                        {selectedPlan && (
                          <div className="mt-6 border-t border-[#BFD8B8] pt-5">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                              <div>
                                <h5 className="text-lg font-bold text-[#2F3E34]">
                                  Review Tasks For {selectedPlan.plan_type}
                                </h5>
                                <p className="text-sm text-[#2F3E34]/70">
                                  Approve only the task suggestions you want to apply. Unchanged tasks are shown for visibility.
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setAllActionableApprovals(true)}
                                  className="text-xs bg-[#E3EFE6] border border-[#BFD8B8] text-[#2F3E34] px-3 py-2 rounded-md hover:bg-white transition-colors"
                                >
                                  Approve All Changes
                                </button>
                                <button
                                  onClick={() => setAllActionableApprovals(false)}
                                  className="text-xs bg-[#F4F7F5] border border-[#BFD8B8] text-[#2F3E34] px-3 py-2 rounded-md hover:bg-white transition-colors"
                                >
                                  Clear All
                                </button>
                              </div>
                            </div>

                            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                              {taskReviews.map((review) => (
                                <div
                                  key={review.taskId}
                                  className="bg-[#F4F7F5] border border-[#BFD8B8] rounded-xl p-4"
                                >
                                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h6 className="text-sm font-bold text-[#2F3E34]">
                                          {review.task.name}
                                        </h6>
                                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white border border-[#BFD8B8] text-[#2F3E34]/75">
                                          {review.changed ? review.action : "unchanged"}
                                        </span>
                                      </div>
                                      <p className="text-xs text-[#2F3E34]/70 mt-1">
                                        {review.statement}
                                      </p>
                                      <div className="mt-2 text-[11px] text-[#2F3E34]/60">
                                        Current: {review.task.status} | Est. {review.task.estimatedHours}h
                                        {typeof review.newHours === "number"
                                          ? ` | Suggested: ${review.newHours}h`
                                          : ""}
                                      </div>
                                    </div>

                                    <label className="flex items-center gap-2 text-sm text-[#2F3E34]">
                                      <input
                                        type="checkbox"
                                        checked={review.apply}
                                        disabled={!review.changed}
                                        onChange={(event) =>
                                          updateReviewApproval(
                                            review.taskId,
                                            event.target.checked,
                                          )
                                        }
                                        className="accent-[#7FB77E]"
                                      />
                                      <span>
                                        {review.changed ? "Apply this suggestion" : "No change to apply"}
                                      </span>
                                    </label>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="flex justify-end gap-3 mt-5">
                              <button
                                onClick={() => {
                                  setSelectedPlan(null);
                                  setTaskReviews([]);
                                }}
                                className="text-sm px-4 py-2 rounded-lg border border-[#BFD8B8] text-[#2F3E34] hover:bg-white transition-colors"
                              >
                                Cancel Review
                              </button>
                              <button
                                onClick={handleApplyApprovedTasks}
                                className="text-sm px-4 py-2 rounded-lg bg-[#7FB77E] text-white font-semibold hover:bg-[#68a367] transition-colors"
                              >
                                Apply Approved Changes
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-white border border-[#BFD8B8] rounded-xl p-5">
                        <h4 className="text-base font-bold text-[#2F3E34] mb-3">
                          Backend Summary
                        </h4>
                        <div className="space-y-3 text-sm text-[#2F3E34]/80">
                          <div>
                            <div className="text-xs text-[#2F3E34]/60">Math Best</div>
                            <div className="font-semibold">{planningData.mathBest ?? "N/A"}</div>
                          </div>
                          <div>
                            <div className="text-xs text-[#2F3E34]/60">Simulations</div>
                            <div className="font-semibold">{planningData.simulations.length}</div>
                          </div>
                          <div>
                            <div className="text-xs text-[#2F3E34]/60">Benchmark</div>
                            <div className="font-semibold">
                              {planningData.benchmark
                                ? `${planningData.benchmark.wall_time_seconds}s for ${planningData.benchmark.plans_simulated} plans`
                                : "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="agent1" className="mt-4">
                    <div className="bg-white border border-[#BFD8B8] rounded-xl p-5">
                      <h4 className="text-lg font-bold text-[#2F3E34] mb-1">
                        Agent 1 Plans
                      </h4>
                      <p className="text-sm text-[#2F3E34]/70 mb-4">
                        {planningData.agent1Reasoning || "No Agent 1 reasoning returned."}
                      </p>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[760px]">
                          <thead>
                            <tr className="text-left border-b border-[#BFD8B8] text-[#2F3E34]/70">
                              <th className="py-2 pr-3">Plan</th>
                              <th className="py-2 pr-3">Stance</th>
                              <th className="py-2 pr-3">Actions</th>
                              <th className="py-2 pr-3">Score</th>
                              <th className="py-2">Use</th>
                            </tr>
                          </thead>
                          <tbody>
                            {planningData.agent1Plans.map((plan) => (
                              <tr
                                key={plan.plan_type}
                                className="border-b border-[#BFD8B8]/50 align-top"
                              >
                                <td className="py-3 pr-3 font-semibold text-[#2F3E34]">
                                  {plan.plan_type}
                                </td>
                                <td className="py-3 pr-3 text-[#2F3E34]/80">
                                  {plan.stance}
                                </td>
                                <td className="py-3 pr-3 text-[#2F3E34]/80">
                                  {renderActionSummary(plan.actions)}
                                </td>
                                <td className="py-3 pr-3 text-[#2F3E34]/80">
                                  {typeof plan.score === "number"
                                    ? plan.score.toFixed(3)
                                    : "N/A"}
                                </td>
                                <td className="py-3">
                                  <button
                                    onClick={() => handleChoosePlan(plan)}
                                    className="text-xs bg-[#E3EFE6] border border-[#BFD8B8] text-[#2F3E34] px-3 py-1.5 rounded-md hover:bg-[#7FB77E] hover:text-white transition-colors"
                                  >
                                    Review
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="agent2" className="mt-4">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      <div className="bg-white border border-[#BFD8B8] rounded-xl p-5">
                        <h4 className="text-lg font-bold text-[#2F3E34] mb-4">
                          Agent 2 Critiques
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm min-w-[620px]">
                            <thead>
                              <tr className="text-left border-b border-[#BFD8B8] text-[#2F3E34]/70">
                                <th className="py-2 pr-3">Plan</th>
                                <th className="py-2 pr-3">Critique</th>
                                <th className="py-2">Mutations</th>
                              </tr>
                            </thead>
                            <tbody>
                              {planningData.agent2Critiques.map((critique) => (
                                <tr
                                  key={critique.plan_type}
                                  className="border-b border-[#BFD8B8]/50 align-top"
                                >
                                  <td className="py-3 pr-3 font-semibold text-[#2F3E34]">
                                    {critique.plan_type}
                                  </td>
                                  <td className="py-3 pr-3 text-[#2F3E34]/80">
                                    {critique.overall_critique}
                                  </td>
                                  <td className="py-3 text-[#2F3E34]/80">
                                    {critique.mutations.length}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="bg-white border border-[#BFD8B8] rounded-xl p-5">
                        <h4 className="text-lg font-bold text-[#2F3E34] mb-4">
                          Mutated Plans
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm min-w-[620px]">
                            <thead>
                              <tr className="text-left border-b border-[#BFD8B8] text-[#2F3E34]/70">
                                <th className="py-2 pr-3">Plan</th>
                                <th className="py-2 pr-3">Mutation Count</th>
                                <th className="py-2 pr-3">Score</th>
                                <th className="py-2">Actions</th>
                                <th className="py-2">Use</th>
                              </tr>
                            </thead>
                            <tbody>
                              {planningData.mutatedPlans.map((plan) => (
                                <tr
                                  key={plan.plan_type}
                                  className="border-b border-[#BFD8B8]/50 align-top"
                                >
                                  <td className="py-3 pr-3 font-semibold text-[#2F3E34]">
                                    {plan.plan_type}
                                  </td>
                                  <td className="py-3 pr-3 text-[#2F3E34]/80">
                                    {(plan as { mutation_count?: number }).mutation_count ?? 0}
                                  </td>
                                  <td className="py-3 pr-3 text-[#2F3E34]/80">
                                    {typeof plan.score === "number"
                                      ? plan.score.toFixed(3)
                                      : "N/A"}
                                  </td>
                                  <td className="py-3 text-[#2F3E34]/80">
                                    {renderActionSummary(plan.actions)}
                                  </td>
                                  <td className="py-3">
                                    <button
                                      onClick={() => handleChoosePlan(plan)}
                                      className="text-xs bg-[#E3EFE6] border border-[#BFD8B8] text-[#2F3E34] px-3 py-1.5 rounded-md hover:bg-[#7FB77E] hover:text-white transition-colors"
                                    >
                                      Review
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="simulation" className="mt-4">
                    <div className="bg-white border border-[#BFD8B8] rounded-xl p-5">
                      <h4 className="text-lg font-bold text-[#2F3E34] mb-4">
                        Layer 4 Simulation Results
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[960px]">
                          <thead>
                            <tr className="text-left border-b border-[#BFD8B8] text-[#2F3E34]/70">
                              <th className="py-2 pr-3">Plan</th>
                              <th className="py-2 pr-3">Score</th>
                              <th className="py-2 pr-3">Completion</th>
                              <th className="py-2 pr-3">Fatigue Headroom</th>
                              <th className="py-2 pr-3">Capacity Relief</th>
                              <th className="py-2 pr-3">Stability</th>
                              <th className="py-2">Summary</th>
                            </tr>
                          </thead>
                          <tbody>
                            {planningData.simulations.map((result) => (
                              <tr
                                key={result.plan_type}
                                className="border-b border-[#BFD8B8]/50 align-top"
                              >
                                <td className="py-3 pr-3 font-semibold text-[#2F3E34]">
                                  {result.plan_type}
                                </td>
                                <td className="py-3 pr-3 text-[#2F3E34]/80">
                                  {result.score.toFixed(3)}
                                </td>
                                <td className="py-3 pr-3 text-[#2F3E34]/80">
                                  {renderMetricMiniBar(
                                    result.metrics.completion,
                                  )}
                                </td>
                                <td className="py-3 pr-3 text-[#2F3E34]/80">
                                  {renderMetricMiniBar(
                                    result.metrics.fatigue,
                                    true,
                                  )}
                                </td>
                                <td className="py-3 pr-3 text-[#2F3E34]/80">
                                  {renderMetricMiniBar(result.metrics.overload)}
                                </td>
                                <td className="py-3 pr-3 text-[#2F3E34]/80">
                                  {renderMetricMiniBar(result.metrics.stability)}
                                </td>
                                <td className="py-3 text-[#2F3E34]/80">
                                  {result.summary}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </div>

            <div className="p-4 border-t border-[#BFD8B8] bg-[#E3EFE6] flex justify-end">
              <button
                onClick={() => setShowSuggestions(false)}
                className="text-sm px-5 py-2 text-[#2F3E34] hover:bg-[#BFD8B8]/30 rounded-lg transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
