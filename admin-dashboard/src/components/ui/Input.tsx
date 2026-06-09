import React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm font-sans',
        'text-text-primary placeholder:text-text-subtle',
        'focus:outline-none focus:border-gold/50 focus:shadow-glow transition-all',
        className,
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm font-sans',
        'text-text-primary placeholder:text-text-subtle resize-y min-h-[100px]',
        'focus:outline-none focus:border-gold/50 focus:shadow-glow transition-all',
        className,
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm font-sans',
        'text-text-primary focus:outline-none focus:border-gold/50 focus:shadow-glow transition-all',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = 'Select';
