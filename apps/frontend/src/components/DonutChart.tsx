const STATUS_COLORS: Record<string, string> = {
  Draft: '#64748b',
  Sent: '#3b82f6',
  Accepted: '#10b981',
  Rejected: '#f43f5e',
};

interface DonutChartProps {
  data: Record<string, number>;
}

export default function DonutChart({ data }: DonutChartProps) {
  const total = Object.values(data).reduce((s, v) => s + v, 0);
  if (total === 0) return <p className="text-slate-500 text-sm text-center py-4">No quotes yet.</p>;

  const r = 40;
  const cx = 60;
  const cy = 60;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const slices = Object.entries(data).map(([status, count]) => {
    const pct = count / total;
    const dash = pct * circumference;
    const slice = { status, count, dash, offset, color: STATUS_COLORS[status] ?? '#94a3b8' };
    offset += dash;
    return slice;
  });

  return (
    <div className="flex items-center gap-6">
      <svg width="120" height="120" viewBox="0 0 120 120" aria-label="Quote status breakdown">
        {slices.map((s) => (
          <circle
            key={s.status}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="18"
            strokeDasharray={`${s.dash} ${circumference - s.dash}`}
            strokeDashoffset={-s.offset + circumference / 4}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px' }}
          />
        ))}
        <text x={cx} y={cy + 5} textAnchor="middle" fill="currentColor" className="donut-label" fontSize="14" fontWeight="bold">{total}</text>
      </svg>
      <div className="space-y-1.5">
        {slices.map((s) => (
          <div key={s.status} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} aria-hidden="true" />
            <span className="text-slate-300">{s.status}</span>
            <span className="text-slate-500 ml-auto pl-3 font-mono">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
