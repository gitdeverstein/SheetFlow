import { CustomerService } from '../services/customerService.js';
import { CustomerSchema } from '@sheetflow/shared';
import { createCrudRouter } from '../utils/crudRouter.js';

const router = createCrudRouter('/api/customers', CustomerService, CustomerSchema, CustomerSchema.partial(), 'Customer');

export default router;
