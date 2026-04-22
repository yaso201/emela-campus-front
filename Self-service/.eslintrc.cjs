/* eslint-env node */
// ESLint config — Frontend emela (Vue 3)
// P6-Ph1 : Règle anti-régression tokens obsolètes

module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['vue'],
  rules: {
    // Anti-régression : tokens obsolètes brand-* et neutral-*
    // Référence : token-migration-map.js
    'no-restricted-syntax': ['error', {
      selector: 'Literal[value=/\\b(brand-|neutral-)\\d+/]',
      message: 'Token obsolète — utiliser ln-blue-* ou ln-gray-* (cf. token-migration-map.js)',
    }],

    // Vue
    'vue/multi-word-component-names': 'off',
    'vue/no-multiple-template-root': 'off',
    'vue/require-default-prop': 'off',

    // Général
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
  },
  globals: {
    // Frappe globals
    frappe: 'readonly',
    window: 'readonly',
    document: 'readonly',
  },
};
