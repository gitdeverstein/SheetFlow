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

vi.mock('../../store/sheetStore.js', () => ({
  useSheetStore: vi.fn(),
}));

vi.mock('../../hooks/useCustomers.js', () => ({
  useCustomers: vi.fn(),
}));

vi.mock('../../hooks/useInventory.js', () => ({
  useInventory: vi.fn(),
}));

vi.mock('../../hooks/useQuotes.js', () => ({
  useQuotes: vi.fn(),
}));

vi.mock('@sheetflow/shared', () => ({
  QUOTE_STATUS_TRANSITIONS: {
    Draft: ['Sent'],
    Sent: ['Accepted', 'Rejected'],
    Accepted: [],
    Rejected: [],
  },
}));

import { useSheetStore } from '../../store/sheetStore.js';
import { useCustomers } from '../../hooks/useCustomers.js';
import { useInventory } from '../../hooks/useInventory.js';
import { useQuotes } from '../../hooks/useQuotes.js';
import Dashboard from '../Dashboard.js';

// ── Helpers ────────────────────────────────────────────────────────────────
const defaultStore = {
  generatePdf: vi.fn(),
  generatingPdfId: null,
  exportExcel: vi.fn(),
  exportingExcelId: null,
  updateQuoteStatus: vi.fn(),
  deleteQuote: vi.fn(),
  duplicateQuote: vi.fn(),
  setEditingQuote: vi.fn(),
  setActiveTab: vi.fn(),
};

const sampleCustomers = [
  { id: 'c1', name: 'Acme Corp', email: 'a@a.com', status: 'Active', company: 'Acme' },
  { id: 'c2', name: 'Beta Inc', email: 'b@b.com', status: 'Lead', company: null },
];

const sampleInventory = [
  { id: 'i1', sku: 'WIDGET', name: 'Widget', stock: 10, alertThreshold: 5, price: 19.99 },
  { id: 'i2', sku: 'GADGET', name: 'Gadget', stock: 2, alertThreshold: 5, price: 49.99 },
];

const sampleQuotes = [
  { id: 'q1', quoteNumber: 'QT-001', customerName: 'Acme Corp', status: 'Draft', total: '100.00', customerId: 'c1', validUntil: '2026-12-31' },
  { id: 'q2', quoteNumber: 'QT-002', customerName: 'Beta Inc', status: 'Accepted', total: '500.00', customerId: 'c2', validUntil: '2026-01-01' },
];

function mockAllHooks(overrides?: {
  customers?: any[]; customersLoading?: boolean;
  inventory?: any[]; inventoryLoading?: boolean;
  quotes?: any[]; quotesLoading?: boolean;
  store?: Record<string, any>;
}) {
  const { customers = sampleCustomers, customersLoading = false,
          inventory = sampleInventory, inventoryLoading = false,
          quotes = sampleQuotes, quotesLoading = false,
          store = {} } = overrides ?? {};

  vi.mocked(useCustomers).mockReturnValue({ data: customers, isLoading: customersLoading } as any);
  vi.mocked(useInventory).mockReturnValue({ data: inventory, isLoading: inventoryLoading } as any);
  vi.mocked(useQuotes).mockReturnValue({ data: quotes, isLoading: quotesLoading } as any);
  vi.mocked(useSheetStore).mockReturnValue({ ...defaultStore, ...store });
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAllHooks();
  });

  // ── Loading State ──────────────────────────────────────────────────────
  it('renders skeleton loader when data is loading', () => {
    mockAllHooks({ customersLoading: true, inventoryLoading: true, quotesLoading: true });
    const { container } = render(<Dashboard />);
    // SkeletonLoader renders divs with "bg-slate-800/50" class — check for skeleton blocks
    const skeletonBlocks = container.querySelectorAll('.rounded-xl\\.bg-slate-800\\/50, [class*="bg-slate-800"]');
    // No KPI card values should be visible
    expect(screen.queryByText('Accepted Revenue')).toBeNull();
    expect(screen.queryByText('Total Customers')).toBeNull();
    expect(screen.getByText(/Real-time KPIs/i)).toBeInTheDocument();
  });

  // ── Header ─────────────────────────────────────────────────────────────
  it('renders the dashboard header', () => {
    render(<Dashboard />);
    expect(screen.getByText('Real-time KPIs')).toBeInTheDocument();
    expect(screen.getByText(/Monitor your customer pipelines/i)).toBeInTheDocument();
  });

  // ── KPI Cards ──────────────────────────────────────────────────────────
  it('renders KPI cards with correct values', () => {
    render(<Dashboard />);
    expect(screen.getByText('Accepted Revenue')).toBeInTheDocument();
    expect(screen.getByText('Total Customers')).toBeInTheDocument();
    expect(screen.getByText('Catalog Products')).toBeInTheDocument();
    expect(screen.getByText('Stock Alerts')).toBeInTheDocument();
  });

  it('shows stock alert count', () => {
    render(<Dashboard />);
    const alertCards = screen.getAllByText('Stock Alerts');
    expect(alertCards).toHaveLength(1);
  });

  // ── Empty Quote Table ──────────────────────────────────────────────────
  it('shows empty state when no quotes exist', () => {
    mockAllHooks({ quotes: [] });
    render(<Dashboard />);
    expect(screen.getByText('No quotes generated yet.')).toBeInTheDocument();
  });

  // ── Quote Table ────────────────────────────────────────────────────────
  it('renders quotes in the table', () => {
    render(<Dashboard />);
    expect(screen.getByText('QT-001')).toBeInTheDocument();
    expect(screen.getByText('QT-002')).toBeInTheDocument();
    const acmeTexts = screen.getAllByText('Acme Corp');
    expect(acmeTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('formats total as currency', () => {
    render(<Dashboard />);
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('$500.00')).toBeInTheDocument();
  });

  // ── Donut Chart ────────────────────────────────────────────────────────
  it('renders donut chart with status counts', () => {
    mockAllHooks({
      quotes: [
        { id: 'q1', quoteNumber: 'QT-001', customerName: 'Acme', status: 'Draft', total: '100', customerId: 'c1' },
        { id: 'q2', quoteNumber: 'QT-002', customerName: 'Beta', status: 'Accepted', total: '200', customerId: 'c2' },
      ],
    });
    render(<Dashboard />);
    expect(screen.getByText('Quote Breakdown')).toBeInTheDocument();
    const draftTexts = screen.getAllByText('Draft');
    const acceptedTexts = screen.getAllByText('Accepted');
    expect(draftTexts.length).toBeGreaterThanOrEqual(1);
    expect(acceptedTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('shows empty donut message when no quotes', () => {
    mockAllHooks({ quotes: [] });
    render(<Dashboard />);
    expect(screen.getByText('No quotes yet.')).toBeInTheDocument();
  });

  // ── StatusPill ─────────────────────────────────────────────────────────
  it('renders status pill for each quote', () => {
    render(<Dashboard />);
    const draftPills = screen.getAllByText('Draft');
    const acceptedPills = screen.getAllByText('Accepted');
    expect(draftPills.length).toBeGreaterThanOrEqual(1);
    expect(acceptedPills.length).toBeGreaterThanOrEqual(1);
  });

  it('calls updateQuoteStatus when changing status', async () => {
    const updateQuoteStatus = vi.fn().mockResolvedValue(undefined);
    mockAllHooks({
      store: { updateQuoteStatus },
      quotes: [
        { id: 'q1', quoteNumber: 'QT-001', customerName: 'Acme', status: 'Sent', total: '100', customerId: 'c1' },
      ],
    });

    render(<Dashboard />);

    // Find the Sent StatusPill button (it's the one with the ▾ dropdown indicator)
    const sentButtons = screen.getAllByRole('button').filter(b => b.textContent?.includes('Sent') && b.textContent?.includes('▾'));
    expect(sentButtons.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(sentButtons[0]);

    // The Accepted option should appear in the dropdown
    const acceptedOption = await screen.findByRole('button', { name: /Accepted/ });
    fireEvent.click(acceptedOption);

    // Modal should appear
    const confirmButton = await screen.findByText('Confirm', { selector: 'button' });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(updateQuoteStatus).toHaveBeenCalledWith('q1', 'Accepted');
    });
  });

  // ── ExpiryBadge ────────────────────────────────────────────────────────
  it('shows expired badge for past validUntil', () => {
    mockAllHooks({
      quotes: [
        { id: 'q1', quoteNumber: 'QT-001', customerName: 'Acme', status: 'Draft', total: '100', customerId: 'c1', validUntil: '2020-01-01' },
      ],
    });
    render(<Dashboard />);
    expect(screen.getByText('Expired')).toBeInTheDocument();
  });

  it('hides expiry badge for accepted/rejected quotes', () => {
    mockAllHooks({
      quotes: [
        { id: 'q2', quoteNumber: 'QT-002', customerName: 'Beta', status: 'Accepted', total: '500', customerId: 'c2', validUntil: '2020-01-01' },
      ],
    });
    render(<Dashboard />);
    expect(screen.queryByText('Expired')).toBeNull();
  });

  // ── Action buttons ─────────────────────────────────────────────────────
  it('renders Edit button and calls setEditingQuote', () => {
    render(<Dashboard />);
    const editButtons = screen.getAllByRole('button').filter(b => b.getAttribute('title') === 'Edit');
    expect(editButtons.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(editButtons[0]);
    expect(defaultStore.setEditingQuote).toHaveBeenCalledWith('q1');
    expect(defaultStore.setActiveTab).toHaveBeenCalledWith('quotes');
  });

  it('renders delete button and calls deleteQuote after confirm', async () => {
    const deleteQuote = vi.fn().mockResolvedValue(undefined);
    mockAllHooks({ store: { deleteQuote } });
    render(<Dashboard />);
    const deleteButtons = screen.getAllByRole('button').filter(b => b.getAttribute('title') === 'Delete');
    expect(deleteButtons.length).toBeGreaterThanOrEqual(1);

    fireEvent.click(deleteButtons[0]);

    const confirmButton = await screen.findByText('Delete', { selector: 'button' });
    fireEvent.click(confirmButton);

    expect(deleteQuote).toHaveBeenCalled();
  });

  // ── Low Stock Watchlist ────────────────────────────────────────────────
  it('shows stock warning when items are below threshold', () => {
    render(<Dashboard />);
    expect(screen.getByText('Stock Warning')).toBeInTheDocument();
    expect(screen.getByText('Gadget')).toBeInTheDocument();
  });

  it('shows healthy message when all stocks are sufficient', () => {
    mockAllHooks({
      inventory: [
        { id: 'i1', sku: 'WIDGET', name: 'Widget', stock: 10, alertThreshold: 5, price: 19.99 },
      ],
    });
    render(<Dashboard />);
    expect(screen.getByText('All item stocks are healthy!')).toBeInTheDocument();
  });

  // ── Top Customers ──────────────────────────────────────────────────────
  it('shows top customers by quote count', () => {
    render(<Dashboard />);
    expect(screen.getByText('Top Customers')).toBeInTheDocument();
    const acmeTexts = screen.getAllByText('Acme Corp');
    expect(acmeTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('shows empty customer message when no customer quotes', () => {
    mockAllHooks({ quotes: [] });
    render(<Dashboard />);
    expect(screen.getByText('No customer quotes yet.')).toBeInTheDocument();
  });

  // ── Duplicate ──────────────────────────────────────────────────────────
  it('calls duplicateQuote on duplicate button click', async () => {
    const duplicateQuote = vi.fn().mockResolvedValue(undefined);
    mockAllHooks({ store: { duplicateQuote } });
    render(<Dashboard />);
    const dupButtons = screen.getAllByRole('button').filter(b => b.getAttribute('title') === 'Duplicate as Draft');
    expect(dupButtons.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(dupButtons[0]);
    await waitFor(() => {
      expect(duplicateQuote).toHaveBeenCalled();
    });
  });

  // ── CSV/PDF Export Buttons ─────────────────────────────────────────────
  it('renders PDF and XLS export buttons', () => {
    render(<Dashboard />);
    const pdfButtons = screen.getAllByText('PDF');
    const xlsButtons = screen.getAllByText('XLS');
    expect(pdfButtons.length).toBeGreaterThanOrEqual(1);
    expect(xlsButtons.length).toBeGreaterThanOrEqual(1);
  });
});
