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
    <div className="bg-[#E3EFE6] p-6 rounded-xl shadow-sm border border-[#BFD8B8] h-full min-h-[640px] flex flex-col">
      <style>{`
        .rdp {
          --rdp-cell-size: 68px;
          --rdp-accent-color: #7FB77E;
          --rdp-background-color: #BFD8B8;
          --rdp-text-color: #2F3E34;
          margin: 0 auto;
          width: fit-content;
          max-width: 100%;
        }
        .rdp-months {
          display: flex;
          justify-content: center;
          width: fit-content;
          margin: 0 auto;
        }
        .rdp-month {
          width: fit-content;
        }
        .rdp-caption {
          justify-content: center;
          padding-bottom: 1rem;
        }
        .rdp-caption_label {
          font-size: 1.1rem;
          font-weight: 700;
          color: #2F3E34;
        }
        .rdp-head_row, .rdp-row {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
        }
        .rdp-head_cell {
          font-size: 0.85rem;
          font-weight: 700;
          color: rgba(47, 62, 52, 0.72);
          text-align: center;
          padding-bottom: 0.6rem;
        }
        .rdp-cell {
          display: flex;
          justify-content: center;
        }
        .has-tasks:after {
          content: '';
          display: block;
          width: 10px;
          height: 10px;
          background-color: #7FB77E;
          border-radius: 50%;
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
        }
        .rdp-day {
          position: relative;
          width: 56px;
          height: 56px;
          font-size: 1rem;
          font-weight: 600;
          border-radius: 16px;
          transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
        }
        .rdp-day:hover {
          background-color: #F4F7F5;
          transform: translateY(-1px);
        }
        .rdp-day_selected,
        .rdp-day_selected:hover {
          background-color: #7FB77E;
          color: white;
        }
        .rdp-day_today {
          border: 2px solid #7FB77E;
          color: #2F3E34;
        }
        .rdp-nav {
          gap: 0.5rem;
        }
        .rdp-button_reset.rdp-button {
          cursor: pointer;
        }
      `}</style>
      <div className="w-full flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-[#2F3E34] self-start">Calendar</h2>
          <p className="text-sm text-[#2F3E34]/70 mt-1">
            Browse scheduled start dates and open the daily task details.
          </p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
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
    </div>
  );
}
