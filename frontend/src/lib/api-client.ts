// frontend/src/lib/api-client.ts
class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetcher<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.message || 'Request failed',
      response.status,
      errorData
    );
  }

  return response.json();
}

export const apiClient = {
  get: <T>(url: string, options?: RequestInit) =>
    fetcher<T>(url, { ...options, method: 'GET' }),

  post: <T>(url: string, data?: any, options?: RequestInit) =>
    fetcher<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(url: string, data?: any, options?: RequestInit) =>
    fetcher<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
};