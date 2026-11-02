import { TAX_RATE_LABEL } from '@sheetflow/shared';
import { API_BASE, apiFetch } from '../store/api.js';

export interface ExportQuoteItem {
  id?: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface ExportFullQuote {
  id: string;
  customerId: string;
  quoteNumber: string;
  status: string;
  total: string | number;
  validUntil?: string | null;
  createdAt?: string | null;
  customerName: string;
  customerEmail?: string;
  notes?: string | null;
  items: ExportQuoteItem[];
}

export async function fetchFullQuote(id: string): Promise<ExportFullQuote> {
  return apiFetch(`${API_BASE}/quotes/${id}`);
}

export async function exportQuotePdf(quote: ExportFullQuote): Promise<void> {
  const [jsPDF, autoTable] = await Promise.all([
    import('jspdf').then(m => m.default),
    import('jspdf-autotable').then(m => m.default)
  ]);

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59);
  doc.text('SheetFlow', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('123 Business Avenue, Suite 100', 14, 28);
  doc.text('City, State 12345', 14, 33);
  doc.text('contact@sheetflow.com', 14, 38);

  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text(`Quote #${quote.quoteNumber}`, 140, 20);
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Date: ${quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : 'N/A'}`, 140, 28);
  doc.text(`Status: ${quote.status}`, 140, 33);
  if (quote.validUntil) {
    doc.text(`Valid Until: ${new Date(quote.validUntil).toLocaleDateString()}`, 140, 38);
  }

  doc.setDrawColor(226, 232, 240);
  doc.line(14, 45, 196, 45);

  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text('Bill To:', 14, 55);
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(quote.customerName, 14, 63);
  if (quote.customerEmail) {
    doc.text(quote.customerEmail, 14, 70);
  }

  const rows = quote.items.map((item) => [
    item.name,
    item.quantity,
    `$${Number(item.unitPrice).toFixed(2)}`,
    `$${(item.quantity * Number(item.unitPrice)).toFixed(2)}`,
  ]);

  const subtotal = quote.items.reduce((sum, item) => sum + item.quantity * Number(item.unitPrice), 0);
  const total = Number(quote.total);
  const vat = total - subtotal;

  autoTable(doc, {
    startY: 85,
    head: [['Item', 'Quantity', 'Unit Price', 'Total']],
    body: rows,
    foot: [
      ['', '', 'Subtotal', `$${subtotal.toFixed(2)}`],
      ['', '', TAX_RATE_LABEL, `$${vat.toFixed(2)}`],
      ['', '', 'Grand Total', `$${total.toFixed(2)}`],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
    },
    footStyles: {
      fillColor: [248, 250, 252],
      textColor: [30, 41, 59],
      fontSize: 10,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [71, 85, 105],
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' },
    },
  });

  if (quote.notes) {
    const finalY = (doc as typeof doc & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 85;
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('Notes:', 14, finalY + 12);
    doc.setTextColor(71, 85, 105);
    const lines = doc.splitTextToSize(quote.notes, 170) as string[];
    doc.text(lines, 14, finalY + 19);
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `SheetFlow - Quote ${quote.quoteNumber} - Page ${i} of ${pageCount}`,
      14,
      doc.internal.pageSize.getHeight() - 10,
    );
  }

  doc.save(`${quote.quoteNumber}.pdf`);
}

export async function exportQuoteExcel(quote: ExportFullQuote): Promise<void> {
  const ExcelJS = await import('exceljs').then(m => m.default);
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('Quote');

  const total = Number(quote.total);
  const subtotal = quote.items.reduce((sum, item) => sum + item.quantity * Number(item.unitPrice), 0);
  const vat = total - subtotal;

  const titleRow = ws.addRow(['SheetFlow']);
  titleRow.font = { bold: true, size: 16, color: { argb: '1E293B' } };

  ws.addRow(['Quote #', quote.quoteNumber]);
  ws.addRow(['Date', quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : 'N/A']);
  ws.addRow(['Status', quote.status]);
  ws.addRow(['Customer', quote.customerName]);
  ws.addRow(['Email', quote.customerEmail || '']);
  ws.addRow(['Valid Until', quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : 'N/A']);
  ws.addRow([]);

  const lineItemsHeader = ws.addRow(['Line Items']);
  lineItemsHeader.font = { bold: true, color: { argb: '1E293B' } };

  const headerRow = ws.addRow(['Item', 'Quantity', 'Unit Price', 'Total']);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F46E5' } };
    cell.alignment = { vertical: 'middle' };
  });

  quote.items.forEach((item) => {
    const row = ws.addRow([item.name, item.quantity, Number(item.unitPrice), item.quantity * Number(item.unitPrice)]);
    row.eachCell((cell, col) => {
      if (col === 3 || col === 4) {
        cell.numFmt = '$#,##0.00';
      }
    });
  });

  ws.addRow([]);

  const subtotalRow = ws.addRow(['', '', 'Subtotal', subtotal]);
  subtotalRow.getCell(3).font = { bold: true };
  subtotalRow.getCell(4).numFmt = '$#,##0.00';
  subtotalRow.getCell(4).font = { bold: true };

  const vatRow = ws.addRow(['', '', TAX_RATE_LABEL, vat]);
  vatRow.getCell(3).font = { bold: true };
  vatRow.getCell(4).numFmt = '$#,##0.00';
  vatRow.getCell(4).font = { bold: true };

  const grandTotalRow = ws.addRow(['', '', 'Grand Total', total]);
  grandTotalRow.getCell(3).font = { bold: true, size: 12 };
  grandTotalRow.getCell(4).numFmt = '$#,##0.00';
  grandTotalRow.getCell(4).font = { bold: true, size: 12 };

  ws.getColumn(1).width = 30;
  ws.getColumn(2).width = 12;
  ws.getColumn(3).width = 14;
  ws.getColumn(4).width = 14;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${quote.quoteNumber}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
