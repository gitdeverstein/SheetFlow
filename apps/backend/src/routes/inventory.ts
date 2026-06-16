import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { InventoryService } from '../services/inventoryService.js';
import { InventoryItemSchema } from '@sheetflow/shared';
import { createCrudRouter } from '../utils/crudRouter.js';

const router = new Hono();

// Bulk CSV import: expects array of inventory items
const ImportSchema = z.array(
  z.object({
    sku: z.string().min(3),
    name: z.string().min(2),
    stock: z.coerce.number().int().nonnegative(),
    alertThreshold: z.coerce.number().int().nonnegative(),
    price: z.coerce.number().positive(),
  })
).min(1).max(500);

router.post('/import', zValidator('json', ImportSchema), async (c) => {
  const rows = c.req.valid('json');
  const result = await InventoryService.bulkUpsert(rows);
  return c.json({ imported: result.length }, 201);
});

// Mount CRUD routes at /
const crudRouter = createCrudRouter('/api/inventory', InventoryService, InventoryItemSchema, InventoryItemSchema.partial(), 'Item');
router.route('/', crudRouter);

export default router;
