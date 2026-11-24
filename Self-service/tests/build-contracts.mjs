// tests/build-contracts.mjs — la page servie dit de quel source elle vient (MANDAT-14, E8 ; P2 de VERDICT-MANDAT-14-PC1).
//   Exécution : `npm run test:contracts` (ou `node --test tests/build-contracts.mjs`)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildIdentity, provesRelease, MODE } from '../scripts/build-identity.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(path.resolve(__dirname, '..', rel), 'utf8');
const SHA = '0123456789abcdef0123456789abcdef01234567';
const fakeGit = (status) => (args) => (args[0] === 'rev-parse' ? SHA : status);
const NOW = new Date('2026-11-20T09:00:00Z');

test('une compilation d\'un arbre propre porte son SHA, sans « +modifié », en mode serveur', () => {
  const id = buildIdentity('.', { git: fakeGit(''), now: NOW });
  assert.deepEqual(id, { sha: SHA, label: SHA.slice(0, 12), dirty: false, mode: MODE, built_at: NOW.toISOString() });
  assert.equal(MODE, 'server');
  assert.equal(provesRelease(id, SHA.slice(0, 7)), true);
});

test('P2 : un arbre modifié porte « +modifié » et ne prouve aucune version', () => {
  const id = buildIdentity('.', { git: fakeGit(' M src/main.js'), now: NOW });
  assert.equal(id.label, `${SHA.slice(0, 12)}+modifié`);
  assert.equal(id.dirty, true);
  assert.equal(provesRelease(id, SHA), false);
});

test('sans git lisible, l\'identité est « inconnu+modifié » et ne prouve rien', () => {
  const id = buildIdentity('.', { git: () => { throw new Error('pas de dépôt'); }, now: NOW });
  assert.equal(id.sha, null);
  assert.equal(id.label, 'inconnu+modifié');
  assert.equal(provesRelease(id, SHA), false);
});

test('une version servie ne prouve que SON SHA', () => {
  const id = buildIdentity('.', { git: fakeGit(''), now: NOW });
  assert.equal(provesRelease(id, 'fedcba9876543'), false);
  assert.equal(provesRelease(id, ''), false);
});

test('le paquet et build.json portent la même identité ; main.js pose <meta name="emela-build">', () => {
  const vite = read('vite.config.js');
  assert.ok(vite.includes('__EMELA_BUILD__: JSON.stringify(BUILD_IDENTITY)'), 'define __EMELA_BUILD__ manquant');
  assert.ok(vite.includes("'build.json'"), 'build.json non déposé');
  assert.ok(vite.includes('writeBuildIdentity()'), 'greffon build.json non branché');
  const main = read('src/main.js');
  assert.ok(main.includes("meta.name = 'emela-build'"), '<meta name="emela-build"> manquant');
  assert.ok(main.includes('mode=${EMELA_BUILD.mode}'), 'le mode n\'est pas dit');
});

test('lot 7 bis : l\'entrée n\'importe l\'application que dynamiquement (une seule évaluation)', () => {
  // La page serveur charge l'entrée sous `?v=<mtime>` ; un morceau de route qui l'importerait la ferait évaluer une
  // seconde fois — deux applications, deux routeurs (§3.28 du rapport). L'entrée n'importe donc ni Vue, ni
  // l'application, ni le routeur : seulement le style et `import('./boot.js')`.
  const main = read('src/main.js');
  const statiques = [...main.matchAll(/^import\s+(?:[^'"]+from\s+)?['"]([^'"]+)['"]/gm)].map((m) => m[1]);
  assert.deepEqual(statiques, ['./assets/tailwind.css'], `imports statiques de l'entrée : ${statiques.join(', ')}`);
  assert.ok(main.includes("import('./boot.js')"), 'l\'amorce dynamique manque');
  assert.ok(!/\bexport\b/.test(main), 'l\'entrée ne doit rien exporter');
  const boot = read('src/boot.js');
  assert.ok(boot.includes("app.mount('#emela-app')") && boot.includes('router.isReady()'), 'l\'amorce ne monte pas');
});
