// frontend/src/composables/useCockpitBlock.js
// Wraps createResource pour appeler portal_app.api.cockpit.get_cockpit_block(block_name).
// Retourne un objet réactif avec .loading, .error, .data, .reload().
import { createResource } from 'frappe-ui';

/**
 * @param {string} blockName — un des 8 blocs supportés :
 *   'alerts' | 'tasks' | 'planning' | 'notifications' |
 *   'teaching_load' | 'indicators' | 'student_status' | 'application_status'
 */
export function useCockpitBlock(blockName) {
  return createResource({
    url: 'portal_app.api.cockpit.get_cockpit_block',
    params: { block_name: blockName },
    auto: true,
  });
}
