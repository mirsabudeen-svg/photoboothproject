import { cn } from '@/lib/utils';

export function Card({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('bg-card border border-border rounded-2xl p-6 shadow-card', className)}
      {...props}
    >
      {children}
    </div>
  );
}
