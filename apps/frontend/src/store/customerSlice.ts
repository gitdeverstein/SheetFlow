import type { StateCreator } from 'zustand';
import type { Customer } from '@sheetflow/shared';
import { API_BASE, apiFetch } from './api.js';
import { queryClient } from '../hooks/queryClient.js';
import { customersKeys } from '../hooks/useCustomers.js';

export interface CustomerSlice {
  addCustomer: (data: Omit<Customer, 'id'>) => Promise<void>;
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
}

type StoreGet = () => {
  addToast: (text: string, type?: 'success' | 'info' | 'error', undoAction?: () => void) => void;
  addCustomer: (data: Omit<Customer, 'id'>) => Promise<void>;
};

type SheetStoreState = import('./sheetStore.js').SheetStoreState;

export const createCustomerSlice: StateCreator<SheetStoreState, [], [], CustomerSlice> = (_, get: StoreGet) => ({

  addCustomer: async (data) => {
    try {
      await apiFetch(`${API_BASE}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      queryClient.invalidateQueries({ queryKey: customersKeys.all });
      get().addToast('Customer added successfully');
    } catch (err: unknown) {
      get().addToast(err instanceof Error ? err.message : 'Failed to add customer', 'error');
    }
  },

  updateCustomer: async (id, data) => {
    try {
      await apiFetch(`${API_BASE}/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      queryClient.invalidateQueries({ queryKey: customersKeys.all });
    } catch (err: unknown) {
      get().addToast(err instanceof Error ? err.message : 'Failed to update customer', 'error');
    }
  },

  deleteCustomer: async (id) => {
    try {
      const allCustomers = queryClient.getQueryData<Customer[]>(customersKeys.all) || [];
      const deletedCustomer = allCustomers.find(c => c.id === id);

      await apiFetch(`${API_BASE}/customers/${id}`, { method: 'DELETE' });
      queryClient.invalidateQueries({ queryKey: customersKeys.all });

      if (deletedCustomer) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _, ...dataWithoutId } = deletedCustomer;
        get().addToast('Customer deleted', 'info', () => {
          get().addCustomer(dataWithoutId);
        });
      } else {
        get().addToast('Customer deleted', 'info');
      }
    } catch (err: unknown) {
      get().addToast(err instanceof Error ? err.message : 'Failed to delete customer', 'error');
    }
  },
});
