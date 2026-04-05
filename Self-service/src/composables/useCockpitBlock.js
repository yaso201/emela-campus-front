// frontend/src/composables/useCockpitBlock.js
// Wrapper maison reactive pour appeler portal_app.api.cockpit.get_cockpit_block(block_name).
// Mime l'API createResource de frappe-ui (.loading, .error, .data, .reload()) sans importer
// frappe-ui (qui a des dépendances lourdes via unplugin-icons).
// Gère CSRF automatiquement via window.csrf_token (injecté par mela_base.html).
import { reactive, onMounted } from 'vue';

/**
 * @param {string} blockName — un des 8 blocs supportés :
 *   'alerts' | 'tasks' | 'planning' | 'notifications' |
 *   'teaching_load' | 'indicators' | 'student_status' | 'application_status'
 */
export function useCockpitBlock(blockName) {
  const resource = reactive({
    loading: false,
    error: null,
    data: null,
    reload: null, // défini ci-dessous
  });

  async function fetchBlock() {
    resource.loading = true;
    resource.error = null;
    try {
      const formData = new URLSearchParams();
      formData.append('block_name', blockName);

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

      if (!response.ok) {
        const text = await response.text();
        let message = `HTTP ${response.status}`;
        try {
          const json = JSON.parse(text);
          message = json._server_messages || json.exc || json.message || message;
        } catch {
          // text n'est pas JSON — garder le status code
        }
        throw new Error(message);
      }

      const json = await response.json();
      // Frappe wraps whitelisted function results in { message: ... }
      resource.data = json.message || json;
    } catch (err) {
      resource.error = err;
    } finally {
      resource.loading = false;
    }
  }

  resource.reload = fetchBlock;

  // Auto-fetch au montage
  onMounted(fetchBlock);

  return resource;
}
