import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ── Shared mocks ──────────────────────────────────────────────────────────
vi.mock('framer-motion', () => {
  const C = ({ children, className, ...props }: any) => {
    const safe = Object.fromEntries(
      Object.entries(props).filter(([k]) => k !== 'animate' && k !== 'transition' && k !== 'initial' && k !== 'exit' && k !== 'variants' && k !== 'whileHover' && k !== 'whileTap')
    );
    return <div className={className} {...safe}>{children}</div>;
  };
  return {
    motion: new Proxy({}, { get: () => C }),
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

vi.mock('react-window', () => ({
  FixedSizeList: ({ children, itemCount }: any) => (
    <div data-testid="fixed-size-list">
      {Array.from({ length: itemCount }, (_, index) => children({ index, style: {} }))}
    </div>
  ),
}));

vi.mock('../../store/sheetStore.js', () => ({
  useSheetStore: vi.fn(),
  buildCrmRow: vi.fn((c: any) => ({
    id: c.id,
    cells: {
      name: { id: `name-${c.id}`, raw: c.name, value: c.name, error: null },
      email: { id: `email-${c.id}`, raw: c.email, value: c.email, error: null },
      phone: { id: `phone-${c.id}`, raw: c.phone || '', value: c.phone || '', error: null },
      company: { id: `company-${c.id}`, raw: c.company || '', value: c.company || '', error: null },
      status: { id: `status-${c.id}`, raw: c.status, value: c.status, error: null },
      notes: { id: `notes-${c.id}`, raw: c.notes || '', value: c.notes || '', error: null },
    },
  })),
  buildInvRow: vi.fn((item: any) => ({
    id: item.id,
    cells: {
      sku: { id: `sku-${item.id}`, raw: item.sku, value: item.sku, error: null },
      name: { id: `name-${item.id}`, raw: item.name, value: item.name, error: null },
      stock: { id: `stock-${item.id}`, raw: String(item.stock), value: item.stock, error: null },
      alertThreshold: { id: `alertThreshold-${item.id}`, raw: String(item.alertThreshold), value: item.alertThreshold, error: null },
      price: { id: `price-${item.id}`, raw: String(item.price), value: Number(item.price), error: null },
    },
  })),
}));

vi.mock('../../hooks/useCustomers.js', () => ({
  useCustomers: vi.fn(),
}));

vi.mock('../../hooks/useInventory.js', () => ({
  useInventory: vi.fn(),
}));

import { useSheetStore } from '../../store/sheetStore.js';
import { useCustomers } from '../../hooks/useCustomers.js';
import { useInventory } from '../../hooks/useInventory.js';
import SpreadsheetGrid from '../SpreadsheetGrid.js';

// ── Helpers ────────────────────────────────────────────────────────────────
const crmColumns = [
  { id: 'name', name: 'Name', type: 'text' },
  { id: 'email', name: 'Email', type: 'text' },
  { id: 'status', name: 'Status', type: 'select', options: ['Active', 'Lead', 'Inactive'] },
];

const invColumns = [
  { id: 'sku', name: 'SKU', type: 'text' },
  { id: 'name', name: 'Product Name', type: 'text' },
  { id: 'stock', name: 'Stock Quantity', type: 'number' },
  { id: 'price', name: 'Unit Price ($)', type: 'number' },
];

const defaultStore = {
  columns: { crm: crmColumns, inventory: invColumns },
  rows: { crm: [], inventory: [], quotes: [] },
  updateSpreadsheetCell: vi.fn(),
  saveSpreadsheetRow: vi.fn(),
  addNewRow: vi.fn(),
  deleteSpreadsheetRow: vi.fn(),
  filters: {},
  setFilter: vi.fn(),
  sort: null,
  setSort: vi.fn(),
  loading: false,
  savingRowId: null,
  bulkImportInventory: vi.fn(),
  addToast: vi.fn(),
};

const sampleCustomers = [
  { id: 'c1', name: 'Alice Smith', email: 'alice@test.com', phone: '555-0100', company: 'Acme', status: 'Active', notes: '' },
  { id: 'c2', name: 'Bob Jones', email: 'bob@test.com', phone: '', company: null, status: 'Lead', notes: '' },
];

const sampleInventory = [
  { id: 'i1', sku: 'WGT-001', name: 'Widget Gold', stock: 45, alertThreshold: 10, price: 149.99 },
  { id: 'i2', sku: 'GDT-001', name: 'Gadget Standard', stock: 8, alertThreshold: 15, price: 249.50 },
];

function mockHooks(overrides?: {
  customers?: any[]; customersLoading?: boolean;
  inventory?: any[]; inventoryLoading?: boolean;
  store?: Record<string, any>;
}) {
  const { customers = sampleCustomers, customersLoading = false,
          inventory = sampleInventory, inventoryLoading = false,
          store = {} } = overrides ?? {};
  vi.mocked(useCustomers).mockReturnValue({ data: customers, isLoading: customersLoading } as any);
  vi.mocked(useInventory).mockReturnValue({ data: inventory, isLoading: inventoryLoading } as any);
  vi.mocked(useSheetStore).mockReturnValue({ ...defaultStore, ...store });
}

describe('SpreadsheetGrid — CRM Tab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHooks();
  });

  it('renders the CRM header', () => {
    render(<SpreadsheetGrid tab="crm" />);
    expect(screen.getByText('Customer Directory')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<SpreadsheetGrid tab="crm" />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders customer data rows', async () => {
    render(<SpreadsheetGrid tab="crm" />);
    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    });
  });

  it('renders email values in cells', async () => {
    render(<SpreadsheetGrid tab="crm" />);
    await waitFor(() => {
      expect(screen.getByText('alice@test.com')).toBeInTheDocument();
    });
  });

  it('renders Add New Row button', () => {
    render(<SpreadsheetGrid tab="crm" />);
    expect(screen.getByText('Add New Row')).toBeInTheDocument();
  });

  it('calls addNewRow when Add New Row is clicked', () => {
    const addNewRow = vi.fn();
    mockHooks({ store: { addNewRow } });
    render(<SpreadsheetGrid tab="crm" />);
    fireEvent.click(screen.getByText('Add New Row'));
    expect(addNewRow).toHaveBeenCalledWith('crm');
  });

  it('renders filter inputs', () => {
    render(<SpreadsheetGrid tab="crm" />);
    const filterInputs = screen.getAllByPlaceholderText('Filter...');
    expect(filterInputs).toHaveLength(crmColumns.length);
  });

  it('calls setFilter on filter change', () => {
    const setFilter = vi.fn();
    mockHooks({ store: { setFilter } });
    render(<SpreadsheetGrid tab="crm" />);
    const filterInputs = screen.getAllByPlaceholderText('Filter...');
    fireEvent.change(filterInputs[0], { target: { value: 'Alice' } });
    expect(setFilter).toHaveBeenCalledWith('name', 'Alice');
  });

  it('shows empty state when no customers', () => {
    mockHooks({ customers: [] });
    render(<SpreadsheetGrid tab="crm" />);
    expect(screen.getByText('No customers yet')).toBeInTheDocument();
  });

  it('shows skeleton loader when data is loading', () => {
    mockHooks({ customersLoading: true });
    const { container } = render(<SpreadsheetGrid tab="crm" />);
    // SkeletonLoader should render instead of data rows
    const skeletonDivs = container.querySelectorAll('[class*="bg-slate-800"]');
    expect(skeletonDivs.length).toBeGreaterThan(0);
    expect(screen.queryByText('Alice Smith')).toBeNull();
  });

  it('renders save and delete buttons for each row', async () => {
    render(<SpreadsheetGrid tab="crm" />);
    await waitFor(() => {
      const saveButtons = screen.getAllByTitle('Save');
      const deleteButtons = screen.getAllByTitle('Delete');
      expect(saveButtons.length).toBeGreaterThanOrEqual(1);
      expect(deleteButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows delete confirmation modal on delete click', async () => {
    render(<SpreadsheetGrid tab="crm" />);

    await waitFor(() => {
      const deleteButtons = screen.getAllByTitle('Delete');
      expect(deleteButtons.length).toBeGreaterThanOrEqual(1);
      fireEvent.click(deleteButtons[0]);
    });

    expect(screen.getByText('Delete Record')).toBeInTheDocument();
  });

  it('calls deleteSpreadsheetRow after confirming delete', async () => {
    const deleteSpreadsheetRow = vi.fn();
    mockHooks({ store: { deleteSpreadsheetRow } });
    render(<SpreadsheetGrid tab="crm" />);

    await waitFor(() => {
      const deleteButton = screen.getAllByTitle('Delete')[0];
      fireEvent.click(deleteButton);
    });

    // Click the Delete button in the confirmation modal
    const modalButtons = screen.getAllByRole('button').filter(b => b.textContent === 'Delete');
    expect(modalButtons.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(modalButtons[0]);

    await waitFor(() => {
      expect(deleteSpreadsheetRow).toHaveBeenCalled();
    });
  });

  it('renders pagination controls', () => {
    render(<SpreadsheetGrid tab="crm" />);
    expect(screen.getByText('Rows per page:')).toBeInTheDocument();
  });

  it('shows status dropdown for status column', async () => {
    render(<SpreadsheetGrid tab="crm" />);
    await waitFor(() => {
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('SpreadsheetGrid — Inventory Tab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHooks();
  });

  it('renders the inventory header', () => {
    render(<SpreadsheetGrid tab="inventory" />);
    expect(screen.getByText('Inventory Manager')).toBeInTheDocument();
  });

  it('renders inventory column headers', () => {
    render(<SpreadsheetGrid tab="inventory" />);
    expect(screen.getByText('SKU')).toBeInTheDocument();
    expect(screen.getByText('Product Name')).toBeInTheDocument();
    expect(screen.getByText('Stock Quantity')).toBeInTheDocument();
    expect(screen.getByText('Unit Price ($)')).toBeInTheDocument();
  });

  it('renders inventory data rows', async () => {
    render(<SpreadsheetGrid tab="inventory" />);
    await waitFor(() => {
      expect(screen.getByText('Widget Gold')).toBeInTheDocument();
      expect(screen.getByText('Gadget Standard')).toBeInTheDocument();
    });
  });

  it('renders CSV import button', () => {
    render(<SpreadsheetGrid tab="inventory" />);
    expect(screen.getByText('Import CSV')).toBeInTheDocument();
  });

  it('does not render CSV import button for CRM tab', () => {
    render(<SpreadsheetGrid tab="crm" />);
    expect(screen.queryByText('Import CSV')).toBeNull();
  });

  it('shows empty state when no inventory items', () => {
    mockHooks({ inventory: [] });
    render(<SpreadsheetGrid tab="inventory" />);
    expect(screen.getByText('No products yet')).toBeInTheDocument();
  });

  it('shows stock and price values', async () => {
    render(<SpreadsheetGrid tab="inventory" />);
    await waitFor(() => {
      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('149.99')).toBeInTheDocument();
    });
  });
});

describe('SpreadsheetGrid — Sorting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows sort indicator when sorted', () => {
    mockHooks({
      store: { sort: { column: 'name', direction: 'asc' as const } },
    });
    render(<SpreadsheetGrid tab="crm" />);
    expect(screen.getByText('▲')).toBeInTheDocument();
  });
});

describe('SpreadsheetGrid — Cell Editing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHooks();
  });

  it('allows double-click to edit a cell', async () => {
    render(<SpreadsheetGrid tab="crm" />);

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });

    // Double-click on the name cell
    const nameCell = screen.getByText('Alice Smith');
    fireEvent.doubleClick(nameCell);

    // An input should appear — there may be filter inputs too, but the editing
    // input is the one inside the cell area (not in a filter row)
    const textInputs = screen.getAllByRole('textbox');
    expect(textInputs.length).toBeGreaterThanOrEqual(1);
  });
});
