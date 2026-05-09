import { apiPatch, apiRequest } from './api';

// Backend DTOs based on Django serializers/schema.
export interface UserState {
  id: number;
  energy_level: 'low' | 'medium' | 'high';
  fatigue_level: 'low' | 'medium' | 'high';
  sleep_hours: number;
  created_at: string;
}

export interface TaskItem {
  id: number;
  user: number;
  title: string;
  body: string;
  remaining_hours: number;
  priority_level: 'low' | 'medium' | 'high';
  energy_required: 'low' | 'medium' | 'high';
  status:
    | 'pending'
    | 'delayed'
    | 'finished'
    | 'dropped'
    | 'cancelled'
    | 'missed'
    | 'not_yet_started';
  level: 'easy' | 'medium' | 'hard';
  deadline: string;
  created_at: string;
}

export interface ScheduleRequest {
  id: number;
  user: number;
  available_hours: number;
  created_at: string;
}

export interface GeneratePlanResponse {
  // New response contract used by the Suggested Task List modal.
  schedule_request?: ScheduleRequest;
  reasoning?: string;
  decision?: {
    id?: number;
    selected_plan?: string;
    score?: number;
    metrics?: Record<string, unknown>;
    reasoning?: string;
  };
  plans?: Array<{
    plan_type: string;
    stance: string;
    actions: Array<{
      task_id: number;
      action: string;
      new_hours?: number;
    }>;
  }>;
  // Backward-compat fallback still returned by older backend implementations.
  best_plan?: {
    selected_plan: string;
    score: number;
    metrics: Record<string, unknown>;
  };
}

// Endpoint wrappers centralize URL paths and request shapes.
// User states
export const listUserStates = () => apiRequest<UserState[]>('/api/user-states/', { method: 'GET' });
export const getUserState = (id: number) => apiRequest<UserState>(`/api/user-states/${id}/`, { method: 'GET' });
export const createUserState = (payload: Omit<UserState, 'id' | 'created_at'>) =>
  apiRequest<UserState>('/api/user-states/', { method: 'POST', data: payload });
export const patchUserState = (id: number, payload: Partial<Omit<UserState, 'id' | 'created_at'>>) =>
  apiPatch<UserState, Partial<Omit<UserState, 'id' | 'created_at'>>>(`/api/user-states/${id}/`, payload);
export const deleteUserState = (id: number) =>
  apiRequest<void>(`/api/user-states/${id}/`, { method: 'DELETE' });

// Tasks
// Optional userId keeps task calls scoped per active user.
export const listTasks = (userId?: number) =>
  apiRequest<TaskItem[]>('/api/tasks/', {
    method: 'GET',
    params: userId ? { user: userId } : undefined,
  });
export const getTask = (id: number, userId?: number) =>
  apiRequest<TaskItem>(`/api/tasks/${id}/`, {
    method: 'GET',
    params: userId ? { user: userId } : undefined,
  });
export const createTask = (payload: Omit<TaskItem, 'id' | 'created_at'>) =>
  apiRequest<TaskItem>('/api/tasks/', { method: 'POST', data: payload });
export const patchTask = (id: number, payload: Partial<Omit<TaskItem, 'id' | 'created_at'>>, userId?: number) =>
  apiPatch<TaskItem, Partial<Omit<TaskItem, 'id' | 'created_at'>>>(`/api/tasks/${id}/`, payload, {
    params: userId ? { user: userId } : undefined,
  });
export const deleteTask = (id: number) => apiRequest<void>(`/api/tasks/${id}/`, { method: 'DELETE' });

// Schedule requests
export const listScheduleRequests = (userId?: number) =>
  apiRequest<ScheduleRequest[]>('/api/schedule-requests/', {
    method: 'GET',
    params: userId ? { user: userId } : undefined,
  });
export const getScheduleRequest = (id: number, userId?: number) =>
  apiRequest<ScheduleRequest>(`/api/schedule-requests/${id}/`, {
    method: 'GET',
    params: userId ? { user: userId } : undefined,
  });
export const createScheduleRequest = (payload: Omit<ScheduleRequest, 'id' | 'created_at'>) =>
  apiRequest<ScheduleRequest>('/api/schedule-requests/', { method: 'POST', data: payload });
export const patchScheduleRequest = (
  id: number,
  payload: Partial<Omit<ScheduleRequest, 'id' | 'created_at'>>,
) =>
  apiPatch<ScheduleRequest, Partial<Omit<ScheduleRequest, 'id' | 'created_at'>>>(
    `/api/schedule-requests/${id}/`,
    payload,
  );
export const deleteScheduleRequest = (id: number) =>
  apiRequest<void>(`/api/schedule-requests/${id}/`, { method: 'DELETE' });
export const generatePlan = (payload: Omit<ScheduleRequest, 'id' | 'created_at'>) =>
  // Expected behavior: returns recommendation plans for the modal after saving user status.
  apiRequest<GeneratePlanResponse>('/api/schedule-requests/generate_plan/', {
    method: 'POST',
    data: payload,
  });
