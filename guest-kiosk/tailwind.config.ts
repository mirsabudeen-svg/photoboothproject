import type { Config } from 'tailwindcss';
import { atelier } from './tailwind.atelier';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: { ...atelier.colors.surface },
        champagne: atelier.colors.champagne,
        content: { ...atelier.colors.content },
        state: { ...atelier.colors.state },
        gold: { DEFAULT: atelier.colors.gold.DEFAULT, deep: atelier.colors.gold.deep },
      },
      fontFamily: {
        display: ['var(--font-cormorant)', 'Cormorant Garamond', 'serif'],
        body: ['var(--font-jost)', 'Jost', 'sans-serif'],
        meta: ['var(--font-ibm-plex-mono)', 'IBM Plex Mono', 'monospace'],
      },
      // @ts-expect-error Atelier kiosk fontSize tuples are valid at runtime
      fontSize: atelier.fontSize,
      borderColor: atelier.borderColor,
      transitionTimingFunction: atelier.transitionTimingFunction,
      transitionDuration: atelier.transitionDuration,
      minHeight: atelier.minHeight,
      minWidth: atelier.minWidth,
    },
  },
  plugins: [],
};

export default config;
