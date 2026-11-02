import { useQuery } from '@tanstack/react-query';
import type { Customer } from '@sheetflow/shared';
import { API_BASE, apiFetch } from '../store/api.js';

export const customersKeys = {
  all: ['customers'] as const,
};

async function fetchCustomers(): Promise<Customer[]> {
  return apiFetch(`${API_BASE}/customers`);
}

export function useCustomers() {
  return useQuery({
    queryKey: customersKeys.all,
    queryFn: fetchCustomers,
  });
}
