import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'info' | 'warning';
}

export default function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
}: ModalProps) {
  const variantClasses = {
    danger: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20',
    info: 'bg-brand-500 hover:bg-brand-600 shadow-brand-500/20',
    warning: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20',
  };

  const iconClasses = {
    danger: 'text-rose-500 bg-rose-500/10',
    info: 'text-brand-500 bg-brand-500/10',
    warning: 'text-amber-500 bg-amber-500/10',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-desc">
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
            className="glass-panel p-6 rounded-2xl max-w-sm w-full mx-4 border border-slate-800 shadow-2xl relative z-10"
          >
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-xl flex-shrink-0 ${iconClasses[variant]}`}>
                <AlertCircle size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 id="modal-title" className="text-lg font-semibold text-white truncate">{title}</h3>
                <p id="modal-desc" className="text-sm text-slate-400 mt-1">{message}</p>
              </div>
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`px-4 py-2 text-sm font-medium text-white rounded-xl transition-all shadow-lg ${variantClasses[variant]}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
