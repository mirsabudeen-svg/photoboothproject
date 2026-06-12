'use client';
import { motion } from 'framer-motion';
import { cascadeItem, press } from '@/lib/motion';

/** Experience / option card. Selected = gold border + inner ring + champagne label
 *  (never color alone — WCAG 1.4.1). Max 5 visible per screen. */
export function SelectionCard({
  title,
  tag,
  selected,
  onSelect,
}: { title: string; tag?: string; selected?: boolean; onSelect: () => void }) {
  return (
    <motion.button
      variants={cascadeItem}
      {...press}
      onClick={onSelect}
      aria-pressed={selected}
      className={[
        'w-full min-h-hit px-8 py-6 flex items-center justify-between text-left',
        'bg-surface-elevated border transition-colors duration-fast ease-luxe',
        selected
          ? 'border-gold shadow-[inset_0_0_0_1px_#C6A15B]'
          : 'border-hairline active:border-hairline-strong',
      ].join(' ')}
    >
      <span className={`font-body font-normal text-k-sub ${selected ? 'text-champagne' : 'text-content-primary'}`}>
        {selected ? '◆ ' : ''}{title}
      </span>
      {tag && (
        <span className="font-meta uppercase tracking-[0.24em] text-k-meta text-gold-deep">{tag}</span>
      )}
    </motion.button>
  );
}
