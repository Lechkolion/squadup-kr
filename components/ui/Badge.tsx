import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

export function Badge({ children, color, className }: BadgeProps) {
  return (
    <span
      className={cn('tag', className)}
      style={color ? { color, borderColor: `${color}40`, backgroundColor: `${color}15` } : undefined}
    >
      {children}
    </span>
  );
}

interface MatchBadgeProps {
  score: number;
  label: string;
}

export function MatchBadge({ score, label }: MatchBadgeProps) {
  let color = 'var(--text-muted)';
  if (score >= 90) color = 'var(--green)';
  else if (score >= 70) color = 'var(--cyan)';
  else if (score >= 50) color = 'var(--amber)';

  return (
    <span
      className="match-badge"
      style={{ color, borderColor: color }}
    >
      {score}% {label}
    </span>
  );
}

interface StatusBadgeProps {
  status: 'pending' | 'accepted' | 'declined';
}

const statusConfig = {
  pending: { label: 'Pending', color: 'var(--amber)' },
  accepted: { label: 'Accepted', color: 'var(--green)' },
  declined: { label: 'Declined', color: 'var(--pink)' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge color={config.color}>{config.label}</Badge>
  );
}
