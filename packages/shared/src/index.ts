import { z } from 'zod';

// ── Status Constants ────────────────────────────────────────────────────────
export const CUSTOMER_STATUSES = ['Active', 'Lead', 'Inactive'] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

export const QUOTE_STATUSES = ['Draft', 'Sent', 'Accepted', 'Rejected'] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

/** Valid status transitions for quotes — business logic shared by frontend and backend. */
export const QUOTE_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  Draft: ['Sent'],
  Sent: ['Accepted', 'Rejected'],
  Accepted: [],
  Rejected: [],
} as const;

// ── Pagination ──────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

// ── Tax Constants ───────────────────────────────────────────────────────────
export const TAX_RATE = 0.2 as const; // 20% VAT
export const TAX_RATE_LABEL = 'VAT (20%)' as const;

// ── CRM schemas ─────────────────────────────────────────────────────────────
export const CustomerSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  status: z.enum(CUSTOMER_STATUSES).default('Lead'),
  notes: z.string().optional(),
  createdAt: z.string().or(z.date()).optional(),
});

export type Customer = z.infer<typeof CustomerSchema>;

// ── Inventory schemas ───────────────────────────────────────────────────────
export const InventoryItemSchema = z.object({
  id: z.string().uuid().optional(),
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  stock: z.number().int().nonnegative('Stock cannot be negative'),
  alertThreshold: z.number().int().nonnegative('Alert threshold cannot be negative'),
  price: z.number().positive('Price must be greater than 0'),
  createdAt: z.string().or(z.date()).optional(),
});

export type InventoryItem = z.infer<typeof InventoryItemSchema>;

// ── Quote schemas ───────────────────────────────────────────────────────────
export const QuoteItemSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().min(1, 'Product name is required'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  unitPrice: z.number().positive('Unit price must be positive'),
});

export const QuoteSchema = z.object({
  id: z.string().uuid().optional(),
  customerId: z.string().uuid(),
  quoteNumber: z.string().optional(),
  items: z.array(QuoteItemSchema),
  status: z.enum(QUOTE_STATUSES).default('Draft'),
  total: z.number().nonnegative(),
  validUntil: z.string().or(z.date()).optional(),
  notes: z.string().optional(),
  createdAt: z.string().or(z.date()).optional(),
});

export type Quote = z.infer<typeof QuoteSchema>;
export type QuoteItem = z.infer<typeof QuoteItemSchema>;

// ── Spreadsheet Types ───────────────────────────────────────────────────────
export type CellValue = string | number | boolean | null;

export interface CellData {
  id: string;
  raw: string;
  value: CellValue;
  error: string | null;
}

export interface SheetRow {
  id: string;
  cells: Record<string, CellData>;
  isNew?: boolean;
}

export interface SheetColumn {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'formula';
  formula?: string;
  options?: string[];
}

export interface SheetState {
  columns: SheetColumn[];
  rows: SheetRow[];
}
