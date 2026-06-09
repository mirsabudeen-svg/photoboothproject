import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0F0F0F',
        surface: '#1A1A1A',
        card: '#242424',
        border: 'rgba(255,255,255,0.08)',
        gold: {
          DEFAULT: '#D4A843',
          muted: 'rgba(212,168,67,0.15)',
          glow: 'rgba(212,168,67,0.25)',
        },
        text: {
          primary: '#F0EDE8',
          muted: '#8A8680',
          subtle: '#5A5753',
        },
      },
      fontFamily: {
        display: ['var(--font-cormorant)', 'serif'],
        sans: ['var(--font-dm-sans)', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 0 24px rgba(212,168,67,0.15)',
        card: '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6)',
        glow: '0 0 0 1px rgba(212,168,67,0.3), 0 0 12px rgba(212,168,67,0.1)',
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
