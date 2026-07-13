import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  Draft: '#64748b',
  Sent: '#3b82f6',
  Accepted: '#10b981',
  Rejected: '#f43f5e',
};

const STATUS_PILL: Record<string, string> = {
  Draft:    'bg-slate-700/60 text-slate-300 border-slate-600/50',
  Sent:     'bg-blue-500/15 text-blue-300 border-blue-500/30',
  Accepted: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  Rejected: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
};

export function StatusPill({ status, transitions, onChange }: { status: string; transitions: readonly string[]; onChange: (s: string) => void }) {
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

export function DonutChart({ data }: { data: Record<string, number> }) {
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

export function OverflowMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div ref={ref} className="relative sm:hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        aria-label="More actions"
      >
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
