import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE, apiFetch } from '../store/api.js';
import { inventoryKeys } from './useInventory.js';

export interface QuoteSummary {
  id: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  status: string;
  total: string;
  validUntil?: string;
  [key: string]: unknown;
}

export const quotesKeys = {
  all: ['quotes'] as const,
  detail: (id: string) => ['quotes', id] as const,
};

async function fetchQuotes(): Promise<QuoteSummary[]> {
  const data = await apiFetch<QuoteSummary[]>(`${API_BASE}/quotes`);
  return data.map((q: QuoteSummary) => ({
    ...q,
    customerName: q.customerName ?? '',
  }));
}

export function useQuotes() {
  return useQuery({
    queryKey: quotesKeys.all,
    queryFn: fetchQuotes,
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return apiFetch(`${API_BASE}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quotesKeys.all });
    },
  });
}

export function useUpdateQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      return apiFetch(`${API_BASE}/quotes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quotesKeys.all });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export function useUpdateQuoteStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiFetch(`${API_BASE}/quotes/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quotesKeys.all });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export function useDeleteQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`${API_BASE}/quotes/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quotesKeys.all });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export function useDuplicateQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return apiFetch(`${API_BASE}/quotes/${id}/duplicate`, { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quotesKeys.all });
    },
  });
}
