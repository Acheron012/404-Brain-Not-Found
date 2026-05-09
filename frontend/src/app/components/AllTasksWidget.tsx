import React from "react";
import { Task } from "../types";

interface AllTasksWidgetProps {
  tasks: Task[];
}

const formatRemainingTime = (hours: number) => {
  if (hours < 0) return `${Math.abs(hours).toFixed(1)}h overdue`;
  if (hours < 24) return `${hours.toFixed(1)}h left`;
  return `${(hours / 24).toFixed(1)}d left`;
};

export function AllTasksWidget({ tasks }: AllTasksWidgetProps) {
  const sortedTasks = [...tasks].sort((a, b) =>
    a.deadline.localeCompare(b.deadline),
  );

  return (
    <div className="bg-[#F4F7F5] p-4 sm:p-6 rounded-xl shadow-sm border border-[#BFD8B8] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-[#2F3E34]">All Tasks</h2>
        <span className="text-sm font-medium text-[#2F3E34] bg-[#BFD8B8] px-3 py-1 rounded-full">
          {sortedTasks.length} total
        </span>
      </div>

      {sortedTasks.length === 0 ? (
        <div className="text-[#2F3E34]/50 min-h-[160px] flex items-center justify-center">
          No tasks created yet.
        </div>
      ) : (
        <div className="overflow-auto max-h-[520px] rounded-lg border border-[#BFD8B8]/60 bg-white">
          <table className="w-full text-xs sm:text-sm min-w-[860px]">
            <thead>
              <tr className="text-left text-[#2F3E34]/70 border-b border-[#BFD8B8] bg-[#E3EFE6] sticky top-0">
                <th className="py-2 px-3">Task</th>
                <th className="py-2 pr-3">Start</th>
                <th className="py-2 pr-3">Deadline</th>
                <th className="py-2 pr-3">Est. Hours</th>
                <th className="py-2 pr-3">Energy</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Condition</th>
                <th className="py-2 px-3">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {sortedTasks.map((task) => (
                <tr
                  key={task.id}
                  className="border-b border-[#BFD8B8]/50 align-top"
                >
                  <td className="py-3 px-3">
                    <div className="font-semibold text-[#2F3E34]">
                      {task.name}
                    </div>
                    <div className="text-xs text-[#2F3E34]/65 mt-1">
                      {<task className="body"></task> || "No description"}
                    </div>
                  </td>
                  <td className="py-3 pr-3 text-[#2F3E34]/80">{task.startDate}</td>
                  <td className="py-3 pr-3 text-[#2F3E34]/80">{task.deadline}</td>
                  <td className="py-3 pr-3 text-[#2F3E34]/80">{task.estimatedHours}</td>
                  <td className="py-3 pr-3 text-[#2F3E34]/80">{task.energyRequired}</td>
                  <td className="py-3 pr-3 text-[#2F3E34]/80">{task.status}</td>
                  <td className="py-3 pr-3">
                    <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                      {task.scheduleCondition}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#2F3E34]/80 whitespace-nowrap">
                    {formatRemainingTime(task.remainingTimeHours)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
