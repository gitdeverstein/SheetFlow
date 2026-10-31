import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="space-y-2 w-full">
        {label && (
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full bg-slate-900/80 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all disabled:opacity-50 ${
            error ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/30' : ''
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="text-xs text-rose-400 font-medium mt-1">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
