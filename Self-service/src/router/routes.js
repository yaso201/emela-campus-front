// Self-service/src/router/routes.js — la table des routes de l'espace et LA garde de profil.
//
// MANDAT-14, P8 (VERDICT-MANDAT-14-PC1 §7) : une seule source de droits. Le routeur
// (`router/index.js`) et les menus (`components/layout/navItems.js`) lisent tous deux
// `routeAdmits` : une entrée de menu ne peut plus offrir une route que la garde refuse.
// Ce module n'importe ni Vue ni le store, pour qu'un test Node le charge tel quel
// (`tests/navigation-contracts.mjs`) ; les composants ne sont chargés qu'à la navigation.

/** Les profils que rend `portal_app.api.portal_access.get_my_profile`. */
export const PROFILES = ['student', 'instructor', 'director', 'candidate', 'generic', 'employee'];

export const routes = [
  {
    path: '/',
    name: 'cockpit',
    component: () => import('@/pages/CockpitPage.vue'),
    meta: { label: 'Accueil', icon: 'home' },
  },
  {
    path: '/planning',
    name: 'planning',
    component: () => import('@/pages/PlanningPage.vue'),
    meta: { label: 'Planning', icon: 'calendar' },
  },
  {
    path: '/results',
    name: 'results',
    component: () => import('@/pages/ResultsPage.vue'),
    meta: { label: 'Résultats', icon: 'chart', requiresProfile: ['student'] },
  },
  {
    path: '/evals',
    name: 'evals',
    component: () => import('@/pages/EvalsPage.vue'),
    meta: { label: 'Évaluations', icon: 'star', requiresProfile: ['student'] },
  },
  {
    path: '/documents',
    name: 'documents',
    component: () => import('@/pages/DocumentsPage.vue'),
    meta: { label: 'Documents', icon: 'file-text', requiresProfile: ['student'] },
  },
  {
    path: '/notifications',
    name: 'notifications',
    component: () => import('@/pages/NotificationsPage.vue'),
    meta: { label: 'Notifications', icon: 'bell' },
  },
  {
    path: '/support',
    name: 'support',
    component: () => import('@/pages/SupportRequestPage.vue'),
    meta: { label: 'Contacter un service', icon: 'help' },
  },
  {
    path: '/support/:id',
    name: 'support-detail',
    component: () => import('@/pages/SupportDetailPage.vue'),
    meta: { label: 'Détail demande', icon: 'help' },
  },
  {
    path: '/internship',
    name: 'internship',
    component: () => import('@/pages/InternshipPage.vue'),
    meta: { label: 'Stage', icon: 'briefcase', requiresProfile: ['student'] },
  },
  {
    path: '/insights',
    name: 'insights',
    component: () => import('@/pages/InsightsPage.vue'),
    meta: { label: 'Pilotage', icon: 'bar-chart', requiresProfile: ['director'] },
  },
  {
    path: '/attendance-paper',
    name: 'attendance-paper',
    component: () => import('@/pages/AttendancePaperPage.vue'),
    meta: { label: 'Présences papier', icon: 'file-text', requiresProfile: ['instructor', 'director', 'generic', 'employee'] },
  },
  {
    path: '/attendance-kpis',
    name: 'attendance-kpis',
    component: () => import('@/pages/AttendanceKpiPage.vue'),
    meta: { label: 'KPI présences', icon: 'bar-chart', requiresProfile: ['director'] },
  },
  {
    path: '/attendance-corrections',
    name: 'attendance-corrections',
    component: () => import('@/pages/AttendanceCorrectionsPage.vue'),
    meta: { label: 'Corrections attendance', icon: 'file-text', requiresProfile: ['student', 'instructor', 'director', 'generic', 'employee'] },
  },
  {
    path: '/attendance-leaves',
    name: 'attendance-leaves',
    component: () => import('@/pages/AttendanceLeavesPage.vue'),
    meta: { label: 'Leaves attendance', icon: 'file-text', requiresProfile: ['student', 'director', 'generic', 'employee'] },
  },
  {
    path: '/attendance-antifraud',
    name: 'attendance-antifraud',
    component: () => import('@/pages/AttendanceAntifraudPage.vue'),
    meta: { label: 'Revue antifraude', icon: 'shield-alert', requiresProfile: ['director', 'generic', 'employee'] },
  },
  {
    path: '/attendance-sync-anomalies',
    name: 'attendance-sync-anomalies',
    component: () => import('@/pages/AttendanceSyncAnomaliesPage.vue'),
    meta: { label: 'Anomalies sync', icon: 'refresh-cw', requiresProfile: ['director', 'generic', 'employee'] },
  },
  {
    path: '/attendance-pdfs',
    name: 'attendance-pdfs',
    component: () => import('@/pages/AttendancePdfPage.vue'),
    meta: { label: 'PDF attendance', icon: 'file-text', requiresProfile: ['student', 'instructor', 'director', 'generic', 'employee'] },
  },
  {
    path: '/attendance-compliance',
    name: 'attendance-compliance',
    component: () => import('@/pages/AttendanceCompliancePage.vue'),
    meta: { label: 'Conformité attendance', icon: 'shield-check', requiresProfile: ['director', 'generic', 'employee'] },
  },
  {
    path: '/attendance-observability',
    name: 'attendance-observability',
    component: () => import('@/pages/AttendanceObservabilityPage.vue'),
    meta: { label: 'Santé attendance', icon: 'activity', requiresProfile: ['director', 'generic', 'employee'] },
  },
  // Routes enseignant — Zone A (lecture) + Zone B (écriture)
  {
    path: '/planning/search',
    name: 'planning-search',
    component: () => import('@/pages/PlanningInstructorPage.vue'),
    meta: { label: 'Planning collègues', icon: 'calendar', requiresProfile: ['instructor', 'director'] },
  },
  {
    path: '/students/:id',
    name: 'student-dossier',
    component: () => import('@/pages/DossierEtudiantPage.vue'),
    meta: { label: 'Dossier étudiant', requiresProfile: ['instructor', 'director'] },
  },
  {
    path: '/modules/:course/stats',
    name: 'module-stats',
    component: () => import('@/pages/StatistiquesPage.vue'),
    meta: { label: 'Statistiques', requiresProfile: ['instructor'] },
  },
  {
    path: '/hours',
    name: 'instructor-hours',
    component: () => import('@/pages/HeuresPage.vue'),
    meta: { label: 'Mes heures', requiresProfile: ['instructor'] },
  },
  {
    path: '/modules/:course/submit',
    name: 'grade-submission',
    component: () => import('@/pages/GradeSubmissionPage.vue'),
    meta: { label: 'Soumettre les notes', requiresProfile: ['instructor'] },
  },
  // UX-AUTH : Page changement de mot de passe
  {
    path: '/account/password',
    name: 'change-password',
    component: () => import('@/pages/ChangePasswordPage.vue'),
    meta: { label: 'Modifier mon mot de passe' },
  },
  // UX-PROFIL : Pages compte et préférences
  {
    path: '/account',
    name: 'account',
    component: () => import('@/pages/AccountPage.vue'),
    meta: { label: 'Mon compte' },
  },
  {
    path: '/account/preferences',
    name: 'preferences',
    component: () => import('@/pages/PreferencesPage.vue'),
    meta: { label: 'Préférences' },
  },
  {
    path: '/account/security',
    name: 'account-security',
    component: () => import('@/pages/TeacherPinForm.vue'),
    meta: { label: 'PIN enseignant', requiresProfile: ['instructor'] },
  },
  {
    path: '/account/leave-requests',
    name: 'academic-leave-requests',
    component: () => import('@/pages/AcademicLeaveRequestsPage.vue'),
    meta: { label: 'Congé académique', icon: 'file-text', requiresProfile: ['student'] },
  },
  // Route catch-all — redirection vers cockpit (C-004)
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'cockpit' },
  },
];

/**
 * LA garde de profil (P8) : une route sans `requiresProfile` admet tout profil connecté ;
 * sinon, seulement les profils listés. Le routeur l'applique à la navigation, les menus au rendu.
 */
export function routeAdmits(route, profile) {
  const required = route?.meta?.requiresProfile;
  return !required || required.includes(profile);
}

/** La route d'un chemin STATIQUE (sans paramètre), tel qu'un menu le déclare ; `null` si aucune. */
export function findStaticRoute(path) {
  return routes.find((r) => r.path === path && !r.redirect) || null;
}
