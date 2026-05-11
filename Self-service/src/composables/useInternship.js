// frontend/src/composables/useInternship.js
// Logique métier pour le portail stage étudiant (L6-E05)
// Ref: D04 §4.2 (cycle de vie), D04 §5 (5 phases), U07 §4.13
// Respecte DEC-127 : pas de frappe.call() direct, utilise fetch API

import { reactive, computed, readonly } from 'vue';

/**
 * Mapping des statuts Internship vers les phases du processus (D04 §5)
 * Phase 1: Déclaration | Phase 2: Convention | Phase 3: En cours
 * Phase 4: Rapport | Phase 5: Soutenance
 */
const STATUS_TO_PHASE = {
  'Fiche soumise': 1,
  'Refusé': 1,
  'Tuteur entreprise validé': 2,
  'Convention générée': 2,
  'Convention signée étudiant': 2,
  'Convention signée tuteur entreprise': 2,
  'Convention signée tuteur académique': 3,
  'Convention signée': 3,
  'En cours': 3,
  'Rapport déposé': 4,
  'Soutenance planifiée': 5,
  'Noté': 5,
  'Annulé': null,
};

/**
 * Mapping des statuts vers les statuses StatusBadge (U07 §2.1)
 */
const STATUS_TO_BADGE_STATUS = {
  'Fiche soumise': 'pending',
  'Refusé': 'rejected',
  'Tuteur entreprise validé': 'validated',
  'Convention générée': 'in-review',
  'Convention signée étudiant': 'pending',
  'Convention signée tuteur entreprise': 'pending',
  'Convention signée tuteur académique': 'active',
  'Convention signée': 'active',
  'En cours': 'active',
  'Rapport déposé': 'active',
  'Soutenance planifiée': 'in-review',
  'Noté': 'graduated',
  'Annulé': 'withdrawn',
};

/**
 * Libellés français des statuts pour affichage
 */
const STATUS_TO_LABEL = {
  'Fiche soumise': 'En attente de validation',
  'Refusé': 'Refusé',
  'Tuteur entreprise validé': 'Validation reçue',
  'Convention générée': 'Convention en cours',
  'Convention signée étudiant': 'En attente de signature',
  'Convention signée tuteur entreprise': 'En attente de signature',
  'Convention signée tuteur académique': 'Stage en cours',
  'Convention signée': 'Stage en cours',
  'En cours': 'Stage en cours',
  'Rapport déposé': 'Rapport déposé',
  'Soutenance planifiée': 'Soutenance planifiée',
  'Noté': 'Terminé',
  'Annulé': 'Annulé',
};

/**
 * Labels des 5 phases pour l'indicateur visuel
 */
const PHASE_LABELS = [
  '', // Index 0 unused
  'Déclaration',
  'Convention',
  'En cours',
  'Rapport',
  'Soutenance',
];

/**
 * Détermine la prochaine action selon le statut
 * @param {string} status - Statut du stage
 * @returns {object|null} - { label, route } ou null
 */
function getNextAction(status) {
  const actions = {
    'Fiche soumise': {
      label: 'En attente de validation par le tuteur entreprise',
      route: null,
    },
    'Convention signée étudiant': {
      label: 'Signer la convention de stage',
      route: '/internship',
    },
    'Convention signée tuteur entreprise': {
      label: 'En attente de signature du tuteur académique',
      route: null,
    },
    'Rapport déposé': {
      label: 'Préparer la soutenance',
      route: '/internship',
    },
    'En cours': {
      label: 'Déposer le rapport de stage',
      route: '/internship',
    },
  };
  return actions[status] || null;
}

/**
 * Composable pour la gestion du stage étudiant (L6-E05)
 * 
 * @returns {object} État et actions pour le portail stage
 */
export function useInternship() {
  // ── État principal ─────────────────────────────────────────────────
  const state = reactive({
    loading: false,
    error: null,
    internship: null, // Données du stage ou null
    hasInternship: false,
  });

  // ── Computed ───────────────────────────────────────────────────────
  
  /** Phase actuelle (1-5) ou null si pas de stage */
  const currentPhase = computed(() => {
    if (!state.internship) return null;
    return STATUS_TO_PHASE[state.internship.status] ?? null;
  });

  /** Libellé du statut pour affichage */
  const statusLabel = computed(() => {
    if (!state.internship) return 'Aucun stage';
    return STATUS_TO_LABEL[state.internship.status] || state.internship.status;
  });

  /** Status StatusBadge */
  const statusBadgeStatus = computed(() => {
    if (!state.internship) return 'pending';
    return STATUS_TO_BADGE_STATUS[state.internship.status] || state.internship.status;
  });

  /** Prochaine action attendue */
  const nextAction = computed(() => {
    if (!state.internship) return null;
    return getNextAction(state.internship.status);
  });

  /** Labels des phases pour l'indicateur */
  const phaseLabels = computed(() => PHASE_LABELS);

  // ── Helpers API ────────────────────────────────────────────────────
  
  /**
   * Appel API générique (DEC-127 compliant)
   * @param {string} method - Chemin de la méthode Frappe
   * @param {object} params - Paramètres POST
   * @returns {Promise<any>} - Réponse JSON
   */
  async function apiCall(method, params = {}) {
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
      }
    }

    const response = await fetch(`/api/method/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Frappe-CSRF-Token': window.csrf_token || '',
        'Accept': 'application/json',
      },
      body: formData.toString(),
      credentials: 'same-origin',
    });

    if (!response.ok) {
      const text = await response.text();
      let message = `HTTP ${response.status}`;
      try {
        const json = JSON.parse(text);
        message = json._server_messages || json.exc || json.message || message;
      } catch {
        // garder status code
      }
      const err = new Error(message);
      err.status = response.status;
      throw err;
    }

    const json = await response.json();
    return json.message ?? json;
  }

  // ── Actions ────────────────────────────────────────────────────────

  /**
   * Charge le statut du stage de l'étudiant connecté
   * Endpoint: internship_app.api.portal_internship.get_student_internship_status
   */
  async function loadInternship() {
    state.loading = true;
    state.error = null;

    try {
      const result = await apiCall(
        'internship_app.api.portal_internship.get_student_internship_status'
      );

      if (result.has_internship && result.internship) {
        state.internship = result.internship;
        state.hasInternship = true;
      } else {
        state.internship = null;
        state.hasInternship = false;
      }
    } catch (err) {
      state.error = err.message || 'Erreur lors du chargement du stage';
      state.internship = null;
      state.hasInternship = false;
    } finally {
      state.loading = false;
    }
  }

  /**
   * Réinitialise l'état
   */
  function reset() {
    state.loading = false;
    state.error = null;
    state.internship = null;
    state.hasInternship = false;
  }

  // ── Return public API ──────────────────────────────────────────────
  return {
    // État (readonly pour éviter mutations externes)
    isLoading: computed(() => state.loading),
    error: computed(() => state.error),
    internship: computed(() => state.internship),
    hasInternship: computed(() => state.hasInternship),
    
    // Computed dérivés
    currentPhase,
    statusLabel,
    statusBadgeStatus,
    nextAction,
    phaseLabels,
    
    // Actions
    loadInternship,
    reset,
  };
}

export default useInternship;
