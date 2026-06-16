import { describe, it, expect, vi, beforeEach } from 'vitest';

function qb(resolvedValue: unknown) {
  const b = {
    from: vi.fn(() => b),
    leftJoin: vi.fn(() => b),
    innerJoin: vi.fn(() => b),
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
    onConflictDoUpdate: vi.fn(() => b),
    execute: vi.fn(() => Promise.resolve(resolvedValue)),
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

const { CustomerService } = await import('../customerService.js');

describe('CustomerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated customers', async () => {
      const mockCustomers = [{ id: '1', name: 'Acme Corp' }];
      mockDb.select.mockReturnValue(qb(mockCustomers));
      const result = await CustomerService.findAll(50, 0);
      expect(result).toEqual(mockCustomers);
    });
  });

  describe('countAll', () => {
    it('should return total count', async () => {
      mockDb.select.mockReturnValue(qb([{ count: '5' }]));
      const result = await CustomerService.countAll();
      expect(Number(result)).toBe(5);
    });
  });

  describe('findById', () => {
    it('should return a customer by id', async () => {
      const mockCustomer = { id: 'abc-123', name: 'Test Customer' };
      mockDb.select.mockReturnValue(qb([mockCustomer]));
      const result = await CustomerService.findById('abc-123');
      expect(result).toEqual(mockCustomer);
    });

    it('should return undefined for missing customer', async () => {
      mockDb.select.mockReturnValue(qb([]));
      const result = await CustomerService.findById('missing-id');
      expect(result).toBeUndefined();
    });
  });

  describe('create', () => {
    it('should create a customer and return it', async () => {
      const input = { name: 'New Co', email: 'new@co.com', status: 'Lead' as const };
      const returned = { id: 'new-id', ...input, createdAt: new Date().toISOString() };
      mockDb.insert.mockReturnValue(returningQb([returned]));
      const result = await CustomerService.create(input);
      expect(result.name).toBe('New Co');
    });
  });

  describe('update', () => {
    it('should update a customer', async () => {
      const returned = { id: 'abc-123', name: 'Updated Name', email: 'test@test.com' };
      mockDb.update.mockReturnValue(returningQb([returned]));
      const result = await CustomerService.update('abc-123', { name: 'Updated Name' });
      expect(result.name).toBe('Updated Name');
    });
  });

  describe('delete', () => {
    it('should delete a customer', async () => {
      const returned = { id: 'abc-123', name: 'Deleted Co' };
      const tx = txBuilder();
      tx.delete.mockReturnValue(returningQb([returned]));
      mockDb.transaction.mockImplementation(async (cb) => cb(tx));
      const result = await CustomerService.delete('abc-123');
      expect(result).toEqual(returned);
    });
  });
});
