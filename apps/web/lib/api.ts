'use client';

import { API_BASE_URL } from './config';
import { tokenStore } from './tokens';

type ApiEnvelope<T> = {
  data: T;
  error: null | { code: string; message: string; details?: unknown };
  meta: Record<string, unknown>;
};

const withAuthHeaders = (headers: Record<string, string> = {}) => {
  const token = tokenStore.getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const redirectToLogin = () => {
  if (typeof window === 'undefined') return;
  if (window.location.pathname !== '/auth/login') {
    window.location.replace('/auth/login');
  }
};

const unauthorizedEnvelope = <T>(): ApiEnvelope<T> => ({
  data: null as T,
  error: {
    code: 'UNAUTHORIZED',
    message: 'Session expired. Please log in again.',
  },
  meta: {},
});

async function request<T>(
  path: string,
  init: RequestInit,
): Promise<ApiEnvelope<T>> {
  const res = await fetch(`${API_BASE_URL}${path}`, init);
  let body: ApiEnvelope<T> | null = null;

  try {
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
    body = null;
  }

  if (res.status === 401) {
    tokenStore.clear();
    redirectToLogin();
    return body ?? unauthorizedEnvelope<T>();
  }

  return (
    body ?? {
      data: null as T,
      error: {
        code: 'HTTP_ERROR',
        message: `Request failed with status ${res.status}`,
      },
      meta: {},
    }
  );
}

//get helper function
export async function apiGet<T>(path: string): Promise<ApiEnvelope<T>> {
  return request<T>(path, {
    method: 'GET',
    headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
  });
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
): Promise<ApiEnvelope<T>> {
  return request<T>(path, {
    method: 'POST',
    headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiPut<T>(
  path: string,
  body: unknown,
): Promise<ApiEnvelope<T>> {
  return request<T>(path, {
    method: 'PUT',
    headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
}

export async function apiDelete<T>(path: string): Promise<ApiEnvelope<T>> {
  return request<T>(path, {
    method: 'DELETE',
    headers: withAuthHeaders({ 'Content-Type': 'application/json' }),
  });
}
