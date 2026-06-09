'use client';

import { cn } from '@/lib/utils';

const themes = [
  { id: 'luxury_gold', label: 'Luxury Gold', swatch: '#D4A843' },
  { id: 'kerala_traditional', label: 'Kerala Traditional', swatch: '#CC3300' },
  { id: 'royal_purple', label: 'Royal Purple', swatch: '#7B2FBE' },
] as const;

export function ThemeSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: (typeof themes)[number]['id']) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {themes.map((theme) => (
        <button
          key={theme.id}
          type="button"
          onClick={() => onChange(theme.id)}
          className={cn(
            'rounded-xl border p-4 text-left transition-all',
            value === theme.id
              ? 'border-gold bg-gold-muted shadow-glow'
              : 'border-border bg-surface hover:border-gold/30',
          )}
        >
          <div
            className="w-6 h-6 rounded-full mb-2 border border-border"
            style={{ backgroundColor: theme.swatch }}
          />
          <span className="text-xs font-sans text-text-primary">{theme.label}</span>
        </button>
      ))}
    </div>
  );
}
