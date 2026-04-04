import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#1E1B2E',
          elevated: '#2A2640',
          hover: '#352F50',
        },
        primary: '#7C3AED',
        secondary: '#3B82F6',
        tertiary: '#EC4899',
        'on-surface': {
          DEFAULT: '#FFFFFF',
          muted: '#A0A0B8',
        },
        success: '#22C55E',
        error: '#EF4444',
        warning: '#F59E0B',
      },
      fontFamily: {
        headline: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        label: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '12px',
      },
    },
  },
  plugins: [],
};

export default config;
