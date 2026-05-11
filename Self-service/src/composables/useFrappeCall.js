// frontend/src/composables/useFrappeCall.js
// Wrapper reactive générique pour appeler n'importe quelle fonction Frappe whitelisted.
// Utilisé par FinancesBlock, AttendanceBlock, PlanningPage et NotificationsBlock (Phase 5).
// Mime l'API de useCockpitBlock (.loading, .error, .data, .reload()).
import { reactive, onMounted } from 'vue';

/**
 * @param {string} method — dotted path, ex: 'portal_app.api.finance_summary.get_student_finance_summary'
 * @param {object} [params={}] — paramètres POST à envoyer
 * @param {object} [options]
 * @param {boolean} [options.auto=true] — fetch au mount
 */
export function useFrappeCall(method, params = {}, options = {}) {
  const { auto = true } = options;

  const resource = reactive({
    loading: false,
    error: null,
    data: null,
    reload: null,
  });

  async function fetchMethod() {
    resource.loading = true;
    resource.error = null;
    try {
      const formData = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
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
          // keep status code
        }
        const err = new Error(message);
        err.status = response.status;
        // P3: classification explicite pour les appelants
        // 'auth' = 401 (session expirée, géré globalement par useAuth)
        // 'forbidden' = 403 (interdit métier, à gérer localement)
        // 'error' = autre erreur serveur
        err.category = response.status === 401 ? 'auth'
          : response.status === 403 ? 'forbidden'
          : 'error';
        throw err;
      }

      const json = await response.json();
      resource.data = json.message !== undefined ? json.message : json;
    } catch (err) {
      resource.error = err;
    } finally {
      resource.loading = false;
    }
  }

  resource.reload = fetchMethod;
  if (auto) onMounted(fetchMethod);

  return resource;
}
