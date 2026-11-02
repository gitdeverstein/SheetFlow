import type { StateCreator } from 'zustand';
import type { Customer } from '@sheetflow/shared';
import { API_BASE, apiFetch } from './api.js';
import { apiAction } from './apiUtils.js';
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
    await apiAction(
      () => apiFetch(`${API_BASE}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
      get().addToast,
      {
        invalidateKeys: [customersKeys.all],
        successMessage: 'Customer added successfully',
        errorMessage: 'Failed to add customer',
      },
    );
  },

  updateCustomer: async (id, data) => {
    await apiAction(
      () => apiFetch(`${API_BASE}/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
      get().addToast,
      {
        invalidateKeys: [customersKeys.all],
        errorMessage: 'Failed to update customer',
      },
    );
  },

  deleteCustomer: async (id) => {
    const deletedCustomer = (queryClient.getQueryData<Customer[]>(customersKeys.all) || []).find((c) => c.id === id);

    await apiAction(
      () => apiFetch(`${API_BASE}/customers/${id}`, { method: 'DELETE' }),
      get().addToast,
      {
        invalidateKeys: [customersKeys.all],
        errorMessage: 'Failed to delete customer',
        onSuccess: (_result, toast) => {
          if (!deletedCustomer) {
            toast('Customer deleted', 'info');
            return;
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id: _id, ...dataWithoutId } = deletedCustomer;
          toast('Customer deleted', 'info', () => {
            get().addCustomer(dataWithoutId);
          });
        },
      },
    );
  },
});
