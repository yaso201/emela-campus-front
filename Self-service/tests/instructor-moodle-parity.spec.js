// frontend/tests/instructor-moodle-parity.spec.js
// UI-INST-V1 — Tests parité Student/Instructor sur accès Moodle (DEC-079)
// Framework: Playwright (@playwright/test)
// Stratégie: login réel (storageState) + mock réseau (page.route) pour contrôler les données

import { test, expect, request } from '@playwright/test';

const PASSWORD = process.env.LANEM_TEST_PASSWORD || 'admin';
const STUDENT_USER = process.env.LANEM_TEST_STUDENT || 'Administrator';
const INSTRUCTOR_USER = process.env.LANEM_TEST_INSTRUCTOR || 'Administrator';

async function loginAndGetStorageState(baseURL, user) {
  const api = await request.newContext({ baseURL });
  const response = await api.post('/api/method/login', {
    form: { usr: user, pwd: PASSWORD },
  });
  expect(response.ok(), `${user} login`).toBeTruthy();
  const storageState = await api.storageState();
  await api.dispose();
  return storageState;
}

// --- Mock payloads ---

const MOODLE_SERVICE_PAYLOAD = {
  service_name: 'Mes cours en ligne',
  service_code: 'MOODLE_MY_COURSES',
  icon: 'graduation_cap',
  description: "Accès à l'espace d'apprentissage Moodle",
  target_url: '/app-emela/moodle-launch',
  external_target_url: 'https://moodle.lanem.bj/my/?portal_context=test',
  open_in_new_tab: true,
  user_type: 'Student',
  visible: true,
  launch_mode: 'portal_redirect',
};

const STUDENT_PROFILE = {
  user: 'etu@campus.lanem.bj',
  profile_type: 'student',
  profile: 'student',
  display_name: 'Amina Kodjovi',
  student_id: 'ETU-2026-00042',
  student_applicant_id: null,
  instructor_id: null,
  employee_id: null,
  person_id: 'PERS-00001',
  academic_status: 'ACT',
  academic_level: 'LIS-L2',
  program: 'LIS',
  application_status: null,
  can_access_desk: false,
  source: 'Student.email',
};

const INSTRUCTOR_PROFILE = {
  user: 'prof@campus.lanem.bj',
  profile_type: 'instructor',
  profile: 'instructor',
  display_name: 'Kofi Enseignant',
  student_id: null,
  student_applicant_id: null,
  instructor_id: 'EDU-INS-2026-00001',
  employee_id: 'EMP-00003',
  person_id: 'PERS-00003',
  academic_status: null,
  academic_level: null,
  program: null,
  application_status: null,
  can_access_desk: false,
  source: 'Employee.user_id->Instructor.employee',
};

// --- Helpers ---

async function mockProfile(page, profile) {
  await page.route('**/api/method/portal_app.api.portal_access.get_my_profile', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: profile }),
    })
  );
}

async function mockPortalServices(page, services) {
  await page.route('**/api/method/portal_app.api.cockpit.get_my_portal_services', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: { services } }),
    })
  );
}

async function mockMoodleService(page, payload) {
  await page.route('**/api/method/portal_app.api.portal_access.get_moodle_service', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: payload }),
    })
  );
}

/** Mock all cockpit block endpoints to avoid 404s in test runner. */
async function mockCockpitBlocks(page) {
  await page.route('**/api/method/portal_app.api.cockpit.get_cockpit_block', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: { status: 'ok', block: 'mock', payload: {} } }),
    })
  );
  await page.route('**/api/method/portal_app.api.notifications.*', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: [] }),
    })
  );
  await page.route('**/api/method/portal_app.api.planning.*', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: [] }),
    })
  );
  // Mandatory documents check (DEC-098)
  await page.route('**/api/method/portal_app.api.mandatory_documents.*', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: null }),
    })
  );
}

// =================================================================
// T1: Tuile Moodle visible cockpit Student — compte actif
// =================================================================

test('T1 — Tuile Moodle visible cockpit Student avec compte actif', async ({ browser, baseURL }) => {
  const storageState = await loginAndGetStorageState(baseURL, STUDENT_USER);
  const context = await browser.newContext({ baseURL, storageState });
  const page = await context.newPage();

  await mockProfile(page, STUDENT_PROFILE);
  await mockPortalServices(page, [MOODLE_SERVICE_PAYLOAD]);
  await mockCockpitBlocks(page);

  await page.goto('/app-emela/');
  await page.waitForLoadState('networkidle');

  const moodleTile = page.locator('text=Mes cours en ligne').first();
  await expect(moodleTile).toBeVisible();
  await context.close();
});

// =================================================================
// T2: Tuile Moodle visible cockpit Instructor — compte actif (parité)
// =================================================================

test('T2 — Tuile Moodle visible cockpit Instructor avec compte actif (parité)', async ({ browser, baseURL }) => {
  const storageState = await loginAndGetStorageState(baseURL, INSTRUCTOR_USER);
  const context = await browser.newContext({ baseURL, storageState });
  const page = await context.newPage();

  const instructorMoodle = { ...MOODLE_SERVICE_PAYLOAD, user_type: 'Instructor' };
  await mockProfile(page, INSTRUCTOR_PROFILE);
  await mockPortalServices(page, [instructorMoodle]);
  await mockCockpitBlocks(page);

  await page.goto('/app-emela/');
  await page.waitForLoadState('networkidle');

  const moodleTile = page.locator('text=Mes cours en ligne').first();
  await expect(moodleTile).toBeVisible();
  await context.close();
});

// =================================================================
// T3: Tuile masquée cockpit Student — compte suspendu
// =================================================================

test('T3 — Tuile masquée cockpit Student — compte suspendu', async ({ browser, baseURL }) => {
  const storageState = await loginAndGetStorageState(baseURL, STUDENT_USER);
  const context = await browser.newContext({ baseURL, storageState });
  const page = await context.newPage();

  await mockProfile(page, STUDENT_PROFILE);
  await mockPortalServices(page, []);
  await mockCockpitBlocks(page);

  await page.goto('/app-emela/');
  await page.waitForLoadState('networkidle');

  const moodleTile = page.locator('text=Mes cours en ligne');
  await expect(moodleTile).toHaveCount(0);
  await context.close();
});

// =================================================================
// T4: Tuile masquée cockpit Instructor — compte absent
// =================================================================

test('T4 — Tuile masquée cockpit Instructor — compte absent', async ({ browser, baseURL }) => {
  const storageState = await loginAndGetStorageState(baseURL, INSTRUCTOR_USER);
  const context = await browser.newContext({ baseURL, storageState });
  const page = await context.newPage();

  await mockProfile(page, INSTRUCTOR_PROFILE);
  await mockPortalServices(page, []);
  await mockCockpitBlocks(page);

  await page.goto('/app-emela/');
  await page.waitForLoadState('networkidle');

  const moodleTile = page.locator('text=Mes cours en ligne');
  await expect(moodleTile).toHaveCount(0);
  await context.close();
});

// =================================================================
// T5: Bloc Comptes liés cliquable AccountPage Student
// =================================================================

test('T5 — Bloc Comptes liés cliquable AccountPage Student', async ({ browser, baseURL }) => {
  const storageState = await loginAndGetStorageState(baseURL, STUDENT_USER);
  const context = await browser.newContext({ baseURL, storageState });
  const page = await context.newPage();

  await mockProfile(page, STUDENT_PROFILE);
  await mockMoodleService(page, MOODLE_SERVICE_PAYLOAD);

  await page.goto('/app-emela/account');
  await page.waitForLoadState('networkidle');

  const moodleLink = page.locator('a[aria-label*="Moodle"]').first();
  await expect(moodleLink).toBeVisible();
  await expect(moodleLink).toHaveAttribute('href', '/app-emela/moodle-launch');
  await expect(moodleLink).toHaveAttribute('target', '_blank');
  await expect(moodleLink).toHaveAttribute('rel', 'noopener noreferrer');
  await context.close();
});

// =================================================================
// T6: Bloc Comptes liés cliquable AccountPage Instructor (parité)
// =================================================================

test('T6 — Bloc Comptes liés cliquable AccountPage Instructor (parité)', async ({ browser, baseURL }) => {
  const storageState = await loginAndGetStorageState(baseURL, INSTRUCTOR_USER);
  const context = await browser.newContext({ baseURL, storageState });
  const page = await context.newPage();

  const instructorMoodle = { ...MOODLE_SERVICE_PAYLOAD, user_type: 'Instructor' };
  await mockProfile(page, INSTRUCTOR_PROFILE);
  await mockMoodleService(page, instructorMoodle);

  await page.goto('/app-emela/account');
  await page.waitForLoadState('networkidle');

  const moodleLink = page.locator('a[aria-label*="Moodle"]').first();
  await expect(moodleLink).toBeVisible();
  await expect(moodleLink).toHaveAttribute('href', '/app-emela/moodle-launch');
  await expect(moodleLink).toHaveAttribute('target', '_blank');
  await context.close();
});

// =================================================================
// T7: Bloc Comptes liés masqué AccountPage — compte absent
// =================================================================

test('T7 — Bloc Comptes liés masqué AccountPage Instructor — compte absent', async ({ browser, baseURL }) => {
  const storageState = await loginAndGetStorageState(baseURL, INSTRUCTOR_USER);
  const context = await browser.newContext({ baseURL, storageState });
  const page = await context.newPage();

  await mockProfile(page, INSTRUCTOR_PROFILE);
  await mockMoodleService(page, null);

  await page.goto('/app-emela/account');
  await page.waitForLoadState('networkidle');

  const moodleLink = page.locator('a[aria-label*="Moodle"]');
  await expect(moodleLink).toHaveCount(0);
  await context.close();
});

// =================================================================
// T8: Bloc Comptes liés masqué AccountPage — suspendu
// =================================================================

test('T8 — Bloc Comptes liés masqué AccountPage Student — suspendu', async ({ browser, baseURL }) => {
  const storageState = await loginAndGetStorageState(baseURL, STUDENT_USER);
  const context = await browser.newContext({ baseURL, storageState });
  const page = await context.newPage();

  await mockProfile(page, STUDENT_PROFILE);
  await mockMoodleService(page, null);

  await page.goto('/app-emela/account');
  await page.waitForLoadState('networkidle');

  const moodleLink = page.locator('a[aria-label*="Moodle"]');
  await expect(moodleLink).toHaveCount(0);
  await context.close();
});
