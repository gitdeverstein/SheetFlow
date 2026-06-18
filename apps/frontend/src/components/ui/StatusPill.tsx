import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { STATUS_COLORS } from './constants.js';

const STATUS_PILL_STYLES: Record<string, string> = {
  Draft:    'bg-slate-700/60 text-slate-300 border-slate-600/50',
  Sent:     'bg-blue-500/15 text-blue-300 border-blue-500/30',
  Accepted: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  Rejected: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
};

interface StatusPillProps {
  status: string;
  transitions?: readonly string[];
  onChange?: (s: string) => void;
}

export function StatusPill({ status, transitions = [], onChange }: StatusPillProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const hasTransitions = transitions.length > 0 && !!onChange;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => hasTransitions && setOpen(o => !o)}
        aria-haspopup={hasTransitions}
        aria-expanded={open}
        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border transition-colors ${STATUS_PILL_STYLES[status] ?? 'bg-slate-700 text-slate-300 border-slate-600'} ${hasTransitions ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] ?? '#94a3b8' }} />
        {status}
        {hasTransitions && <span className="opacity-60">▾</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute left-0 top-full mt-1 z-30 bg-slate-900 border border-slate-700 rounded-xl shadow-xl min-w-[110px] overflow-hidden">
            {transitions.map(s => (
              <button key={s} onClick={() => { onChange?.(s); setOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-slate-800 transition-colors flex items-center gap-2 ${STATUS_PILL_STYLES[s] ? 'text-slate-200' : 'text-slate-300'}`}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[s] ?? '#94a3b8' }} />{s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
