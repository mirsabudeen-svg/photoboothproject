'use client';
import { motion } from 'framer-motion';
import { press } from '@/lib/motion';

type Variant = 'primary' | 'hairline' | 'skip';

/** ATELIER button. Rule: exactly ONE `primary` per screen. */
export function AtelierButton({
  variant = 'primary',
  children,
  ...rest
}: { variant?: Variant } & React.ComponentProps<typeof motion.button>) {
  const base =
    'font-meta uppercase tracking-[0.28em] text-k-caption min-h-hit min-w-hit px-12 select-none';
  const styles: Record<Variant, string> = {
    primary: 'bg-gold text-surface-base',
    hairline: 'border border-gold text-champagne bg-transparent active:bg-gold/10',
    skip: 'text-content-secondary min-h-0 min-w-0 px-4 py-3 underline-offset-4 active:underline',
  };
  return (
    <motion.button {...press} className={`${base} ${styles[variant]}`} {...rest}>
      {children}
    </motion.button>
  );
}
