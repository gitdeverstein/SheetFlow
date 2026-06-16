import { pgTable, uuid, text, integer, decimal, timestamp, check, index, unique } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ── Users Table (authentication) ─────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  googleId: text('google_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  idx_users_email: index('idx_users_email').on(table.email),
  idx_users_google_id: index('idx_users_google_id').on(table.googleId),
  uq_users_google_id: unique('uq_users_google_id').on(table.googleId),
}));

// ── Sessions Table ───────────────────────────────────────────────────────────
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  idx_sessions_user_id: index('idx_sessions_user_id').on(table.userId),
  idx_sessions_expires_at: index('idx_sessions_expires_at').on(table.expiresAt),
}));

// Customers Table
export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  company: text('company'),
  status: text('status').default('Lead'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  idx_customers_created_at: index('idx_customers_created_at').on(table.createdAt),
  statusCheck: check('customers_status_check', sql`${table.status} IN ('Active', 'Lead', 'Inactive')`),
}));
// Inventory Table
export const inventory = pgTable('inventory', {
  id: uuid('id').primaryKey().defaultRandom(),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  stock: integer('stock').notNull().default(0),
  alertThreshold: integer('alert_threshold').notNull().default(0),
  price: decimal('price', { precision: 12, scale: 2 }).notNull().default('0.00'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  stockPositive: check('stock_positive', sql`${table.stock} >= 0`),
  pricePositive: check('price_positive', sql`${table.price} >= 0`),
  idx_inventory_created_at: index('idx_inventory_created_at').on(table.createdAt)
}));

// Quotes Table
export const quotes = pgTable('quotes', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  quoteNumber: text('quote_number').notNull().unique(),
  status: text('status').notNull().default('Draft'), // 'Draft' | 'Sent' | 'Accepted' | 'Rejected'
  total: decimal('total', { precision: 12, scale: 2 }).notNull().default('0.00'),
  validUntil: timestamp('valid_until', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  idx_customerId: index('idx_quotes_customer_id').on(table.customerId),
  idx_quotes_created_at: index('idx_quotes_created_at').on(table.createdAt),
  statusCheck: check('quotes_status_check', sql`${table.status} IN ('Draft', 'Sent', 'Accepted', 'Rejected')`),
}));

// Quote Items Table
export const quoteItems = pgTable('quote_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  quoteId: uuid('quote_id')
    .notNull()
    .references(() => quotes.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  productId: uuid('product_id')
    .notNull()
    .references(() => inventory.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
  name: text('name').notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 })
    .notNull()
    .default('0.00'),
}, (table) => ({
  idx_quoteId: index('idx_quote_items_quote_id').on(table.quoteId),
  idx_productId: index('idx_quote_items_product_id').on(table.productId),
  uq_quote_product: unique('uq_quote_product').on(table.quoteId, table.productId),
  unitPricePositive: check('unit_price_positive', sql`${table.unitPrice} >= 0`),
  quantityPositive: check('quantity_positive', sql`${table.quantity} > 0`),
}));

// Relations
export const customersRelations = relations(customers, ({ many }) => ({
  quotes: many(quotes),
}));

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  customer: one(customers, {
    fields: [quotes.customerId],
    references: [customers.id],
  }),
  items: many(quoteItems),
}));

export const quoteItemsRelations = relations(quoteItems, ({ one }) => ({
  quote: one(quotes, {
    fields: [quoteItems.quoteId],
    references: [quotes.id],
  }),
  product: one(inventory, {
    fields: [quoteItems.productId],
    references: [inventory.id],
  }),
}));
