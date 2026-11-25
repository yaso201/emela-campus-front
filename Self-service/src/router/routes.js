// Self-service/src/router/routes.js — la table des routes de l'espace et LA garde de profil.
//
// MANDAT-14, P8 (VERDICT-MANDAT-14-PC1 §7) : une seule source de droits. Le routeur
// (`router/index.js`) et les menus (`components/layout/navItems.js`) lisent tous deux
// `routeAdmits` : une entrée de menu ne peut plus offrir une route que la garde refuse.
// Ce module n'importe ni Vue ni le store, pour qu'un test Node le charge tel quel
// (`tests/navigation-contracts.mjs`) ; les composants ne sont chargés qu'à la navigation.

/** Les profils que rend `portal_app.api.portal_access.get_my_profile`. DEC-366 (MANDAT-14, X8, E-M11) : `dossier`, le
 * profil de NAVIGATION de l'étudiant à accès réduit (profil générique du serveur + facette « dossier ») ; la garde ne
 * l'admet que sur Accueil, Mes démarches (retour, démission, abandon, discipline), Documents, Notifications, Mon
 * compte, Support — les routes sans garde de profil sont toutes de cette liste. */
export const PROFILES = ['student', 'dossier', 'instructor', 'director', 'candidate', 'generic', 'employee'];

export const routes = [
  {
    path: '/',
    name: 'cockpit',
    component: () => import('@/pages/CockpitPage.vue'),
    meta: { label: 'Accueil', icon: 'home' },
  },
  // Q19 (VERDICT-MANDAT-14-PC1B) : le directeur suit les enseignants et les étudiants dans la gestion ; l'espace
  // ne lui offre ni planning, ni planning des collègues, ni dossier étudiant (P8 : route admise = chemin de menu).
  {
    path: '/planning',
    name: 'planning',
    component: () => import('@/pages/PlanningPage.vue'),
    meta: { label: 'Planning', icon: 'calendar', requiresProfile: ['student', 'instructor'] },
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
    meta: { label: 'Documents', icon: 'file-text', requiresProfile: ['student', 'dossier'] },
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
    meta: { label: 'Indicateurs de présence', icon: 'bar-chart', requiresProfile: ['director'] },
  },
  {
    path: '/attendance-corrections',
    name: 'attendance-corrections',
    component: () => import('@/pages/AttendanceCorrectionsPage.vue'),
    // P16 (PC1B) : les libellés en français.
    meta: { label: 'Corrections de présence', icon: 'file-text', requiresProfile: ['student', 'instructor', 'director', 'generic', 'employee'] },
  },
  {
    path: '/attendance-leaves',
    name: 'attendance-leaves',
    component: () => import('@/pages/AttendanceLeavesPage.vue'),
    meta: { label: 'Absences justifiées', icon: 'file-text', requiresProfile: ['student', 'director', 'generic', 'employee'] },
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
    meta: { label: 'Anomalies de synchronisation', icon: 'refresh-cw', requiresProfile: ['director', 'generic', 'employee'] },
  },
  {
    path: '/attendance-pdfs',
    name: 'attendance-pdfs',
    component: () => import('@/pages/AttendancePdfPage.vue'),
    meta: { label: 'Feuilles de présence (PDF)', icon: 'file-text', requiresProfile: ['student', 'instructor', 'director', 'generic', 'employee'] },
  },
  {
    path: '/attendance-compliance',
    name: 'attendance-compliance',
    component: () => import('@/pages/AttendanceCompliancePage.vue'),
    meta: { label: 'Conformité des présences', icon: 'shield-check', requiresProfile: ['director', 'generic', 'employee'] },
  },
  {
    path: '/attendance-observability',
    name: 'attendance-observability',
    component: () => import('@/pages/AttendanceObservabilityPage.vue'),
    meta: { label: 'Santé des présences', icon: 'activity', requiresProfile: ['director', 'generic', 'employee'] },
  },
  // Routes enseignant — Zone A (lecture) + Zone B (écriture). Q19 : l'enseignant seul.
  {
    path: '/planning/search',
    name: 'planning-search',
    component: () => import('@/pages/PlanningInstructorPage.vue'),
    meta: { label: 'Planning des collègues', icon: 'calendar', requiresProfile: ['instructor'], navParent: '/planning' },
  },
  {
    path: '/students/:id',
    name: 'student-dossier',
    component: () => import('@/pages/DossierEtudiantPage.vue'),
    meta: { label: 'Dossier étudiant', requiresProfile: ['instructor'], navParent: '/modules' },
  },
  // MANDAT-14 (E-M9, P7) : la liste des modules de l'enseignant, chemin permanent vers les notes et les statistiques.
  {
    path: '/modules',
    name: 'my-modules',
    component: () => import('@/pages/MesModulesPage.vue'),
    meta: { label: 'Mes modules', requiresProfile: ['instructor'] },
  },
  // MANDAT-14 (E-M10, P26 ; PC1C) : le module de l'enseignant — son planning (tous groupes) et ses enseignants.
  // P27 : la barre du haut porte le nom du module (la page le pose, `usePageTitle`) ; « Module » n'est qu'un repli.
  {
    path: '/modules/:course',
    name: 'my-module',
    component: () => import('@/pages/ModulePage.vue'),
    meta: { label: 'Module', requiresProfile: ['instructor'], navParent: '/modules' },
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
  // P23 (PC1B) : la page Congé est une démarche — elle allume « Mes démarches », pas « Mon compte ».
  {
    path: '/account/leave-requests',
    name: 'academic-leave-requests',
    component: () => import('@/pages/AcademicLeaveRequestsPage.vue'),
    meta: { label: 'Congé académique', icon: 'file-text', requiresProfile: ['student'], navParent: '/demarches' },
  },
  // MANDAT-14 (E-M1 à E-M6, Q20) : les démarches de l'étudiant, une page par procédure.
  {
    path: '/demarches',
    name: 'demarches',
    component: () => import('@/pages/DemarchesPage.vue'),
    meta: { label: 'Mes démarches', requiresProfile: ['student', 'dossier'] },
  },
  {
    path: '/demarches/retour-conge',
    name: 'demarche-retour-conge',
    component: () => import('@/pages/RetourCongePage.vue'),
    meta: { label: 'Retour de congé', requiresProfile: ['student', 'dossier'] },
  },
  {
    path: '/demarches/reorientation',
    name: 'demarche-reorientation',
    component: () => import('@/pages/ReorientationPage.vue'),
    meta: { label: 'Réorientation', requiresProfile: ['student'] },
  },
  {
    path: '/demarches/demission',
    name: 'demarche-demission',
    component: () => import('@/pages/DemissionPage.vue'),
    meta: { label: 'Démission', requiresProfile: ['student', 'dossier'] },
  },
  {
    path: '/demarches/abandon',
    name: 'demarche-abandon',
    component: () => import('@/pages/AbandonPage.vue'),
    meta: { label: 'Abandon d’études', requiresProfile: ['student', 'dossier'] },
  },
  {
    path: '/demarches/discipline',
    name: 'demarche-discipline',
    component: () => import('@/pages/DisciplinePage.vue'),
    meta: { label: 'Discipline', requiresProfile: ['student', 'dossier'] },
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

/** La route d'un chemin réel, paramètres compris (`/modules/X/submit` → `/modules/:course/submit`) ; `null` si aucune. */
export function matchRoute(path) {
  const segments = String(path).split('?')[0].split('/').filter(Boolean);
  return routes.find((r) => {
    if (r.redirect) return false;
    const pattern = r.path.split('/').filter(Boolean);
    return pattern.length === segments.length
      && pattern.every((p, i) => p.startsWith(':') || p === segments[i]);
  }) || null;
}
