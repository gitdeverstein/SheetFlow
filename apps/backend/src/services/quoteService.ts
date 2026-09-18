import { getDb } from '../db.js';
import { quotes, quoteItems, customers, inventory } from '@sheetflow/db';
import { eq, desc, sql, inArray, count } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { QUOTE_STATUS_TRANSITIONS, type QuoteItem } from '@sheetflow/shared';

interface CreateQuoteData {
  customerId: string;
  quoteNumber?: string;
  status?: string;
  total: string | number;
  validUntil?: string | Date | null;
  notes?: string | null;
  items: QuoteItem[];
}

const allowedTransitions = QUOTE_STATUS_TRANSITIONS;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function deductStock(tx: any, items: Pick<QuoteItem, 'productId' | 'quantity'>[]) {
  const sorted = [...items].sort((a, b) => a.productId.localeCompare(b.productId));
  for (const item of sorted) {
    const result = await tx.execute(sql`SELECT stock FROM ${inventory} WHERE id = ${item.productId} FOR UPDATE`);
    const invItem = result.rows?.[0] ?? result[0];
    if (!invItem) throw new HTTPException(400, { message: `Produit introuvable: ${item.productId}` });
    if (Number(invItem.stock) < item.quantity) {
      throw new HTTPException(400, { message: 'Stock insuffisant' });
    }
    await tx
      .update(inventory)
      .set({ stock: sql`stock - ${item.quantity}` })
      .where(eq(inventory.id, item.productId));
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function restoreStock(tx: any, items: Pick<QuoteItem, 'productId' | 'quantity'>[]) {
  const sorted = [...items].sort((a, b) => a.productId.localeCompare(b.productId));
  for (const item of sorted) {
    await tx
      .update(inventory)
      .set({ stock: sql`stock + ${item.quantity}` })
      .where(eq(inventory.id, item.productId));
  }
}

/** Apply stock deltas for an Accepted→Accepted update, sorted by productId to prevent deadlocks. */
async function applyStockDelta(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any,
  oldItems: Pick<QuoteItem, 'productId' | 'quantity'>[],
  newItems: Pick<QuoteItem, 'productId' | 'quantity'>[],
) {
  const deltas = new Map<string, number>();
  for (const i of oldItems) deltas.set(i.productId, (deltas.get(i.productId) ?? 0) - i.quantity);
  for (const i of newItems) deltas.set(i.productId, (deltas.get(i.productId) ?? 0) + i.quantity);

  const sorted = [...deltas.entries()].sort(([a], [b]) => a.localeCompare(b));
  for (const [prodId, delta] of sorted) {
    if (delta === 0) continue;
    const result = await tx.execute(sql`SELECT stock FROM ${inventory} WHERE id = ${prodId} FOR UPDATE`);
    const invItem = result.rows?.[0] ?? result[0];
    if (!invItem) throw new HTTPException(400, { message: `Produit introuvable: ${prodId}` });
    if (delta < 0 && Number(invItem.stock) < Math.abs(delta)) {
      throw new HTTPException(400, { message: 'Stock insuffisant' });
    }
    await tx
      .update(inventory)
      .set({ stock: sql`stock + ${delta}` })
      .where(eq(inventory.id, prodId));
  }
}

export const QuoteService = {
  async findAll(limit = 50, offset = 0) {
    return await getDb()
      .select({
        id: quotes.id,
        quoteNumber: quotes.quoteNumber,
        status: quotes.status,
        total: quotes.total,
        createdAt: quotes.createdAt,
        customerName: customers.name,
      })
      .from(quotes)
      .leftJoin(customers, eq(quotes.customerId, customers.id))
      .orderBy(desc(quotes.createdAt))
      .limit(limit)
      .offset(offset);
  },

  async countAll() {
    const [result] = await getDb().select({ count: count() }).from(quotes);
    return Number(result.count);
  },

  async findById(id: string) {
    const [quote] = await getDb()
      .select({
        id: quotes.id,
        customerId: quotes.customerId,
        quoteNumber: quotes.quoteNumber,
        status: quotes.status,
        total: quotes.total,
        validUntil: quotes.validUntil,
        notes: quotes.notes,
        createdAt: quotes.createdAt,
        customerName: customers.name,
        customerEmail: customers.email,
      })
      .from(quotes)
      .leftJoin(customers, eq(quotes.customerId, customers.id))
      .where(eq(quotes.id, id));

    if (!quote) return null;

    const items = await getDb().select().from(quoteItems).where(eq(quoteItems.quoteId, id));

    return { ...quote, items };
  },

  async lookupUnitPrices(items: { productId: string }[]): Promise<Map<string, number>> {
    const productIds = items.map((i) => i.productId);
    if (productIds.length === 0) return new Map();
    const products = await getDb()
      .select({ id: inventory.id, price: inventory.price })
      .from(inventory)
      .where(inArray(inventory.id, productIds));
    const priceMap = new Map<string, number>();
    for (const p of products) {
      priceMap.set(p.id, Number(p.price));
    }
    return priceMap;
  },

  async create(data: CreateQuoteData) {
    return await getDb().transaction(async (tx) => {
      if (data.status === 'Accepted') {
        await deductStock(tx, data.items);
      }

      const [newQuote] = await tx
        .insert(quotes)
        .values({
          customerId: data.customerId,
          quoteNumber: data.quoteNumber,
          status: data.status,
          total: data.total.toString(),
          validUntil: data.validUntil ? new Date(data.validUntil) : null,
          notes: data.notes ?? null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
        .returning();

      const itemsToInsert = data.items.map((item) => ({
        quoteId: newQuote.id,
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
      }));

      if (itemsToInsert.length > 0) {
        await tx.insert(quoteItems).values(itemsToInsert);
      }

      return { ...newQuote, items: itemsToInsert };
    });
  },

  async updateStatus(id: string, status: string) {
    return await getDb().transaction(async (tx) => {
      const [oldQuote] = await tx.select().from(quotes).where(eq(quotes.id, id));

      if (!oldQuote) throw new HTTPException(404, { message: 'Quote not found' });

      if (oldQuote.status === status) return oldQuote;

      if (!allowedTransitions[oldQuote.status]?.includes(status)) {
        throw new HTTPException(400, { message: 'Transition de statut non autorisée' });
      }

      const items = await tx.select().from(quoteItems).where(eq(quoteItems.quoteId, id));

      if (status === 'Accepted') {
        await deductStock(tx, items);
      } else if (oldQuote.status === 'Accepted') {
        await restoreStock(tx, items);
      }

      const [updated] = await tx.update(quotes).set({ status }).where(eq(quotes.id, id)).returning();

      return updated;
    });
  },

  async update(id: string, data: Partial<CreateQuoteData>) {
    return await getDb().transaction(async (tx) => {
      const [existing] = await tx.select().from(quotes).where(eq(quotes.id, id));

      if (!existing) return null;

      if (existing.status === 'Accepted' && data.items !== undefined) {
        throw new HTTPException(400, { message: "Impossible de modifier les articles d'un devis accepté" });
      }

      const existingItems = await tx.select().from(quoteItems).where(eq(quoteItems.quoteId, id));

      const newStatus = data.status || existing.status;
      const oldStatus = existing.status;

      if (data.status && data.status !== existing.status) {
        if (!allowedTransitions[existing.status]?.includes(data.status)) {
          throw new HTTPException(400, { message: 'Transition de statut non autorisée' });
        }
      }

      const sortedExisting = [...existingItems].sort((a, b) => a.productId.localeCompare(b.productId));
      const newItems = data.items || [];
      const sortedNew = [...newItems].sort((a, b) => a.productId.localeCompare(b.productId));

      if (oldStatus === 'Accepted' && newStatus === 'Accepted') {
        await applyStockDelta(tx, sortedExisting, sortedNew);
      } else {
        if (oldStatus === 'Accepted' && newStatus !== 'Accepted') {
          await restoreStock(tx, sortedExisting);
        }
        if (newStatus === 'Accepted' && oldStatus !== 'Accepted') {
          await deductStock(tx, sortedNew);
        }
      }

      const updatePayload: Record<string, string | number | boolean | Date | null | undefined> = {};
      if (data.customerId !== undefined) updatePayload.customerId = data.customerId;
      if (data.status !== undefined) updatePayload.status = data.status;
      if (data.validUntil !== undefined) updatePayload.validUntil = data.validUntil ? new Date(data.validUntil) : null;
      if (data.quoteNumber !== undefined) updatePayload.quoteNumber = data.quoteNumber;
      if (data.total !== undefined) updatePayload.total = data.total.toString();
      if (data.notes !== undefined) updatePayload.notes = data.notes ?? null;

      const [updated] = await tx.update(quotes).set(updatePayload).where(eq(quotes.id, id)).returning();

      if (newItems.length > 0) {
        const existingMap = new Map(existingItems.map((i) => [i.productId, i]));
        const newMap2 = new Map(newItems.map((i) => [i.productId, i]));

        const toDelete = existingItems.filter((i) => !newMap2.has(i.productId)).map((i) => i.id);
        const toInsert = newItems
          .filter((i) => !existingMap.has(i.productId))
          .map((item) => ({
            quoteId: id,
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toString(),
          }));
        const toUpdate = newItems.filter(
          (i) =>
            existingMap.has(i.productId) &&
            (existingMap.get(i.productId)!.quantity !== i.quantity ||
              existingMap.get(i.productId)!.unitPrice !== String(i.unitPrice)),
        );

        if (toDelete.length > 0) {
          await tx.delete(quoteItems).where(inArray(quoteItems.id, toDelete));
        }
        for (const item of toUpdate) {
          await tx
            .update(quoteItems)
            .set({ quantity: item.quantity, unitPrice: item.unitPrice.toString(), name: item.name })
            .where(sql`${quoteItems.quoteId} = ${id} AND ${quoteItems.productId} = ${item.productId}`);
        }
        if (toInsert.length > 0) {
          await tx.insert(quoteItems).values(toInsert);
        }

        const finalItems =
          toInsert.length > 0
            ? newItems
            : existingItems.map((i) => {
                const nu = newMap2.get(i.productId);
                return nu ? { ...i, quantity: nu.quantity, unitPrice: String(nu.unitPrice), name: nu.name } : i;
              });

        return { ...updated, items: finalItems };
      }

      return { ...updated, items: existingItems };
    });
  },

  async duplicate(id: string) {
    return await getDb().transaction(async (tx) => {
      const [original] = await tx.select().from(quotes).where(eq(quotes.id, id));
      if (!original) throw new HTTPException(404, { message: 'Quote not found' });

      const originalItems = await tx.select().from(quoteItems).where(eq(quoteItems.quoteId, id));
      const [customer] = await tx
        .select({ name: customers.name })
        .from(customers)
        .where(eq(customers.id, original.customerId));

      const newNumber = `QT-${new Date().getFullYear()}-${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
      const [newQuote] = await tx
        .insert(quotes)
        .values({
          customerId: original.customerId,
          quoteNumber: newNumber,
          status: 'Draft',
          total: original.total,
          validUntil: original.validUntil ? new Date(original.validUntil) : null,
          notes: original.notes ?? null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
        .returning();

      const itemsToInsert = originalItems.map((item) => ({
        quoteId: newQuote.id,
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
      }));
      if (itemsToInsert.length > 0) {
        await tx.insert(quoteItems).values(itemsToInsert);
      }
      return { ...newQuote, items: itemsToInsert, customerName: customer?.name ?? null };
    });
  },

  async delete(id: string) {
    return await getDb().transaction(async (tx) => {
      const [quote] = await tx.select().from(quotes).where(eq(quotes.id, id));

      if (!quote) return null;

      if (quote.status === 'Accepted') {
        const items = await tx.select().from(quoteItems).where(eq(quoteItems.quoteId, id));

        await restoreStock(tx, items);
      }

      const [deleted] = await tx.delete(quotes).where(eq(quotes.id, id)).returning();

      return deleted;
    });
  },
};
