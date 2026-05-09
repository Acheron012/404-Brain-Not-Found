export type TaskStatus =
  | 'finished'
  | 'in progress'
  | 'delayed'
  | 'cancelled'
  | 'dropped'
  | 'missed'
  | 'not yet started';
export type Intensity = 'Easy' | 'Medium' | 'Hard';

export interface Task {
  id: string;
  name: string;
  description: string;
  deadline: string; // YYYY-MM-DD
  intensity: Intensity;
  status: TaskStatus;
}
