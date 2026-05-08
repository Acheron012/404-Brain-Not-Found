import axios, { AxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Shared axios instance for all frontend -> Django API calls.
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Generic request helper used by endpoint wrappers.
export async function apiRequest<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<T>({
    url: path,
    ...config,
  });

  return response.data;
}

// Dedicated PATCH helper to keep update calls consistent.
export async function apiPatch<TResponse, TPayload = unknown>(
  path: string,
  data: TPayload,
  config?: AxiosRequestConfig,
): Promise<TResponse> {
  const response = await apiClient.patch<TResponse>(path, data, config);
  return response.data;
}
