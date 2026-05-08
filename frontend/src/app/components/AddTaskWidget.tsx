import React, { useState } from 'react';
import { Task, Intensity } from '../types';

interface AddTaskWidgetProps {
  onAddTask: (task: Omit<Task, 'id' | 'status'>) => void;
}

export function AddTaskWidget({ onAddTask }: AddTaskWidgetProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [intensity, setIntensity] = useState<Intensity>('Medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !deadline) return;
    
    onAddTask({
      name,
      description,
      deadline,
      intensity
    });
    
    // Reset form
    setName('');
    setDescription('');
    setDeadline('');
    setIntensity('Medium');
  };

  return (
    <div className="bg-[#E3EFE6] p-5 rounded-xl shadow-sm border border-[#BFD8B8] flex flex-col">
      <h2 className="text-lg font-bold text-[#2F3E34] mb-4">Add New Task</h2>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="block text-xs font-medium text-[#2F3E34] mb-1">Task Name</label>
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
          <label className="block text-xs font-medium text-[#2F3E34] mb-1">Task Description</label>
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
            <label className="block text-xs font-medium text-[#2F3E34] mb-1">Task Deadline</label>
            <input 
              type="date" 
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="bg-[#F4F7F5] border border-[#BFD8B8] text-[#2F3E34] text-sm rounded-lg focus:ring-[#7FB77E] focus:border-[#7FB77E] outline-none block w-full p-2"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2F3E34] mb-1">Intensity Level</label>
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
