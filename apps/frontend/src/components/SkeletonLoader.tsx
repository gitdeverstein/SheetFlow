import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  variant?: 'card' | 'table-row' | 'grid-cell';
  count?: number;
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <motion.div
      className={`rounded-xl bg-slate-800/50 ${className ?? ''}`}
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="glass-panel p-6 rounded-2xl space-y-4">
      <div className="flex justify-between items-center">
        <SkeletonBlock className="h-4 w-28" />
        <SkeletonBlock className="h-10 w-10 rounded-lg" />
      </div>
      <div className="space-y-2">
        <SkeletonBlock className="h-8 w-32" />
        <SkeletonBlock className="h-3 w-20" />
      </div>
    </div>
  );
}

function SkeletonTableRow() {
  return (
    <div className="grid grid-cols-5 gap-4 p-3 border-b border-slate-800/60">
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonBlock key={i} className="h-5 w-full" />
      ))}
    </div>
  );
}

function SkeletonGridCell() {
  return (
    <div className="p-3 border-r border-slate-800/40 flex items-center min-h-[48px]">
      <SkeletonBlock className="h-4 w-3/4" />
    </div>
  );
}

export default function SkeletonLoader({ variant = 'card', count = 1 }: SkeletonLoaderProps) {
  const items = Array.from({ length: count });

  if (variant === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {items.map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (variant === 'table-row') {
    return (
      <div className="divide-y divide-slate-800/60">
        {items.map((_, i) => (
          <SkeletonTableRow key={i} />
        ))}
      </div>
    );
  }

  if (variant === 'grid-cell') {
    return (
      <div className="grid grid-cols-5 border-b border-slate-800/60 bg-slate-950/40">
        {items.map((_, i) => (
          <SkeletonGridCell key={i} />
        ))}
      </div>
    );
  }

  return null;
}
