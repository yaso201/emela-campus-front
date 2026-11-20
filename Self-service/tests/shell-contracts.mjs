// tests/shell-contracts.mjs — la coquille de l'espace et le titre des pages (MANDAT-14, P25 de VERDICT-MANDAT-14-PC1B ;
// constats C-3.3 et C-3.4, V-LEARN-M14-05).
//
// C-3.4 : la coquille rendait DEUX mises en page (bureau, téléphone), chacune avec son `router-view`, l'une cachée par
// CSS : chaque page était montée deux fois. Une seule doit l'être, choisie par la largeur (`v-if` / `v-else`).
// C-3.3 : `NavIcon` était employé sans être importé. Et une page de l'espace n'a qu'un `main` (celui de la coquille) et
// qu'un `h1` (le sien ; le bandeau n'en porte plus).
//   Exécution : `npm run test:contracts` (ou `node --test tests/shell-contracts.mjs`)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const lire = (rel) => readFileSync(join(SRC, rel), 'utf8');
const sansCommentaires = (s) => s.replace(/<!--[\s\S]*?-->/g, '');
const gabarit = (s) => sansCommentaires((s.match(/<template>[\s\S]*<\/template>/) || [''])[0]);
const compter = (s, motif) => (s.match(motif) || []).length;

test('la coquille ne monte qu’une mise en page à la fois (C-3.4)', () => {
  const g = gabarit(lire('components/layout/AppShell.vue'));
  assert.equal(compter(g, /<router-view\b/g), 2, 'un router-view par mise en page');
  assert.match(g, /<div v-if="desktop"[^>]*>/, 'la mise en page de bureau est conditionnelle');
  assert.match(g, /<div v-else class="flex flex-col/, 'celle du téléphone est son alternative');
  assert.doesNotMatch(g, /hidden md:flex min-h-screen|md:hidden flex flex-col/,
    'aucune mise en page n’est seulement cachée par CSS : elle serait montée quand même');
});

test('un composant qui emploie NavIcon l’importe (C-3.3)', () => {
  for (const f of ['components/layout/SideNav.vue', 'components/layout/BottomNav.vue']) {
    const s = lire(f);
    if (/<NavIcon\b/.test(gabarit(s))) {
      assert.match(s, /import NavIcon from '\.\/NavIcon\.vue'/, `${f} emploie NavIcon sans l’importer`);
    }
  }
});

test('le bandeau ne porte pas de h1 : le titre est celui de la page', () => {
  assert.equal(compter(gabarit(lire('components/layout/TopBar.vue')), /<h1\b/g), 0);
});

test('chaque page routée a un seul h1 et aucun main (le main est celui de la coquille)', () => {
  const pages = [...new Set([...lire('router/routes.js').matchAll(/@\/pages\/(\w+)\.vue/g)].map((m) => m[1]))];
  assert.ok(pages.length > 20, 'les pages de la table des routes sont lues');
  for (const p of pages) {
    const g = gabarit(lire(`pages/${p}.vue`));
    assert.equal(compter(g, /<main\b/g), 0, `${p} ouvre un second main`);
    assert.equal(compter(g, /<h1\b/g), 1, `${p} doit porter un h1, et un seul`);
  }
});
