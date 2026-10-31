interface ExpiryBadgeProps {
  validUntil?: string | null;
  status: string;
}

export function ExpiryBadge({ validUntil, status }: ExpiryBadgeProps) {
  if (!validUntil || status === 'Accepted' || status === 'Rejected') return null;
  const expired = new Date(validUntil) < new Date();
  if (!expired) return null;
  return (
    <span className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 rounded">
      Expired
    </span>
  );
}
