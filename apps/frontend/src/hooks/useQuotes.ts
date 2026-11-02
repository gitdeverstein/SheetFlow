import { useQuery } from '@tanstack/react-query';
import { API_BASE, apiFetch } from '../store/api.js';

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
