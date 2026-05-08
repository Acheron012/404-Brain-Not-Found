import React, { useMemo, useState } from 'react';
import { Task } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ProgressWidgetProps {
  tasks: Task[];
}

export function ProgressWidget({ tasks }: ProgressWidgetProps) {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const stats = useMemo(() => {
    const counts = {
      finished: 0,
      pending: 0,
      delayed: 0,
      cancelled: 0,
      dropped: 0,
      missed: 0,
      'not yet started': 0,
    };
    tasks.forEach(task => {
      counts[task.status]++;
    });
    return counts;
  }, [tasks]);

  // Mock data for the chart based on timeframe
  const chartData = useMemo(() => {
    if (timeframe === 'daily') {
      return [
        { name: 'Mon', completed: 2, new: 3 },
        { name: 'Tue', completed: 4, new: 1 },
        { name: 'Wed', completed: 1, new: 5 },
        { name: 'Thu', completed: 5, new: 2 },
        { name: 'Fri', completed: 3, new: 3 },
        { name: 'Sat', completed: 0, new: 0 },
        { name: 'Sun', completed: 1, new: 1 },
      ];
    } else if (timeframe === 'weekly') {
      return [
        { name: 'Week 1', completed: 12, new: 15 },
        { name: 'Week 2', completed: 18, new: 20 },
        { name: 'Week 3', completed: 15, new: 10 },
        { name: 'Week 4', completed: 22, new: 25 },
      ];
    } else {
      return [
        { name: 'Jan', completed: 45, new: 50 },
        { name: 'Feb', completed: 52, new: 60 },
        { name: 'Mar', completed: 38, new: 45 },
        { name: 'Apr', completed: 65, new: 70 },
      ];
    }
  }, [timeframe]);

  return (
    <div className="bg-[#E3EFE6] p-6 rounded-xl shadow-sm border border-[#BFD8B8] flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#2F3E34]">Progress</h2>
        <select 
          className="bg-[#F4F7F5] border border-[#BFD8B8] text-[#2F3E34] text-sm rounded-lg focus:ring-[#7FB77E] focus:border-[#7FB77E] block p-2 outline-none"
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value as any)}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      <div className="h-64 w-full mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#BFD8B8" opacity={0.5} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#2F3E34' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#2F3E34' }} />
            <Tooltip 
              cursor={{ fill: '#BFD8B8', opacity: 0.2 }}
              contentStyle={{ backgroundColor: '#F4F7F5', borderRadius: '8px', border: '1px solid #BFD8B8', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#2F3E34' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
            <Bar dataKey="completed" name="Completed Tasks" fill="#7FB77E" radius={[4, 4, 0, 0]} barSize={24} />
            <Bar dataKey="new" name="New Tasks" fill="#BFD8B8" radius={[4, 4, 0, 0]} barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-auto">
        <StatCard label="Finished" value={stats.finished} />
        <StatCard label="Pending" value={stats.pending} />
        <StatCard label="Delayed" value={stats.delayed} />
        <StatCard label="Cancelled" value={stats.cancelled} />
        <StatCard label="Dropped" value={stats.dropped} />
        <StatCard label="Missed" value={stats.missed} />
        <StatCard label="Not Started" value={stats['not yet started']} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string, value: number }) {
  return (
    <div className="bg-[#F4F7F5] p-3 rounded-lg flex flex-col items-center justify-center text-center border border-[#BFD8B8]">
      <span className="text-2xl font-bold text-[#7FB77E]">{value}</span>
      <span className="text-xs text-[#2F3E34]/70 mt-1 font-medium">{label}</span>
    </div>
  );
}
