// frontend/src/router/index.js
// Vue Router 4 — history mode, base /app-emela, routes lazy-loaded.
// Frappe route rule (hooks.py) : /app-emela/<path:app_path> → app_emela.html
import { createRouter, createWebHistory } from 'vue-router';
import { useProfileStore } from '@/stores/profile';

const routes = [
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
    meta: { label: 'Stage', icon: 'briefcase' },
  },
  {
    path: '/insights',
    name: 'insights',
    component: () => import('@/pages/InsightsPage.vue'),
    meta: { label: 'Pilotage', icon: 'bar-chart', requiresProfile: ['director'] },
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
  // Route catch-all — redirection vers cockpit (C-004)
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'cockpit' },
  },
];

const router = createRouter({
  history: createWebHistory('/app-emela'),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    return { top: 0 };
  },
});

// Guard pour les routes protégées par profil (ex: /insights réservé aux directors)
// La garde serveur (app_emela.py) empêche les guests d'atteindre la SPA.
// Ce guard est une défense en profondeur pour les cas de session expirée.
router.beforeEach(async (to, from, next) => {
  const requiredProfiles = to.meta?.requiresProfile;
  if (!requiredProfiles) {
    return next();
  }

  const profile = useProfileStore();

  if (profile.status === 'idle') {
    await profile.fetchProfile();
  }

  // Guest dans la SPA privée — session expirée, rediriger vers login
  if (profile.isGuest) {
    window.location.href = '/emela/login?redirect-to=' + encodeURIComponent('/app-emela' + to.fullPath);
    return;
  }

  // Profil non autorisé pour cette route → cockpit
  if (!requiredProfiles.includes(profile.profile)) {
    return next('/');
  }

  next();
});

export default router;
