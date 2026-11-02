import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'info'
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel p-6 rounded-2xl max-w-sm w-full relative z-10 border border-slate-800 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${
                variant === 'danger' ? 'bg-rose-500/10 text-rose-500' :
                variant === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                'bg-brand-500/10 text-brand-500'
              }`}>
                <AlertCircle size={20} />
              </div>
              <h3 className="text-lg font-display font-semibold text-white">{title}</h3>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed">
              {message}
            </p>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white bg-slate-900/50 border border-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                {cancelLabel}
              </button>
              <button
                onClick={() => { onConfirm(); onClose(); }}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-xl transition-all shadow-lg cursor-pointer ${
                  variant === 'danger' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' :
                  variant === 'warning' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20' :
                  'bg-brand-500 hover:bg-brand-600 shadow-brand-500/20'
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
