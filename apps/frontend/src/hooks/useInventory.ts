import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { InventoryItem } from '@sheetflow/shared';
import { API_BASE, apiFetch } from '../store/api.js';

export const inventoryKeys = {
  all: ['inventory'] as const,
};

async function fetchInventory(): Promise<InventoryItem[]> {
  return apiFetch(`${API_BASE}/inventory`);
}

export function useInventory() {
  return useQuery({
    queryKey: inventoryKeys.all,
    queryFn: fetchInventory,
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<InventoryItem, 'id'>) => {
      return apiFetch(`${API_BASE}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InventoryItem> }) => {
      return apiFetch(`${API_BASE}/inventory/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`${API_BASE}/inventory/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}
