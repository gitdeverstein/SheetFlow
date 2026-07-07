import { createDb, users, customers, inventory, quotes, quoteItems, sessions } from './index.js';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/sheetflow';
const { db, client } = createDb(connectionString);

async function main() {
  console.log('Seeding database...');

  try {
    // Clean tables (order matters for foreign keys)
    await db.delete(sessions);
    await db.delete(quoteItems);
    await db.delete(quotes);
    await db.delete(inventory);
    await db.delete(customers);
    await db.delete(users);

    console.log('Creating default users...');
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123!';
    const demoPassword = process.env.SEED_DEMO_PASSWORD || 'demo1234!';
    const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
    await db.insert(users).values([{
      name: 'Admin',
      email: 'admin@sheetflow.com',
      passwordHash: adminPasswordHash,
    }]).returning();

    await db.insert(users).values([{
      name: 'John Doe',
      email: 'john@sheetflow.com',
      passwordHash: await bcrypt.hash(demoPassword, 12),
    }]).returning();

    console.log('Inserting customers...');
    const [c1, c2, c3, c4] = await db.insert(customers).values([
      { name: 'Acme Corp', email: 'contact@acme.com', phone: '+1-555-0100', company: 'Acme Corp', status: 'Active', notes: 'Premium client — 15% discount on bulk orders' },
      { name: 'Jean Dupont', email: 'jean.dupont@example.fr', phone: '+33-6-12-34-56-78', company: 'Dupont SARL', status: 'Active', notes: 'Prefers communication by email' },
      { name: 'GreenLeaf Industries', email: 'info@greenleaf.io', phone: '+1-555-0200', company: 'GreenLeaf Industries', status: 'Active', notes: 'Eco-friendly packaging required' },
      { name: 'Smith & Co', email: 'hello@smithco.uk', phone: '+44-20-7946-0958', company: 'Smith & Co', status: 'Lead', notes: 'Requested catalog — follow up in Q3' },
    ]).returning();

    console.log('Inserting inventory...');
    const [p1, p2, p3, p4, p5] = await db.insert(inventory).values([
      { sku: 'WGT-001', name: 'Premium Widget (Gold)', stock: 45, alertThreshold: 10, price: '149.99' },
      { sku: 'WGT-002', name: 'Premium Widget (Silver)', stock: 120, alertThreshold: 20, price: '89.99' },
      { sku: 'GDT-001', name: 'Ergonomic Gadget (Standard)', stock: 8, alertThreshold: 15, price: '249.50' },
      { sku: 'GDT-002', name: 'Ergonomic Gadget (Pro)', stock: 3, alertThreshold: 5, price: '399.00' },
      { sku: 'ACC-001', name: 'USB-C Hub 7-in-1', stock: 200, alertThreshold: 30, price: '34.99' },
      { sku: 'ACC-002', name: 'Wireless Charging Pad', stock: 0, alertThreshold: 25, price: '29.99' },
    ]).returning();

    console.log('Inserting quotes...');
    const [q1, q2, q3, q4] = await db.insert(quotes).values([
      { customerId: c1.id, quoteNumber: 'QT-2026-001', status: 'Accepted', total: '401.96', validUntil: new Date('2026-07-15') },
      { customerId: c2.id, quoteNumber: 'QT-2026-002', status: 'Sent', total: '957.60', validUntil: new Date('2026-08-01') },
      { customerId: c3.id, quoteNumber: 'QT-2026-003', status: 'Draft', total: '299.40', validUntil: new Date('2026-09-01') },
      { customerId: c4.id, quoteNumber: 'QT-2026-004', status: 'Rejected', total: '959.82', validUntil: new Date('2026-05-01') },
    ]).returning();

    console.log('Inserting quote items...');
    await db.insert(quoteItems).values([
      { quoteId: q1.id, productId: p1.id, name: p1.name, quantity: 2, unitPrice: p1.price },
      { quoteId: q1.id, productId: p5.id, name: p5.name, quantity: 1, unitPrice: p5.price },
      { quoteId: q2.id, productId: p4.id, name: p4.name, quantity: 2, unitPrice: p4.price },
      { quoteId: q3.id, productId: p3.id, name: p3.name, quantity: 1, unitPrice: p3.price },
      { quoteId: q4.id, productId: p2.id, name: p2.name, quantity: 5, unitPrice: p2.price },
      { quoteId: q4.id, productId: p5.id, name: p5.name, quantity: 10, unitPrice: p5.price },
    ]);

    // Deduct stock dynamically for accepted quotes (QT-2026-001)
    const quote1Items = [
      { productId: p1.id, quantity: 2 },
      { productId: p5.id, quantity: 1 },
    ];
    for (const item of quote1Items) {
      await db.update(inventory)
        .set({ stock: sql`${inventory.stock} - ${item.quantity}` })
        .where(sql`${inventory.id} = ${item.productId}`);
    }

    console.log('Database seeded successfully!');
    console.log(`  Admin user: admin@sheetflow.com / admin123!`);
    console.log(`  Demo user:  john@sheetflow.com / demo1234!`);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
