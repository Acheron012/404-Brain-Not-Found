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
    | 'in_progress'
    | 'delayed'
    | 'finished'
    | 'dropped'
    | 'cancelled'
    | 'missed'
    | 'not_yet_started';
  level: 'easy' | 'medium' | 'hard';
  start_date: string;
  deadline: string;
  created_at: string;
  schedule_condition?:
    | 'upcoming'
    | 'on_track'
    | 'delayed'
    | 'missed'
    | 'early_start'
    | 'finished'
    | 'cancelled'
    | 'dropped';
  remaining_time_hours?: number;
}

export interface ScheduleRequest {
  id: number;
  user: number;
  available_hours: number;
  created_at: string;
}

export interface GeneratePlanResponse {
  schedule_request?: ScheduleRequest;
  reasoning?: string;
  plans?: Array<{
    plan_type: string;
    stance: string;
    actions: Array<{
      task_id: number | string;
      action: string;
      new_hours?: number;
    }>;
  }>;
  best_plan?: {
    selected_plan?: string;
    score?: number;
    metrics?: Record<string, unknown>;
    plan_decision?: {
      selected_plan: string;
      score: number;
      metrics: {
        completion: number;
        fatigue: number;
        overload: number;
        stability: number;
      };
      reasoning: string;
    };
    debug?: {
      agent1?: {
        reasoning: string;
        plans: Array<{
          plan_type: string;
          stance: string;
          actions: Array<{
            task_id: number | string;
            action: string;
            new_hours?: number;
          }>;
          score?: number;
        }>;
      };
      agent2?: {
        critiques: Array<{
          plan_type: string;
          overall_critique: string;
          mutations: Array<{
            task_id: number | string;
            original_action: string;
            mutated_action: string;
            new_hours?: number;
            reason: string;
          }>;
          unchanged: Array<number | string>;
          task_reviews?: Array<{
            task_id: number | string;
            action: string;
            new_hours?: number;
            changed: boolean;
            statement: string;
          }>;
        }>;
        mutated_plans: Array<{
          plan_type: string;
          stance: string;
          actions: Array<{
            task_id: number | string;
            action: string;
            new_hours?: number;
          }>;
          mutation_count?: number;
          score?: number;
        }>;
      };
      layer4?: {
        all_simulations: Array<{
          plan_type: string;
          score: number;
          metrics: {
            completion: number;
            fatigue: number;
            overload: number;
            stability: number;
          };
          summary: string;
          actions: Array<{
            task_id: number | string;
            action: string;
            new_hours?: number;
          }>;
        }>;
        benchmark?: {
          wall_time_seconds: number;
          plans_simulated: number;
        };
        math_best?: string;
      };
      reviews?: Record<
        string,
        Array<{
          task_id: number | string;
          task_name: string;
          action: string;
          new_hours?: number;
          changed: boolean;
          statement: string;
        }>
      >;
    };
  };
  decision?: {
    id: number;
    selected_plan: string;
    score: number;
    metrics: {
      completion: number;
      fatigue: number;
      overload: number;
      stability: number;
    };
    reasoning: string;
  };
  debug?: {
    agent1?: {
      reasoning: string;
      plans: Array<{
        plan_type: string;
        stance: string;
        actions: Array<{
          task_id: number | string;
          action: string;
          new_hours?: number;
        }>;
        score?: number;
      }>;
    };
    agent2?: {
      critiques: Array<{
        plan_type: string;
        overall_critique: string;
        mutations: Array<{
          task_id: number | string;
          original_action: string;
          mutated_action: string;
          new_hours?: number;
          reason: string;
        }>;
        unchanged: Array<number | string>;
        task_reviews?: Array<{
          task_id: number | string;
          action: string;
          new_hours?: number;
          changed: boolean;
          statement: string;
        }>;
      }>;
      mutated_plans: Array<{
        plan_type: string;
        stance: string;
        actions: Array<{
          task_id: number | string;
          action: string;
          new_hours?: number;
        }>;
        mutation_count?: number;
        score?: number;
      }>;
    };
    layer4?: {
      all_simulations: Array<{
        plan_type: string;
        score: number;
        metrics: {
          completion: number;
          fatigue: number;
          overload: number;
          stability: number;
        };
        summary: string;
        actions: Array<{
          task_id: number | string;
          action: string;
          new_hours?: number;
        }>;
      }>;
      benchmark?: {
        wall_time_seconds: number;
        plans_simulated: number;
      };
      math_best?: string;
    };
    reviews?: Record<
      string,
      Array<{
        task_id: number | string;
        task_name: string;
        action: string;
        new_hours?: number;
        changed: boolean;
        statement: string;
      }>
    >;
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
