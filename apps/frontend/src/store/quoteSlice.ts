import type { StateCreator } from 'zustand';
import { API_BASE, apiFetch } from './api.js';
import { fetchFullQuote, exportQuotePdf, exportQuoteExcel } from '../utils/exportUtils.js';
import { queryClient } from '../hooks/queryClient.js';
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
    try {
      await apiFetch(`${API_BASE}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      queryClient.invalidateQueries({ queryKey: quotesKeys.all });
      get().addToast('Quote created successfully!');
    } catch (err: unknown) {
      get().addToast(err instanceof Error ? err.message : 'Failed to create quote', 'error');
    }
  },

  updateQuote: async (id, data) => {
    try {
      await apiFetch(`${API_BASE}/quotes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      set({ editingQuoteId: null });
      queryClient.invalidateQueries({ queryKey: quotesKeys.all });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      get().addToast('Quote updated successfully');
    } catch (err: unknown) {
      get().addToast(err instanceof Error ? err.message : 'Failed to update quote', 'error');
    }
  },

  updateQuoteStatus: async (id, status) => {
    try {
      await apiFetch(`${API_BASE}/quotes/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      queryClient.invalidateQueries({ queryKey: quotesKeys.all });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      get().addToast(`Quote status updated to ${status}`);
    } catch (err: unknown) {
      get().addToast(err instanceof Error ? err.message : 'Failed to update status', 'error');
    }
  },

  duplicateQuote: async (id) => {
    try {
      await apiFetch(`${API_BASE}/quotes/${id}/duplicate`, { method: 'POST' });
      queryClient.invalidateQueries({ queryKey: quotesKeys.all });
      get().addToast('Quote duplicated as Draft');
    } catch (err: unknown) {
      get().addToast(err instanceof Error ? err.message : 'Failed to duplicate quote', 'error');
    }
  },

  deleteQuote: async (id) => {
    try {
      await apiFetch(`${API_BASE}/quotes/${id}`, { method: 'DELETE' });
      queryClient.invalidateQueries({ queryKey: quotesKeys.all });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      get().addToast('Quote deleted', 'info');
    } catch (err: unknown) {
      get().addToast(err instanceof Error ? err.message : 'Failed to delete quote', 'error');
    }
  },

  generatePdf: async (id) => {
    set({ generatingPdfId: id });
    try {
      const fullQuote = await fetchFullQuote(id);
      exportQuotePdf(fullQuote);
      get().addToast('PDF downloaded successfully');
    } catch (err: unknown) {
      get().addToast(err instanceof Error ? err.message : 'Failed to generate PDF', 'error');
    }
    finally { set({ generatingPdfId: null }); }
  },

  exportExcel: async (id) => {
    set({ exportingExcelId: id });
    try {
      const fullQuote = await fetchFullQuote(id);
      await exportQuoteExcel(fullQuote);
      get().addToast('Excel file downloaded successfully');
    } catch (err: unknown) {
      get().addToast(err instanceof Error ? err.message : 'Failed to export Excel', 'error');
    }
    finally { set({ exportingExcelId: null }); }
  },
});
