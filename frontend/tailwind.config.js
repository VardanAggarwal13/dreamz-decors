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
        // Ink = dark foreground / text on light bg
        ink: {
          DEFAULT: '#1a1a1a',
          soft: '#5a5a5a',
          muted: '#9a9a9a',
        },
        // Bone = light surfaces (warm ivory — never stark white for main bg)
        bone: {
          DEFAULT: '#faf8f4',
          soft: '#ffffff',
          muted: '#ede7dc',
        },
        // Gold accent — slightly deeper for contrast on ivory
        accent: {
          DEFAULT: '#b8895a',
          glow: '#d4a574',
          deep: '#8a6238',
          neon: '#39ff88',
        },
      },
      boxShadow: {
        glow: '0 4px 20px rgba(184, 137, 90, 0.25), 0 0 32px rgba(184, 137, 90, 0.15)',
        'glow-neon': '0 0 28px rgba(57, 255, 136, 0.4)',
        soft: '0 1px 2px rgba(26, 26, 26, 0.04), 0 8px 24px rgba(26, 26, 26, 0.06)',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease forwards',
        marquee: 'marquee 30s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};
