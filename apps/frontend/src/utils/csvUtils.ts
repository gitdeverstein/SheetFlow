export interface ParsedCsvInventory {
  sku: string;
  name: string;
  stock: number;
  alertThreshold: number;
  price: number;
}

export async function parseInventoryCsv(file: File): Promise<ParsedCsvInventory[]> {
  const text = await file.text();
  const lines = text.trim().split('\n').filter(Boolean);

  if (lines.length < 2) {
    throw new Error('CSV must have a header and at least one row');
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
  const required = ['sku', 'name', 'stock', 'alertthreshold', 'price'];
  const missing = required.filter(r => !headers.includes(r));

  if (missing.length > 0) {
    throw new Error(`CSV missing columns: ${missing.join(', ')}`);
  }

  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const get = (k: string) => vals[headers.indexOf(k)] ?? '';

    return {
      sku: get('sku'),
      name: get('name'),
      stock: parseInt(get('stock'), 10) || 0,
      alertThreshold: parseInt(get('alertthreshold'), 10) || 0,
      price: parseFloat(get('price')) || 0
    };
  }).filter(r => r.sku && r.name && r.price > 0);
}
