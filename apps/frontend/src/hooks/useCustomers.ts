import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Customer, 'id'>) => {
      return apiFetch(`${API_BASE}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customersKeys.all });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Customer> }) => {
      return apiFetch(`${API_BASE}/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customersKeys.all });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`${API_BASE}/customers/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customersKeys.all });
    },
  });
}
