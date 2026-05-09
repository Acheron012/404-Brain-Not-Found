import React from 'react';
import { DayPicker } from 'react-day-picker';
import { Task } from '../types';
import 'react-day-picker/dist/style.css';

interface CalendarWidgetProps {
  tasks: Task[];
  onDateClick: (date: Date) => void;
}

export function CalendarWidget({ tasks, onDateClick }: CalendarWidgetProps) {
  // Create a set of dates that have tasks
  const datesWithTasks = tasks.map(t => {
    const [y, m, d] = t.startDate.split('-');
    return new Date(Number(y), Number(m) - 1, Number(d));
  });

  return (
    <div className="bg-[#E3EFE6] p-6 rounded-xl shadow-sm border border-[#BFD8B8] h-full flex flex-col items-center justify-center">
      <style>{`
        .rdp {
          --rdp-cell-size: 40px;
          --rdp-accent-color: #7FB77E;
          --rdp-background-color: #BFD8B8;
          --rdp-text-color: #2F3E34;
          margin: 0;
        }
        .has-tasks:after {
          content: '';
          display: block;
          width: 6px;
          height: 6px;
          background-color: #7FB77E;
          border-radius: 50%;
          position: absolute;
          bottom: 4px;
          left: 50%;
          transform: translateX(-50%);
        }
        .rdp-day {
          position: relative;
        }
      `}</style>
      <div className="w-full flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-[#2F3E34] self-start">Calendar</h2>
      </div>
      <DayPicker
        mode="single"
        onDayClick={(date) => {
          if (date) onDateClick(date);
        }}
        modifiers={{
          hasTask: datesWithTasks
        }}
        modifiersClassNames={{
          hasTask: 'has-tasks'
        }}
        className="mx-auto font-sans text-[#2F3E34]"
      />
    </div>
  );
}
