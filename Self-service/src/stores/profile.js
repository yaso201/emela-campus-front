// frontend/src/stores/profile.js
// Store Pinia — détecte le profil utilisateur via get_my_profile (endpoint dédié).
// État : 'idle' | 'loading' | 'loaded' | 'guest' | 'error'
import { defineStore } from 'pinia';

export const useProfileStore = defineStore('profile', {
  state: () => ({
    status: 'idle',
    profile: null,
    error: null,
    sessionUser: typeof window !== 'undefined' ? window.user || 'Guest' : 'Guest',
    canAccessDesk: false,
    // Q18 (MANDAT-14) : le nom d'usage de la personne (`display_name` de get_my_profile, `User.full_name`).
    displayName: null,
  }),
  getters: {
    isLoaded: (state) => state.status === 'loaded',
    isGuest: (state) => state.status === 'guest',
    isLoading: (state) => state.status === 'loading' || state.status === 'idle',
    profileLabel: (state) => {
      const labels = {
        guest:      'Invité',
        student:    'Étudiant',
        instructor: 'Enseignant',
        director:   'Direction',
        candidate:  'Candidat',
        generic:    'Utilisateur',
      };
      return labels[state.profile] || 'Utilisateur';
    },
  },
  actions: {
    setGuestState() {
      this.sessionUser = 'Guest';
      this.profile = 'guest';
      this.status = 'guest';
      this.canAccessDesk = false;
      this.displayName = null;
    },

    setResolvedProfile(profile, user, canAccessDesk, displayName = null) {
      this.sessionUser = user || window.user || 'Guest';
      this.profile = profile || 'generic';
      this.canAccessDesk = !!canAccessDesk;
      // Le serveur rend l'adresse quand le compte n'a pas de nom : ce n'est pas un nom d'usage.
      this.displayName = displayName && displayName !== this.sessionUser ? displayName : null;
      this.status = 'loaded';
    },

    async fetchProfile() {
      if (this.status === 'loading' || this.status === 'loaded') return;
      this.status = 'loading';
      this.error = null;
      this.canAccessDesk = false;

      try {
        const response = await fetch(
          '/api/method/portal_app.api.portal_access.get_my_profile',
          {
            method: 'POST',
            headers: {
              'X-Frappe-CSRF-Token': window.csrf_token || '',
              'Accept': 'application/json',
            },
            credentials: 'same-origin',
          },
        );

        if (response.status === 403 || response.status === 401) {
          this.setGuestState();
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json();
        const hasMessage = json && Object.prototype.hasOwnProperty.call(json, 'message');
        const data = hasMessage ? json.message : json;
        const isEmptyPayload = !data || (typeof data === 'object' && Object.keys(data).length === 0);
        const sessionUser = window.user || 'Guest';
        const resolvedProfile = data?.profile ?? data?.profile_type ?? null;

        if (resolvedProfile === 'guest' || data?.profile_type === 'guest') {
          this.setGuestState();
          return;
        }

        if (isEmptyPayload) {
          if (sessionUser === 'Guest') {
            this.setGuestState();
            return;
          }

          throw new Error('Empty profile payload for authenticated session');
        }

        // R2: can_access_desk vient du backend — plus de lecture frontend des rôles système.
        this.setResolvedProfile(resolvedProfile, data?.user, data?.can_access_desk, data?.display_name);
      } catch (err) {
        this.error = err;
        this.status = 'error';
      }
    },
  },
});
