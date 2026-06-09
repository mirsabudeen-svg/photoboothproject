import { cn } from '@/lib/utils';

type BadgeVariant = 'live' | 'offline' | 'draft' | 'success' | 'warning';

const styles: Record<BadgeVariant, string> = {
  live: 'bg-gold-muted text-gold border-gold/30',
  offline: 'bg-white/5 text-text-muted border-border',
  draft: 'bg-white/5 text-text-subtle border-border',
  success: 'bg-emerald-950/50 text-emerald-400 border-emerald-800/40',
  warning: 'bg-amber-950/50 text-amber-400 border-amber-800/40',
};

export function Badge({
  variant = 'draft',
  children,
  className,
}: {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-sans border',
        styles[variant],
        className,
      )}
    >
      {variant === 'live' && (
        <span className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse-gold" />
      )}
      {children}
    </span>
  );
}
