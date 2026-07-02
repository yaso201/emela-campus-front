// tests/source-contracts.mjs
// Contrats STATIQUES du source front (garde-fous).
// F1 (02/07/2026) : migrés depuis la suite BACK portal_app (option A) — ces
// contrats portent sur le SOURCE FRONT et vivent désormais avec le front.
//   - ex test_planning_fixes.py::TestPlanningFrontendContracts (2)
//   - ex test_routing_architecture.py::test_change_password_success_stays_in_spa_no_hard_redirect (1)
// Toolchain front native : node:test (aucune dépendance ajoutée).
//   Exécution : `npm run test:contracts`  (ou `node --test tests/source-contracts.mjs`)
//
// NB contrat partagé : `payload?.sessions` (PlanningPage) décrit la FORME de la
// réponse API back ; la moitié BACK de ce contrat reste testée côté back
// (portal_app/tests/test_planning_fixes.py — API planning). Ici on ne vérifie
// que la CONSOMMATION côté front.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = (rel) => readFileSync(path.resolve(__dirname, '..', 'src', rel), 'utf8');

test('planning utils : dates calendrier locales, pas de toISOString UTC', () => {
  const source = src('utils/planning.js');
  assert.ok(source.includes('function toLocalIsoDate'), 'toLocalIsoDate manquant');
  assert.ok(!source.includes('.toISOString('), '.toISOString( interdit pour les dates calendrier');
});

test('PlanningPage : normalise les sessions avant rendu (forme payload.sessions)', () => {
  const source = src('pages/PlanningPage.vue');
  assert.ok(source.includes('normalizePlanningSession'), 'normalizePlanningSession manquant');
  assert.ok(source.includes('planning.data?.payload?.sessions'), 'lecture payload.sessions manquante');
});

test('ChangePasswordPage : succès reste dans la SPA (router.push, pas de hard-redirect)', () => {
  const source = src('pages/ChangePasswordPage.vue');
  // Pas de hard-redirect
  assert.ok(!source.includes("window.location.href = '/emela/login'"), 'hard-redirect login interdit');
  assert.ok(!source.includes("window.location.href = '/app-emela/'"), 'hard-redirect accueil interdit');
  // Navigation via Vue Router
  assert.ok(source.includes("router.push({ name: 'cockpit' })"), 'router.push(cockpit) manquant');
  // Message de succès sans auto-redirect
  assert.ok(source.includes('Mot de passe modifié'), 'message succès manquant');
  assert.ok(source.includes('Retourner'), 'lien retour manquant');
  // Blocage nouveau == ancien
  assert.ok(source.includes('isSameAsOld'), 'garde isSameAsOld manquant');
});
