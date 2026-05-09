export type TaskStatus =
  | 'finished'
  | 'pending'
  | 'in progress'
  | 'delayed'
  | 'cancelled'
  | 'dropped'
  | 'missed'
  | 'not yet started';
export type Intensity = 'Easy' | 'Medium' | 'Hard';
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
  startDate: string; // YYYY-MM-DD
  deadline: string; // YYYY-MM-DD
  intensity: Intensity;
  status: TaskStatus;
  scheduleCondition: TaskScheduleCondition;
}
