// frontend/src/stores/auth.js
// Store Pinia pour l'info utilisateur.
// Lu depuis window.user et window.csrf_token injectés par mela_base.html (Task 2.0).
// Q18 (MANDAT-14) : la personne se nomme par son nom d'usage, rendu par le serveur avec le profil
// (`useProfileStore().displayName`) ; l'adresse ne sert qu'en repli, tant que le profil n'est pas lu ou si le compte
// n'a pas de nom.
import { defineStore } from 'pinia';
import { useProfileStore } from './profile.js';

function nomDUsage(user) {
  const nom = useProfileStore().displayName;
  return nom && nom !== user ? nom : null;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: typeof window !== 'undefined' ? window.user || 'Guest' : 'Guest',
    csrfToken: typeof window !== 'undefined' ? window.csrf_token || '' : '',
  }),
  getters: {
    isGuest: (state) => !state.user || state.user === 'Guest',
    displayName: (state) => {
      if (!state.user || state.user === 'Guest') return 'Invité';
      const nom = nomDUsage(state.user);
      if (nom) return nom;
      const local = state.user.split('@')[0];
      return local
        .split(/[._-]/)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ');
    },
    initials: (state) => {
      if (!state.user || state.user === 'Guest') return '?';
      const nom = nomDUsage(state.user);
      const parts = nom ? nom.split(/\s+/).filter(Boolean) : state.user.split('@')[0].split(/[._-]/).filter(Boolean);
      return parts
        .slice(0, 2)
        .map((p) => p.charAt(0).toUpperCase())
        .join('');
    },
  },
});
