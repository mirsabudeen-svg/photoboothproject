/**
 * ATELIER Tailwind theme extension.
 * Merge into tailwind.config.ts:  theme: { extend: { ...atelier } }
 * (Tailwind v4: mirror these as @theme vars in globals.css instead.)
 */
export const atelier = {
  colors: {
    surface: { base: '#0A0908', raised: '#121110', elevated: '#1B1916' },
    gold: { DEFAULT: '#C6A15B', deep: '#9A7B3F' },
    champagne: '#E8D5A8',
    content: { display: '#FAF8F3', primary: '#F5F0E6', secondary: '#B8B5AD' },
    state: { success: '#7BA05B', warning: '#D4A24E', error: '#B85C5C', processing: '#8FA3B8' },
  },
  fontFamily: {
    display: ['"Cormorant Garamond"', 'serif'],
    body: ['Jost', 'sans-serif'],
    meta: ['"IBM Plex Mono"', 'monospace'],
  },
  fontSize: {
    'k-display': ['clamp(72px,13vw,140px)', { lineHeight: '1.05', letterSpacing: '-0.01em' }],
    'k-heading': ['clamp(40px,6vw,64px)', { lineHeight: '1.1' }],
    'k-sub': ['clamp(24px,3vw,32px)', { lineHeight: '1.4' }],
    'k-body': ['clamp(18px,2.4vw,26px)', { lineHeight: '1.6' }],
    'k-caption': ['clamp(14px,1.9vw,20px)', { letterSpacing: '0.24em' }],
    'k-meta': ['clamp(12px,1.5vw,16px)', { letterSpacing: '0.28em' }],
  },
  borderColor: { hairline: 'rgba(198,161,91,0.22)', 'hairline-strong': 'rgba(198,161,91,0.4)' },
  transitionTimingFunction: {
    luxe: 'cubic-bezier(0.22,1,0.36,1)',
    exit: 'cubic-bezier(0.55,0,1,0.45)',
    settle: 'cubic-bezier(0.34,1.2,0.64,1)',
  },
  transitionDuration: { touch: '120ms', fast: '250ms', screen: '450ms', cinematic: '700ms' },
  minHeight: { hit: '88px', 'hit-tablet': '72px' },
  minWidth: { hit: '88px' },
};
