import { cn } from '@/lib/utils';

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm font-sans',
        'text-text-primary placeholder:text-text-subtle',
        'focus:outline-none focus:border-gold/50 focus:shadow-glow transition-all',
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm font-sans',
        'text-text-primary placeholder:text-text-subtle resize-y min-h-[100px]',
        'focus:outline-none focus:border-gold/50 focus:shadow-glow transition-all',
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm font-sans',
        'text-text-primary focus:outline-none focus:border-gold/50 focus:shadow-glow transition-all',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
