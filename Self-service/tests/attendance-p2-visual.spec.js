import fs from 'node:fs';
import path from 'node:path';

import { expect, request, test } from '@playwright/test';

const PASSWORD = 'LaNEM-Recette-2026!';
const ARTIFACT_DIR = path.resolve('test-results/attendance-p2-visual');

const viewports = [
  { name: 'mobile', viewport: { width: 375, height: 812 } },
  { name: 'desktop', viewport: { width: 1366, height: 900 } },
];

const routes = [
  {
    name: 'kpis',
    path: '/app-emela/attendance-kpis',
    heading: 'KPI présences',
    user: 'service.peda.recette@lanem.test',
  },
  {
    name: 'corrections',
    path: '/app-emela/attendance-corrections',
    heading: 'Corrections attendance',
    user: 'enseignant.recette@lanem.test',
  },
  {
    name: 'leaves',
    path: '/app-emela/attendance-leaves',
    heading: 'Leaves attendance',
    user: 'etudiant.recette@lanem.test',
  },
  {
    name: 'antifraud',
    path: '/app-emela/attendance-antifraud',
    heading: 'Revue antifraude',
    user: 'responsable.formation.recette@lanem.test',
  },
  {
    name: 'sync-anomalies',
    path: '/app-emela/attendance-sync-anomalies',
    heading: 'Anomalies sync',
    user: 'assistante.peda.recette@lanem.test',
  },
  {
    name: 'paper',
    path: '/app-emela/attendance-paper',
    heading: 'Présences papier',
    user: 'enseignant.recette@lanem.test',
  },
];

test.beforeAll(() => {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
});

for (const viewportCase of viewports) {
  for (const route of routes) {
    test(`${viewportCase.name} ${route.name}`, async ({ browser, baseURL }) => {
      const storageState = await loginAndGetStorageState(baseURL, route.user);
      const context = await browser.newContext({
        baseURL,
        storageState,
        viewport: viewportCase.viewport,
      });
      const page = await context.newPage();
      const browserErrors = [];

      page.on('console', (message) => {
        if (message.type() === 'error') {
          browserErrors.push(message.text());
        }
      });
      page.on('pageerror', (error) => {
        browserErrors.push(error.message);
      });

      await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      await closeOnboardingIfPresent(page);
      await page.waitForLoadState('networkidle');

      await expect(
        page.locator('main').getByRole('heading', { name: route.heading }).first()
      ).toBeVisible();
      await expect(page.getByText(/indisponible|indisponibles/i)).toHaveCount(0);

      const layout = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        mainCount: document.querySelectorAll('main').length,
        textLength: document.body.innerText.trim().length,
      }));
      expect(layout.mainCount).toBeGreaterThan(0);
      expect(layout.textLength).toBeGreaterThan(20);
      expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 4);
      expect(browserErrors).toEqual([]);

      await page.screenshot({
        path: path.join(ARTIFACT_DIR, `${viewportCase.name}-${route.name}.png`),
        fullPage: true,
      });
      await context.close();
    });
  }
}

async function loginAndGetStorageState(baseURL, user) {
  const api = await request.newContext({ baseURL });
  const response = await api.post('/api/method/login', {
    form: {
      usr: user,
      pwd: PASSWORD,
    },
  });
  expect(response.ok(), `${user} login`).toBeTruthy();
  const storageState = await api.storageState();
  await api.dispose();
  return storageState;
}

async function closeOnboardingIfPresent(page) {
  const closeButton = page.getByLabel('Fermer').first();
  try {
    if (await closeButton.isVisible({ timeout: 1_000 })) {
      await closeButton.click();
    }
  } catch {
    // No onboarding modal on this account/session.
  }
}
