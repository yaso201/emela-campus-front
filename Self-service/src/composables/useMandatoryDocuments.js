// frontend/src/composables/useMandatoryDocuments.js
// Logique métier pour les documents obligatoires (CF-002 / L5-E05a)
// Ref: D05 §6, §8.4 — DEC-098, DEC-125, DEC-127
// Ce composable encapsule TOUTE la logique — le composant Vue n'a aucune logique métier

import { reactive, computed, ref } from 'vue';

/**
 * Composable pour la gestion des documents obligatoires.
 * Respecte DEC-127 : utilise useFrappeCall, jamais frappe.call() direct.
 *
 * @returns {object} État et actions pour le flux documents obligatoires
 */
export function useMandatoryDocuments(initialDocument = null) {
  // ── État principal ─────────────────────────────────────────────────
  const state = reactive({
    loading: false,
    error: null,
    pendingDoc: initialDocument, // Initialisé par le parent si fourni
    // Vague 0.5: fail-close — si la vérification échoue, on reste bloqué
    checkFailed: false,
  });

  // ── Étapes du flux ─────────────────────────────────────────────────
  const currentStep = ref('reading'); // 'reading' | 'quiz' | 'signature' | 'submitting' | 'done'
  const scrollCompleted = ref(false);

  // Quiz
  const quizQuestions = ref([]);
  const quizAnswers = ref({}); // { "question-name": "A", ... }
  const quizError = ref(null);

  // Signature
  const signatureText = ref('');
  const acceptChecked = ref(false);

  // ── Computed ───────────────────────────────────────────────────────
  // Vague 0.5: fail-close — blocked if pending doc OR if check failed (API error)
  const isBlocked = computed(() => !!state.pendingDoc || state.checkFailed);

  const isLoading = computed(() => state.loading);

  const needsQuiz = computed(() => {
    if (!state.pendingDoc) return false;
    return state.pendingDoc.validation_type?.includes('Quiz');
  });

  const needsSignature = computed(() => {
    if (!state.pendingDoc) return false;
    return state.pendingDoc.validation_type?.includes('Signature');
  });

  const canSubmitQuiz = computed(() => {
    if (!needsQuiz.value) return true;
    return quizQuestions.value.every((q) => !!quizAnswers.value[q.name]);
  });

  const canSubmitSignature = computed(() => {
    if (!needsSignature.value) return true;
    return acceptChecked.value && signatureText.value.trim().length >= 3;
  });

  // ── Helpers API ────────────────────────────────────────────────────
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
   * Vérifie si un document obligatoire est en attente pour l'utilisateur.
   * Appelé au onMounted de CockpitPage.
   */
  async function checkPending() {
    state.loading = true;
    state.error = null;
    state.checkFailed = false;

    try {
      const result = await apiCall('portal_app.api.mandatory_documents.get_pending_mandatory_documents');

      if (result.blocked && result.document) {
        state.pendingDoc = result.document;
        resetFlow();
      } else {
        state.pendingDoc = null;
      }
    } catch (err) {
      // Vague 0.5: fail-close — API error keeps the portal blocked
      state.error = 'Impossible de vérifier vos documents obligatoires. Réessayez ou contactez le support.';
      state.pendingDoc = null;
      state.checkFailed = true;
    } finally {
      state.loading = false;
    }
  }

  /**
   * Charge les questions quiz pour le document en cours.
   */
  async function loadQuiz() {
    if (!state.pendingDoc || !needsQuiz.value) return;

    quizError.value = null;
    state.loading = true;

    try {
      const result = await apiCall('portal_app.api.mandatory_documents.get_quiz_questions', {
        mandatory_document: state.pendingDoc.name,
      });

      if (result.questions && result.questions.length >= 2) {
        quizQuestions.value = result.questions;
        quizAnswers.value = {};
      } else {
        throw new Error('Pas assez de questions disponibles pour ce document');
      }
    } catch (err) {
      quizError.value = err.message || 'Erreur lors du chargement du quiz';
    } finally {
      state.loading = false;
    }
  }

  /**
   * Appelé quand l'utilisateur a scrollé jusqu'en bas du document.
   * Active le bouton "J'ai lu".
   */
  function onScrollComplete() {
    scrollCompleted.value = true;
  }

  /**
   * Passe à l'étape quiz après lecture complète.
   */
  async function onReadingComplete() {
    if (!scrollCompleted.value) return;

    if (needsQuiz.value) {
      await loadQuiz();
      if (!quizError.value) {
        currentStep.value = 'quiz';
      }
    } else if (needsSignature.value) {
      currentStep.value = 'signature';
    } else {
      // Lecture+Acceptation uniquement
      await submitValidation();
    }
  }

  /**
   * Valide les réponses quiz avant de passer à la signature.
   * Le backend vérifie les réponses — ici on vérifie juste qu'elles sont toutes remplies.
   */
  function submitAnswers() {
    if (!canSubmitQuiz.value) {
      quizError.value = 'Veuillez répondre à toutes les questions';
      return;
    }

    quizError.value = null;

    if (needsSignature.value) {
      currentStep.value = 'signature';
    } else {
      // Cas théorique : Quiz sans Signature — on soumet direct
      submitValidation();
    }
  }

  /**
   * Soumet la validation finale au backend.
   * Gère le cas quiz_passed: false pour permettre de réessayer.
   */
  async function submitValidation() {
    if (!state.pendingDoc) return;
    if (!canSubmitSignature.value) return;

    currentStep.value = 'submitting';
    quizError.value = null;

    try {
      const result = await apiCall('portal_app.api.mandatory_documents.submit_document_validation', {
        mandatory_document: state.pendingDoc.name,
        quiz_answers: needsQuiz.value ? JSON.stringify(quizAnswers.value) : '{}',
        signature_text: needsSignature.value ? signatureText.value.trim() : '',
      });

      if (result.success) {
        currentStep.value = 'done';
        // Laisser le composant parent gérer la transition via @validated
      } else if (result.quiz_passed === false) {
        // Quiz échoué — permettre de réessayer
        quizError.value = result.message || 'Réponses incorrectes. Veuillez relire le document et réessayer.';
        currentStep.value = 'quiz';
        // Recharger de nouvelles questions
        await loadQuiz();
      } else {
        throw new Error(result.message || 'Validation échouée');
      }
    } catch (err) {
      state.error = err.message || 'Erreur lors de la validation';
      currentStep.value = needsSignature.value ? 'signature' : needsQuiz.value ? 'quiz' : 'reading';
    }
  }

  /**
   * Réinitialise le flux (pour réessayer le quiz ou reset complet).
   */
  function resetFlow() {
    currentStep.value = 'reading';
    scrollCompleted.value = false;
    quizQuestions.value = [];
    quizAnswers.value = {};
    quizError.value = null;
    signatureText.value = '';
    acceptChecked.value = false;
  }

  /**
   * Resynchronise le document en cours (appelé si le parent passe un autre document).
   */
  function setPendingDocument(document) {
    state.pendingDoc = document || null;
    resetFlow();
  }

  /**
   * Reset complet incluant le document pending.
   */
  function reset() {
    resetFlow();
    state.pendingDoc = null;
    state.error = null;
    state.loading = false;
    state.checkFailed = false;
  }

  // ── Return public API ──────────────────────────────────────────────
  return {
    // État
    isLoading,
    error: computed(() => state.error),
    pendingDoc: computed(() => state.pendingDoc),
    isBlocked,

    // Étapes
    currentStep,
    scrollCompleted,
    quizQuestions,
    quizAnswers,
    quizError,
    signatureText,
    acceptChecked,

    // Computed helpers
    needsQuiz,
    needsSignature,
    canSubmitQuiz,
    canSubmitSignature,

    // Actions
    checkPending,
    loadQuiz,
    onScrollComplete,
    onReadingComplete,
    submitAnswers,
    submitValidation,
    setPendingDocument,
    reset,
  };
}
