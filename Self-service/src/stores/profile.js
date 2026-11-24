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
    // DEC-366 (MANDAT-14, X8, E-M11) : la facette « dossier » d'un étudiant à accès réduit (`dossier` de get_my_profile)
    // — statut, son libellé, l'échéance de l'accès, la période disciplinaire. Le serveur garde le profil GÉNÉRIQUE ;
    // l'espace en tire le profil de navigation `dossier` (accueil, menu et routes réduits).
    dossier: null,
    // MANDAT-14 (lot 7, VERDICT-PC1D §6 : un seul appel de get_my_profile par chargement) : le matricule (étudiant,
    // sinon candidat) que rend get_my_profile, lu par « Mon compte » ici plutôt que par un second appel.
    matricule: null,
  }),
  getters: {
    isLoaded: (state) => state.status === 'loaded',
    isGuest: (state) => state.status === 'guest',
    isLoading: (state) => state.status === 'loading' || state.status === 'idle',
    profileLabel: (state) => {
      const labels = {
        guest:      'Invité',
        student:    'Étudiant',
        dossier:    'Étudiant',
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
      this.dossier = null;
      this.matricule = null;
    },

    setResolvedProfile(profile, user, canAccessDesk, displayName = null, dossier = null, matricule = null) {
      this.matricule = matricule || null;
      this.sessionUser = user || window.user || 'Guest';
      // DEC-366 : un profil générique qui porte la facette « dossier » est un étudiant à accès réduit.
      this.dossier = (profile || 'generic') === 'generic' && dossier ? dossier : null;
      this.profile = this.dossier ? 'dossier' : profile || 'generic';
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
        this.setResolvedProfile(resolvedProfile, data?.user, data?.can_access_desk, data?.display_name, data?.dossier,
          data?.student_id || data?.student_applicant_id || null);
      } catch (err) {
        this.error = err;
        this.status = 'error';
      }
    },
  },
});
