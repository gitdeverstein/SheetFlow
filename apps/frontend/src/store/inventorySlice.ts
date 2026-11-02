import type { StateCreator } from 'zustand';
import type { InventoryItem } from '@sheetflow/shared';
import { API_BASE, apiFetch } from './api.js';
import { apiAction } from './apiUtils.js';
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
    await apiAction(
      () => apiFetch(`${API_BASE}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
      get().addToast,
      {
        invalidateKeys: [inventoryKeys.all],
        successMessage: 'Product added successfully',
        errorMessage: 'Failed to add product',
      },
    );
  },

  updateInventoryItem: async (id, data) => {
    await apiAction(
      () => apiFetch(`${API_BASE}/inventory/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
      get().addToast,
      {
        invalidateKeys: [inventoryKeys.all],
        errorMessage: 'Failed to update product',
      },
    );
  },

  deleteInventoryItem: async (id) => {
    await apiAction(
      () => apiFetch(`${API_BASE}/inventory/${id}`, { method: 'DELETE' }),
      get().addToast,
      {
        invalidateKeys: [inventoryKeys.all],
        successMessage: 'Product deleted',
        successType: 'info',
        errorMessage: 'Failed to delete product',
      },
    );
  },

  bulkImportInventory: async (rows) => {
    await apiAction(
      () => apiFetch<{ imported: number }>(`${API_BASE}/inventory/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rows),
      }),
      get().addToast,
      {
        invalidateKeys: [inventoryKeys.all],
        errorMessage: 'Failed to import products',
        onSuccess: (result, toast) => {
          toast(`${result.imported} product(s) imported successfully`);
        },
      },
    );
  },
});
