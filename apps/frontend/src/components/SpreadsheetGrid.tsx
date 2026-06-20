import { useState, useRef, useEffect, useMemo } from 'react';
import { useSheetStore, buildCrmRow, buildInvRow } from '../store/sheetStore.js';
import { useCustomers } from '../hooks/useCustomers.js';
import { useInventory } from '../hooks/useInventory.js';
import { Plus, Trash2, Save, ArrowUpDown, Search, AlertCircle, Upload, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FixedSizeList as List } from 'react-window';
import SkeletonLoader from './SkeletonLoader.js';
import AnimatedSection from './AnimatedSection.js';
import { useDebounce } from '../hooks/useDebounce.js';

interface SpreadsheetGridProps {
  tab: 'crm' | 'inventory';
}

export default function SpreadsheetGrid({ tab }: SpreadsheetGridProps) {
  const {
    columns: allColumns,
    updateSpreadsheetCell,
    saveSpreadsheetRow,
    addNewRow,
    deleteSpreadsheetRow,
    filters, setFilter,
    sort, setSort,
    loading, savingRowId,
    bulkImportInventory,
  } = useSheetStore();

  const { data: customers = [], isLoading: isCustomersLoading } = useCustomers();
  const { data: inventory = [], isLoading: isInventoryLoading } = useInventory();

  const columns = useMemo(() => allColumns[tab] || [], [allColumns, tab]);

  // Derive rows directly from TanStack Query data
  const rows = useMemo(() => {
    if (tab === 'crm') return customers.map(buildCrmRow);
    if (tab === 'inventory') return inventory.map(buildInvRow);
    return [];
  }, [tab, customers, inventory]);

  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [cellHighlight, setCellHighlight] = useState<Record<string, boolean>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);

  const inputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const debouncedFilters = useDebounce(filters, 250);

  const filteredRows = useMemo(() => rows.filter((row) =>
    columns.every((col) => {
      const filterVal = debouncedFilters[col.id]?.toLowerCase() || '';
      if (!filterVal) return true;
      return String(row.cells[col.id]?.value || '').toLowerCase().includes(filterVal);
    })
  ), [rows, columns, debouncedFilters]);

  const sortedRows = useMemo(() => [...filteredRows].sort((a, b) => {
    if (!sort) return 0;
    const { column, direction } = sort;
    const valA = a.cells[column]?.value ?? '';
    const valB = b.cells[column]?.value ?? '';
    if (typeof valA === 'number' && typeof valB === 'number') {
      return direction === 'asc' ? valA - valB : valB - valA;
    }
    return direction === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
  }), [filteredRows, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const clampedPage = Math.min(page, totalPages - 1);
  const paginatedRows = useMemo(() => {
    const start = clampedPage * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, clampedPage, pageSize]);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const handleCellClick = (rowId: string, colId: string, raw: string) => {
    setEditingCell({ rowId, colId });
    setEditValue(raw);
  };

  const handleCellBlur = (rowId: string, colId: string) => {
    if (!editingCell) return;
    const originalValue = rows.find(r => r.id === rowId)?.cells[colId]?.raw || '';
    if (editValue !== String(originalValue)) {
      updateSpreadsheetCell(tab, rowId, colId, editValue);
      const cellKey = `${colId}-${rowId}`;
      setCellHighlight(prev => ({ ...prev, [cellKey]: true }));
      setTimeout(() => setCellHighlight(prev => ({ ...prev, [cellKey]: false })), 1000);
    }
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowId: string, colId: string) => {
    if (e.key === 'Enter') handleCellBlur(rowId, colId);
    else if (e.key === 'Escape') setEditingCell(null);
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const text = await file.text();
    const lines = text.trim().split('\n').filter(Boolean);
    if (lines.length < 2) { useSheetStore.getState().addToast('CSV must have a header and at least one row', 'error'); return; }
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
    const missing = ['sku', 'name', 'stock', 'alertthreshold', 'price'].filter(r => !headers.includes(r));
    if (missing.length > 0) { useSheetStore.getState().addToast(`CSV missing columns: ${missing.join(', ')}`, 'error'); return; }
    const parsed = lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const get = (k: string) => vals[headers.indexOf(k)] ?? '';
      return { sku: get('sku'), name: get('name'), stock: parseInt(get('stock'), 10) || 0, alertThreshold: parseInt(get('alertthreshold'), 10) || 0, price: parseFloat(get('price')) || 0 };
    }).filter(r => r.sku && r.name && r.price > 0);
    if (parsed.length === 0) { useSheetStore.getState().addToast('No valid rows found in CSV', 'error'); return; }
    setImporting(true);
    await bulkImportInventory(parsed);
    setImporting(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold text-white capitalize">
            {tab === 'crm' ? 'Customer Directory' : 'Inventory Manager'}
          </h1>
          <p className="text-slate-400 mt-2">
            Double-click cells to edit. Starting with <code className="text-xs text-brand-400">=</code> evaluates formulas.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {tab === 'inventory' && (
            <>
              <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={handleCsvImport} />
              <motion.button
                onClick={() => csvInputRef.current?.click()}
                disabled={importing}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium rounded-xl transition-all disabled:opacity-50"
                title="Import CSV (columns: sku, name, stock, alertThreshold, price)"
              >
                {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                <span>{importing ? 'Importing…' : 'Import CSV'}</span>
              </motion.button>
            </>
          )}
          <motion.button
            onClick={() => addNewRow(tab)}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-brand-500/20"
          >
            <Plus size={18} />
            <span>Add New Row</span>
          </motion.button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel p-6 rounded-2xl max-w-sm w-full mx-4 border border-slate-800 shadow-2xl"
            >
              <h3 className="text-lg font-semibold text-white">Delete Record</h3>
              <p className="text-sm text-slate-400 mt-2">This record will be deleted. You can undo within 4 seconds.</p>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => { const id = deleteConfirm; setDeleteConfirm(null); deleteSpreadsheetRow(tab, id); }}
                  className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spreadsheet Container */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Column Headers */}
            <div className="grid border-b border-slate-800 bg-slate-900/40"
              style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr) 100px` }}>
              {columns.map((col) => (
                <div key={col.id} className="p-3 text-sm font-semibold text-slate-300 flex items-center justify-between border-r border-slate-800/50">
                  <span className="truncate">{col.name}</span>
                  <button onClick={() => setSort(col.id)} className="p-1 hover:bg-slate-800 text-slate-500 hover:text-slate-200 rounded transition-colors" aria-label={`Sort by ${col.name}`}>
                    {sort?.column === col.id
                      ? <span className="text-brand-400 text-xs font-bold">{sort.direction === 'asc' ? '▲' : '▼'}</span>
                      : <ArrowUpDown size={13} />}
                  </button>
                </div>
              ))}
              <div className="p-3 text-sm font-semibold text-slate-300 text-center">Actions</div>
            </div>

            {/* Filter Row */}
            <div className="grid border-b border-slate-800 bg-slate-950/20"
              style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr) 100px` }}>
              {columns.map((col) => (
                <div key={col.id} className="p-2 border-r border-slate-800/50 relative flex items-center">
                  <Search size={12} className="absolute left-4 text-slate-600" />
                  <input
                    type="text" placeholder="Filter..." value={filters[col.id] || ''}
                    onChange={(e) => setFilter(col.id, e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-800/60 rounded-lg pl-7 pr-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-brand-500 placeholder-slate-600"
                  />
                </div>
              ))}
              <div className="p-2" />
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-800/60 bg-slate-950/40">
              {(loading || isCustomersLoading || isInventoryLoading) ? (
                <SkeletonLoader variant="grid-cell" count={columns.length} />
              ) : sortedRows.length === 0 ? (
                <div className="p-12 flex flex-col items-center gap-3 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800/60 flex items-center justify-center">
                    {tab === 'crm'
                      ? <svg className="w-7 h-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      : <svg className="w-7 h-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    }
                  </div>
                  <p className="text-slate-300 font-medium">
                    {rows.length === 0 ? (tab === 'crm' ? 'No customers yet' : 'No products yet') : 'No results match your filters'}
                  </p>
                  <p className="text-slate-500 text-sm">
                    {rows.length === 0
                      ? `Click "Add New Row" to add your first ${tab === 'crm' ? 'customer' : 'product'}.`
                      : 'Try clearing the filter fields above.'}
                  </p>
                  {rows.length === 0 && (
                    <button onClick={() => addNewRow(tab)} className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-xl transition-all">
                      <Plus size={15} /> Add New Row
                    </button>
                  )}
                </div>
              ) : (
                <AnimatedSection>
                  <List
                    height={Math.min(paginatedRows.length * 48, 600)}
                    itemCount={paginatedRows.length}
                    itemSize={48}
                    width="100%"
                    overscanCount={5}
                  >
                    {({ index, style }) => {
                      const row = paginatedRows[index];
                      const isSaving = savingRowId === row.id;
                      return (
                        <div
                          className="grid hover:bg-slate-900/20 transition-colors group border-b border-slate-800/60"
                          style={{ ...style, gridTemplateColumns: `repeat(${columns.length}, 1fr) 100px` } as React.CSSProperties}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowDown') { e.preventDefault(); const next = paginatedRows[index + 1]; if (next) handleCellClick(next.id, columns[0]?.id, String(next.cells[columns[0]?.id]?.raw || '')); }
                            else if (e.key === 'ArrowUp') { e.preventDefault(); const prev = paginatedRows[index - 1]; if (prev) handleCellClick(prev.id, columns[0]?.id, String(prev.cells[columns[0]?.id]?.raw || '')); }
                            else if (e.key === 'Tab') {
                              e.preventDefault();
                              const colIdx = editingCell ? columns.findIndex(c => c.id === editingCell.colId) : -1;
                              if (e.shiftKey) { if (colIdx > 0) handleCellClick(row.id, columns[colIdx - 1].id, String(row.cells[columns[colIdx - 1].id]?.raw || '')); }
                              else if (colIdx < columns.length - 1) { handleCellClick(row.id, columns[colIdx + 1].id, String(row.cells[columns[colIdx + 1].id]?.raw || '')); }
                              else if (index < paginatedRows.length - 1) { const nr = paginatedRows[index + 1]; handleCellClick(nr.id, columns[0].id, String(nr.cells[columns[0].id]?.raw || '')); }
                            }
                          }}
                        >
                          {columns.map((col) => {
                            const cell = row.cells[col.id];
                            const isEditing = editingCell?.rowId === row.id && editingCell?.colId === col.id;
                            const cellKey = `${col.id}-${row.id}`;
                            const isHighlighted = cellHighlight[cellKey];
                            const hasFormula = typeof cell?.raw === 'string' && cell.raw.startsWith('=');
                            return (
                              <div
                                key={col.id}
                                onDoubleClick={() => handleCellClick(row.id, col.id, String(cell?.raw ?? ''))}
                                className={`p-3 text-sm border-r border-slate-800/40 flex items-center min-h-[48px] select-none transition-all duration-300 cursor-pointer relative
                                  ${isHighlighted ? 'bg-blue-500/20 border-blue-500/50 shadow-inner' : ''}
                                  ${hasFormula && !isEditing ? 'text-cyan-400 font-medium' : 'text-slate-300'}`}
                              >
                                {col.type === 'select' && col.options ? (
                                  <select
                                    value={String(cell?.value ?? '')}
                                    onChange={(e) => { updateSpreadsheetCell(tab, row.id, col.id, e.target.value); saveSpreadsheetRow(tab, row.id); }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full bg-slate-900 border border-slate-700/60 text-xs rounded-lg px-2 py-1.5 text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer"
                                  >
                                    {col.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                                  </select>
                                ) : isEditing ? (
                                  <input
                                    ref={inputRef}
                                    type="text" value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={() => handleCellBlur(row.id, col.id)}
                                    onKeyDown={(e) => handleKeyDown(e, row.id, col.id)}
                                    className="w-full h-full bg-slate-900 border border-brand-500 rounded px-2 py-1 text-sm text-white focus:outline-none absolute inset-1 z-10 font-mono"
                                  />
                                ) : (
                                  <div className="w-full flex items-center justify-between">
                                    <span className="truncate">
                                      {cell?.error
                                        ? <span className="text-rose-400 flex items-center gap-1 text-xs"><AlertCircle size={12} />{cell.error}</span>
                                        : (cell?.value ?? '')}
                                    </span>
                                    {hasFormula && (
                                      <span className="text-[9px] px-1 bg-cyan-500/10 text-cyan-400/80 rounded border border-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity font-mono">fx</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* #6: Save button with spinner */}
                          <div className="p-2 flex items-center justify-center gap-2">
                            <button
                              onClick={() => saveSpreadsheetRow(tab, row.id)}
                              disabled={isSaving}
                              className="p-1.5 text-emerald-400 rounded-lg transition-colors hover:bg-emerald-500/10 disabled:opacity-50"
                              title="Save"
                              aria-label={`Save row ${index + 1}`}
                            >
                              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(row.id)}
                              className="p-1.5 text-rose-400 rounded-lg transition-colors hover:bg-rose-500/10"
                              title="Delete"
                              aria-label={`Delete row ${index + 1}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    }}
                  </List>
                </AnimatedSection>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2 py-3 text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs">
            {sortedRows.length > 0
              ? `${clampedPage * pageSize + 1}–${Math.min((clampedPage + 1) * pageSize, sortedRows.length)} of ${sortedRows.length}`
              : '0 items'}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={clampedPage === 0}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={clampedPage >= totalPages - 1}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
