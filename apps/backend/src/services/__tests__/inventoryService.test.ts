import { describe, it, expect, vi, beforeEach } from 'vitest';

function qb(resolvedValue: unknown) {
  const b = {
    from: vi.fn(() => b),
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
    then: <R>(cb: (value: unknown) => R) => Promise.resolve(resolvedValue).then(cb),
  };
  return b;
}

const mockDb = {
  select: vi.fn(() => qb([])),
  insert: vi.fn(() => returningQb([])),
  update: vi.fn(() => returningQb([])),
  delete: vi.fn(() => returningQb([])),
};

vi.mock('@sheetflow/db', () => ({
  inventory: 'inventory_table',
}));

vi.mock('../../db.js', () => ({
  getDb: () => mockDb,
}));

const { InventoryService } = await import('../inventoryService.js');

describe('InventoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated inventory items', async () => {
      const mockItems = [{ id: '1', sku: 'WIDGET-001' }];
      mockDb.select.mockReturnValue(qb(mockItems));
      const result = await InventoryService.findAll(50, 0);
      expect(result).toEqual(mockItems);
    });
  });

  describe('findById', () => {
    it('should return an item by id', async () => {
      const mockItem = { id: 'abc', sku: 'TEST-001', name: 'Test Item' };
      mockDb.select.mockReturnValue(qb([mockItem]));
      const result = await InventoryService.findById('abc');
      expect(result).toEqual(mockItem);
    });
  });

  describe('create', () => {
    it('should create an inventory item', async () => {
      const input = { sku: 'NEW-001', name: 'New Product', stock: 10, alertThreshold: 3, price: 29.99 };
      const inserted = { id: 'new-id', ...input, price: '29.99' };
      mockDb.insert.mockReturnValue(returningQb([inserted]));
      const result = await InventoryService.create(input);
      expect(result.price).toBe('29.99');
    });
  });

  describe('bulkUpsert', () => {
    it('should upsert inventory items', async () => {
      const items = [{ sku: 'A-1', name: 'Item A', stock: 5, alertThreshold: 2, price: 10 }];
      const result = [{ sku: 'A-1', name: 'Item A', stock: 5, alertThreshold: 2, price: '10.00' }];
      mockDb.insert.mockReturnValue(returningQb(result));
      const out = await InventoryService.bulkUpsert(items);
      expect(mockDb.insert).toHaveBeenCalledOnce();
      expect(out).toEqual(result);
    });
  });
});
