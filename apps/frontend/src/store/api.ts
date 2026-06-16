import type { SheetRow, Customer, InventoryItem } from '@sheetflow/shared';

export const API_BASE = import.meta.env.VITE_API_URL || '/api';
const DEFAULT_TIMEOUT = 15000;

/**
 * Check if the user is authenticated by attempting a lightweight /api/auth/me call.
 */
export async function checkAuth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}

interface ErrorBody {
  error?: string;
}

function errorMessage(res: Response, body: ErrorBody): string {
  const msg = body?.error || '';
  if (msg) return msg;
  if (res.status === 404) return 'Resource not found';
  if (res.status === 409) return 'A conflict occurred. The resource may already exist or is in use.';
  if (res.status === 429) return 'Too many requests. Please slow down and try again.';
  if (res.status >= 500) return 'Server error. Please try again later.';
  return `Request failed (${res.status})`;
}

export interface ApiFetchOptions extends RequestInit {
  timeout?: number;
}

export async function apiFetch<T = unknown>(url: string, options: ApiFetchOptions = {}): Promise<T> {
  const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    if (res.status === 401) {
      window.location.reload();
      throw new Error('Session expired. Please sign in again.');
    }

    if (!res.ok) {
      const body: ErrorBody = await res.json().catch(() => ({}));
      throw new Error(errorMessage(res, body));
    }

    const text = await res.text();
    return text ? JSON.parse(text) : undefined as T;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.', { cause: err });
    }
    if (err instanceof TypeError) {
      throw new Error('Network error: unable to connect to server', { cause: err });
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function login(email: string, password: string): Promise<{ user: { id: string; name: string; email: string } }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body: ErrorBody = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Authentication failed');
  }
  return res.json();
}

export async function register(name: string, email: string, password: string): Promise<{ user: { id: string; name: string; email: string } }> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    const body: ErrorBody = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Registration failed');
  }
  return res.json();
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

export function getGoogleAuthUrl(): string {
  return `${API_BASE}/auth/google`;
}

export function buildCrmRow(c: Customer): SheetRow {
  return {
    id: c.id!,
    cells: {
      name: { id: `name-${c.id}`, raw: c.name, value: c.name, error: null },
      email: { id: `email-${c.id}`, raw: c.email, value: c.email, error: null },
      phone: { id: `phone-${c.id}`, raw: c.phone || '', value: c.phone || '', error: null },
      company: { id: `company-${c.id}`, raw: c.company || '', value: c.company || '', error: null },
      status: { id: `status-${c.id}`, raw: c.status, value: c.status, error: null },
      notes: { id: `notes-${c.id}`, raw: c.notes || '', value: c.notes || '', error: null },
    }
  };
}

export function buildInvRow(item: InventoryItem): SheetRow {
  return {
    id: item.id!,
    cells: {
      sku: { id: `sku-${item.id}`, raw: item.sku, value: item.sku, error: null },
      name: { id: `name-${item.id}`, raw: item.name, value: item.name, error: null },
      stock: { id: `stock-${item.id}`, raw: String(item.stock), value: item.stock, error: null },
      alertThreshold: { id: `alertThreshold-${item.id}`, raw: String(item.alertThreshold), value: item.alertThreshold, error: null },
      price: { id: `price-${item.id}`, raw: String(item.price), value: Number(item.price), error: null },
    }
  };
}
