/**
 * Navigation déclarée — PAR OBJET, jamais par acteur (lot 1 §2 : le cumul de
 * rôles rend les modes intenables). Une seule déclaration : le routeur en
 * dérive ses routes, le châssis en dérive ses entrées. Aucune route en dur
 * dans une vue.
 *
 * `need` est la permission qui rend l'entrée VISIBLE. Absente, l'entrée n'est
 * pas rendue — jamais rendue puis grisée (règle 3).
 * hidden déclare une route SANS entrée de barre : un écran atteint par lien
 * depuis un autre écran doit quand même être déclaré ici, sinon le lien tombe
 * dans la redirection fourre-tout et l'utilisateur atterrit ailleurs sans un mot.
 * `grappe` dit à quelle livraison l'écran appartient : celles qui ne sont pas
 * encore produites le disent, plutôt que d'ouvrir une page vide.
 */
import {
  IconInbox, IconTree, IconShare, IconUsers, IconCalendar, IconGrade,
  IconShield, IconLife, IconDoc, IconAward, IconLock, IconCog,
} from './icons.js';

export const NAV = [
  {
    key: 'top',
    items: [
      { key: 'queue', label: 'À traiter', path: '/a-traiter', icon: IconInbox, view: 'WorkQueueView', grappe: 1, countKey: 'total' },
    ],
  },
  {
    key: 'domains',
    title: 'Domaines',
    items: [
      { key: 'structure', label: 'Structure', path: '/structure', icon: IconTree, view: 'StructureView', need: 'read:structure', grappe: 2 },
      { key: 'service', label: 'Répartition', path: '/repartition', icon: IconShare, view: 'RepartitionView', need: 'read:service', grappe: 3 },
      { key: 'service-validate', label: 'Valider les répartitions', path: '/repartition/validation', icon: IconShare, view: 'RepartitionValidationView', need: 'validate:service', grappe: 3 },
      // Le bilan porte SON SUJET dans l'URL : un bilan de charge sans enseignant
      // dans la route affiche fatalement quelqu'un d'autre, et le lien ressemble
      // à un succès. Segment facultatif — l'écran sans sujet le dit.
      { key: 'service-charge', label: 'Bilan de charge', path: '/repartition/charge/:teacher?', icon: IconShare, view: 'TeacherLoadView', need: 'read:service', grappe: 3, hidden: true },
      { key: 'service-signals', label: 'Signaux de répartition', path: '/repartition/signaux', icon: IconShare, view: 'ServiceSignalsView', need: 'read:service', grappe: 3, hidden: true },
      { key: 'service-progress', label: 'Prévu contre réalisé', path: '/repartition/realise', icon: IconShare, view: 'ServiceProgressView', need: 'read:service', grappe: 3, hidden: true },
      { key: 'groups', label: 'Groupes', path: '/groupes', icon: IconUsers, view: 'GroupsView', need: 'read:groups', grappe: 4 },
      { key: 'enrollment', label: 'Inscriptions', path: '/groupes/inscriptions', icon: IconUsers, view: 'EnrollmentView', need: 'read:groups', grappe: 4, hidden: true },
      { key: 'planning', label: 'Planning', path: '/planning', icon: IconCalendar, view: 'PlanningView', need: 'read:planning', grappe: 5 },
      { key: 'grades', label: 'Notes', path: '/notes', icon: IconGrade, view: 'GradeControlView', need: 'control:grades', grappe: 6 },
      { key: 'deliberation', label: 'Délibération', path: '/notes/deliberation', icon: IconGrade, view: 'DeliberationView', need: 'deliberate', grappe: 6 },
      { key: 'exams', label: 'Examens', path: '/planning/examens', icon: IconCalendar, view: 'ExamView', need: 'write:exams', grappe: 6, hidden: true },
      { key: 'dossiers', label: 'Dossiers', path: '/dossiers', icon: IconShield, view: 'DossiersView', need: 'read:dossiers', grappe: 7 },
      { key: 'awaiting-decider', label: 'En attente d’un autre décideur', path: '/dossiers/sans-decideur', icon: IconShield, view: 'AwaitingDeciderView', need: 'read:dossiers', grappe: 7, hidden: true },
      // Le conseil pédagogique porte QUATRE écrans, et un seul est dans la barre.
      // Les trois autres sont atteints par lien depuis lui — déclarés ici pour que
      // ces liens ne tombent pas dans la redirection fourre-tout.
      { key: 'council', label: 'Conseil pédagogique', path: '/conseil', icon: IconLife, view: 'CouncilCandidatesView', need: 'read:council', grappe: 8 },
      { key: 'council-session', label: 'Séance du conseil', path: '/conseil/seance', icon: IconLife, view: 'CouncilSessionView', need: 'read:council', grappe: 8, hidden: true },
      { key: 'council-preconisations', label: 'Préconisations', path: '/conseil/preconisations', icon: IconLife, view: 'CouncilRecommendationsView', need: 'read:council', grappe: 8, hidden: true },
      { key: 'council-absences', label: 'Seuils d’absence', path: '/conseil/absences', icon: IconLife, view: 'CouncilAbsenceView', need: 'read:council', grappe: 8, hidden: true },
      { key: 'documents', label: 'Documents', path: '/documents', icon: IconDoc, view: 'DocumentsView', need: 'emit:documents', grappe: 9 },
      { key: 'graduation', label: 'Diplomation', path: '/diplomation', icon: IconAward, view: 'GraduationView', need: 'read:graduation', grappe: 10 },
    ],
  },
  {
    key: 'bottom',
    items: [
      { key: 'closure', label: 'Clôture', path: '/cloture', icon: IconLock, view: 'ClosureView', need: 'close:year', grappe: 9 },
      { key: 'admin', label: 'Administration', path: '/administration', icon: IconCog, view: 'RolesView', need: 'grant_role', grappe: 11 },
      { key: 'atelier', label: 'Atelier des composants', path: '/atelier', icon: IconCog, view: 'AtelierView', grappe: 0 },
    ],
  },
];

/** À plat, pour le routeur. */
export const NAV_ITEMS = NAV.flatMap((g) => g.items);

/** Les quatre cibles de la barre inférieure mobile — jamais six comprimées. */
export const BOTTOM_KEYS = ['queue', 'planning', 'grades', 'dossiers'];
