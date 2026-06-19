import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// ── Shared mocks ──────────────────────────────────────────────────────────
vi.mock('framer-motion', () => {
  const motion = new Proxy({}, {
    get: (_target, prop: string) => {
      return ({ children, className, ...props }: any) => {
        const safe = Object.fromEntries(
          Object.entries(props).filter(([k]) =>
            !['animate', 'transition', 'initial', 'exit', 'variants', 'whileHover', 'whileTap', 'layoutId', 'layout'].includes(k)
          )
        );
        const Tag = prop as any;
        return <Tag className={className} {...safe}>{children}</Tag>;
      };
    }
  });
  return {
    motion,
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

const mockAddToast = vi.hoisted(() => vi.fn());
vi.mock('../../store/sheetStore.js', () => ({
  useSheetStore: Object.assign(vi.fn(), { getState: () => ({ addToast: mockAddToast }) }),
}));

vi.mock('../../store/api.js', () => ({
  apiFetch: vi.fn(),
  API_BASE: '/api',
}));

vi.mock('../../hooks/useCustomers.js', () => ({
  useCustomers: vi.fn(),
}));

vi.mock('../../hooks/useInventory.js', () => ({
  useInventory: vi.fn(),
}));

vi.mock('@sheetflow/shared', () => ({
  TAX_RATE: 0.20,
  TAX_RATE_LABEL: 'VAT (20%)',
}));

import { useSheetStore } from '../../store/sheetStore.js';
import { apiFetch } from '../../store/api.js';
import { useCustomers } from '../../hooks/useCustomers.js';
import { useInventory } from '../../hooks/useInventory.js';
import QuoteGenerator from '../QuoteGenerator.js';

// ── Helpers ────────────────────────────────────────────────────────────────
const defaultStore = {
  createQuote: vi.fn(),
  updateQuote: vi.fn(),
  editingQuoteId: null,
  setEditingQuote: vi.fn(),
};

const sampleCustomers = [
  { id: 'c1', name: 'Acme Corp', email: 'a@a.com', company: 'Acme' },
  { id: 'c2', name: 'Beta Inc', email: 'b@b.com', company: null },
];

const sampleInventory = [
  { id: 'i1', sku: 'WIDGET', name: 'Premium Widget', stock: 10, price: '29.99' },
  { id: 'i2', sku: 'GADGET', name: 'Ergonomic Gadget', stock: 5, price: '99.50' },
];

const sampleQuote = {
  id: 'q1',
  customerId: 'c1',
  quoteNumber: 'QT-001',
  status: 'Draft',
  total: '179.88',
  items: [
    { productId: 'i1', name: 'Premium Widget', quantity: 4, unitPrice: '29.99' },
    { productId: 'i2', name: 'Ergonomic Gadget', quantity: 1, unitPrice: '49.99' },
  ],
  notes: 'Test notes',
  validUntil: '2026-12-31T00:00:00.000Z',
};

function mockAllHooks(overrides?: {
  customers?: any[];
  inventory?: any[];
  store?: Record<string, any>;
  editingQuoteId?: string | null;
}) {
  const { customers = sampleCustomers, inventory = sampleInventory,
          store = {}, editingQuoteId = null } = overrides ?? {};
  vi.mocked(useCustomers).mockReturnValue({ data: customers } as any);
  vi.mocked(useInventory).mockReturnValue({ data: inventory } as any);
  vi.mocked(useSheetStore).mockReturnValue({ ...defaultStore, editingQuoteId, ...store });
}

/** Helper: select a customer, add an item, and select a product to create a valid quote form state. */
async function fillValidQuote() {
  const customerCombobox = screen.getByText('Select a Customer...');
  fireEvent.click(customerCombobox);
  const customerOption = screen.getByText('Acme Corp');
  fireEvent.click(customerOption);

  fireEvent.click(screen.getByText('Add Item'));

  const productCombobox = screen.getByText('Select Product...');
  fireEvent.click(productCombobox);
  const productOption = screen.getByText('Premium Widget');
  fireEvent.click(productOption);
}

describe('QuoteGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAllHooks({ editingQuoteId: null });
  });

  // ── Create Mode ───────────────────────────────────────────────────────
  it('renders in create mode by default', () => {
    render(<QuoteGenerator />);
    expect(screen.getByText('Create New Quote')).toBeInTheDocument();
    expect(screen.getByText(/Compile products, assign clients/i)).toBeInTheDocument();
  });

  it('renders the form elements', () => {
    render(<QuoteGenerator />);
    expect(screen.getByText('Select a Customer...')).toBeInTheDocument();
    expect(screen.getByText('Add Item')).toBeInTheDocument();
    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText('Total Quote Value')).toBeInTheDocument();
  });

  it('shows disabled submit button when no customer selected', () => {
    render(<QuoteGenerator />);
    const submitButton = screen.getByText('Create Quote');
    // motion.button is rendered as <div> in the mock; the disabled prop is spread
    // onto the mock div. Use closest('[disabled]') to find the motion.button div.
    expect(submitButton.closest('[disabled]')).not.toBeNull();
  });

  // ── Customer Selection ────────────────────────────────────────────────
  it('renders customer options in the dropdown', async () => {
    render(<QuoteGenerator />);
    fireEvent.click(screen.getByText('Select a Customer...'));
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Beta Inc')).toBeInTheDocument();
  });

  it('filters customers by search text', async () => {
    render(<QuoteGenerator />);
    fireEvent.click(screen.getByText('Select a Customer...'));
    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'Acme' } });
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.queryByText('Beta Inc')).toBeNull();
  });

  // ── Items Management ──────────────────────────────────────────────────
  it('adds a new line item when "Add Item" is clicked', () => {
    render(<QuoteGenerator />);
    expect(screen.getByText(/No items added yet/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Add Item'));
    expect(screen.queryByText(/No items added yet/i)).toBeNull();
  });

  it('removes a line item', () => {
    const { container } = render(<QuoteGenerator />);
    fireEvent.click(screen.getByText('Add Item'));
    fireEvent.click(screen.getByText('Add Item'));
    // Two items present — each has a remove button with text-rose-500 class
    // (motion.button renders as <div> so use querySelector instead of getByRole)
    const removeButtons = container.querySelectorAll('.text-rose-500');
    expect(removeButtons.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(removeButtons[0] as HTMLElement);
    const remaining = container.querySelectorAll('.text-rose-500');
    expect(remaining.length).toBeLessThan(removeButtons.length);
  });

  // ── Product Selection ─────────────────────────────────────────────────
  it('renders inventory items in product select', async () => {
    render(<QuoteGenerator />);
    fireEvent.click(screen.getByText('Add Item'));
    fireEvent.click(screen.getByText('Select Product...'));
    expect(screen.getByText('Premium Widget')).toBeInTheDocument();
    expect(screen.getByText('Ergonomic Gadget')).toBeInTheDocument();
  });

  // ── Empty Inventory ───────────────────────────────────────────────────
  it('renders without error when inventory is empty', () => {
    mockAllHooks({ inventory: [] });
    render(<QuoteGenerator />);
    expect(screen.getByText('Create New Quote')).toBeInTheDocument();
    expect(screen.getByText('Select a Customer...')).toBeInTheDocument();
  });

  it('shows only placeholder in product select when inventory is empty', async () => {
    mockAllHooks({ inventory: [] });
    render(<QuoteGenerator />);
    fireEvent.click(screen.getByText('Add Item'));
    fireEvent.click(screen.getByText('Select Product...'));
    expect(screen.getByText('No options found')).toBeInTheDocument();
  });

  // ── Calculations ──────────────────────────────────────────────────────
  it('renders initial zero values', () => {
    render(<QuoteGenerator />);
    const zeroValues = screen.getAllByText(/\(?\$0\.00\)?/);
    expect(zeroValues.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Subtotal')).toBeInTheDocument();
  });

  // ── Edit Mode ─────────────────────────────────────────────────────────
  it('populates customer field when editing a quote', async () => {
    mockAllHooks({ editingQuoteId: 'q1' });
    vi.mocked(apiFetch).mockResolvedValue(sampleQuote);
    render(<QuoteGenerator />);

    await waitFor(() => {
      // The customer select should show the selected customer name
      expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
    });
  });

  it('populates items when editing a quote', async () => {
    mockAllHooks({ editingQuoteId: 'q1' });
    vi.mocked(apiFetch).mockResolvedValue(sampleQuote);
    render(<QuoteGenerator />);

    await waitFor(() => {
      // After loading, the items should be rendered
      expect(screen.getByText('Premium Widget')).toBeInTheDocument();
      expect(screen.getByText('Ergonomic Gadget')).toBeInTheDocument();
    });
  });

  it('populates notes when editing a quote', async () => {
    mockAllHooks({ editingQuoteId: 'q1' });
    vi.mocked(apiFetch).mockResolvedValue(sampleQuote);
    render(<QuoteGenerator />);

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText('Internal notes, special instructions...');
      expect(textarea).toHaveValue('Test notes');
    });
  });

  it('populates validUntil when editing a quote', async () => {
    mockAllHooks({ editingQuoteId: 'q1' });
    vi.mocked(apiFetch).mockResolvedValue(sampleQuote);
    render(<QuoteGenerator />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('2026-12-31')).toBeInTheDocument();
    });
  });

  it('shows error toast when loading quote fails', async () => {
    vi.mocked(apiFetch).mockRejectedValue(new Error('API error'));
    mockAllHooks({ editingQuoteId: 'q1' });
    render(<QuoteGenerator />);

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith('Failed to load quote', 'error');
    });
  });

  it('resets submitting state when createQuote fails', async () => {
    const createQuote = vi.fn().mockRejectedValue(new Error('Network error'));
    mockAllHooks({ store: { createQuote } });
    render(<QuoteGenerator />);

    await fillValidQuote();

    // Initially shows "Create Quote"
    expect(screen.getByText('Create Quote')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Create Quote'));

    // During submission, shows "Validating..."
    expect(screen.getByText('Validating...')).toBeInTheDocument();

    // After rejection, goes back to "Create Quote"
    await waitFor(() => {
      expect(screen.getByText('Create Quote')).toBeInTheDocument();
    });
  });

  it('resets submitting state when updateQuote fails', async () => {
    const updateQuote = vi.fn().mockRejectedValue(new Error('Network error'));
    mockAllHooks({ editingQuoteId: 'q1', store: { updateQuote } });
    vi.mocked(apiFetch).mockResolvedValue(sampleQuote);
    render(<QuoteGenerator />);

    // Wait for quote to load
    await waitFor(() => {
      expect(screen.getByText('Update Quote')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Update Quote'));

    // During submission, shows "Validating..."
    expect(screen.getByText('Validating...')).toBeInTheDocument();

    // After rejection, goes back to "Update Quote"
    await waitFor(() => {
      expect(screen.getByText('Update Quote')).toBeInTheDocument();
    });
  });

  it('shows correct edit mode description', async () => {
    mockAllHooks({ editingQuoteId: 'q1' });
    render(<QuoteGenerator />);
    await act(async () => {});
    expect(screen.getByText(/Modify an existing quote/)).toBeInTheDocument();
  });

  it('shows loading skeleton when editing', async () => {
    mockAllHooks({ editingQuoteId: 'q1' });
    render(<QuoteGenerator />);
    await act(async () => {});
    expect(screen.getByText('Edit Quote')).toBeInTheDocument();
  });

  it('loads quote data when editingQuoteId is set', async () => {
    vi.mocked(apiFetch).mockResolvedValue(sampleQuote);
    mockAllHooks({ editingQuoteId: 'q1' });

    render(<QuoteGenerator />);

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith('/api/quotes/q1');
    });
  });

  it('shows cancel editing button when editing', async () => {
    mockAllHooks({ editingQuoteId: 'q1' });
    vi.mocked(apiFetch).mockResolvedValue(sampleQuote);
    render(<QuoteGenerator />);
    await act(async () => {});
    expect(screen.getByText('Cancel Editing')).toBeInTheDocument();
  });

  it('calls setEditingQuote(null) when cancel is clicked', async () => {
    const setEditingQuote = vi.fn();
    mockAllHooks({ editingQuoteId: 'q1', store: { setEditingQuote } });
    vi.mocked(apiFetch).mockResolvedValue(sampleQuote);

    render(<QuoteGenerator />);

    await waitFor(() => {
      expect(screen.getByText('Cancel Editing')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cancel Editing'));
    expect(setEditingQuote).toHaveBeenCalledWith(null);
  });

  // ── Form Submission ───────────────────────────────────────────────────
  it('calls createQuote on submit with valid data', async () => {
    const createQuote = vi.fn().mockResolvedValue(undefined);
    mockAllHooks({ store: { createQuote } });
    render(<QuoteGenerator />);

    await fillValidQuote();

    // Submit — motion.button renders as <div> in the mock
    const submitButton = screen.getByText('Create Quote');
    expect(submitButton.closest('div')?.getAttribute('disabled')).toBeNull();
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(createQuote).toHaveBeenCalled();
      const callArg = createQuote.mock.calls[0][0];
      expect(callArg).toHaveProperty('customerId', 'c1');
      expect(callArg).toHaveProperty('status', 'Draft');
      expect(callArg).toHaveProperty('items');
      expect(callArg).toHaveProperty('total');
    });
  });

  it('calls updateQuote on submit when editing', async () => {
    const updateQuote = vi.fn().mockResolvedValue(undefined);
    mockAllHooks({ editingQuoteId: 'q1', store: { updateQuote } });
    vi.mocked(apiFetch).mockResolvedValue(sampleQuote);

    render(<QuoteGenerator />);

    // Wait for quote to load and form to populate
    await waitFor(() => {
      expect(screen.getByText('Update Quote')).toBeInTheDocument();
    });

    // The form should be auto-populated from the loaded quote, no need to fill manually
    const submitButton = screen.getByText('Update Quote');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(updateQuote).toHaveBeenCalledWith('q1', expect.objectContaining({
        customerId: 'c1',
      }));
    });
  });

  // ── Notes & Valid Until ───────────────────────────────────────────────
  it('renders notes textarea', () => {
    render(<QuoteGenerator />);
    expect(screen.getByPlaceholderText('Internal notes, special instructions...')).toBeInTheDocument();
  });

  it('renders valid until date input', () => {
    render(<QuoteGenerator />);
    expect(screen.getByText(/Valid Until/)).toBeInTheDocument();
  });

  // ── Summary Panel ─────────────────────────────────────────────────────
  it('renders the summary panel with initial zero values', () => {
    render(<QuoteGenerator />);
    const dollarValues = screen.getAllByText(/\$0\.00/);
    expect(dollarValues.length).toBeGreaterThanOrEqual(1);
  });

  it('renders TAX_RATE_LABEL in the summary', () => {
    render(<QuoteGenerator />);
    expect(screen.getAllByText('VAT (20%)').length).toBeGreaterThanOrEqual(1);
  });
});
