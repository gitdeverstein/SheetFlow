import { create } from 'zustand';
import { API_BASE, apiFetch } from './api.js';
import { createCustomerSlice, type CustomerSlice } from './customerSlice.js';
import { createInventorySlice, type InventorySlice } from './inventorySlice.js';
import { createQuoteSlice, type QuoteSlice } from './quoteSlice.js';
import { createSpreadsheetSlice, type SpreadsheetSlice } from './spreadsheetSlice.js';
import { queryClient } from '../hooks/queryClient.js';
import { customersKeys } from '../hooks/useCustomers.js';
import { inventoryKeys } from '../hooks/useInventory.js';
import { quotesKeys } from '../hooks/useQuotes.js';

// Re-export builders so existing imports from 'sheetStore' keep working
export { buildCrmRow, buildInvRow } from './api.js';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error';
  text: string;
  undoAction?: () => void;
}

interface CoreSlice {
  activeTab: 'crm' | 'inventory' | 'quotes' | 'dashboard';
  loading: boolean;
  toasts: ToastMessage[];
  filters: Record<string, string>;
  sort: { column: string; direction: 'asc' | 'desc' } | null;
  setActiveTab: (tab: 'crm' | 'inventory' | 'quotes' | 'dashboard') => void;
  prefetchData: () => Promise<void>;
  addToast: (text: string, type?: 'success' | 'info' | 'error', undoAction?: () => void) => void;
  removeToast: (id: string) => void;
  setFilter: (colId: string, val: string) => void;
  setSort: (colId: string) => void;
}

export type SheetStoreState = CoreSlice & CustomerSlice & InventorySlice & QuoteSlice & SpreadsheetSlice;

export const useSheetStore = create<SheetStoreState>()((...args) => {
  const [set, get] = args;

  const core: CoreSlice = {
    activeTab: 'dashboard',
    loading: false,
    toasts: [],
    filters: {},
    sort: null,

    setActiveTab: (tab) => set({ activeTab: tab }),

    addToast: (text, type = 'success', undoAction) => {
      const id = crypto.randomUUID();
      set((state) => ({ toasts: [...state.toasts, { id, text, type, undoAction }] }));
      setTimeout(() => get().removeToast(id), 4000);
    },

    removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

    setFilter: (colId, val) => set((state) => ({ filters: { ...state.filters, [colId]: val } })),

    setSort: (colId) => set((state) => {
      const current = state.sort;
      if (current?.column === colId) {
        return current.direction === 'asc'
          ? { sort: { column: colId, direction: 'desc' as const } }
          : { sort: null };
      }
      return { sort: { column: colId, direction: 'asc' as const } };
    }),

    prefetchData: async () => {
      set({ loading: true });
      try {
        await Promise.all([
          queryClient.fetchQuery({ queryKey: customersKeys.all, queryFn: () => apiFetch(`${API_BASE}/customers`) }),
          queryClient.fetchQuery({ queryKey: inventoryKeys.all, queryFn: () => apiFetch(`${API_BASE}/inventory`) }),
          queryClient.fetchQuery({ queryKey: quotesKeys.all, queryFn: () => apiFetch(`${API_BASE}/quotes`) }),
        ]);
      } catch (err: unknown) {
        get().addToast(err instanceof Error ? err.message : 'Failed to load data', 'error');
      } finally {
        set({ loading: false });
      }
    },
  };

  return {
    ...core,
    ...createCustomerSlice(...args),
    ...createInventorySlice(...args),
    ...createQuoteSlice(...args),
    ...createSpreadsheetSlice(...args),
  };
});
