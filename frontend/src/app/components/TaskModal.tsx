import React, { useState } from "react";
import { Intensity, Task, TaskStatus } from "../types";
import { Check, Edit2, Trash2, X, XCircle } from "lucide-react";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  tasks: Task[];
  onDeleteTask: (id: string) => void;
  onUpdateTask: (task: Task) => void;
}

export function TaskModal({
  isOpen,
  onClose,
  date,
  tasks,
  onDeleteTask,
  onUpdateTask,
}: TaskModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Task>>({});

  if (!isOpen || !date) return null;

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const dateString = `${y}-${m}-${d}`;

  const dateTasks = tasks.filter((t) => t.startDate === dateString);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#F4F7F5] rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-6 border-b border-[#BFD8B8] bg-[#E3EFE6]">
          <div>
            <h3 className="text-xl font-bold text-[#2F3E34]">
              Tasks for {date.toLocaleDateString()}
            </h3>
            <p className="text-sm text-[#2F3E34]/70 mt-1">
              {dateTasks.length} task{dateTasks.length !== 1 && "s"} scheduled
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#2F3E34]/50 hover:text-[#2F3E34] hover:bg-[#BFD8B8]/30 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {dateTasks.length === 0 ? (
            <div className="text-center py-10 text-[#2F3E34]/50">
              <p>No tasks scheduled for this date.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dateTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 border border-[#BFD8B8] rounded-xl bg-white shadow-sm hover:border-[#7FB77E] transition-colors"
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
                          setEditForm({
                            ...editForm,
                            description: e.target.value,
                          })
                        }
                        className="w-full text-sm text-[#2F3E34]/80 border border-[#BFD8B8] rounded p-2 focus:border-[#7FB77E] focus:outline-none resize-none bg-[#F4F7F5]"
                        rows={2}
                        placeholder="Description"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={editForm.startDate || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              startDate: e.target.value,
                            })
                          }
                          className="text-xs border border-[#BFD8B8] rounded p-1.5 bg-[#F4F7F5] text-[#2F3E34] outline-none"
                        />
                        <input
                          type="date"
                          value={editForm.deadline || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              deadline: e.target.value,
                            })
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
                          <option value="pending">Pending</option>
                          <option value="in progress">In progress</option>
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
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-[#2F3E34]">{task.name}</h4>
                        <div className="flex gap-1 ml-4">
                          <button
                            onClick={() => startEdit(task)}
                            className="p-1.5 text-[#2F3E34]/40 hover:text-[#7FB77E] hover:bg-[#E3EFE6] rounded transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => onDeleteTask(task.id)}
                            className="p-1.5 text-[#2F3E34]/40 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-[#2F3E34]/70 mb-3">
                        {task.description}
                      </p>
                      <div className="text-[11px] text-[#2F3E34]/60 mb-3">
                        Starts {task.startDate} · Due {task.deadline}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-[#BFD8B8] uppercase tracking-wider bg-[#F4F7F5] text-[#2F3E34]/80">
                          {task.intensity}
                        </span>
                        <span className="text-[11px] font-medium text-[#2F3E34]/70 bg-[#E3EFE6] px-2 py-0.5 rounded border border-[#BFD8B8]/50">
                          {task.status}
                        </span>
                        <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {task.scheduleCondition}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {dateTasks.length > 0 && (
          <div className="p-4 border-t border-[#BFD8B8] bg-[#E3EFE6] text-center">
            <button
              onClick={onClose}
              className="text-sm font-medium text-[#2F3E34]/70 hover:text-[#2F3E34] px-4 py-2"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
