import React, { useEffect, useState } from "react";
import { EnergyLevel, Intensity, Task, TaskStatus } from "../types";
import {
  Check,
  Circle,
  CircleCheck,
  Clock,
  Edit2,
  Trash2,
  XCircle,
} from "lucide-react";

interface ToDoListWidgetProps {
  tasks: Task[];
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

export function ToDoListWidget({
  tasks,
  onUpdateTask,
  onDeleteTask,
}: ToDoListWidgetProps) {
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Task>>({});

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        hour: "numeric",
        minute: "2-digit",
        month: "short",
        day: "numeric",
      };
      setCurrentDateTime(now.toLocaleDateString("en-US", options));
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const todayDate = new Date();
  const y = todayDate.getFullYear();
  const m = String(todayDate.getMonth() + 1).padStart(2, "0");
  const d = String(todayDate.getDate()).padStart(2, "0");
  const today = `${y}-${m}-${d}`;
  const todayTasks = tasks.filter((task) => task.startDate === today);

  const formatRemainingTime = (hours: number) => {
    if (hours < 0) return `${Math.abs(hours).toFixed(1)}h overdue`;
    if (hours < 24) return `${hours.toFixed(1)}h left`;
    return `${(hours / 24).toFixed(1)}d left`;
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case "Easy":
        return "bg-[#BFD8B8] text-[#2F3E34] border-[#7FB77E]";
      case "Medium":
        return "bg-[#7FB77E] text-white border-[#7FB77E]";
      case "Hard":
        return "bg-[#2F3E34] text-[#E3EFE6] border-[#2F3E34]";
      default:
        return "bg-[#F4F7F5] text-[#2F3E34] border-[#BFD8B8]";
    }
  };

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setEditForm(task);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = () => {
    if (editingId && editForm.name && editForm.startDate && editForm.deadline) {
      onUpdateTask(editForm as Task);
      setEditingId(null);
    }
  };

  const toggleTaskStatus = (task: Task) => {
    const newStatus: TaskStatus =
<<<<<<< HEAD
      task.status === "finished" ? "in progress" : "finished";
=======
      task.status === "finished" ? "not yet started" : "finished";
>>>>>>> 266c0c704aa77f8b979c6b2c9c97bbb4a689645e
    onUpdateTask({ ...task, status: newStatus });
  };

  return (
    <div className="bg-[#E3EFE6] p-6 rounded-xl shadow-sm border border-[#BFD8B8] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#2F3E34] flex items-center gap-2">
          To Do List
          <span className="text-sm font-normal text-[#2F3E34]/70">
            - {currentDateTime}
          </span>
        </h2>
        <span className="text-sm font-medium text-[#2F3E34] bg-[#BFD8B8] px-3 py-1 rounded-full">
          Today
        </span>
      </div>

      <div className="pr-2 space-y-3">
        {todayTasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[#2F3E34]/50 min-h-[150px]">
            <CircleCheck size={48} className="mb-3 opacity-20" />
            <p>No tasks starting today. You're all caught up!</p>
          </div>
        ) : (
          todayTasks.map((task) => (
            <div
              key={task.id}
              className="p-4 border border-[#BFD8B8] rounded-lg bg-[#F4F7F5] hover:bg-[#E3EFE6] transition-colors group"
            >
              {editingId === task.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editForm.name || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="w-full text-sm font-bold border-b border-[#BFD8B8] focus:border-[#7FB77E] focus:outline-none py-1 bg-transparent text-[#2F3E34]"
                    placeholder="Task Name"
                  />
                  <textarea
                    value={editForm.description || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    className="w-full text-sm text-[#2F3E34]/80 border border-[#BFD8B8] rounded p-2 focus:border-[#7FB77E] focus:outline-none resize-none bg-[#F4F7F5]"
                    rows={2}
                    placeholder="Description"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="0.25"
                      step="0.25"
                      value={editForm.estimatedHours ?? ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          estimatedHours: Number(e.target.value),
                        })
                      }
                      className="text-xs border border-[#BFD8B8] rounded p-1.5 bg-[#F4F7F5] text-[#2F3E34] outline-none"
                    />
                    <select
                      value={editForm.energyRequired}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          energyRequired: e.target.value as EnergyLevel,
                        })
                      }
                      className="text-xs border border-[#BFD8B8] rounded p-1.5 bg-[#F4F7F5] text-[#2F3E34] outline-none"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={editForm.startDate || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, startDate: e.target.value })
                      }
                      className="text-xs border border-[#BFD8B8] rounded p-1.5 bg-[#F4F7F5] text-[#2F3E34] outline-none"
                    />
                    <input
                      type="date"
                      value={editForm.deadline || ""}
                      onChange={(e) =>
                        setEditForm({ ...editForm, deadline: e.target.value })
                      }
                      className="text-xs border border-[#BFD8B8] rounded p-1.5 bg-[#F4F7F5] text-[#2F3E34] outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={editForm.intensity}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          intensity: e.target.value as Intensity,
                        })
                      }
                      className="text-xs border border-[#BFD8B8] rounded p-1.5 bg-[#F4F7F5] text-[#2F3E34] outline-none"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                    <select
                      value={editForm.status}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          status: e.target.value as TaskStatus,
                        })
                      }
                      className="text-xs border border-[#BFD8B8] rounded p-1.5 flex-1 bg-[#F4F7F5] text-[#2F3E34] outline-none"
                    >
                      <option value="finished">Finished</option>
<<<<<<< HEAD
                      <option value="in progress">In progress</option>
                      <option value="delayed">Delayed</option>
=======
                      <option value="pending">Pending</option>
                      <option value="in progress">In progress</option>
>>>>>>> 266c0c704aa77f8b979c6b2c9c97bbb4a689645e
                      <option value="cancelled">Cancelled</option>
                      <option value="dropped">Dropped</option>
                      <option value="not yet started">Not yet started</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={cancelEdit}
                      className="p-1.5 text-[#2F3E34]/50 hover:bg-[#BFD8B8]/30 rounded"
                    >
                      <XCircle size={18} />
                    </button>
                    <button
                      onClick={saveEdit}
                      className="p-1.5 text-[#7FB77E] hover:bg-[#E3EFE6] rounded"
                    >
                      <Check size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleTaskStatus(task)}
                    className="mt-0.5 text-[#2F3E34]/40 hover:text-[#7FB77E] transition-colors"
                  >
                    {task.status === "finished" ? (
                      <CircleCheck className="text-[#7FB77E]" size={20} />
                    ) : (
                      <Circle size={20} />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4
                        className={`text-sm font-bold truncate ${task.status === "finished" ? "line-through text-[#2F3E34]/40" : "text-[#2F3E34]"}`}
                      >
                        {task.name}
                      </h4>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(task)}
                          className="p-1 text-[#2F3E34]/40 hover:text-[#7FB77E] hover:bg-[#E3EFE6] rounded transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => onDeleteTask(task.id)}
                          className="p-1 text-[#2F3E34]/40 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {task.description && (
                      <p className="text-xs text-[#2F3E34]/70 mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <div className="mt-2 text-[11px] text-[#2F3E34]/60">
                      Starts {task.startDate} | Due {task.deadline}
                    </div>
                    <div className="mt-1 text-[11px] text-[#2F3E34]/60">
                      Est. {task.estimatedHours}h | Energy {task.energyRequired} | {formatRemainingTime(task.remainingTimeHours)}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getIntensityColor(task.intensity)}`}
                      >
                        {task.intensity}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-medium text-[#2F3E34]/70">
                        <Clock size={12} />
                        {task.status}
                      </span>
                      <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {task.scheduleCondition}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
