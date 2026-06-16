import type { StateCreator } from 'zustand';
import type { InventoryItem } from '@sheetflow/shared';
import { API_BASE, apiFetch } from './api.js';
import { queryClient } from '../hooks/queryClient.js';
import { inventoryKeys } from '../hooks/useInventory.js';

export interface InventorySlice {
  addInventoryItem: (data: Omit<InventoryItem, 'id'>) => Promise<void>;
  updateInventoryItem: (id: string, data: Partial<InventoryItem>) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  bulkImportInventory: (rows: Array<{ sku: string; name: string; stock: number; alertThreshold: number; price: number }>) => Promise<void>;
}

type StoreGet = () => {
  addToast: (text: string, type?: 'success' | 'info' | 'error', undoAction?: () => void) => void;
};

type SheetStoreState = import('./sheetStore.js').SheetStoreState;

export const createInventorySlice: StateCreator<SheetStoreState, [], [], InventorySlice> = (_, get: StoreGet) => ({

  addInventoryItem: async (data) => {
    try {
      await apiFetch(`${API_BASE}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      get().addToast('Product added successfully');
    } catch (err: unknown) {
      get().addToast(err instanceof Error ? err.message : 'Failed to add product', 'error');
    }
  },

  updateInventoryItem: async (id, data) => {
    try {
      await apiFetch(`${API_BASE}/inventory/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
    } catch (err: unknown) {
      get().addToast(err instanceof Error ? err.message : 'Failed to update product', 'error');
    }
  },

  deleteInventoryItem: async (id) => {
    try {
      await apiFetch(`${API_BASE}/inventory/${id}`, { method: 'DELETE' });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      get().addToast('Product deleted', 'info');
    } catch (err: unknown) {
      get().addToast(err instanceof Error ? err.message : 'Failed to delete product', 'error');
    }
  },

  bulkImportInventory: async (rows) => {
    try {
      const { imported } = await apiFetch<{ imported: number }>(`${API_BASE}/inventory/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rows),
      });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      get().addToast(`${imported} product(s) imported successfully`);
    } catch (err: unknown) {
      get().addToast(err instanceof Error ? err.message : 'Failed to import products', 'error');
    }
  },
});
