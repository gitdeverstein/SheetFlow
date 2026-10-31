import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const variants = {
  primary: 'bg-brand-500 hover:bg-brand-600 text-white shadow-brand-500/20',
  secondary: 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20',
  ghost: 'text-slate-400 hover:text-white hover:bg-slate-800',
};

export function Button({
  variant = 'primary',
  isLoading,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      disabled={disabled || isLoading}
      className={`
        inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {isLoading ? <Loader2 size={16} className="animate-spin" /> : icon}
      <span>{children}</span>
    </motion.button>
  );
}
