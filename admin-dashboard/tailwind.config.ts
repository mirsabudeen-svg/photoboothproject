import type { Config } from 'tailwindcss';
import { atelier } from './tailwind.atelier';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Legacy admin aliases — migrate to Atelier tokens in Phase 1
      colors: {
        surface: { ...atelier.colors.surface },
        champagne: atelier.colors.champagne,
        content: { ...atelier.colors.content },
        state: { ...atelier.colors.state },
        base: atelier.colors.surface.base,
        card: atelier.colors.surface.elevated,
        border: atelier.borderColor.hairline,
        gold: {
          DEFAULT: atelier.colors.gold.DEFAULT,
          muted: 'rgba(198,161,91,0.15)',
          glow: 'rgba(198,161,91,0.25)',
          deep: atelier.colors.gold.deep,
        },
        text: {
          primary: atelier.colors.content.primary,
          muted: atelier.colors.content.secondary,
          subtle: '#5A5753',
        },
      },
      fontFamily: {
        display: ['var(--font-cormorant)', 'Cormorant Garamond', 'serif'],
        body: ['var(--font-jost)', 'Jost', 'sans-serif'],
        sans: ['var(--font-jost)', 'Jost', 'sans-serif'],
        meta: ['var(--font-ibm-plex-mono)', 'IBM Plex Mono', 'monospace'],
      },
      // @ts-expect-error Atelier kiosk fontSize tuples are valid at runtime
      fontSize: atelier.fontSize,
      borderColor: atelier.borderColor,
      transitionTimingFunction: atelier.transitionTimingFunction,
      transitionDuration: atelier.transitionDuration,
      minHeight: atelier.minHeight,
      minWidth: atelier.minWidth,
      boxShadow: {
        gold: '0 0 24px rgba(198,161,91,0.15)',
        card: '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6)',
        glow: '0 0 0 1px rgba(198,161,91,0.3), 0 0 12px rgba(198,161,91,0.1)',
      },
      animation: {
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-gold': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
