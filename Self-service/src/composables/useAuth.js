// frontend/src/composables/useAuth.js
// Composable d'authentification — logout, détection session expirée, reconnexion
// UX-AUTH — Phase 3, P3: statuts auth raffinés
import { ref, computed } from 'vue';

// Auth status: 'guest' | 'ok' | 'session_expired'
// Note: 'forbidden' (403 métier) n'est PAS un état auth global — il est
// géré par requête via err.status dans useFrappeCall.
const authStatus = ref(window.user === 'Guest' ? 'guest' : 'ok');
const isSessionExpired = computed(() => authStatus.value === 'session_expired');
let interceptorSetup = false;

// Routes exclues de l'interception auth (pas de faux positif)
const AUTH_ROUTE_PATTERNS = ['/logout', '/api/method/login'];

function isAuthRoute(url) {
  const s = url?.toString() || '';
  return AUTH_ROUTE_PATTERNS.some(p => s.includes(p));
}

/**
 * Déconnexion — utilise le pattern Frappe identifié dans useFrappeCall
 */
async function logout() {
  try {
    await fetch('/api/method/logout', {
      method: 'POST',
      headers: {
        'X-Frappe-CSRF-Token': window.csrf_token || '',
        'Accept': 'application/json',
      },
      credentials: 'same-origin',
    });
  } catch (e) {
    console.warn('[useAuth] Logout error:', e);
  }
  // Redirection dans tous les cas (même si l'appel échoue)
  window.location.href = '/emela/login';
}

/**
 * Intercepteur fetch pour détecter les 401 (session expirée).
 * Les 403 (interdit métier) ne déclenchent PAS la mécanique session expirée.
 * Ne s'installe qu'une seule fois (singleton).
 */
function setupSessionInterceptor() {
  if (interceptorSetup) return;
  interceptorSetup = true;

  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);

    const url = args[0]?.toString() || '';
    if (isAuthRoute(url)) return response;

    if (response.status === 401) {
      // 401 = non authentifié ou session expirée → déclencher la mécanique auth
      authStatus.value = 'session_expired';
    }
    // 403 = interdit métier → PAS de changement d'état auth.
    // L'appelant verra err.status === 403 via useFrappeCall.

    return response;
  };
}

/**
 * Redirection vers login avec paramètre redirect-to (convention canonique P3)
 */
function reconnect() {
  const requestedUrl = window.location.pathname + window.location.search + window.location.hash;
  window.location.href = '/emela/login?redirect-to=' + encodeURIComponent(requestedUrl);
}

/**
 * Hook pour réinitialiser l'état (utile pour tests)
 */
function resetSessionState() {
  authStatus.value = window.user === 'Guest' ? 'guest' : 'ok';
}

export function useAuth() {
  return {
    authStatus,
    isSessionExpired,
    logout,
    setupSessionInterceptor,
    reconnect,
    resetSessionState,
  };
}
