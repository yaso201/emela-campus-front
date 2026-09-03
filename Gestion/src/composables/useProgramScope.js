/**
 * La filière — un FILTRE D'ÉCRAN, avec une vraie source.
 *
 * ⚠️ Le lot 1 a tranché que la filière n'est pas un contexte : le bandeau n'en
 * porte pas, parce qu'un responsable de formation n'a pas à la choisir et qu'un
 * gestionnaire académique en change dix fois par heure. Mais les écrans de
 * groupes, de planning et d'examens en ont besoin comme PARAMÈTRE.
 *
 * Les grappes 4 et 5 portaient un bouchon — un nom de filière écrit en dur,
 * nommé pour qu'on ne le prenne pas pour une donnée. Il est retiré : la source
 * existe, et elle est double.
 *
 *   1. LA PORTÉE DU LECTEUR, dans la session : `scope.program` est renseigné pour
 *      un rôle scopé (responsable de formation, responsable de programme). Quand
 *      elle existe, elle N'EST PAS UN DÉFAUT — c'est une contrainte. Le serveur
 *      refuse déjà hors périmètre, en fail-closed ; proposer un sélecteur libre à
 *      quelqu'un de scopé lui offrirait des choix qui échoueront.
 *
 *   2. LES OPTIONS DE STRUCTURE, sinon : `list_structure_options()` rend les
 *      filières, les années et les semestres en un appel.
 *
 * D'où la forme : `locked` dit lequel des deux cas s'applique, et l'écran affiche
 * un libellé fixe ou un sélecteur — jamais un sélecteur grisé.
 */
import { computed, ref, shallowRef } from 'vue';
import { useSession } from './useSession.js';
import { listStructureOptions } from '../api/structure.js';

const options = shallowRef([]);
const picked = ref(null);
const loaded = ref(false);
let started = null;

export function useProgramScope() {
  const { scope } = useSession();

  /** La portée du lecteur fait foi quand elle existe. */
  const locked = computed(() => !!scope.value?.program);

  async function load() {
    if (locked.value) {
      // Rien à charger : la portée EST la réponse. Un appel de plus n'apporterait
      // que des choix que le serveur refuserait.
      options.value = [{ name: scope.value.program, program_name: scope.value.program }];
      picked.value = scope.value.program;
      loaded.value = true;
      return;
    }
    if (started) return started;
    started = (async () => {
      const opts = await listStructureOptions();
      options.value = opts?.programs || [];
      // Pas de « toutes les filières » implicite : le premier élément est un
      // choix, non un défaut universel. L'écran dit lequel est affiché.
      if (!picked.value) picked.value = options.value[0]?.name || null;
      loaded.value = true;
    })();
    return started;
  }

  const program = computed(() => picked.value);
  const label = computed(() =>
    (options.value.find((p) => p.name === picked.value) || {}).program_name || picked.value || '');

  function pick(name) {
    if (locked.value) return;   // la portée ne se contourne pas depuis l'écran
    picked.value = name;
  }

  return { program, label, options, locked, loaded, load, pick };
}
