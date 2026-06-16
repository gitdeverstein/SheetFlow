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

const { resolveCatalogPrices } = await import('../priceService.js');

describe('priceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should resolve catalog prices for items', async () => {
    const items = [
      { productId: 'p1', name: 'Item 1', quantity: 2, unitPrice: 0 },
      { productId: 'p2', name: 'Item 2', quantity: 1, unitPrice: 0 },
    ];
    mockDb.select.mockReturnValue(qb([
      { id: 'p1', price: '25.00' },
      { id: 'p2', price: '15.00' },
    ]));
    const result = await resolveCatalogPrices(items);
    expect(result).toHaveLength(2);
    expect(result[0].unitPrice).toBe(25);
    expect(result[1].unitPrice).toBe(15);
  });

  it('should throw if a product is not found', async () => {
    const items = [{ productId: 'missing-id', name: 'Ghost', quantity: 1, unitPrice: 0 }];
    mockDb.select.mockReturnValue(qb([]));
    await expect(resolveCatalogPrices(items)).rejects.toThrow('Produit');
  });
});
