import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { HTTPException } from 'hono/http-exception';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, QUOTE_STATUSES, QuoteSchema } from '@sheetflow/shared';
import { QuoteService } from '../services/quoteService.js';
import { resolveCatalogPrices } from '../services/priceService.js';

const router = new Hono();

router.get('/', zValidator('query', z.object({
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  offset: z.coerce.number().int().min(0).default(0),
})), async (c) => {
  const { limit, offset } = c.req.valid('query');
  const [list, total] = await Promise.all([
    QuoteService.findAll(limit, offset),
    QuoteService.countAll(),
  ]);
  c.res.headers.set('X-Total-Count', String(total));
  return c.json(list);
});

router.get('/:id', zValidator('param', z.object({ id: z.string().uuid() })), async (c) => {
  const { id } = c.req.valid('param');
  const quote = await QuoteService.findById(id);
  if (!quote) throw new HTTPException(404, { message: 'Quote not found' });
  return c.json(quote);
});

router.post('/', zValidator('json', QuoteSchema), async (c) => {
  const validated = c.req.valid('json');

  const items = validated.items || [];
  const correctedItems = await resolveCatalogPrices(items);

  let calculatedTotal = 0;
  for (const item of correctedItems) {
    calculatedTotal += item.quantity * item.unitPrice;
  }
  calculatedTotal = Math.round(calculatedTotal * 1.20 * 100) / 100;

  const quoteNumber = validated.quoteNumber || `QT-${new Date().getFullYear()}-${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
  const quotePayload = {
    ...validated,
    items: correctedItems,
    quoteNumber,
    total: calculatedTotal,
  };

  const result = await QuoteService.create(quotePayload);
  return c.json(result, 201);
});

router.put('/:id', zValidator('param', z.object({ id: z.string().uuid() })), zValidator('json', QuoteSchema.partial()), async (c) => {
  const { id } = c.req.valid('param');
  const validated = c.req.valid('json');

  const items = validated.items || [];
  let correctedItems = items;
  if (items.length > 0) {
    correctedItems = await resolveCatalogPrices(items);
  }

  let calculatedTotal = 0;
  for (const item of correctedItems) {
    calculatedTotal += item.quantity * item.unitPrice;
  }
  calculatedTotal = Math.round(calculatedTotal * 1.20 * 100) / 100;

  const quotePayload = {
    ...validated,
    items: correctedItems,
    total: correctedItems.length > 0 ? calculatedTotal : validated.total,
  };

  const result = await QuoteService.update(id, quotePayload);
  if (!result) throw new HTTPException(404, { message: 'Quote not found' });
  return c.json(result);
});

router.put('/:id/status', zValidator('param', z.object({ id: z.string().uuid() })), zValidator('json', z.object({ status: z.enum(QUOTE_STATUSES) })), async (c) => {
  const { id } = c.req.valid('param');
  const { status } = c.req.valid('json');

  const updated = await QuoteService.updateStatus(id, status);
  return c.json(updated);
});

router.post('/:id/duplicate', zValidator('param', z.object({ id: z.string().uuid() })), async (c) => {
  const { id } = c.req.valid('param');
  const duplicated = await QuoteService.duplicate(id);
  return c.json(duplicated, 201);
});

router.delete('/:id', zValidator('param', z.object({ id: z.string().uuid() })), async (c) => {
  const { id } = c.req.valid('param');
  const deleted = await QuoteService.delete(id);
  if (!deleted) throw new HTTPException(404, { message: 'Quote not found' });
  return c.json({ message: 'Quote deleted successfully' });
});

export default router;
