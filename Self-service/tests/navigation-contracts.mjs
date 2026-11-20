// tests/navigation-contracts.mjs — le menu suit la garde du routeur (MANDAT-14, P8 de VERDICT-MANDAT-14-PC1 §7).
//
// Une entrée de menu ne s'affiche qu'aux profils que la garde de sa route admet. Ce test parcourt les deux
// menus (latéral et barre basse) pour CHAQUE profil, et prouve que chaque entrée rendue mène à une route qui
// l'admet — donc sans le renvoi silencieux vers l'accueil (`next('/')`) que faisait « KPI présences ».
// Il refuse aussi une liste `profiles` qui déborde de la garde : la donnée elle-même ne peut plus diverger.
//   Exécution : `npm run test:contracts` (ou `node --test tests/navigation-contracts.mjs`)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PROFILES, routes, routeAdmits, findStaticRoute, matchRoute } from '../src/router/routes.js';
import {
  SIDE_NAV_ITEMS, BOTTOM_NAV_ITEMS, BOTTOM_NAV_MAX, navItemsFor, isNavActive,
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

// ── MANDAT-14, VERDICT-MANDAT-14-PC1B ─────────────────────────────────────────────────────────────

test('Q19 : le planning, le planning des collègues et le dossier étudiant ne sont plus au directeur', () => {
  for (const path of ['/planning', '/planning/search', '/students/ETU-1']) {
    const route = matchRoute(path);
    assert.ok(route, `${path} ne mène à aucune route`);
    assert.equal(routeAdmits(route, 'director'), false, `${path} admet encore le directeur`);
  }
  assert.equal(routeAdmits(matchRoute('/planning'), 'student'), true);
  assert.equal(routeAdmits(matchRoute('/planning/search'), 'instructor'), true);
  assert.equal(routeAdmits(matchRoute('/students/ETU-1'), 'instructor'), true);
  for (const items of Object.values(MENUS)) {
    assert.ok(!navItemsFor(items, 'director').some((i) => i.to.startsWith('/planning')),
      'une entrée de planning reste offerte au directeur');
  }
});

test('Q20 : « Mes démarches » remplace « Congé académique » au menu de l’étudiant', () => {
  const student = navItemsFor(SIDE_NAV_ITEMS, 'student').map((i) => i.to);
  assert.ok(student.includes('/demarches'));
  assert.ok(!student.includes('/account/leave-requests'));
});

test('E-M9 : l’enseignant a ses modules et ses heures au menu (P7)', () => {
  const instructor = navItemsFor(SIDE_NAV_ITEMS, 'instructor').map((i) => i.to);
  assert.ok(instructor.includes('/modules'));
  assert.ok(instructor.includes('/hours'));
});

test('P23 : une page atteinte par « Mes démarches » allume « Mes démarches », et elle seule', () => {
  const lit = (path, profile) => navItemsFor(SIDE_NAV_ITEMS, profile)
    .filter((i) => isNavActive(i, { path, meta: matchRoute(path)?.meta || {} }))
    .map((i) => i.label);
  for (const path of ['/demarches', '/account/leave-requests', '/demarches/reorientation',
    '/demarches/retour-conge', '/demarches/demission', '/demarches/abandon', '/demarches/discipline']) {
    assert.deepEqual(lit(path, 'student'), ['Mes démarches'], path);
  }
  assert.deepEqual(lit('/account', 'student'), ['Mon compte']);
  assert.deepEqual(lit('/modules/GL-S3-ALGO2/submit', 'instructor'), ['Mes modules']);
  // E-M10 (PC1C) : la page du module allume « Mes modules » ; le planning d'un collègue ouvert depuis elle, « Planning ».
  assert.deepEqual(lit('/modules/GL-S3-ALGO2', 'instructor'), ['Mes modules']);
  assert.deepEqual(lit('/planning/search?enseignant=ENS-00002', 'instructor'), ['Planning']);
  assert.deepEqual(lit('/planning/search', 'instructor'), ['Planning']);
  assert.deepEqual(lit('/', 'student'), ['Accueil']);
});

test('P16 : aucun libellé anglais au menu ni au titre des routes', () => {
  const ANGLAIS = /\b(Leaves|attendance|sync|Email|KPI)\b/;
  for (const item of [...SIDE_NAV_ITEMS, ...BOTTOM_NAV_ITEMS]) {
    assert.ok(!ANGLAIS.test(item.label), `menu : « ${item.label} »`);
  }
  for (const r of routes) {
    if (r.meta?.label) assert.ok(!ANGLAIS.test(r.meta.label), `route ${r.path} : « ${r.meta.label} »`);
  }
});

// DEC-366 (E-M11, X8) : l'étudiant à accès réduit — profil de navigation `dossier`. Son menu et la garde du routeur
// se réduisent aux six entrées de DEC-366 ; la page Congé et la réorientation (lectures fermées au MINIMAL, DEC-333)
// et toute page de participation lui restent refusées.
test('DEC-366 : le profil « dossier » ne voit et n’ouvre que l’espace réduit', () => {
  const menu = navItemsFor(SIDE_NAV_ITEMS, 'dossier').map((i) => i.to).sort();
  assert.deepEqual(menu, ['/', '/account', '/demarches', '/documents', '/notifications', '/support']);
  const barre = navItemsFor(BOTTOM_NAV_ITEMS, 'dossier').map((i) => i.to);
  assert.ok(barre.length <= BOTTOM_NAV_MAX, `barre basse : ${barre.length} entrées`);
  const admises = routes.filter((r) => !r.redirect && routeAdmits(r, 'dossier')).map((r) => r.path).sort();
  assert.deepEqual(admises, ['/', '/account', '/account/password', '/account/preferences', '/demarches',
    '/demarches/abandon', '/demarches/demission', '/demarches/discipline', '/demarches/retour-conge', '/documents',
    '/notifications', '/support', '/support/:id'].sort());
  for (const p of ['/account/leave-requests', '/demarches/reorientation', '/planning', '/results', '/evals', '/internship']) {
    assert.ok(!routeAdmits(findStaticRoute(p), 'dossier'), `${p} doit rester fermé au profil « dossier »`);
  }
});
