import { getDb } from '../db.js';
import { customers, quotes, quoteItems, inventory } from '@sheetflow/db';
import { eq, sql, count } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import type { Customer } from '@sheetflow/shared';

export const CustomerService = {
  async findAll(limit = 50, offset = 0) {
    return await getDb().select().from(customers).limit(limit).offset(offset);
  },

  async countAll() {
    const [result] = await getDb().select({ count: count() }).from(customers);
    return Number(result.count);
  },

  async findById(id: string) {
    const [item] = await getDb().select().from(customers).where(eq(customers.id, id));
    return item;
  },

  async create(data: Omit<Customer, 'id' | 'createdAt'>) {
    const [inserted] = await getDb().insert(customers).values(data).returning();
    return inserted;
  },

  async update(id: string, data: Partial<Omit<Customer, 'id' | 'createdAt'>>) {
    const [updated] = await getDb().update(customers).set(data).where(eq(customers.id, id)).returning();
    return updated;
  },

  async delete(id: string) {
    try {
      return await getDb().transaction(async (tx) => {
        const itemsToRestore = await tx
          .select({
            productId: quoteItems.productId,
            quantity: quoteItems.quantity,
          })
          .from(quoteItems)
          .innerJoin(quotes, eq(quoteItems.quoteId, quotes.id))
          .where(sql`${quotes.customerId} = ${id} AND ${quotes.status} = 'Accepted'`);

        const aggregated = itemsToRestore.reduce(
          (acc, item) => {
            acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
            return acc;
          },
          {} as Record<string, number>,
        );

        const sortedProductIds = Object.keys(aggregated).sort();

        for (const productId of sortedProductIds) {
          await tx.execute(sql`SELECT stock FROM ${inventory} WHERE id = ${productId} FOR UPDATE`);
          await tx
            .update(inventory)
            .set({ stock: sql`stock + ${aggregated[productId]}` })
            .where(eq(inventory.id, productId));
        }

        const [deleted] = await tx.delete(customers).where(eq(customers.id, id)).returning();
        return deleted;
      });
    } catch (error) {
      // Re-throw HTTPException and pg errors so the global handler can map
      // them correctly (404, 409, 400). Only wrap truly unexpected errors.
      if (error instanceof HTTPException) throw error;
      const pgCode = (error as { code?: string }).code;
      if (pgCode) throw error; // let global handler map pg error codes
      throw new HTTPException(500, { message: 'Erreur lors de la suppression du client' });
    }
  },
};
