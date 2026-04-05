// frontend/src/router/index.js
// Vue Router 4 — history mode, base /mela, 5 routes lazy-loaded.
// Frappe route rule (hooks.py) : /mela/<path:app_path> → mela.html (SPA entry)
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
    meta: { label: 'Résultats', icon: 'chart' },
  },
  {
    path: '/evals',
    name: 'evals',
    component: () => import('@/pages/EvalsPage.vue'),
    meta: { label: 'Évaluations', icon: 'star' },
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
    path: '/insights',
    name: 'insights',
    component: () => import('@/pages/InsightsPage.vue'),
    meta: { label: 'Pilotage', icon: 'bar-chart', requiresProfile: ['director'] },
  },
];

const router = createRouter({
  history: createWebHistory('/mela'),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    return { top: 0 };
  },
});

// Guard pour les routes protégées par profil (ex: /insights réservé aux directors)
router.beforeEach((to, from, next) => {
  const requiredProfiles = to.meta?.requiresProfile;
  if (!requiredProfiles) {
    return next();
  }

  const profile = useProfileStore();

  // Si profil pas encore chargé, laisser passer (la page gère le cas via v-if)
  if (profile.isLoading) {
    return next();
  }

  // Si guest → accueil
  if (profile.isGuest) {
    return next('/');
  }

  // Si profil non autorisé → accueil
  if (!requiredProfiles.includes(profile.profile)) {
    return next('/');
  }

  next();
});

export default router;
