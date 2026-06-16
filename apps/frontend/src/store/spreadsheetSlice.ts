import type { StateCreator } from 'zustand';
import { CUSTOMER_STATUSES, type SheetColumn, type SheetRow, type CellValue, type Customer, type InventoryItem } from '@sheetflow/shared';
import { evaluateFormula, recalculateSheet } from '../utils/formulaEngine.js';

export interface SpreadsheetSlice {
  columns: Record<string, SheetColumn[]>;
  rows: Record<string, SheetRow[]>;
  savingRowId: string | null;
  recalcTimer: ReturnType<typeof setTimeout> | null;
  updateSpreadsheetCell: (tab: 'crm' | 'inventory' | 'quotes', rowId: string, colId: string, rawValue: string) => void;
  saveSpreadsheetRow: (tab: 'crm' | 'inventory' | 'quotes', rowId: string) => Promise<void>;
  addNewRow: (tab: 'crm' | 'inventory' | 'quotes') => void;
  deleteSpreadsheetRow: (tab: 'crm' | 'inventory' | 'quotes', rowId: string) => Promise<void>;
}

// The combined store state type (defined in sheetStore.ts)
type SheetStoreState = import('./sheetStore.js').SheetStoreState;

type StoreGet = () => {
  rows: Record<string, SheetRow[]>;
  columns: Record<string, SheetColumn[]>;
  recalcTimer: ReturnType<typeof setTimeout> | null;
  addCustomer: (data: Omit<Customer, 'id'>) => Promise<void>;
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<void>;
  addInventoryItem: (data: Omit<InventoryItem, 'id'>) => Promise<void>;
  updateInventoryItem: (id: string, data: Partial<InventoryItem>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;
  addToast: (text: string, type?: 'success' | 'info' | 'error') => void;
};

export const createSpreadsheetSlice: StateCreator<SheetStoreState, [], [], SpreadsheetSlice> = (set, get: StoreGet) => ({
  columns: {
    crm: [
      { id: 'name', name: 'Name', type: 'text' },
      { id: 'email', name: 'Email', type: 'text' },
      { id: 'phone', name: 'Phone', type: 'text' },
      { id: 'company', name: 'Company', type: 'text' },
      { id: 'status', name: 'Status', type: 'select', options: [...CUSTOMER_STATUSES] },
      { id: 'notes', name: 'Notes', type: 'text' },
    ],
    inventory: [
      { id: 'sku', name: 'SKU', type: 'text' },
      { id: 'name', name: 'Product Name', type: 'text' },
      { id: 'stock', name: 'Stock Quantity', type: 'number' },
      { id: 'alertThreshold', name: 'Alert Threshold', type: 'number' },
      { id: 'price', name: 'Unit Price ($)', type: 'number' },
    ],
  },
  rows: { crm: [], inventory: [], quotes: [] },
  savingRowId: null,
  recalcTimer: null,

  updateSpreadsheetCell: (tab, rowId, colId, rawValue) => {
    set((state: SheetStoreState) => {
      const tabRows = [...state.rows[tab]];
      const rowIndex = tabRows.findIndex((r: SheetRow) => r.id === rowId);
      if (rowIndex === -1) return {};
      const row = { ...tabRows[rowIndex] };
      const cells = { ...row.cells };
      let evaluatedValue: CellValue = rawValue;
      let evaluatedError: string | null = null;
      if (typeof rawValue === 'string' && rawValue.startsWith('=')) {
        try {
          const rowData: Record<string, CellValue> = {};
          for (const key of Object.keys(cells)) {
            rowData[key] = cells[key]?.value ?? null;
          }
          const colKeys = state.columns[tab].map((c: SheetColumn) => c.id);
          const valuesMap: Record<string, CellValue> = {};
          state.rows[tab].forEach((r: SheetRow, rIdx: number) => {
            colKeys.forEach((ck: string) => { valuesMap[`${ck}-${rIdx}`] = r.cells[ck]?.value ?? null; });
          });
          const result = evaluateFormula(rawValue, rowData, { values: valuesMap, colKeys, rowCount: state.rows[tab].length });
          evaluatedValue = result.value;
          evaluatedError = result.error ?? null;
        } catch (e) { evaluatedError = e instanceof Error ? e.message : 'Formula error'; }
      }
      cells[colId] = { id: `${colId}-${rowId}`, raw: rawValue, value: evaluatedValue, error: evaluatedError };
      row.cells = cells;
      tabRows[rowIndex] = row;
      return { rows: { ...state.rows, [tab]: tabRows } };
    });

    const hasFormulas = get().rows[tab].some((r: SheetRow) =>
      Object.values(r.cells).some((c) => typeof c.raw === 'string' && c.raw.startsWith('='))
    );
    if (!hasFormulas) return;

    const timer = get().recalcTimer;
    if (timer) clearTimeout(timer);
    const newTimer = setTimeout(() => {
      set((state: SheetStoreState) => {
        const recalculated = recalculateSheet(state.columns[tab], state.rows[tab]);
        return { rows: { ...state.rows, [tab]: recalculated } };
      });
      set({ recalcTimer: null });
    }, 150);
    set({ recalcTimer: newTimer });
  },

  addNewRow: (tab) => {
    set((state: SheetStoreState) => {
      const newId = `new-${Math.random().toString(36).substring(2, 9)}`;
      const emptyCells: Record<string, SheetRow['cells'][string]> = {};
      state.columns[tab].forEach((col: SheetColumn) => {
        const defaultVal: CellValue = col.id === 'status' ? 'Lead' : col.type === 'number' ? null : '';
        emptyCells[col.id] = { id: `${col.id}-${newId}`, raw: defaultVal as string, value: defaultVal, error: null };
      });
      const newRow: SheetRow = { id: newId, cells: emptyCells as SheetRow['cells'], isNew: true };
      return { rows: { ...state.rows, [tab]: [newRow, ...state.rows[tab]] } };
    });
  },

  saveSpreadsheetRow: async (tab, rowId) => {
    set({ savingRowId: rowId });
    const state = get();
    const row = state.rows[tab].find((r: SheetRow) => r.id === rowId);
    if (!row) { set({ savingRowId: null }); return; }
    const payload: Record<string, unknown> = {};
    for (const colId of Object.keys(row.cells)) {
      let cellVal = row.cells[colId].value;
      const colDef = state.columns[tab].find((c: SheetColumn) => c.id === colId);
      if (colDef?.type === 'number') cellVal = Number(cellVal) || 0;
      payload[colId] = cellVal;
    }
    try {
      if (row.isNew) {
        if (tab === 'crm') await state.addCustomer(payload as Omit<Customer, 'id'>);
        else if (tab === 'inventory') await state.addInventoryItem(payload as Omit<InventoryItem, 'id'>);
      } else {
        if (tab === 'crm') await state.updateCustomer(rowId, payload as Partial<Customer>);
        else if (tab === 'inventory') await state.updateInventoryItem(rowId, payload as Partial<InventoryItem>);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      state.addToast('Failed to save row: ' + message, 'error');
    } finally {
      set({ savingRowId: null });
    }
  },

  deleteSpreadsheetRow: async (tab, rowId) => {
    if (rowId.startsWith('new-')) {
      set((state: SheetStoreState) => ({ rows: { ...state.rows, [tab]: state.rows[tab].filter((r: SheetRow) => r.id !== rowId) } }));
      return;
    }
    const state = get();
    if (tab === 'crm') await state.deleteCustomer(rowId);
    else if (tab === 'inventory') await state.deleteInventoryItem(rowId);
  },
});
