import React, { useEffect, useState } from "react";
import { Task, TaskStatus } from "./types";
import { ProgressWidget } from "./components/ProgressWidget";
import { UserStatusWidget } from "./components/UserStatusWidget";
import { ToDoListWidget } from "./components/ToDoListWidget";
import { CalendarWidget } from "./components/CalendarWidget";
import { AddTaskWidget } from "./components/AddTaskWidget";
import { TaskModal } from "./components/TaskModal";
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

const apiStatusToUiStatus = (status: TaskItem["status"]): TaskStatus => {
  if (status === "not_yet_started") return "not yet started";
  return status;
};

const uiStatusToApiStatus = (status: TaskStatus): TaskItem["status"] => {
  if (status === "not yet started") return "not_yet_started";
  return status;
};

const mapApiTaskToUiTask = (task: TaskItem): Task => ({
  id: String(task.id),
  name: task.title,
  description: task.body ?? "",
  deadline: task.deadline.slice(0, 10),
  intensity: levelToIntensity(task.level),
  status: apiStatusToUiStatus(task.status),
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

  // Bootstrap data from Django: ensure a user exists, then load tasks.
  useEffect(() => {
    const initialize = async () => {
      try {
        const users = await listUserStates();
        const user =
          users[0] ??
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
  const handleAddTask = async (newTaskData: Omit<Task, "id" | "status">) => {
    if (!activeUserId) return;

    try {
      const level = intensityToLevel(newTaskData.intensity);
      const created = await createTask({
        user: activeUserId,
        title: newTaskData.name,
        body: newTaskData.description,
        remaining_hours: 1,
        priority_level:
          level === "easy" ? "low" : level === "hard" ? "high" : "medium",
        energy_required:
          level === "easy" ? "low" : level === "hard" ? "high" : "medium",
        status: "not_yet_started",
        level,
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
          remaining_hours: 1,
          priority_level:
            level === "easy" ? "low" : level === "hard" ? "high" : "medium",
          energy_required:
            level === "easy" ? "low" : level === "hard" ? "high" : "medium",
          status: uiStatusToApiStatus(updatedTask.status),
          level,
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
    if (!activeUserId) return;

    try {
      const updated = await patchUserState(activeUserId, payload);
      setActiveUserState(updated);
      setApiError(null);
    } catch (error) {
      setApiError("Could not save user state to Django API.");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F5] p-6 font-sans text-[#2F3E34]">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-[#2F3E34]">Schedly</h1>
          <p className="text-[#2F3E34]/70 mt-2">
            Manage your tasks and track your daily progress.
          </p>
          {apiError && <p className="text-sm text-red-600 mt-2">{apiError}</p>}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="flex-none">
              <UserStatusWidget
                onAddTask={handleAddTask}
                initialUserState={activeUserState}
                onSaveUserState={handleSaveUserState}
              />
            </div>

            <div className="flex-none">
              <ProgressWidget tasks={tasks} />
            </div>

            <div className="flex-1 min-h-[300px]">
              <ToDoListWidget
                tasks={tasks}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="flex-none">
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
