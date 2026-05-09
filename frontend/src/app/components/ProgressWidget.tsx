import React, { useMemo, useState } from "react";
import { Task } from "../types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ProgressWidgetProps {
  tasks: Task[];
}

type Timeframe = "daily" | "weekly" | "monthly";

const dayLabel = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const monthLabel = new Intl.DateTimeFormat("en-US", { month: "short" });

const getWeekStart = (date: Date) => {
  const value = new Date(date);
  const day = value.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  value.setDate(value.getDate() + diff);
  value.setHours(0, 0, 0, 0);
  return value;
};

const buildChartData = (tasks: Task[], timeframe: Timeframe) => {
  const buckets = new Map<
    string,
    { name: string; completed: number; active: number; sortKey: number }
  >();

  tasks.forEach((task) => {
    const date = new Date(task.startDate);
    if (Number.isNaN(date.getTime())) return;

    let key: string;
    let name: string;
    let sortKey: number;

    if (timeframe === "daily") {
      const bucketDate = new Date(date);
      bucketDate.setHours(0, 0, 0, 0);
      key = bucketDate.toISOString();
      name = dayLabel.format(bucketDate);
      sortKey = bucketDate.getTime();
    } else if (timeframe === "weekly") {
      const bucketDate = getWeekStart(date);
      key = bucketDate.toISOString();
      name = `Week of ${monthLabel.format(bucketDate)} ${bucketDate.getDate()}`;
      sortKey = bucketDate.getTime();
    } else {
      const bucketDate = new Date(date.getFullYear(), date.getMonth(), 1);
      key = bucketDate.toISOString();
      name = `${monthLabel.format(bucketDate)} ${bucketDate.getFullYear()}`;
      sortKey = bucketDate.getTime();
    }

    const current = buckets.get(key) ?? {
      name,
      completed: 0,
      active: 0,
      sortKey,
    };

    if (task.status === "finished") {
      current.completed += 1;
    } else {
      current.active += 1;
    }

    buckets.set(key, current);
  });

  return [...buckets.values()].sort((a, b) => a.sortKey - b.sortKey);
};

export function ProgressWidget({ tasks }: ProgressWidgetProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("weekly");

  // Status counters are real and derived from live task data.
  const stats = useMemo(() => {
    const counts = {
      finished: 0,
      pending: 0,
      "in progress": 0,
      cancelled: 0,
      dropped: 0,
      missed: 0,
      "not yet started": 0,
    };
    const conditions = {
      delayed: 0,
      missed: 0,
    };
    tasks.forEach((task) => {
      counts[task.status]++;
      if (task.scheduleCondition === "delayed") conditions.delayed++;
      if (task.scheduleCondition === "missed") conditions.missed++;
    });
    return { ...counts, ...conditions };
  }, [tasks]);

  const chartData = useMemo(
    () => buildChartData(tasks, timeframe),
    [tasks, timeframe],
  );

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
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#BFD8B8"
                opacity={0.5}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#2F3E34" }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#2F3E34" }}
              />
              <Tooltip
                cursor={{ fill: "#BFD8B8", opacity: 0.2 }}
                contentStyle={{
                  backgroundColor: "#F4F7F5",
                  borderRadius: "8px",
                  border: "1px solid #BFD8B8",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  color: "#2F3E34",
                }}
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="circle" />
              <Bar
                dataKey="completed"
                name="Completed Tasks"
                fill="#7FB77E"
                radius={[4, 4, 0, 0]}
                barSize={24}
              />
              <Bar
                dataKey="active"
                name="Active Tasks"
                fill="#BFD8B8"
                radius={[4, 4, 0, 0]}
                barSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full rounded-xl border border-dashed border-[#BFD8B8] bg-[#F4F7F5] flex items-center justify-center text-sm text-[#2F3E34]/65">
            No real task data available for progress yet.
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-auto">
        <StatCard label="Finished" value={stats.finished} />
        <StatCard label="Pending" value={stats.pending} />
        <StatCard label="In Progress" value={stats["in progress"]} />
        <StatCard label="Delayed" value={stats.delayed} />
        <StatCard label="Cancelled" value={stats.cancelled} />
        <StatCard label="Dropped" value={stats.dropped} />
        <StatCard label="Missed" value={stats.missed} />
        <StatCard label="Not Started" value={stats["not yet started"]} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[#F4F7F5] p-3 rounded-lg flex flex-col items-center justify-center text-center border border-[#BFD8B8]">
      <span className="text-2xl font-bold text-[#7FB77E]">{value}</span>
      <span className="text-xs text-[#2F3E34]/70 mt-1 font-medium">
        {label}
      </span>
    </div>
  );
}
