// frontend/tailwind.config.js
// ESM config — package.json déclare "type": "module".
// P6-Ph1 : Design System LaNEM v1 — tokens inline (DEC-149, token-migration-map.js)

export default {
  content: [
    './src/**/*.{vue,js,ts,jsx,tsx}',
    './index.html',
  ],
  theme: {
    extend: {
      colors: {
        // ─── LaNEM Design System v1 ───
        // Référence : DESIGN_SYSTEM_LaNEM_Institutionnel_v1.md §2.2
        // Migration : brand-* → ln-blue-*, neutral-* → ln-gray-*

        'ln-blue': {
          50: '#F4F8FF',   // Fond ultra-clair (hover)
          100: '#E8F0FE',  // Fond badges/info
          200: '#C7D8F5',  // Rings, bordures légères
          600: '#1E62C4',  // Liens
          700: '#104EAC',  // Hover
          800: '#0D3B8C',  // Boutons primaires
          900: '#0A2463',  // Titres, nav active
        },

        'ln-gray': {
          50: '#FAFBFC',   // Fond secondaire
          100: '#F0F2F5',  // Séparations légères
          200: '#E1E4E8',  // Bordures
          300: '#D1D5DB',  // Bordures actives
          400: '#9CA3AF',  // Texte tertiaire
          500: '#6B7280',  // Texte secondaire
          600: '#4B5563',  // Texte body
          700: '#374151',  // Texte principal
          900: '#111827',  // Titres
        },

        // Couleurs sémantiques
        'ln-success': '#047857',
        'ln-success-bg': '#ECFDF5',
        'ln-warning': '#B45309',
        'ln-warning-bg': '#FFFBEB',
        'ln-error': '#B91C1C',
        'ln-error-bg': '#FEF2F2',

        // ─── Anciens tokens OBSOLÈTES ───
        // Les tokens brand-* et neutral-* sont remplacés par ln-blue-* et ln-gray-*
        // Voir token-migration-map.js pour le mapping complet
      },

      fontFamily: {
        sans: ["'Inter'", '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },

      fontSize: {
        // Échelle typographique LaNEM (§2.3)
        'h1': ['28px', { lineHeight: '1.2', fontWeight: '700' }],
        'h2': ['20px', { lineHeight: '1.3', fontWeight: '600' }],
        'h3': ['14px', { lineHeight: '1.4', fontWeight: '600' }],
        'body': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['12px', { lineHeight: '1.4', fontWeight: '500' }],
        'micro': ['11px', { lineHeight: '1.3', fontWeight: '500' }],
      },

      boxShadow: {
        // Élévations LaNEM (§2.5)
        'card': '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.03)',
        'elevated': '0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.04)',
        'nav': '0 1px 0 rgba(0,0,0,0.05)',
      },

      borderRadius: {
        // Rayons LaNEM (§2.6)
        'sm-ln': '6px',
        'md-ln': '8px',
        'lg-ln': '12px',
        'xl-ln': '16px',
      },

      spacing: {
        // Système 8pt (§2.4)
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
      },
    },
  },
  plugins: [],
};
