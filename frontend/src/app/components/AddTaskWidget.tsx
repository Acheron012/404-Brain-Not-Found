import React, { useState } from "react";
import { EnergyLevel, Intensity, Task, TaskStatus } from "../types";

interface AddTaskWidgetProps {
  onAddTask: (
    task: Omit<Task, "id" | "scheduleCondition" | "remainingTimeHours">,
  ) => void;
}

export function AddTaskWidget({ onAddTask }: AddTaskWidgetProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("1");
  const [energyRequired, setEnergyRequired] = useState<EnergyLevel>("Medium");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [intensity, setIntensity] = useState<Intensity>("Medium");
  const [status, setStatus] = useState<TaskStatus>("not yet started");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !deadline) return;

    onAddTask({
      name,
      description,
      estimatedHours: Number(estimatedHours),
      energyRequired,
      startDate,
      deadline,
      intensity,
      status,
    });

    setName("");
    setDescription("");
    setEstimatedHours("1");
    setEnergyRequired("Medium");
    setStartDate("");
    setDeadline("");
    setIntensity("Medium");
    setStatus("not yet started");
  };

  return (
    <div className="bg-[#E3EFE6] p-5 rounded-xl shadow-sm border border-[#BFD8B8] flex flex-col">
      <h2 className="text-lg font-bold text-[#2F3E34] mb-4">Add New Task</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="block text-xs font-medium text-[#2F3E34] mb-1">
            Task Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-[#F4F7F5] border border-[#BFD8B8] text-[#2F3E34] text-sm rounded-lg focus:ring-[#7FB77E] focus:border-[#7FB77E] outline-none block w-full p-2"
            placeholder="e.g., Complete Project Proposal"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#2F3E34] mb-1">
            Task Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-[#F4F7F5] border border-[#BFD8B8] text-[#2F3E34] text-sm rounded-lg focus:ring-[#7FB77E] focus:border-[#7FB77E] outline-none block w-full p-2 resize-none"
            placeholder="Details about the task..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#2F3E34] mb-1">
              Estimated Hours
            </label>
            <input
              type="number"
              min="0.25"
              step="0.25"
              required
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              className="bg-[#F4F7F5] border border-[#BFD8B8] text-[#2F3E34] text-sm rounded-lg focus:ring-[#7FB77E] focus:border-[#7FB77E] outline-none block w-full p-2"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2F3E34] mb-1">
              Energy Required
            </label>
            <select
              value={energyRequired}
              onChange={(e) => setEnergyRequired(e.target.value as EnergyLevel)}
              className="bg-[#F4F7F5] border border-[#BFD8B8] text-[#2F3E34] text-sm rounded-lg focus:ring-[#7FB77E] focus:border-[#7FB77E] outline-none block w-full p-2"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#2F3E34] mb-1">
              Task Start Date
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-[#F4F7F5] border border-[#BFD8B8] text-[#2F3E34] text-sm rounded-lg focus:ring-[#7FB77E] focus:border-[#7FB77E] outline-none block w-full p-2"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2F3E34] mb-1">
              Task Deadline
            </label>
            <input
              type="date"
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="bg-[#F4F7F5] border border-[#BFD8B8] text-[#2F3E34] text-sm rounded-lg focus:ring-[#7FB77E] focus:border-[#7FB77E] outline-none block w-full p-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#2F3E34] mb-1">
              Intensity Level
            </label>
            <select
              value={intensity}
              onChange={(e) => setIntensity(e.target.value as Intensity)}
              className="bg-[#F4F7F5] border border-[#BFD8B8] text-[#2F3E34] text-sm rounded-lg focus:ring-[#7FB77E] focus:border-[#7FB77E] outline-none block w-full p-2"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2F3E34] mb-1">
              Workflow Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="bg-[#F4F7F5] border border-[#BFD8B8] text-[#2F3E34] text-sm rounded-lg focus:ring-[#7FB77E] focus:border-[#7FB77E] outline-none block w-full p-2"
            >
              <option value="not yet started">Not yet started</option>
              <option value="in progress">In progress</option>
              <option value="finished">Finished</option>
              <option value="cancelled">Cancelled</option>
              <option value="dropped">Dropped</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full mt-2 text-white bg-[#7FB77E] hover:bg-[#68a367] focus:ring-4 focus:ring-[#BFD8B8] outline-none font-medium rounded-lg text-sm px-4 py-2.5 text-center transition-colors"
        >
          Add Task
        </button>
      </form>
    </div>
  );
}
