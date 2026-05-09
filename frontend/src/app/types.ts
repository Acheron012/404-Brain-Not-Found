export type TaskStatus =
  | 'finished'
  | 'in progress'
  | 'delayed'
  | 'cancelled'
  | 'dropped'
  | 'missed'
  | 'not yet started';
export type Intensity = 'Easy' | 'Medium' | 'Hard';
export type EnergyLevel = 'Low' | 'Medium' | 'High';
export type TaskScheduleCondition =
  | 'upcoming'
  | 'on track'
  | 'delayed'
  | 'missed'
  | 'early start'
  | 'finished'
  | 'cancelled'
  | 'dropped';

export interface Task {
  id: string;
  name: string;
  description: string;
  estimatedHours: number;
  energyRequired: EnergyLevel;
  startDate: string; // YYYY-MM-DD
  deadline: string; // YYYY-MM-DD
  intensity: Intensity;
  status: TaskStatus;
  scheduleCondition: TaskScheduleCondition;
  remainingTimeHours: number;
}
