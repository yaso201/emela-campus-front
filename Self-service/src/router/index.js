// frontend/src/router/index.js
// Vue Router 4 — history mode, base /app-emela, routes lazy-loaded.
// Frappe route rule (hooks.py) : /app-emela/<path:app_path> → app_emela.html
// MANDAT-14, P8 : la table des routes et la garde de profil vivent dans `./routes.js`,
// que les menus lisent aussi (une seule source de droits).
import { createRouter, createWebHistory } from 'vue-router';
import { useProfileStore } from '@/stores/profile';
import { routes, routeAdmits } from './routes.js';

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
  if (!to.meta?.requiresProfile) {
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
  if (!routeAdmits(to, profile.profile)) {
    return next('/');
  }

  next();
});

export default router;
