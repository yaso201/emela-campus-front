/**
 * Session — une seule instance pour l'application. La coquille l'ouvre au
 * démarrage ; les vues la lisent, aucune ne la recharge.
 *
 * `can()` répond LOCALEMENT à partir de la matrice reçue à l'ouverture : aucun
 * composant ne compare un rôle à une chaîne, aucun ne recalcule la matrice.
 * C'est la règle 3 en code — l'action n'est pas rendue, jamais rendue puis
 * désactivée : un grisé est déjà une fuite d'information.
 */
import { readonly, ref, shallowRef } from 'vue';
import { openSession } from '../api/session.js';
import { isDenied } from '../api/client.js';
import { denial } from './useResource.js';

const person = shallowRef({ id: '', name: '', initials: '', email: '' });
const roles = shallowRef([]);
const scope = shallowRef({ kind: 'nature', program: null, reason: null });
const spaces = shallowRef({ management: true, personal: false });
const permissions = shallowRef({});
const ready = ref(false);
const failure = ref(null);

let started = null;

async function open() {
  if (started) return started;
  started = (async () => {
    try {
      const s = await openSession();
      // Les initiales sont de l'AFFICHAGE : dérivées ICI du nom, jamais
      // rendues par le serveur (arbitrage stabilisation §3.1).
      const name = (s.person && s.person.name) || '';
      const initials = name.split(/[\s.@_-]+/).filter(Boolean)
        .map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '·';
      person.value = { ...s.person, initials };
      roles.value = s.roles || [];
      scope.value = s.scope || scope.value;
      spaces.value = s.spaces || spaces.value;
      permissions.value = s.permissions || {};
      ready.value = true;
    } catch (err) {
      failure.value = err;
      started = null;
      // Règle 5 (stabilisation §6) : un refus d'ouverture rend le refus
      // EXPLIQUÉ via la coquille — jamais un bootstrap cassé en silence.
      if (isDenied(err)) { err.globalDenial = true; denial.value = err; return; }
      throw err;
    }
  })();
  return started;
}

/** can('publish:planning') — une question, jamais un calcul. */
function can(action) {
  return permissions.value[action] === true;
}

export function useSession() {
  return {
    person: readonly(person),
    roles: readonly(roles),
    scope: readonly(scope),
    spaces: readonly(spaces),
    ready: readonly(ready),
    failure: readonly(failure),
    open,
    can,
  };
}
