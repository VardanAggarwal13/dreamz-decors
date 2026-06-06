/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        display: ['"Playfair Display"', 'serif'],
      },
      colors: {
        ink: {
          DEFAULT: 'rgb(var(--color-ink) / <alpha-value>)',
          soft: 'rgb(var(--color-ink-soft) / <alpha-value>)',
          muted: 'rgb(var(--color-ink-muted) / <alpha-value>)',
        },
        bone: {
          DEFAULT: 'rgb(var(--color-bone) / <alpha-value>)',
          soft: 'rgb(var(--color-bone-soft) / <alpha-value>)',
          muted: 'rgb(var(--color-bone-muted) / <alpha-value>)',
        },
        hairline: 'rgb(var(--color-hairline) / <alpha-value>)',
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          glow: 'rgb(var(--color-accent-glow) / <alpha-value>)',
          deep: 'rgb(var(--color-accent-deep) / <alpha-value>)',
        },
        gold: {
          DEFAULT: 'rgb(var(--color-gold) / <alpha-value>)',
          light: 'rgb(var(--color-gold-light) / <alpha-value>)',
          deep: 'rgb(var(--color-gold-deep) / <alpha-value>)',
        },
        sale: {
          DEFAULT: 'rgb(var(--color-sale) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--color-success) / <alpha-value>)',
        },
      },
      boxShadow: {
        glow: '0 12px 32px rgba(188, 74, 44, 0.12)',
        'glow-gold': '0 12px 32px rgba(197, 158, 89, 0.18)',
        soft: '0 1px 2px rgba(22, 22, 22, 0.03), 0 18px 44px rgba(22, 22, 22, 0.06)',
        card: '0 1px 0 rgba(22, 22, 22, 0.03), 0 14px 32px rgba(22, 22, 22, 0.05)',
        'card-hover': '0 2px 0 rgba(22, 22, 22, 0.04), 0 24px 48px rgba(22, 22, 22, 0.10)',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease forwards',
        'fade-in': 'fadeIn 0.5s ease forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};