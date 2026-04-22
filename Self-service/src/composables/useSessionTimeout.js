// frontend/src/composables/useSessionTimeout.js
// Gestion du timeout de session — warning avant expiration
// UX-PROFIL — Phase 3
import { ref, onMounted, onUnmounted } from 'vue';

// Session Frappe = 8h par défaut
const SESSION_DURATION_MINUTES = 8 * 60; // 480 minutes
const WARNING_BEFORE_MINUTES = 5;

export function useSessionTimeout() {
  const showWarning = ref(false);
  const remainingMinutes = ref(WARNING_BEFORE_MINUTES);

  let warningTimeout = null;
  let countdownInterval = null;
  let lastActivityTime = Date.now();

  // Réinitialise le timer d'activité
  function recordActivity() {
    lastActivityTime = Date.now();
  }

  // Démarre le timer de warning
  function startWarningTimer() {
    // Warning après (SESSION_DURATION - WARNING_BEFORE) minutes
    const warningDelayMs = (SESSION_DURATION_MINUTES - WARNING_BEFORE_MINUTES) * 60 * 1000;

    warningTimeout = setTimeout(() => {
      showWarning.value = true;
      remainingMinutes.value = WARNING_BEFORE_MINUTES;

      // Compte à rebours minute par minute
      countdownInterval = setInterval(() => {
        remainingMinutes.value--;
        if (remainingMinutes.value <= 0) {
          clearInterval(countdownInterval);
          // La session va expirer — le modal SessionExpired prendra le relais
        }
      }, 60 * 1000);
    }, warningDelayMs);
  }

  // Prolonge la session (appel API)
  async function extendSession() {
    try {
      // Appel API qui rafraîchit la session côté serveur
      await fetch('/api/method/frappe.auth.get_logged_user', {
        method: 'GET',
        headers: {
          'X-Frappe-CSRF-Token': window.csrf_token || '',
        },
        credentials: 'same-origin',
      });

      // Réinitialise l'état
      showWarning.value = false;
      remainingMinutes.value = WARNING_BEFORE_MINUTES;

      // Redémarre le timer
      if (warningTimeout) clearTimeout(warningTimeout);
      if (countdownInterval) clearInterval(countdownInterval);
      startWarningTimer();

      return true;
    } catch (e) {
      console.error('[useSessionTimeout] Failed to extend session:', e);
      return false;
    }
  }

  // Ferme le warning sans prolonger
  function dismissWarning() {
    showWarning.value = false;
  }

  onMounted(() => {
    // P3: pas de timeout pour les invités — inutile et source de signaux parasites
    if (window.user === 'Guest') return;

    recordActivity();
    startWarningTimer();

    // Écouteurs d'activité (pour debug/tracking éventuel)
    const events = ['click', 'keydown', 'scroll', 'mousemove'];
    events.forEach(event => {
      window.addEventListener(event, recordActivity, { passive: true });
    });
  });

  onUnmounted(() => {
    if (warningTimeout) clearTimeout(warningTimeout);
    if (countdownInterval) clearInterval(countdownInterval);

    const events = ['click', 'keydown', 'scroll', 'mousemove'];
    events.forEach(event => {
      window.removeEventListener(event, recordActivity);
    });
  });

  return {
    showWarning,
    remainingMinutes,
    extendSession,
    dismissWarning,
  };
}
