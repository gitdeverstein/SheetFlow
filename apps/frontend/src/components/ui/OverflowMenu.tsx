import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal } from 'lucide-react';
import { useOutsideClick } from '../../hooks/useOutsideClick.js';

interface OverflowMenuProps {
  children: React.ReactNode;
}

export function OverflowMenu({ children }: OverflowMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClick<HTMLDivElement>(() => setOpen(false), open);

  return (
    <div ref={ref} className="relative sm:hidden">
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="More actions"
        aria-haspopup="true"
        aria-expanded={open}
        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
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
