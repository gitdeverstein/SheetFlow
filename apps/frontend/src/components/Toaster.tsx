import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
  undoAction?: () => void;
}

interface ToasterProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

export default function Toaster({ toasts, removeToast }: ToasterProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full" aria-live="polite">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`glass-panel p-4 rounded-xl flex items-start gap-3 shadow-2xl border-l-4
              ${toast.type === 'success' ? 'border-l-emerald-500' : ''}
              ${toast.type === 'error' ? 'border-l-rose-500' : ''}
              ${toast.type === 'info' ? 'border-l-brand-500' : ''}
            `}
          >
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-400 capitalize">
                {toast.type}
              </p>
              <p className="text-sm text-slate-200 mt-0.5">{toast.text}</p>
              {toast.undoAction && (
                <button
                  onClick={() => { toast.undoAction!(); removeToast(toast.id); }}
                  className="mt-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
                >
                  ↩ Undo
                </button>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-500 hover:text-slate-300 transition-colors"
              aria-label="Close notification"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
