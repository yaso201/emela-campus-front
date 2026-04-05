// frontend/src/stores/auth.js
// Store Pinia pour l'info utilisateur.
// Lu depuis window.user et window.csrf_token injectés par mela_base.html (Task 2.0).
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: typeof window !== 'undefined' ? window.user || 'Guest' : 'Guest',
    csrfToken: typeof window !== 'undefined' ? window.csrf_token || '' : '',
  }),
  getters: {
    isGuest: (state) => !state.user || state.user === 'Guest',
    displayName: (state) => {
      if (!state.user || state.user === 'Guest') return 'Invité';
      const local = state.user.split('@')[0];
      return local
        .split(/[._-]/)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ');
    },
    initials: (state) => {
      if (!state.user || state.user === 'Guest') return '?';
      const local = state.user.split('@')[0];
      const parts = local.split(/[._-]/).filter(Boolean);
      return parts
        .slice(0, 2)
        .map((p) => p.charAt(0).toUpperCase())
        .join('');
    },
  },
});
