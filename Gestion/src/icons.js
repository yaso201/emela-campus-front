import { h } from 'vue';

/**
 * Icônes de navigation — composants fonctionnels, aucun fichier distant, aucune
 * police d'icônes : la contrainte « aucun appel réseau externe » vaut aussi ici.
 */
const svg = (paths, stroke = 1.7) => (props) =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': stroke,
             'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', ...props },
    paths.map((d) => h('path', { d })));

export const IconInbox = svg(['M3 13h5l2 3h4l2-3h5', 'M4 5h16l1 8v6H3v-6z']);
export const IconTree = svg(['M4 4v14h5M9 11H4', 'M13 2h8v5h-8z', 'M13 9h8v5h-8z', 'M13 16h8v5h-8z']);
export const IconShare = svg(['M12 4v6M12 10 6 14v6M12 10l6 4v6']);
export const IconUsers = svg(['M3 20v-1.5A4.5 4.5 0 0 1 7.5 14h3A4.5 4.5 0 0 1 15 18.5V20', 'M9 4.8a3.2 3.2 0 1 1 0 6.4 3.2 3.2 0 0 1 0-6.4', 'M16 5.5a3 3 0 0 1 0 5.6M18 20v-1.5a4.5 4.5 0 0 0-2.2-3.9']);
export const IconCalendar = svg(['M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z', 'M3 10h18M8 3v4M16 3v4']);
export const IconGrade = svg(['M4 4h16v16H4z', 'M8 12l2.5 2.5L16 9']);
export const IconShield = svg(['M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6z']);
export const IconLife = svg(['M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18', 'M12 8.4a3.6 3.6 0 1 1 0 7.2 3.6 3.6 0 0 1 0-7.2', 'm5.7 5.7 3.8 3.8M14.5 14.5l3.8 3.8M18.3 5.7l-3.8 3.8M9.5 14.5l-3.8 3.8']);
export const IconDoc = svg(['M6 3h8l4 4v14H6z', 'M14 3v4h4M9 12h6M9 16h6']);
export const IconAward = svg(['M12 3.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11', 'M8.5 13.5 7 22l5-2.5L17 22l-1.5-8.5']);
export const IconLock = svg(['M6 10h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z', 'M8 10V7.5a4 4 0 0 1 8 0V10']);
export const IconCog = svg(['M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6', 'M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.5 1.5M16.9 16.9l1.5 1.5M18.4 5.6l-1.5 1.5M7.1 16.9l-1.5 1.5']);
