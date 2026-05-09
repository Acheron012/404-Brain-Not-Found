import React, { useEffect, useState } from "react";
import { EnergyLevel, Task, TaskStatus, TaskScheduleCondition } from "./types";
import { Check, Palette } from "lucide-react";
import { ProgressWidget } from "./components/ProgressWidget";
import { UserStatusWidget } from "./components/UserStatusWidget";
import { ToDoListWidget } from "./components/ToDoListWidget";
import { AllTasksWidget } from "./components/AllTasksWidget";
import { CalendarWidget } from "./components/CalendarWidget";
import { AddTaskWidget } from "./components/AddTaskWidget";
import { TaskModal } from "./components/TaskModal";
import { THEME_PALETTES, ThemeId } from "./themePalettes";
import "./theme-overrides.css";
import {
  type UserState as ApiUserState,
  createTask,
  createUserState,
  deleteTask,
  listTasks,
  listUserStates,
  patchUserState,
  patchTask,
  TaskItem,
} from "@/lib/endpoints";

// Map backend task enums to UI labels.
const levelToIntensity = (level: TaskItem["level"]): Task["intensity"] => {
  if (level === "easy") return "Easy";
  if (level === "hard") return "Hard";
  return "Medium";
};

// Map UI labels back to backend enum values.
const intensityToLevel = (intensity: Task["intensity"]): TaskItem["level"] => {
  if (intensity === "Easy") return "easy";
  if (intensity === "Hard") return "hard";
  return "medium";
};

const apiEnergyToUiEnergy = (
  energy: TaskItem["energy_required"],
): EnergyLevel => {
  if (energy === "low") return "Low";
  if (energy === "high") return "High";
  return "Medium";
};

const uiEnergyToApiEnergy = (
  energy: EnergyLevel,
): TaskItem["energy_required"] => {
  if (energy === "Low") return "low";
  if (energy === "High") return "high";
  return "medium";
};

const apiStatusToUiStatus = (status: TaskItem["status"]): TaskStatus => {
  if (status === "not_yet_started") return "not yet started";
  if (status === "in_progress") return "in progress";
  return status === "pending" ? "pending" : status;
};

const uiStatusToApiStatus = (status: TaskStatus): TaskItem["status"] => {
  if (status === "not yet started") return "not_yet_started";
  if (status === "in progress") return "in_progress";
  return status;
};

const apiScheduleConditionToUi = (
  condition?: TaskItem["schedule_condition"],
): TaskScheduleCondition => {
  if (!condition) return "upcoming";
  if (condition === "on_track") return "on track";
  if (condition === "early_start") return "early start";
  return condition.replace(/_/g, " ") as TaskScheduleCondition;
};

const mapApiTaskToUiTask = (task: TaskItem): Task => ({
  id: String(task.id),
  name: task.title,
  description: task.body ?? "",
  estimatedHours: task.remaining_hours,
  energyRequired: apiEnergyToUiEnergy(task.energy_required),
  startDate: task.start_date.slice(0, 10),
  deadline: task.deadline.slice(0, 10),
  intensity: levelToIntensity(task.level),
  status: apiStatusToUiStatus(task.status),
  scheduleCondition: apiScheduleConditionToUi(task.schedule_condition),
  remainingTimeHours: task.remaining_time_hours ?? 0,
});

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeUserId, setActiveUserId] = useState<number | null>(null);
  const [activeUserState, setActiveUserState] = useState<ApiUserState | null>(
    null,
  );
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState<ThemeId>("green");
  const [showThemePicker, setShowThemePicker] = useState(false);

  const selectedTheme = THEME_PALETTES.find((theme) => theme.id === activeTheme) ?? THEME_PALETTES[1];
  const themeStyle = selectedTheme.vars as React.CSSProperties;

  // Bootstrap data from Django: ensure a user exists, then load tasks.
  useEffect(() => {
    const initialize = async () => {
      try {
        const users = await listUserStates();
        const sortedUsers = [...users].sort((a, b) => a.id - b.id);
        const user =
          sortedUsers[0] ??
          (await createUserState({
            energy_level: "medium",
            fatigue_level: "low",
            sleep_hours: 8,
          }));
        const userId = user.id;

        setActiveUserId(userId);
        setActiveUserState(user);
        const apiTasks = await listTasks(userId);
        setTasks(apiTasks.map(mapApiTaskToUiTask));
        setApiError(null);
      } catch (error) {
        setApiError("Could not load tasks from Django API.");
        console.error(error);
      }
    };

    void initialize();
  }, []);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  // Persist new tasks to Django, then sync local UI state.
  const handleAddTask = async (
    newTaskData: Omit<Task, "id" | "scheduleCondition" | "remainingTimeHours">,
  ) => {
    if (!activeUserId) return;

    try {
      const level = intensityToLevel(newTaskData.intensity);
      const created = await createTask({
        user: activeUserId,
        title: newTaskData.name,
        body: newTaskData.description,
        remaining_hours: newTaskData.estimatedHours,
        priority_level:
          level === "easy" ? "low" : level === "hard" ? "high" : "medium",
        energy_required: uiEnergyToApiEnergy(newTaskData.energyRequired),
        status: uiStatusToApiStatus(newTaskData.status),
        level,
        start_date: `${newTaskData.startDate}T00:00:00Z`,
        deadline: `${newTaskData.deadline}T23:59:59Z`,
      });

      setTasks((prev) => [...prev, mapApiTaskToUiTask(created)]);
      setApiError(null);
    } catch (error) {
      setApiError("Could not add task to Django API.");
      console.error(error);
    }
  };

  // Delete task in Django first, then remove from UI.
  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask(Number(id));
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setApiError(null);
    } catch (error) {
      setApiError("Could not delete task from Django API.");
      console.error(error);
    }
  };

  // Persist task edits to Django and normalize response for UI.
  const handleUpdateTask = async (updatedTask: Task) => {
    if (!activeUserId) return;

    try {
      const level = intensityToLevel(updatedTask.intensity);
      const patched = await patchTask(
        Number(updatedTask.id),
        {
          user: activeUserId,
          title: updatedTask.name,
          body: updatedTask.description,
          remaining_hours: updatedTask.estimatedHours,
          priority_level:
            level === "easy" ? "low" : level === "hard" ? "high" : "medium",
          energy_required: uiEnergyToApiEnergy(updatedTask.energyRequired),
          status: uiStatusToApiStatus(updatedTask.status),
          level,
          start_date: `${updatedTask.startDate}T00:00:00Z`,
          deadline: `${updatedTask.deadline}T23:59:59Z`,
        },
        activeUserId,
      );

      const mapped = mapApiTaskToUiTask(patched);
      setTasks((prev) =>
        prev.map((t) => (t.id === updatedTask.id ? mapped : t)),
      );
      setApiError(null);
    } catch (error) {
      setApiError("Could not update task in Django API.");
      console.error(error);
    }
  };

  // Save user energy/fatigue/sleep state to Django.
  const handleSaveUserState = async (
    payload: Pick<
      ApiUserState,
      "energy_level" | "fatigue_level" | "sleep_hours"
    >,
  ) => {
    if (!activeUserId) {
      throw new Error("No active user selected.");
    }

    try {
      const updated = await patchUserState(activeUserId, payload);
      setActiveUserState(updated);
      setApiError(null);
      return updated;
    } catch (error) {
      setApiError("Could not save user state to Django API.");
      console.error(error);
      throw error;
    }
  };

  return (
    <div className="themed-dashboard min-h-screen bg-[#F4F7F5] p-6 font-sans text-[#2F3E34]" style={themeStyle}>
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-[#2F3E34]">Schedly</h1>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowThemePicker((prev) => !prev)}
                className="flex items-center gap-2 bg-[#E3EFE6] border border-[#BFD8B8] text-[#2F3E34] px-3 py-2 rounded-lg shadow-sm hover:bg-[#F4F7F5] transition-colors"
                aria-label="Theme"
                title="Theme"
              >
                <Palette size={16} />
                <span className="text-sm font-medium">Theme</span>
              </button>

              {showThemePicker && (
                <div className="absolute top-12 right-0 z-20 w-80 bg-[#F4F7F5] border border-[#BFD8B8] rounded-xl shadow-lg p-3">
                  <p className="text-xs font-semibold text-[#2F3E34]/70 mb-2">Choose a theme palette</p>
                  <div className="grid grid-cols-4 gap-2">
                    {THEME_PALETTES.map((theme) => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => {
                          setActiveTheme(theme.id);
                          setShowThemePicker(false);
                        }}
                        className="relative border border-[#BFD8B8] rounded-lg p-2 text-left hover:bg-[#E3EFE6] transition-colors"
                        title={`${theme.label}: ${theme.description}`}
                      >
                        <span
                          className="inline-block w-5 h-5 rounded-full border border-black/10"
                          style={{ backgroundColor: theme.swatch }}
                        />
                        <span className="block text-[11px] mt-1 text-[#2F3E34] leading-tight">
                          {theme.label.split(" ")[0]}
                        </span>
                        {activeTheme === theme.id && (
                          <Check size={12} className="absolute top-1.5 right-1.5 text-[#2F3E34]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <p className="text-[#2F3E34]/70 mt-2">
            Manage your tasks and track your daily progress.
          </p>
          {apiError && <p className="text-sm text-red-600 mt-2">{apiError}</p>}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="flex-none">
              {/* Pass current tasks so suggestion actions can resolve task_id -> task name. */}
              <UserStatusWidget
                onAddTask={handleAddTask}
                tasks={tasks}
                initialUserState={activeUserState}
                onSaveUserState={handleSaveUserState}
              />
            </div>

            <div className="flex-none">
              {/* Uses the same shared tasks state as UserStatus and Calendar. */}
              <ProgressWidget tasks={tasks} />
            </div>

            <div className="flex-none">
              {/* Uses the same shared tasks state for synchronized list updates. */}
              <ToDoListWidget
                tasks={tasks}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
              />
            </div>

            <div className="flex-none">
              <AllTasksWidget tasks={tasks} />
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="flex-none">
              {/* Uses the same shared tasks state for synchronized calendar badges. */}
              <CalendarWidget tasks={tasks} onDateClick={handleDateClick} />
            </div>

            <div className="flex-1 min-h-[400px]">
              <AddTaskWidget onAddTask={handleAddTask} />
            </div>
          </div>
        </div>
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        date={selectedDate}
        tasks={tasks}
        onDeleteTask={handleDeleteTask}
        onUpdateTask={handleUpdateTask}
      />
    </div>
  );
}
