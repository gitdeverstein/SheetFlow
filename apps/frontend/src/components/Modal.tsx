import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Info, AlertCircle } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export default function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info'
}: ModalProps) {
  const variantStyles = {
    danger: {
      icon: <AlertCircle className="text-rose-500" size={24} />,
      button: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20',
    },
    warning: {
      icon: <AlertTriangle className="text-amber-500" size={24} />,
      button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20',
    },
    info: {
      icon: <Info className="text-brand-500" size={24} />,
      button: 'bg-brand-500 hover:bg-brand-600 shadow-brand-500/20',
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-panel w-full max-w-md rounded-2xl shadow-2xl p-6 relative border border-slate-800/80 z-10"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              {variantStyles[variant].icon}
              <h2 className="text-xl font-display font-semibold text-white">{title}</h2>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed mb-8">
              {message}
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={() => { onConfirm(); onClose(); }}
                className={`px-5 py-2 text-sm font-semibold text-white rounded-xl transition-all shadow-lg ${variantStyles[variant].button}`}
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
