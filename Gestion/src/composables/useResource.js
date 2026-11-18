/**
 * useResource — les cinq états, une fois pour toutes.
 *
 * Dans une maquette un état est un dessin ; ici c'est une branche, et c'est la
 * seule branche : vide · chargement · erreur · refus de droit · succès partiel.
 * Aucune vue ne réécrit ce try/catch.
 *
 * ⚠ RÈGLE 5, PORTÉE ICI ET NULLE PART AILLEURS. Un refus de droit ne devient
 * jamais l'état d'erreur d'une vue : il alimente `denial`, et la coquille rend
 * le refus expliqué à la place de la page. Une vue qui oublierait d'y penser
 * l'affiche quand même — c'est tout l'intérêt de le porter dans la couche
 * d'appel plutôt que dans trente écrans.
 */
import { ref, shallowRef } from 'vue';
import { isDenied } from '../api/client.js';

/**
 * Le refus courant, partagé. Effacé par la coquille au changement de route —
 * SAUF s'il vient du BOOTSTRAP (session/contexte, stabilisation §6) : ce
 * refus-là n'appartient à aucune page, il appartient à la session ; changer
 * d'écran ne recharge pas le contexte, l'effacer rendait un squelette
 * perpétuel sur les écrans dont le chargement attend `params`.
 */
export const denial = shallowRef(null);
export function clearDenial() {
  if (denial.value && denial.value.globalDenial) return;
  denial.value = null;
}

export function useResource(loader, options = {}) {
  const {
    isEmpty = (data) => !data || (Array.isArray(data.items) && data.items.length === 0),
    expectedCount = null,
    label = 'lignes',
  } = options;

  const state = ref('loading');          // loading | ready | empty | error | denied
  const data = shallowRef(null);
  const error = shallowRef(null);
  const partial = ref('');               // succès partiel : rédigé serveur
  const expected = ref(expectedCount);
  // D-FRONT-REPONSE-PERIMEE-01 (MANDAT-12, course O-5) : chaque chargement
  // porte son numéro ; une réponse — succès OU échec — dont le chargement a été
  // dépassé par un plus récent est IGNORÉE. Sans cette garde, la dernière
  // réponse ARRIVÉE gagnait : une demande lancée sans filtre, revenue après la
  // bonne, réécrivait l'écran (6 groupes au lieu de 0, deux boutons de trop).
  let latest = 0;

  async function load(params = {}) {
    const seq = ++latest;
    state.value = 'loading';
    error.value = null;
    partial.value = '';
    try {
      const result = await loader(params);
      if (seq !== latest) return;      // réponse périmée : un chargement plus récent fait foi
      data.value = result;
      // Le décompte avant chargement : « 100 étudiants » annoncé séparément.
      if (result && result.count != null) expected.value = result.count;
      // Succès partiel : le serveur dit ce qui est passé et ce qui ne l'est pas.
      if (result && result.partial_message) partial.value = result.partial_message;
      state.value = isEmpty(result) ? 'empty' : 'ready';
    } catch (err) {
      if (seq !== latest) return;      // l'échec d'un chargement dépassé n'efface pas le récent
      if (isDenied(err)) {
        denial.value = err;            // règle 5 — la coquille prend la suite
        state.value = 'denied';
      } else {
        error.value = err;
        state.value = 'error';
      }
    }
  }

  return { state, data, error, partial, expected, label, load };
}
