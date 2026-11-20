// Self-service/scripts/build-identity.mjs — l'identité d'une compilation de l'espace (MANDAT-14, E8 et P2).
//
// Aujourd'hui rien ne dit de quel source vient la page servie (D-PIPELINE-MODE-01). Cette identité est
// calculée UNE fois par `vite.config.js`, inscrite dans le paquet (`__EMELA_BUILD__`, lu par `main.js`,
// qui pose `<meta name="emela-build">`) et déposée à côté de lui (`build.json`, servi en
// `/assets/portal_app/emela/build.json`). La recette et les preuves la lisent et la comparent au SHA attendu.
//
// P2 (VERDICT-MANDAT-14-PC1) : une version dont le source avait des changements non commités porte
// `+modifié` ; une preuve qui lit `+modifié`, ou un autre SHA que l'attendu, est ROUGE.
import { execFileSync } from 'node:child_process';

/** Le mode de l'espace : il n'a pas de mode simulé (relevé R1) ; un paquet de l'espace appelle toujours le serveur. */
export const MODE = 'server';

/**
 * @param {string} dir   le dossier `Self-service/` (la commande git y est lancée)
 * @param {object} [opts]
 * @param {(args: string[]) => string} [opts.git]  pour les tests : remplace l'appel à git
 * @param {Date} [opts.now]
 */
export function buildIdentity(dir, { git, now = new Date() } = {}) {
  const run = git || ((args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).trim());
  let sha = null;
  let dirty = false;
  try {
    sha = run(['rev-parse', 'HEAD']);
    // Le paquet est fait de Self-service/ et de shared/ (alias @design, jetons) : eux seuls comptent.
    dirty = run(['status', '--porcelain', '--', '.', '../shared']).length > 0;
  } catch {
    sha = null;
  }
  const valid = typeof sha === 'string' && /^[0-9a-f]{40}$/.test(sha);
  const short = valid ? sha.slice(0, 12) : 'inconnu';
  return {
    sha: valid ? sha : null,
    label: valid && !dirty ? short : `${short}+modifié`,
    dirty: !valid || dirty,
    mode: MODE,
    built_at: now.toISOString(),
  };
}

/** Une identité prouve une version servie si elle porte le SHA attendu, sans `+modifié` (P2). */
export function provesRelease(identity, expectedSha) {
  return Boolean(identity && identity.sha && !identity.dirty && identity.mode === MODE
    && typeof expectedSha === 'string' && expectedSha.length >= 7
    && identity.sha.startsWith(expectedSha));
}
