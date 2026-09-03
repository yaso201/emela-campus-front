/**
 * Point d'appel unique. Aucun composant ne l'importe : seuls les modules de
 * domaine de ce dossier le font, et les pages passent par eux. Le branchement
 * à la coquille se fera ici, en un endroit, pas dans trente vues.
 */

const BASE = '/api/method/';

/**
 * Mode de service. 'mock' fait tourner l'application sans serveur — une
 * bibliothèque de composants qui ne s'assemble pas ne prouve rien. Le
 * branchement réel n'a qu'un interrupteur à basculer (VITE_API_MODE=live).
 */
const MODE = (import.meta.env?.VITE_API_MODE || 'mock').toLowerCase();
export const isMock = MODE === 'mock';

/**
 * Le simulacre est chargé à LA DEMANDE, jamais à l'import.
 *
 * Deux raisons, et la seconde n'est pas théorique. En mode branché, `mock/` est
 * du code mort : un import statique le mettrait quand même dans le paquet servi
 * en 3G. Et `fixtures.js` vérifie ses propres données au chargement du module
 * (il lève si une clé refusée a quitté le vocabulaire) — statiquement importé,
 * ce garde-fou ferait tomber l'application BRANCHÉE pour une faute dans des
 * données qu'elle n'utilise pas. Un contrôle doit tomber là où il protège.
 */
let loadMock = null;

/**
 * Les drapeaux de mise au point ne franchissent jamais le fil.
 *
 * `__empty` et `__fail` sont une convention du SIMULACRE : la couche de simulacre
 * les injecte depuis la bascule d'URL. Une vue n'en écrit pas — mais si l'une le
 * faisait, le drapeau partirait au serveur dans le corps de la requête, puisque
 * rien ne le filtrait. C'est arrivé une fois. Le point d'appel les retire donc au
 * bord, là où il n'y a qu'un endroit à tenir.
 */
function stripDebugFlags(params) {
  const clean = {};
  for (const [k, v] of Object.entries(params)) if (!k.startsWith('__')) clean[k] = v;
  return clean;
}

export async function call(method, params = {}, { signal } = {}) {
  if (isMock) {
    loadMock = loadMock || import('./mock/index.js');
    const { mockCall } = await loadMock;
    return mockCall(method, params);
  }

  const res = await fetch(BASE + method, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json',
               // CORRECTION D'UNE LIGNE (mandat branchement §6, à reverser) :
               // le jeton posé par le shell, joint sur toute écriture.
               'X-Frappe-CSRF-Token': window.csrf_token || '' },
    credentials: 'same-origin',
    body: JSON.stringify(stripDebugFlags(params)),
    signal,
  });

  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Le message est rédigé côté serveur et affichable tel quel : aucun écran
    // ne fabrique de phrase à partir d'un code.
    throw Object.assign(new Error(payload.message || 'Erreur serveur'), {
      code: res.status === 403 ? 'PERMISSION_DENIED' : payload.code || 'SERVER_ERROR',
      details: payload.details || null,
      status: res.status,
    });
  }
  return payload.message ?? payload;
}

/** Vrai pour un refus de droit : monte AccessDenied, jamais ErrorState. */
export const isDenied = (err) => err && err.code === 'PERMISSION_DENIED';

/** Fabrique un refus au format serveur — utilisé par les simulacres. */
export function denied(message, details = null) {
  return Object.assign(new Error(message), { code: 'PERMISSION_DENIED', details, status: 403 });
}
