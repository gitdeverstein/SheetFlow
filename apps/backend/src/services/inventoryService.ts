import { getDb } from '../db.js';
import { inventory } from '@sheetflow/db';
import { eq, count, sql } from 'drizzle-orm';
import type { InventoryItem } from '@sheetflow/shared';

export const InventoryService = {
  async findAll(limit = 50, offset = 0) {
    return await getDb().select().from(inventory).limit(limit).offset(offset);
  },

  async countAll() {
    const [result] = await getDb().select({ count: count() }).from(inventory);
    return Number(result.count);
  },

  async findById(id: string) {
    const [item] = await getDb().select().from(inventory).where(eq(inventory.id, id));
    return item;
  },

  async create(data: Omit<InventoryItem, 'id' | 'createdAt'>) {
    const [inserted] = await getDb()
      .insert(inventory)
      .values({
        ...data,
        price: data.price.toFixed(2),
      })
      .returning();
    return inserted;
  },

  async update(id: string, data: Partial<Omit<InventoryItem, 'id' | 'createdAt'>>) {
    const { price, ...rest } = data;
    const updatePayload: Record<string, string | number | null | undefined> = { ...rest };
    if (price !== undefined) {
      updatePayload.price = price.toFixed(2);
    }
    const [updated] = await getDb().update(inventory).set(updatePayload).where(eq(inventory.id, id)).returning();
    return updated;
  },

  async delete(id: string) {
    const [deleted] = await getDb().delete(inventory).where(eq(inventory.id, id)).returning();
    return deleted;
  },

  async bulkUpsert(rows: Array<{ sku: string; name: string; stock: number; alertThreshold: number; price: number }>) {
    return await getDb()
      .insert(inventory)
      .values(rows.map((r) => ({ ...r, price: r.price.toFixed(2) })))
      .onConflictDoUpdate({
        target: inventory.sku,
        set: {
          name: sql`excluded.name`,
          stock: sql`excluded.stock`,
          alertThreshold: sql`excluded.alert_threshold`,
          price: sql`excluded.price`,
        },
      })
      .returning();
  },
};
