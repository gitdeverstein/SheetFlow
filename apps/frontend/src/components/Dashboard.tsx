import { useEffect, useMemo, useRef, useState } from 'react';
import { useSheetStore } from '../store/sheetStore.js';
import { useCustomers } from '../hooks/useCustomers.js';
import { useInventory } from '../hooks/useInventory.js';
import { useQuotes } from '../hooks/useQuotes.js';
import { Users, Package, FileText, AlertTriangle, Download, FileSpreadsheet, Loader2, Trash2, Edit3, Copy, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QUOTE_STATUS_TRANSITIONS } from '@sheetflow/shared';
import AnimatedSection from './AnimatedSection.js';
import SkeletonLoader from './SkeletonLoader.js';

// ── SVG Donut Chart ──────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  Draft: '#64748b',
  Sent: '#3b82f6',
  Accepted: '#10b981',
  Rejected: '#f43f5e',
};

function DonutChart({ data }: { data: Record<string, number> }) {
  const total = Object.values(data).reduce((s, v) => s + v, 0);
  if (total === 0) return <p className="text-slate-500 text-sm text-center py-4">No quotes yet.</p>;

  const r = 40;
  const cx = 60;
  const cy = 60;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const slices = Object.entries(data).map(([status, count]) => {
    const pct = count / total;
    const dash = pct * circumference;
    const slice = { status, count, dash, offset, color: STATUS_COLORS[status] ?? '#94a3b8' };
    offset += dash;
    return slice;
  });

  return (
    <div className="flex items-center gap-6">
      <svg width="120" height="120" viewBox="0 0 120 120">
        {slices.map((s) => (
          <circle
            key={s.status}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="18"
            strokeDasharray={`${s.dash} ${circumference - s.dash}`}
            strokeDashoffset={-s.offset + circumference / 4}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px' }}
          />
        ))}
        <text x={cx} y={cy + 5} textAnchor="middle" fill="currentColor" className="donut-label" fontSize="14" fontWeight="bold">{total}</text>
      </svg>
      <div className="space-y-1.5">
        {slices.map((s) => (
          <div key={s.status} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-slate-300">{s.status}</span>
            <span className="text-slate-500 ml-auto pl-3 font-mono">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Status pill ──────────────────────────────────────────────────────────────
const STATUS_PILL: Record<string, string> = {
  Draft:    'bg-slate-700/60 text-slate-300 border-slate-600/50',
  Sent:     'bg-blue-500/15 text-blue-300 border-blue-500/30',
  Accepted: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  Rejected: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
};

function StatusPill({ status, transitions, onChange }: { status: string; transitions: readonly string[]; onChange: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => transitions.length > 0 && setOpen(o => !o)}
        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border transition-colors ${STATUS_PILL[status] ?? 'bg-slate-700 text-slate-300 border-slate-600'} ${transitions.length > 0 ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[status] ? '' : 'bg-slate-400'}`} style={{ backgroundColor: STATUS_COLORS[status] }} />
        {status}
        {transitions.length > 0 && <span className="opacity-60">▾</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute left-0 top-full mt-1 z-30 bg-slate-900 border border-slate-700 rounded-xl shadow-xl min-w-[110px] overflow-hidden">
            {transitions.map(s => (
              <button key={s} onClick={() => { onChange(s); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-slate-800 transition-colors flex items-center gap-2 ${STATUS_PILL[s] ? 'text-slate-200' : 'text-slate-300'}`}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[s] }} />{s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Overflow menu ─────────────────────────────────────────────────────────────
function OverflowMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div ref={ref} className="relative sm:hidden">
      <button onClick={() => setOpen(o => !o)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
        <MoreHorizontal size={16} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -4 }}
            className="absolute right-0 top-full mt-1 z-30 bg-slate-900 border border-slate-700 rounded-xl shadow-xl min-w-[140px] overflow-hidden"
            onClick={() => setOpen(false)}>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
function ExpiryBadge({ validUntil, status }: { validUntil?: string | null; status: string }) {
  if (!validUntil || status === 'Accepted' || status === 'Rejected') return null;
  const expired = new Date(validUntil) < new Date();
  if (!expired) return null;
  return (
    <span className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 rounded">
      Expired
    </span>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const {
    generatePdf, generatingPdfId,
    exportExcel, exportingExcelId,
    updateQuoteStatus, deleteQuote,
    duplicateQuote,
    setEditingQuote, setActiveTab,
  } = useSheetStore();

  const { data: customers = [], isLoading: customersLoading } = useCustomers();
  const { data: inventory = [], isLoading: inventoryLoading } = useInventory();
  const { data: quotes = [], isLoading: quotesLoading } = useQuotes();

  const isLoading = customersLoading || inventoryLoading || quotesLoading;

  const [animatedRevenue, setAnimatedRevenue] = useState(0);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  const totalCustomers = customers.length;
  const totalProducts = inventory.length;
  const lowStockAlerts = inventory.filter((item: { stock: unknown; alertThreshold: unknown }) => Number(item.stock) < Number(item.alertThreshold)).length;

  // Quote status counts for donut chart
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { Draft: 0, Sent: 0, Accepted: 0, Rejected: 0 };
    for (const q of quotes) counts[q.status] = (counts[q.status] ?? 0) + 1;
    return counts;
  }, [quotes]);

  // Customer → quote count map
  const quoteCountByCustomer = useMemo(() => {
    const map: Record<string, number> = {};
    for (const q of quotes) map[q.customerId] = (map[q.customerId] ?? 0) + 1;
    return map;
  }, [quotes]);

  const revenue = useMemo(
    () => quotes
      .filter((q: { status: string }) => q.status === 'Accepted')
      .reduce((sum: number, q: { total: string }) => sum + parseFloat(q.total), 0),
    [quotes]
  );

  useEffect(() => {
    let start = 0;
    const end = revenue;
    if (end === 0) { setAnimatedRevenue(0); return; } // eslint-disable-line react-hooks/set-state-in-effect
    const duration = 400;
    const stepTime = 16;
    const steps = duration / stepTime;
    const increment = end / steps;
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setAnimatedRevenue(end); clearInterval(timer); }
      else setAnimatedRevenue(Math.floor(start));
    }, stepTime);
    return () => clearInterval(timer);
  }, [revenue]);

  const handleDuplicate = async (id: string) => {
    setDuplicatingId(id);
    await duplicateQuote(id);
    setDuplicatingId(null);
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-4xl font-display font-bold tracking-tight text-white">Real-time KPIs</h1>
        <p className="text-slate-400 mt-2">Monitor your customer pipelines, sales documents, and stock thresholds.</p>
      </motion.div>

      {/* KPI Cards */}
      {isLoading ? <SkeletonLoader variant="card" count={4} /> : (
        <motion.div
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
          initial="hidden" animate="show"
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          {[
            { label: 'Accepted Revenue', value: `$${animatedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: 'Real-time pipeline', color: 'emerald', icon: <FileText size={20} /> },
            { label: 'Total Customers', value: totalCustomers, sub: 'Active CRM profiles', color: 'brand', icon: <Users size={20} /> },
            { label: 'Catalog Products', value: totalProducts, sub: 'Unique SKUs tracked', color: 'purple', icon: <Package size={20} /> },
            { label: 'Stock Alerts', value: lowStockAlerts, sub: 'Items below threshold', color: 'amber', icon: <AlertTriangle size={20} />, warn: lowStockAlerts > 0 },
          ].map((card, i) => (
            <AnimatedSection key={card.label} delay={i * 0.1}>
              <motion.div
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                className="glass-panel glass-panel-hover p-6 rounded-2xl"
              >
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm font-medium">{card.label}</span>
                  <div className={`p-2 bg-${card.color}-500/10 text-${card.color}-400 rounded-lg`}>{card.icon}</div>
                </div>
                <div className="mt-4">
                  <span className={`text-3xl font-display font-bold ${card.warn ? 'text-amber-400' : 'text-white'}`}>{card.value}</span>
                  <p className={`text-xs mt-1 ${i === 0 ? 'text-emerald-400' : 'text-slate-400'}`}>{card.sub}</p>
                </div>
              </motion.div>
            </AnimatedSection>
          ))}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quote Table */}
        <AnimatedSection delay={0.4} className="lg:col-span-2">
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h2 className="text-xl font-display font-semibold text-white">Recent Quotes</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-sm">
                    <th className="pb-3 font-medium">Quote #</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium text-right">Total</th>
                    <th className="pb-3 font-medium text-center">Status</th>
                    <th className="pb-3 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm">
                  {quotes.length === 0 ? (
                    <tr><td colSpan={5} className="py-6 text-center text-slate-500">No quotes generated yet.</td></tr>
                  ) : quotes.map((quote: { id: string; quoteNumber: string; customerName: string; total: string; status: string; validUntil?: string | null }) => (
                    <tr key={quote.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-3.5 font-medium text-white">{quote.quoteNumber}</td>
                      <td className="py-3.5 text-slate-300">{quote.customerName}</td>
                      <td className="py-3.5 text-right text-slate-300 font-mono">${parseFloat(quote.total).toFixed(2)}</td>
                      <td className="py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          <StatusPill
                            status={quote.status}
                            transitions={QUOTE_STATUS_TRANSITIONS[quote.status] ?? []}
                            onChange={(newStatus) => {
                              if (newStatus === 'Accepted' || quote.status === 'Accepted') {
                                setConfirmModal({
                                  title: 'Update Status',
                                  message: `Change status to "${newStatus}"? This will adjust inventory stock.`,
                                  confirmLabel: 'Update Status',
                                  onConfirm: () => updateQuoteStatus(quote.id, newStatus),
                                });
                              } else {
                                updateQuoteStatus(quote.id, newStatus);
                              }
                            }}
                          />
                          <ExpiryBadge validUntil={quote.validUntil} status={quote.status} />
                        </div>
                      </td>
                      <td className="py-3.5">
                        {/* Desktop actions */}
                        <div className="hidden sm:flex items-center justify-center gap-1.5 flex-wrap">
                          <button onClick={() => { setEditingQuote(quote.id); setActiveTab('quotes'); }}
                            className="p-1.5 text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors" title="Edit">
                            <Edit3 size={15} />
                          </button>
                          <button onClick={() => handleDuplicate(quote.id)} disabled={duplicatingId === quote.id}
                            className="p-1.5 text-violet-400 hover:bg-violet-500/10 rounded-lg transition-colors disabled:opacity-50" title="Duplicate as Draft">
                            {duplicatingId === quote.id ? <Loader2 size={15} className="animate-spin" /> : <Copy size={15} />}
                          </button>
                          <button onClick={() => generatePdf(quote.id)} disabled={generatingPdfId === quote.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-brand-500 hover:bg-brand-600 text-white transition-colors disabled:opacity-50">
                            {generatingPdfId === quote.id ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                            <span>PDF</span>
                          </button>
                          <button onClick={() => exportExcel(quote.id)} disabled={exportingExcelId === quote.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50">
                            {exportingExcelId === quote.id ? <Loader2 size={12} className="animate-spin" /> : <FileSpreadsheet size={12} />}
                            <span>XLS</span>
                          </button>
                          <button onClick={() => {
                            setConfirmModal({
                              title: 'Delete Quote',
                              message: 'Delete this quote? Stock will be restored if accepted.',
                              confirmLabel: 'Delete',
                              onConfirm: () => deleteQuote(quote.id),
                            });
                          }}
                            className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors" title="Delete">
                            <Trash2 size={15} />
                          </button>
                        </div>
                        {/* Mobile overflow menu */}
                        <OverflowMenu>
                          <button onClick={() => { setEditingQuote(quote.id); setActiveTab('quotes'); }} className="w-full text-left px-3 py-2 text-xs text-cyan-400 hover:bg-slate-800 flex items-center gap-2"><Edit3 size={13} /> Edit</button>
                          <button onClick={() => handleDuplicate(quote.id)} className="w-full text-left px-3 py-2 text-xs text-violet-400 hover:bg-slate-800 flex items-center gap-2"><Copy size={13} /> Duplicate</button>
                          <button onClick={() => generatePdf(quote.id)} className="w-full text-left px-3 py-2 text-xs text-brand-400 hover:bg-slate-800 flex items-center gap-2"><Download size={13} /> Export PDF</button>
                          <button onClick={() => exportExcel(quote.id)} className="w-full text-left px-3 py-2 text-xs text-emerald-400 hover:bg-slate-800 flex items-center gap-2"><FileSpreadsheet size={13} /> Export Excel</button>
                          <button onClick={() => {
                            setConfirmModal({
                              title: 'Delete Quote',
                              message: 'Delete this quote? Stock will be restored if accepted.',
                              confirmLabel: 'Delete',
                              onConfirm: () => deleteQuote(quote.id),
                            });
                          }} className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-slate-800 flex items-center gap-2"><Trash2 size={13} /> Delete</button>
                        </OverflowMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </AnimatedSection>

        {/* Right column */}
        <div className="space-y-6">
          {/* Quote Status Chart */}
          <AnimatedSection delay={0.45} direction="up">
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h2 className="text-xl font-display font-semibold text-white">Quote Breakdown</h2>
              <DonutChart data={statusCounts} />
            </div>
          </AnimatedSection>

          {/* Low Stock Watchlist */}
          <AnimatedSection delay={0.5} direction="up">
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h2 className="text-xl font-display font-semibold text-white flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                <span>Stock Warning</span>
              </h2>
              <div className="space-y-3">
                {inventory.filter((item: { stock: unknown; alertThreshold: unknown }) => Number(item.stock) < Number(item.alertThreshold)).length === 0 ? (
                  <div className="py-4 text-center text-slate-500 text-sm">All item stocks are healthy!</div>
                ) : inventory.filter((item) => Number(item.stock) < Number(item.alertThreshold)).map((item: { id?: string; name: string; sku: string; stock: number; alertThreshold: number }) => (
                  <div key={item.id} className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-white">{item.name}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-amber-500 font-mono">{item.stock} left</p>
                      <p className="text-xs text-slate-500">Limit: {item.alertThreshold}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>

          {/* Top Customers by Quote Count */}
          <AnimatedSection delay={0.55} direction="up">
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h2 className="text-xl font-display font-semibold text-white flex items-center gap-2">
                <Users size={18} className="text-brand-400" />
                <span>Top Customers</span>
              </h2>
              <div className="space-y-2">
                {customers
                  .map((c: { id?: string; name: string; company?: string | null }) => ({ ...c, quoteCount: quoteCountByCustomer[c.id ?? ''] ?? 0 }))
                  .filter((c: { quoteCount: number }) => c.quoteCount > 0)
                  .sort((a: { quoteCount: number }, b: { quoteCount: number }) => b.quoteCount - a.quoteCount)
                  .slice(0, 5)
                  .map((c: { id?: string; name: string; company?: string | null; quoteCount: number }) => (
                    <button
                      key={c.id}
                      onClick={() => { useSheetStore.getState().setFilter('customerId', c.id!); setActiveTab('quotes'); }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-900/60 transition-colors group"
                    >
                      <div className="text-left">
                        <p className="text-sm font-medium text-white group-hover:text-brand-300 transition-colors">{c.name}</p>
                        {c.company && <p className="text-xs text-slate-500">{c.company}</p>}
                      </div>
                      <span className="text-xs font-mono bg-brand-500/15 text-brand-300 border border-brand-500/25 rounded-full px-2 py-0.5">
                        {c.quoteCount} quote{c.quoteCount !== 1 ? 's' : ''}
                      </span>
                    </button>
                  ))}
                {customers.filter((c: { id?: string }) => (quoteCountByCustomer[c.id ?? ''] ?? 0) > 0).length === 0 && (
                  <p className="text-slate-500 text-sm text-center py-2">No customer quotes yet.</p>
                )}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setConfirmModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel p-6 rounded-2xl max-w-sm w-full mx-4 border border-slate-800 shadow-2xl"
            >
              <h3 className="text-lg font-semibold text-white">{confirmModal.title}</h3>
              <p className="text-sm text-slate-400 mt-2">{confirmModal.message}</p>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const action = confirmModal.onConfirm;
                    setConfirmModal(null);
                    action();
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer"
                >
                  {confirmModal.confirmLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
