// frontend/src/stores/profile.js
// Store Pinia — détecte le profil utilisateur via get_cockpit_block("notifications").
// État : 'idle' | 'loading' | 'loaded' | 'guest' | 'error'
import { defineStore } from 'pinia';

export const useProfileStore = defineStore('profile', {
  state: () => ({
    status: 'idle',
    profile: null,
    error: null,
  }),
  getters: {
    isLoaded: (state) => state.status === 'loaded',
    isGuest: (state) => state.status === 'guest',
    isLoading: (state) => state.status === 'loading' || state.status === 'idle',
    profileLabel: (state) => {
      const labels = {
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
    async fetchProfile() {
      if (this.status === 'loading' || this.status === 'loaded') return;
      this.status = 'loading';
      this.error = null;

      try {
        const formData = new URLSearchParams();
        formData.append('block_name', 'notifications');
        const response = await fetch(
          '/api/method/portal_app.api.cockpit.get_cockpit_block',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'X-Frappe-CSRF-Token': window.csrf_token || '',
              'Accept': 'application/json',
            },
            body: formData.toString(),
            credentials: 'same-origin',
          },
        );

        if (response.status === 403 || response.status === 401) {
          this.status = 'guest';
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json();
        const data = json.message || json;
        if (data.status === 'ok' && data.profile) {
          this.profile = data.profile;
          this.status = 'loaded';
        } else {
          this.profile = 'generic';
          this.status = 'loaded';
        }
      } catch (err) {
        this.error = err;
        this.status = 'error';
      }
    },
  },
});
