import { useQuery } from '@tanstack/react-query';
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
