/**
 * Centralized API client.
 * Reads the JWT from localStorage and attaches it as a Bearer token.
 * On 401, clears storage and redirects to /login.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('wa_token');
}

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  // Session expired or invalid token — force re-login
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('wa_token');
      localStorage.removeItem('wa_user');
      window.location.href = '/login';
    }
    throw new ApiError(401, 'Unauthorized');
  }

  const data = await res.json();

  if (!data.success) {
    throw new ApiError(res.status, data.message || 'Request failed');
  }

  return data.data as T;
}

export const api = {
  get:    <T>(endpoint: string)                  => request<T>(endpoint),
  post:   <T>(endpoint: string, body: unknown)   => request<T>(endpoint, { method: 'POST',   body: JSON.stringify(body) }),
  put:    <T>(endpoint: string, body: unknown)   => request<T>(endpoint, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  <T>(endpoint: string, body: unknown)   => request<T>(endpoint, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: <T>(endpoint: string)                  => request<T>(endpoint, { method: 'DELETE' }),
};

export { ApiError };
