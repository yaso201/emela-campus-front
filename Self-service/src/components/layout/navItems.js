// Self-service/src/components/layout/navItems.js — les entrées des deux menus de l'espace.
//
// MANDAT-14, P8 (VERDICT-MANDAT-14-PC1 §7) : UNE SEULE SOURCE DE DROITS. Une entrée ne
// s'affiche qu'aux profils que la garde de sa route admet (`routeAdmits`, `router/routes.js`).
// `profiles` ne peut que RESTREINDRE (choix de présentation : le planning n'est au menu que
// de l'étudiant et de l'enseignant), jamais élargir. `tests/navigation-contracts.mjs` le prouve
// pour chaque profil, et refuse une liste `profiles` qui déborde de la garde.
import { findStaticRoute, routeAdmits } from '../../router/routes.js';

const ALL = ['student', 'instructor', 'director', 'candidate', 'generic', 'employee'];

/** Menu latéral (bureau) et menu en surimpression (téléphone). */
export const SIDE_NAV_ITEMS = [
  { to: '/', label: 'Accueil', icon: 'home', profiles: ALL },
  { to: '/planning', label: 'Planning', icon: 'calendar', profiles: ['student', 'instructor'] },
  { to: '/results', label: 'Résultats', icon: 'chart', profiles: ['student'] },
  { to: '/evals', label: 'Évaluations', icon: 'star', profiles: ['student'] },
  { to: '/documents', label: 'Documents', icon: 'file-text', profiles: ['student'] },
  // MANDAT-14 (E-M1, Q20) : « Mes démarches » remplace « Congé académique » ; le congé y a sa carte.
  { to: '/demarches', label: 'Mes démarches', icon: 'file-text', profiles: ['student'] },
  { to: '/internship', label: 'Stage', icon: 'briefcase', profiles: ['student'] },
  // MANDAT-14 (E-M9, P7) : l'espace de l'enseignant a ses entrées — ses modules (notes, statistiques), ses heures.
  { to: '/modules', label: 'Mes modules', icon: 'file-text', profiles: ['instructor'] },
  { to: '/hours', label: 'Mes heures', icon: 'calendar', profiles: ['instructor'] },
  { to: '/insights', label: 'Pilotage', icon: 'bar-chart', profiles: ['director'] },
  { to: '/attendance-paper', label: 'Présences papier', icon: 'file-text', profiles: ['instructor', 'director', 'generic', 'employee'] },
  // P8 : la garde n'admet que le directeur ; « generic » et « employee » étaient renvoyés à l'accueil sans un mot.
  { to: '/attendance-kpis', label: 'Indicateurs de présence', icon: 'bar-chart', profiles: ['director'] },
  // P16 (PC1B) : les libellés en français (« Leaves », « PDF attendance » ne s'affichent plus).
  { to: '/attendance-corrections', label: 'Corrections de présence', icon: 'file-text', profiles: ['student', 'instructor', 'director', 'generic', 'employee'] },
  { to: '/attendance-leaves', label: 'Absences justifiées', icon: 'file-text', profiles: ['student', 'director', 'generic', 'employee'] },
  { to: '/attendance-antifraud', label: 'Revue antifraude', icon: 'shield-alert', profiles: ['director', 'generic', 'employee'] },
  { to: '/attendance-sync-anomalies', label: 'Anomalies de synchronisation', icon: 'refresh-cw', profiles: ['director', 'generic', 'employee'] },
  { to: '/attendance-pdfs', label: 'Feuilles de présence', icon: 'file-text', profiles: ['student', 'instructor', 'director', 'generic', 'employee'] },
  { to: '/attendance-compliance', label: 'Conformité des présences', icon: 'shield-check', profiles: ['director', 'generic', 'employee'] },
  { to: '/attendance-observability', label: 'Santé des présences', icon: 'activity', profiles: ['director', 'generic', 'employee'] },
  { to: '/support', label: 'Support', icon: 'help-circle', profiles: ALL },
  { to: '/notifications', label: 'Notifications', icon: 'bell', profiles: ALL },
  { to: '/account', label: 'Mon compte', icon: 'user', profiles: ALL },
];

/** Barre basse (téléphone), cinq entrées au plus. */
export const BOTTOM_NAV_ITEMS = [
  { to: '/', label: 'Accueil', icon: 'home', profiles: ALL },
  { to: '/planning', label: 'Planning', icon: 'calendar', profiles: ['student', 'instructor'] },
  { to: '/results', label: 'Résultats', icon: 'chart', profiles: ['student'] },
  { to: '/support', label: 'Aide', icon: 'help-circle', profiles: ALL },
  { to: '/notifications', label: 'Notifs', icon: 'bell', profiles: ALL },
];

export const BOTTOM_NAV_MAX = 5;

/**
 * L'entrée allumée (P23, VERDICT-MANDAT-14-PC1B) : une route peut nommer l'entrée dont elle relève
 * (`meta.navParent` — la page Congé relève de « Mes démarches », pas de « Mon compte ») ; sinon, l'entrée
 * dont le chemin est le même ou un préfixe de segment (`/demarches/reorientation` → « Mes démarches »).
 * Une seule règle pour les deux menus.
 */
export function isNavActive(item, route) {
  const path = route?.path || '';
  if (item.to === '/') return path === '/';
  const parent = route?.meta?.navParent;
  if (parent) return item.to === parent;
  return path === item.to || path.startsWith(`${item.to}/`);
}

/**
 * Les entrées d'un menu pour un profil : celles qui le listent ET dont la route l'admet.
 * Une entrée dont le chemin ne mène à aucune route n'est jamais rendue.
 */
export function navItemsFor(items, profile, { canAccessDesk = false } = {}) {
  return items.filter((item) => {
    const route = findStaticRoute(item.to);
    return Boolean(route)
      && item.profiles.includes(profile)
      && routeAdmits(route, profile)
      && (!item.requiresDesk || canAccessDesk);
  });
}
