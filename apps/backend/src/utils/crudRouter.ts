import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { HTTPException } from 'hono/http-exception';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@sheetflow/shared';
import type { ZodObject, ZodRawShape } from 'zod';

interface CrudService<T> {
  findAll(limit?: number, offset?: number): Promise<T[]>;
  countAll(): Promise<number>;
  findById(id: string): Promise<T | null>;
  create(data: Record<string, unknown>): Promise<T>;
  update(id: string, data: Record<string, unknown>): Promise<T | null>;
  delete(id: string): Promise<T | null>;
}

export function createCrudRouter<T>(
  pathPrefix: string,
  service: CrudService<T>,
  createSchema: ZodObject<ZodRawShape>,
  updateSchema?: ZodObject<ZodRawShape>,
  entityName: string = 'Resource'
) {
  const router = new Hono();

  router.get('/', zValidator('query', z.object({
    limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
    offset: z.coerce.number().int().min(0).default(0),
  })), async (c) => {
    const { limit, offset } = c.req.valid('query');
    const [list, total] = await Promise.all([
      service.findAll(limit, offset),
      service.countAll(),
    ]);
    c.res.headers.set('X-Total-Count', String(total));
    return c.json(list);
  });

  router.get('/:id', zValidator('param', z.object({ id: z.string().uuid() })), async (c) => {
    const { id } = c.req.valid('param');
    const item = await service.findById(id);
    if (!item) throw new HTTPException(404, { message: `${entityName} not found` });
    return c.json(item);
  });

  router.post('/', zValidator('json', createSchema), async (c) => {
    const validated = c.req.valid('json');
    const insertData = { ...(validated as Record<string, unknown>) };
    delete insertData.id;
    delete insertData.createdAt;
    const inserted = await service.create(insertData);
    return c.json(inserted, 201);
  });

  router.put('/:id', zValidator('param', z.object({ id: z.string().uuid() })), zValidator('json', updateSchema || createSchema.partial()), async (c) => {
    const { id } = c.req.valid('param');
    const validated = c.req.valid('json');
    const updateData = { ...(validated as Record<string, unknown>) };
    delete updateData.id;
    delete updateData.createdAt;
    const updated = await service.update(id, updateData);
    if (!updated) throw new HTTPException(404, { message: `${entityName} not found` });
    return c.json(updated);
  });

  router.delete('/:id', zValidator('param', z.object({ id: z.string().uuid() })), async (c) => {
    const { id } = c.req.valid('param');
    const deleted = await service.delete(id);
    if (!deleted) throw new HTTPException(404, { message: `${entityName} not found` });
    return c.json({ message: `${entityName} deleted successfully` });
  });

  return router;
}
