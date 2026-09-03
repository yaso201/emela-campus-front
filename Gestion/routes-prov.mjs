// Rejeu des 24 routes — harnais F3-PROV (mock/live selon la release active).
// Zéro erreur console/page/HTTP, zéro h1 vide ; + les vecteurs d'écran PROV.
import { chromium } from 'playwright-core';

const BASE = process.env.BASE || 'http://127.0.0.1:8000';
const MODE = process.env.MODE || 'mock';
const LOGIN = process.env.LOGIN === '1';
const ROUTES = ['/a-traiter','/structure','/repartition','/repartition/validation',
 '/repartition/charge','/repartition/signaux','/repartition/realise','/groupes',
 '/groupes/inscriptions','/planning','/notes','/notes/deliberation','/planning/examens',
 '/dossiers','/dossiers/sans-decideur','/conseil','/conseil/seance','/conseil/preconisations',
 '/conseil/absences','/documents','/diplomation','/cloture','/administration','/atelier'];

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
const failures = [];
let route417 = 0;
page.on('response', (r) => {
  if (r.status() >= 400 && r.url().includes('/api/method')) {
    if (r.status() === 417) route417 += 1;
    failures.push(`HTTP ${r.status()} ${r.url().split('method/')[1] || r.url()}`);
  }
});

// le login par l'API — la desserte /gestion est gatée par session (SRV)
const lr = await page.request.post(`${BASE}/api/method/login`, {
  form: { usr: 'Administrator', pwd: process.env.PW || 'admin' },
});
if (lr.status() !== 200) { console.log('LOGIN KO', lr.status()); process.exit(2); }

for (const r of ROUTES) {
  const errs = [];
  const onCons = (m) => { if (m.type() === 'error') errs.push(`console: ${m.text().slice(0,120)}`); };
  const onErr = (e) => errs.push(`page: ${String(e).slice(0,120)}`);
  page.on('console', onCons); page.on('pageerror', onErr);
  await page.goto(`${BASE}/gestion#${r}`, { waitUntil: 'networkidle' }).catch((e) => errs.push(`nav: ${e}`));
  await page.waitForTimeout(400);
  const h1 = (await page.locator('h1').first().textContent().catch(() => '')) || '';
  if (!h1.trim()) errs.push('h1 VIDE');
  page.off('console', onCons); page.off('pageerror', onErr);
  if (errs.length) failures.push(`${r} → ${errs.join(' · ')}`);
  console.log(`${errs.length ? 'KO' : 'ok'}  ${r}  h1="${h1.trim().slice(0,44)}"`);
}

// ── vecteurs d'écran PROV ──
await page.goto(`${BASE}/gestion#/repartition`, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
const body = await page.textContent('body');
if (MODE === 'mock') {
  if (!body.includes('à attribuer')) failures.push('PROV: « à attribuer » absent (L9)');
  if (body.includes('pas encore enregistrée')) failures.push('PROV: état inventé ENCORE rendu');
}
await page.goto(`${BASE}/gestion#/notes/deliberation`, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
const delib = await page.textContent('body');
if (!delib.includes('Aucune délibération sélectionnée')) failures.push('PROV: sans sujet, l\'écran ne le dit pas');
if (MODE === 'mock') {
  await page.click('td:has-text("DELIB-2027-L2GL")').catch(() => failures.push('PROV: liste non cliquable'));
  await page.waitForTimeout(600);
  const after = await page.textContent('body');
  if (!/Conseil pédagogique/.test(after)) failures.push('PROV: le sujet choisi n\'ouvre pas le tableau');
  if (!page.url().includes('deliberation=DELIB-2027-L2GL')) failures.push('PROV: le sujet ne voyage pas dans l\'adresse');
}

console.log(`\n${failures.length ? 'ÉCHECS:' : 'TOUT VERT'} (417 api: ${route417})`);
for (const f of failures) console.log('  -', f);
await browser.close();
process.exit(failures.length ? 1 : 0);
