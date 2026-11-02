import { describe, it, expect, vi, beforeEach } from 'vitest';

function qb(resolvedValue: unknown) {
  const b = {
    from: vi.fn(() => b),
    leftJoin: vi.fn(() => b),
    where: vi.fn(() => b),
    limit: vi.fn(() => b),
    offset: vi.fn(() => b),
    orderBy: vi.fn(() => b),
    order: vi.fn(() => b),
    then: <R>(cb: (value: unknown) => R) => Promise.resolve(resolvedValue).then(cb),
  };
  return b;
}

function returningQb(resolvedValue: unknown) {
  const b = {
    values: vi.fn(() => b),
    set: vi.fn(() => b),
    where: vi.fn(() => b),
    returning: vi.fn(() => Promise.resolve(resolvedValue)),
    then: <R>(cb: (value: unknown) => R) => Promise.resolve(resolvedValue).then(cb),
  };
  return b;
}

function txBuilder() {
  return {
    select: vi.fn(() => qb([])),
    insert: vi.fn(() => returningQb([])),
    update: vi.fn(() => returningQb([])),
    delete: vi.fn(() => returningQb([])),
    execute: vi.fn(() => Promise.resolve({ rows: [], rowCount: 0 })),
  };
}

const mockDb = {
  select: vi.fn(() => qb([])),
  insert: vi.fn(() => returningQb([])),
  update: vi.fn(() => returningQb([])),
  delete: vi.fn(() => returningQb([])),
  transaction: vi.fn(async (cb: (tx: ReturnType<typeof txBuilder>) => Promise<unknown>) => cb(txBuilder())),
};

vi.mock('@sheetflow/db', () => ({
  customers: 'customers_table',
  quotes: 'quotes_table',
  quoteItems: 'quote_items_table',
  inventory: 'inventory_table',
}));

vi.mock('../../db.js', () => ({
  getDb: () => mockDb,
}));

const { QuoteService } = await import('../quoteService.js');

describe('QuoteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated quotes', async () => {
      const mockQuotes = [{ id: 'q1', quoteNumber: 'QT-2026-001', customerName: 'Acme Corp' }];
      mockDb.select.mockReturnValue(qb(mockQuotes));
      const result = await QuoteService.findAll(50, 0);
      expect(result).toEqual(mockQuotes);
    });
  });

  describe('findById', () => {
    it('should return a quote with items', async () => {
      const mockQuote = { id: 'q1', quoteNumber: 'QT-2026-001', customerId: 'c1', status: 'Draft', total: '100.00', customerName: 'Acme Corp' };
      mockDb.select.mockReturnValue(qb([mockQuote]));
      const result = await QuoteService.findById('q1');
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should transition from Draft to Sent', async () => {
      const oldQuote = { id: 'q1', status: 'Draft', customerId: 'c1' };
      const updatedQuote = { id: 'q1', status: 'Sent' };
      const tx = txBuilder();
      tx.select.mockReturnValueOnce(qb([oldQuote])).mockReturnValueOnce(qb([]));
      tx.update.mockReturnValue(returningQb([updatedQuote]));
      mockDb.transaction.mockImplementation(async (cb) => cb(tx));
      const result = await QuoteService.updateStatus('q1', 'Sent');
      expect(result.status).toBe('Sent');
    });

    it('should throw for invalid transition', async () => {
      const oldQuote = { id: 'q1', status: 'Draft' };
      const tx = txBuilder();
      tx.select.mockReturnValue(qb([oldQuote]));
      mockDb.transaction.mockImplementation(async (cb) => cb(tx));
      await expect(QuoteService.updateStatus('q1', 'Accepted')).rejects.toThrow();
    });
  });
});
