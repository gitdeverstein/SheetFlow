import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export default function SettingsModal({ isOpen, onClose, isDarkMode, toggleTheme }: SettingsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="settings-title">
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
            className="glass-panel w-full max-w-md rounded-2xl shadow-2xl p-6 relative border border-slate-800/80 z-10"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close settings"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Settings className="text-brand-500" size={22} />
              <h2 id="settings-title" className="text-xl font-display font-semibold text-white">Application Settings</h2>
            </div>

            {/* Settings Form */}
            <div className="space-y-4 text-sm text-slate-300">
              <div className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800/60 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">Theme</p>
                  <p className="text-xs text-slate-400">Switch between light and dark appearance.</p>
                </div>
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-200 transition-colors cursor-pointer"
                >
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </button>
              </div>

              <div className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800/60 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">Compact Mode</p>
                  <p className="text-xs text-slate-400">Reduce padding in tables and grids.</p>
                </div>
                <input type="checkbox" className="w-4 h-4 accent-brand-500 rounded" />
              </div>

              <div className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800/60 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">Auto-Save Sheets</p>
                  <p className="text-xs text-slate-400">Automatically persist modifications.</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-500 rounded" />
              </div>

              <div className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800/60 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">Developer Mode</p>
                  <p className="text-xs text-slate-400">Show database queries in browser console.</p>
                </div>
                <input type="checkbox" className="w-4 h-4 accent-brand-500 rounded" />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
