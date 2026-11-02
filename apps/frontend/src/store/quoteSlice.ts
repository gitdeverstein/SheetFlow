import type { StateCreator } from 'zustand';
import { API_BASE, apiFetch } from './api.js';
import { apiAction } from './apiUtils.js';
import { fetchFullQuote, exportQuotePdf, exportQuoteExcel } from '../utils/exportUtils.js';
import { quotesKeys } from '../hooks/useQuotes.js';
import { inventoryKeys } from '../hooks/useInventory.js';

export interface QuoteSlice {
  editingQuoteId: string | null;
  generatingPdfId: string | null;
  exportingExcelId: string | null;
  setEditingQuote: (quoteId: string | null) => void;
  createQuote: (data: Record<string, unknown>) => Promise<void>;
  updateQuote: (id: string, data: Record<string, unknown>) => Promise<void>;
  updateQuoteStatus: (id: string, status: string) => Promise<void>;
  duplicateQuote: (id: string) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  generatePdf: (id: string) => Promise<void>;
  exportExcel: (id: string) => Promise<void>;
}

type StoreGet = () => {
  addToast: (text: string, type?: 'success' | 'info' | 'error', undoAction?: () => void) => void;
};

type SheetStoreState = import('./sheetStore.js').SheetStoreState;

export const createQuoteSlice: StateCreator<SheetStoreState, [], [], QuoteSlice> = (set, get: StoreGet) => ({
  editingQuoteId: null,
  generatingPdfId: null,
  exportingExcelId: null,

  setEditingQuote: (quoteId) => set({ editingQuoteId: quoteId }),

  createQuote: async (data) => {
    await apiAction(
      () => apiFetch(`${API_BASE}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
      get().addToast,
      {
        invalidateKeys: [quotesKeys.all],
        successMessage: 'Quote created successfully!',
        errorMessage: 'Failed to create quote',
      },
    );
  },

  updateQuote: async (id, data) => {
    await apiAction(
      () => apiFetch(`${API_BASE}/quotes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
      get().addToast,
      {
        invalidateKeys: [quotesKeys.all, inventoryKeys.all],
        successMessage: 'Quote updated successfully',
        errorMessage: 'Failed to update quote',
        onSuccess: () => set({ editingQuoteId: null }),
      },
    );
  },

  updateQuoteStatus: async (id, status) => {
    await apiAction(
      () => apiFetch(`${API_BASE}/quotes/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }),
      get().addToast,
      {
        invalidateKeys: [quotesKeys.all, inventoryKeys.all],
        errorMessage: 'Failed to update status',
        onSuccess: (_, toast) => {
          toast(`Quote status updated to ${status}`);
        },
      },
    );
  },

  duplicateQuote: async (id) => {
    await apiAction(
      () => apiFetch(`${API_BASE}/quotes/${id}/duplicate`, { method: 'POST' }),
      get().addToast,
      {
        invalidateKeys: [quotesKeys.all],
        successMessage: 'Quote duplicated as Draft',
        errorMessage: 'Failed to duplicate quote',
      },
    );
  },

  deleteQuote: async (id) => {
    await apiAction(
      () => apiFetch(`${API_BASE}/quotes/${id}`, { method: 'DELETE' }),
      get().addToast,
      {
        invalidateKeys: [quotesKeys.all, inventoryKeys.all],
        successMessage: 'Quote deleted',
        successType: 'info',
        errorMessage: 'Failed to delete quote',
      },
    );
  },

  generatePdf: async (id) => {
    set({ generatingPdfId: id });
    await apiAction(
      async () => {
        const fullQuote = await fetchFullQuote(id);
        exportQuotePdf(fullQuote);
      },
      get().addToast,
      {
        successMessage: 'PDF downloaded successfully',
        errorMessage: 'Failed to generate PDF',
      },
    );
    set({ generatingPdfId: null });
  },

  exportExcel: async (id) => {
    set({ exportingExcelId: id });
    await apiAction(
      async () => {
        const fullQuote = await fetchFullQuote(id);
        await exportQuoteExcel(fullQuote);
      },
      get().addToast,
      {
        successMessage: 'Excel file downloaded successfully',
        errorMessage: 'Failed to export Excel',
      },
    );
    set({ exportingExcelId: null });
  },
});
