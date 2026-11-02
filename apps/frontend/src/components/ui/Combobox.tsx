import { useState, useId } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useOutsideClick } from '../../hooks/useOutsideClick.js';

interface Option {
  id: string;
  label: string;
  subLabel?: string;
}

interface ComboboxProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  ariaLabel?: string;
  className?: string;
}

export function Combobox({ options, value, onChange, placeholder = 'Select...', label, ariaLabel, className = '' }: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useOutsideClick<HTMLDivElement>(() => setIsOpen(false), isOpen);
  const listboxId = useId();

  const selectedOption = options.find(opt => opt.id === value);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(search.toLowerCase()) ||
    opt.subLabel?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`space-y-2 w-full relative ${className}`} ref={containerRef}>
      {label && (
        <span id={`${listboxId}-label`} className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </span>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabel ? undefined : label ? `${listboxId}-label` : undefined}
        className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-slate-200 flex justify-between items-center cursor-pointer hover:border-slate-600 transition-all text-left"
      >
        <span className={selectedOption ? 'text-slate-200' : 'text-slate-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="p-2 border-b border-slate-800 flex items-center gap-2">
              <Search size={14} className="text-slate-500" aria-hidden="true" />
              <input
                autoFocus
                type="text"
                aria-label="Search options"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full bg-transparent text-sm text-slate-200 focus:outline-none placeholder-slate-600"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div id={listboxId} role="listbox" className="max-h-60 overflow-y-auto p-1">
              {filteredOptions.length === 0 ? (
                <div className="p-3 text-sm text-slate-500 text-center">No options found</div>
              ) : (
                filteredOptions.map((opt) => (
                  <div
                    key={opt.id}
                    role="option"
                    aria-selected={opt.id === value}
                    onClick={() => {
                      onChange(opt.id);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`p-2.5 rounded-lg cursor-pointer transition-colors flex flex-col ${
                      opt.id === value ? 'bg-brand-500/20 text-brand-300' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-sm font-medium">{opt.label}</span>
                    {opt.subLabel && <span className="text-xs text-slate-500">{opt.subLabel}</span>}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
