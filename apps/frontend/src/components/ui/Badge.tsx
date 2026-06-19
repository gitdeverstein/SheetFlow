interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'brand';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-slate-700/60 text-slate-300 border-slate-600/50',
    success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    error: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    info: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    brand: 'bg-brand-500/15 text-brand-300 border-brand-500/30',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
