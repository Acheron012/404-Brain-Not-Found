import React, { useState } from "react";
import { Task } from "./types";
import { ProgressWidget } from "./components/ProgressWidget";
import { UserStatusWidget } from "./components/UserStatusWidget";
import { ToDoListWidget } from "./components/ToDoListWidget";
import { CalendarWidget } from "./components/CalendarWidget";
import { AddTaskWidget } from "./components/AddTaskWidget";
import { TaskModal } from "./components/TaskModal";

const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      name: "Complete Project Proposal",
      description: "Draft the initial proposal for the new client project.",
      deadline: getTodayString(),
      intensity: "Hard",
      status: "pending",
    },
    {
      id: "2",
      name: "Team Standup",
      description: "Daily team sync.",
      deadline: getTodayString(),
      intensity: "Easy",
      status: "finished",
    },
  ]);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleAddTask = (newTaskData: Omit<Task, "id" | "status">) => {
    const newTask: Task = {
      ...newTaskData,
      id: Math.random().toString(36).substr(2, 9),
      status: "not yet started",
    };
    setTasks((prev) => [...prev, newTask]);
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F7F5] p-6 font-sans text-[#2F3E34]">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-[#2F3E34]">Schedly</h1>
          <p className="text-[#2F3E34]/70 mt-2">
            Manage your tasks and track your daily progress.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="flex-none">
              <UserStatusWidget onAddTask={handleAddTask} />
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
