// gestion-app/tailwind.config.js
// Reprise à l'identique de portal_app/frontend/tailwind.config.js : le code de
// gestion dépend de ces jetons (rounded-md-ln, text-body-sm, shadow-card…).
// Ne pas diverger — si le self-service change, celui-ci change avec lui.
// ESM : package.json déclare "type": "module".

export default {
  content: ['./src/**/*.{vue,js,ts,jsx,tsx}', './index.html'],
  theme: {
    extend: {
      colors: {
        'ln-blue': {
          50: '#F4F8FF', 100: '#E8F0FE', 200: '#C7D8F5',
          600: '#1E62C4', 700: '#104EAC', 800: '#0D3B8C', 900: '#0A2463',
        },
        'ln-gray': {
          50: '#FAFBFC', 100: '#F0F2F5', 200: '#E1E4E8', 300: '#D1D5DB',
          400: '#9CA3AF', 500: '#6B7280', 600: '#4B5563', 700: '#374151', 900: '#111827',
        },
        'ln-success': '#047857', 'ln-success-bg': '#ECFDF5',
        'ln-warning': '#B45309', 'ln-warning-bg': '#FFFBEB',
        'ln-error': '#B91C1C',   'ln-error-bg': '#FEF2F2',
      },
      fontFamily: {
        sans: ["'Inter'", '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        h1: ['28px', { lineHeight: '1.2', fontWeight: '700' }],
        h2: ['20px', { lineHeight: '1.3', fontWeight: '600' }],
        h3: ['14px', { lineHeight: '1.4', fontWeight: '600' }],
        body: ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '1.4', fontWeight: '500' }],
        micro: ['11px', { lineHeight: '1.3', fontWeight: '500' }],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.03)',
        elevated: '0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.04)',
        nav: '0 1px 0 rgba(0,0,0,0.05)',
      },
      borderRadius: { 'sm-ln': '6px', 'md-ln': '8px', 'lg-ln': '12px', 'xl-ln': '16px' },
      spacing: { 1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '20px', 6: '24px', 8: '32px', 10: '40px' },
    },
  },
  plugins: [],
};
