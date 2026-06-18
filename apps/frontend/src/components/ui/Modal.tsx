import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  icon?: ReactNode;
  footer?: ReactNode;
}

export function Modal({ isOpen, onClose, title, children, icon, footer }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
          />
          {/* Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="glass-panel w-full max-w-md rounded-2xl shadow-2xl p-6 relative border border-slate-800/80 z-10"
          >
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-4">
              {icon && <div className="text-brand-500">{icon}</div>}
              <h2 id="modal-title" className="text-xl font-display font-semibold text-white">{title}</h2>
            </div>

            <div className="text-sm text-slate-300">
              {children}
            </div>

            {footer && (
              <div className="mt-6 flex justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
