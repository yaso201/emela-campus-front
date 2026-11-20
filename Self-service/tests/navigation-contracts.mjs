// tests/navigation-contracts.mjs — le menu suit la garde du routeur (MANDAT-14, P8 de VERDICT-MANDAT-14-PC1 §7).
//
// Une entrée de menu ne s'affiche qu'aux profils que la garde de sa route admet. Ce test parcourt les deux
// menus (latéral et barre basse) pour CHAQUE profil, et prouve que chaque entrée rendue mène à une route qui
// l'admet — donc sans le renvoi silencieux vers l'accueil (`next('/')`) que faisait « KPI présences ».
// Il refuse aussi une liste `profiles` qui déborde de la garde : la donnée elle-même ne peut plus diverger.
//   Exécution : `npm run test:contracts` (ou `node --test tests/navigation-contracts.mjs`)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PROFILES, routes, routeAdmits, findStaticRoute } from '../src/router/routes.js';
import {
  SIDE_NAV_ITEMS, BOTTOM_NAV_ITEMS, BOTTOM_NAV_MAX, navItemsFor,
} from '../src/components/layout/navItems.js';

const MENUS = { 'menu latéral': SIDE_NAV_ITEMS, 'barre basse': BOTTOM_NAV_ITEMS };

test('chaque entrée de menu mène à une route existante (aucun chemin orphelin)', () => {
  for (const [menu, items] of Object.entries(MENUS)) {
    for (const item of items) {
      assert.ok(findStaticRoute(item.to), `${menu} : « ${item.label} » → ${item.to} ne mène à aucune route`);
    }
  }
});

test('les profils déclarés par une entrée sont tous admis par la garde de sa route', () => {
  for (const [menu, items] of Object.entries(MENUS)) {
    for (const item of items) {
      const route = findStaticRoute(item.to);
      for (const p of item.profiles) {
        assert.ok(PROFILES.includes(p), `${menu} : « ${item.label} » déclare un profil inconnu « ${p} »`);
        assert.ok(routeAdmits(route, p),
          `${menu} : « ${item.label} » est offerte à « ${p} », que la garde de ${item.to} refuse`);
      }
    }
  }
});

test('pour chaque profil, chaque entrée rendue est admise par la garde (aucune redirection)', () => {
  for (const profile of PROFILES) {
    for (const [menu, items] of Object.entries(MENUS)) {
      for (const item of navItemsFor(items, profile, { canAccessDesk: true })) {
        assert.ok(routeAdmits(findStaticRoute(item.to), profile),
          `${menu}, profil ${profile} : « ${item.label} » mènerait à un renvoi vers l'accueil`);
      }
    }
  }
});

test('KPI présences : au menu du directeur seulement, comme la garde (le cas relevé par R1)', () => {
  const kpi = (profile) => navItemsFor(SIDE_NAV_ITEMS, profile).some((i) => i.to === '/attendance-kpis');
  assert.equal(kpi('director'), true);
  for (const profile of ['generic', 'employee', 'student', 'instructor', 'candidate']) {
    assert.equal(kpi(profile), false, `KPI présences offerte à ${profile}`);
  }
});

test('la barre basse tient en cinq entrées pour chaque profil', () => {
  for (const profile of PROFILES) {
    assert.ok(navItemsFor(BOTTOM_NAV_ITEMS, profile).length <= BOTTOM_NAV_MAX, `barre basse de ${profile}`);
  }
});

test('la garde : une route sans requiresProfile admet tout profil, sinon la liste seule', () => {
  const accueil = findStaticRoute('/');
  const kpis = findStaticRoute('/attendance-kpis');
  for (const p of PROFILES) assert.equal(routeAdmits(accueil, p), true);
  assert.equal(routeAdmits(kpis, 'director'), true);
  assert.equal(routeAdmits(kpis, 'employee'), false);
  assert.ok(routes.some((r) => r.redirect), 'la route de repli existe');
});
