import { getDb } from '../db.js';
import { inventory } from '@sheetflow/db';
import { inArray } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';

export async function resolveCatalogPrices<T extends { productId: string; unitPrice?: number }>(
  items: T[]
): Promise<(T & { unitPrice: number })[]> {
  const productIds = items.map(i => i.productId);
  if (productIds.length === 0) return items as (T & { unitPrice: number })[];

  const products = await getDb()
    .select({ id: inventory.id, price: inventory.price })
    .from(inventory)
    .where(inArray(inventory.id, productIds));

  const priceMap = new Map(products.map(p => [p.id, Number(p.price)]));

  const unknown = productIds.filter(id => !priceMap.has(id));
  if (unknown.length > 0) {
    throw new HTTPException(400, { message: `Produit(s) introuvable(s): ${unknown.join(', ')}` });
  }

  return items.map(item => ({ ...item, unitPrice: priceMap.get(item.productId)! }));
}
