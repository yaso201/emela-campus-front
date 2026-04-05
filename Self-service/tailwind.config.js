// frontend/tailwind.config.js
// ESM config — package.json déclare "type": "module".
import tokens from '../design-system/tokens/tailwind-tokens.js';

export default {
  content: [
    './src/**/*.{vue,js,ts,jsx,tsx}',
    './index.html',
  ],
  theme: {
    extend: {
      colors: tokens.colors,
      fontFamily: tokens.fontFamily,
      fontSize: tokens.fontSize,
      fontWeight: tokens.fontWeight,
      lineHeight: tokens.lineHeight,
      letterSpacing: tokens.letterSpacing,
      spacing: tokens.spacing,
      borderRadius: tokens.borderRadius,
      boxShadow: tokens.boxShadow,
    },
  },
  plugins: [],
};
