import { useAuthStore } from '@/stores/authStore';
import type { FieldError } from '@/types';

const baseURL = process.env.NEXT_PUBLIC_API_URL;

export const createApiError = (
  message: string,
  code: string,
  status: number,
  details?: FieldError[],
): ApiError => {
  const error = new Error(message || 'Request failed') as ApiError;
  error.name = 'ApiError';
  error.code = code;
  error.status = status;
  error.details = details;
  return error;
};

interface ApiError extends Error {
  code: string;
  status: number;
  details?: FieldError[];
}

const request = async <T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> => {
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${baseURL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw createApiError('Cannot reach server', 'NETWORK_ERROR', 0);
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw createApiError(
      json.error?.message || 'Request failed',
      json.error?.code || 'REQUEST_FAILED',
      res.status,
      json.error?.details,
    );
  }

  return json.data as T;
};

export const apiGet = <T>(path: string): Promise<T> => request<T>('GET', path);

export const apiPost = <T>(path: string, body: unknown): Promise<T> =>
  request<T>('POST', path, body);

export const apiPatch = <T>(path: string, body?: unknown): Promise<T> =>
  request<T>('PATCH', path, body);

export type { ApiError };
