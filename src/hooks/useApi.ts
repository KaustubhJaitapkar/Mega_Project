'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

export function useApi() {
  const router = useRouter();

  const request = useCallback(
    async <T,>(
      url: string,
      options: RequestInit = {}
    ): Promise<{ data?: T; error?: string }> => {
      try {
        const res = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          ...options,
        });

        if (res.status === 401) {
          router.push('/login');
          return { error: 'Unauthorized' };
        }

        const data = await res.json();

        if (!res.ok) {
          return { error: data.error || 'An error occurred' };
        }

        return { data };
      } catch (error) {
        return { error: 'Network error' };
      }
    },
    [router]
  );

  return {
    get: <T,>(url: string) =>
      request<T>(url, { method: 'GET' }),
    post: <T,>(url: string, body?: Record<string, any>) =>
      request<T>(url, { method: 'POST', body: JSON.stringify(body) }),
    put: <T,>(url: string, body?: Record<string, any>) =>
      request<T>(url, { method: 'PUT', body: JSON.stringify(body) }),
    delete: <T,>(url: string) =>
      request<T>(url, { method: 'DELETE' }),
  };
}
