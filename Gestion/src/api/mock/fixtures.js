/**
 * Données simulées — formes du manifeste des appels, valeurs des maquettes des
 * lots 1 à 8. Aucune logique métier ici : le simulacre ne décide rien, il rend.
 *
 * ⚠️ F3-FORMES : les modules SERVICE et STRUCTURE rendent LA FORME SERVEUR —
 * celle des `return` réels de `service_allocation.py`, `structure.py` et
 * `unit_usage.py`. La forme que les ÉCRANS consomment est reconstruite par les
 * ADAPTATEURS (`src/api/service.js`, `src/api/structure.js`) : c'est la même
 * chaîne « serveur → adaptateur → écran » en simulacre et en branché — le
 * faux-en-branché/vert-en-simulacre ne peut plus naître d'une forme divergente.
 *
 * ⚠️ UN SEUL VOCABULAIRE DE PASTILLE. `WorkQueue` passe le `status` de chaque
 * objet DIRECTEMENT à `StatusPill` : une file qui emploierait son propre
 * vocabulaire (`warn`, `err`, `draft`) verrait toutes ses pastilles retomber en
 * gris neutre — le ton perdu, et la clé affichée telle quelle quand `statusLabel`
 * manque. Les clés sont donc celles de `StatusPill` : `brouillon`, `propose`,
 * `valide`, `incomplete`, `renvoyee`, `suspendue`… `statusLabel` reste la phrase.
 * Les fixtures serveur, elles, portent le vocabulaire SERVEUR (`Brouillon`,
 * `Proposé`, `Validé`) — la traduction en clé de pastille vit à l'adaptateur.
 */
import { PERMISSIONS, PERMISSION_SET } from '../../permissions.js';

/**
 * Les cinq clés que ce lecteur NE porte pas. C'est la seule information propre à
 * cette fixture — la liste des clés, elle, vit dans `permissions.js` et n'est pas
 * recopiée ici : deux listes du même ensemble divergeraient.
 *
 * Ces cinq-là sont refusées parce qu'un gestionnaire académique cumulant
 * Education Manager ne les porte pas : l'arbitrage d'un congé appartient au
 * Director, la décision d'appel et celle de diplomation à la Direction, la
 * clôture au Director, l'attribution de rôle à l'administration technique.
 *
 * ⚠️ Ce sont des chaînes libres, donc un piège : la version 02 du vocabulaire a
 * RENOMMÉ une clé (`arbitrate:dossiers` → `arbitrate:leave` + `decide:appeal`).
 * Si une version 03 renomme `close:year`, cette liste garderait la chaîne morte,
 * `!DENIED.has(k)` répondrait vrai pour la clé neuve, et le lecteur simulé
 * GAGNERAIT silencieusement un droit qu'il est censé ne pas avoir — l'entrée
 * « Clôture » apparaîtrait, sans erreur nulle part.
 *
 * D'où le contrôle ci-dessous, au CHARGEMENT du module : une chaîne morte fait
 * échouer l'application à l'import, là où elle est trouvable. Un trou de donnée
 * dérivée se ferme, il ne se surveille pas (règle 6).
 */
export const DENIED = new Set([
  'arbitrate:leave', 'decide:appeal', 'decide:graduation', 'close:year', 'grant_role',
]);

const DEAD_KEYS = [...DENIED].filter((k) => !PERMISSION_SET.has(k));
if (DEAD_KEYS.length) {
  throw new Error(
    'fixtures.js — clé(s) refusée(s) absente(s) du vocabulaire : ' + DEAD_KEYS.join(', ')
    + '. Le vocabulaire a changé sans que DENIED suive : le lecteur simulé gagnerait un droit.');
}

export const session = {
  person: { id: 'HR-0142', name: 'Kodjo Dossou', initials: 'KD', email: 'k.dossou@lanem.bj' },
  roles: ['Gestionnaire académique', 'Education Manager'],
  scope: { kind: 'nature', program: null, reason: null },
  spaces: { management: true, personal: true },
  /**
   * VOCABULAIRE-PERMISSIONS-02 — la liste des clés vit dans `permissions.js`,
   * avec son principe et les motifs de ses scissions. Cette matrice est
   * DÉRIVÉE : tout sauf `DENIED`, pour que les écrans produits soient
   * ATTEIGNABLES.
   *
   * Ce fichier décrit un lecteur possible, pas une politique de droits : la
   * matrice réelle vient du serveur, et ce sont les GARDES qui y font foi.
   *
   * FORMES (M2-AN-03) : la forme SERVEUR est une LISTE de clés
   * (`resolve_permissions` → `list[str]`) ; l'adaptateur `openSession` accepte
   * liste ET dict et normalise en dict pour `can()`. Le simulacre garde le DICT
   * — c'est la forme que le harnais d'audit éprouve (vocabulaire des clés) ;
   * l'adaptateur est prouvé en BRANCHÉ, où la liste serveur arrive vraiment.
   */
  permissions: Object.fromEntries(PERMISSIONS.map((k) => [k, !DENIED.has(k)])),
};

export const academicContext = {
  years: [
    { id: 'AY-2026', label: '2026-2027', current: true },
    { id: 'AY-2025', label: '2025-2026', current: false },
  ],
  terms: [
    { id: 'T-1', label: 'Semestre 1', parity: 'impair' },
    { id: 'T-2', label: 'Semestre 2', parity: 'pair' },
  ],
  current: { year: 'AY-2026', term: 'T-1' },
  note: 'Nous sommes le 10 septembre — la répartition validée alimente le planning.',
};

const QUEUE = [
  { id: 'GRD-118', domain: 'grades', title: 'MAT-118 · contrôle continu', subtitle: 'Pr. Ahouandjinou · 42 notes · 3 signalements',
    status: 'incomplete', statusLabel: '3 signalements', due: 'depuis 2 jours', overdue: true, to: 'grades' },
  { id: 'GRD-204', domain: 'grades', title: 'INF-204 · projet', subtitle: 'Pr. Hounkpatin · 38 notes',
    status: 'propose', statusLabel: 'À contrôler', due: 'depuis 1 jour', to: 'grades' },
  { id: 'DOC-0091', domain: 'documents', title: 'Marie Kponou · relevé semestriel S1', subtitle: 'Reçue le 14 mars · dossier de candidature',
    status: 'propose', statusLabel: 'À traiter', due: 'depuis 2 jours', to: 'documents' },
  { id: 'DOC-0092', domain: 'documents', title: 'Ange Sossou · relevé annuel 2025-2026', subtitle: 'Les deux semestres sont délibérés',
    status: 'propose', statusLabel: 'À traiter', due: 'depuis 3 jours', to: 'documents' },
  { id: 'PLN-W38', domain: 'planning', title: 'Semaine du 14 septembre · 3 brouillons', subtitle: 'L2 Génie logiciel — groupe A',
    status: 'brouillon', statusLabel: 'À publier', due: 'avant le 12 septembre', overdue: true, to: 'planning' },
  { id: 'CNS-0012', domain: 'council', title: 'Seuils d’absence · 4 au second seuil', subtitle: 'Convocation à envisager — rien ne se déclenche seul',
    status: 'incomplete', statusLabel: 'À examiner', to: 'council' },
];

export function workQueue(params = {}) {
  if (params.__empty) return { total: 0, count: 0, items: [] };
  const items = params.domain ? QUEUE.filter((i) => i.domain === params.domain) : QUEUE;
  return { total: items.length, count: items.length, items };
}

export const workQueueCounts = {
  total: 6,
  by_domain: { grades: 2, documents: 2, planning: 1, council: 1, dossiers: 0, structure: 0 },
  overdue: 2,
};

const DAYS = [
  { key: 'mon', label: 'Lundi', dayNumber: 14 },
  { key: 'tue', label: 'Mardi', dayNumber: 15 },
  { key: 'wed', label: 'Mercredi', dayNumber: 16, today: true },
  { key: 'thu', label: 'Jeudi', dayNumber: 17 },
  { key: 'fri', label: 'Vendredi', dayNumber: 18 },
];

export function weekSessions(params = {}) {
  if (params.__empty) return { days: DAYS, hours: { from: 8, to: 18, step: 0.5 }, items: [] };
  return {
    days: DAYS,
    // step : les séances s'alignent sur la demi-heure (validation serveur).
    hours: { from: 8, to: 18, step: 0.5 },
    items: [
      { id: 'S1', day: 'mon', start: 8, end: 10, code: 'INF-204-A', lines: ['CM · amphi B', 'Pr. Hounkpatin'], tone: 'published', origin: 'repartition', stateLabel: 'Publiée' },
      { id: 'S2', day: 'mon', start: 10, end: 12, code: 'INF-204-B', lines: ['TD · salle 12', 'M. Dossou'], tone: 'published', origin: 'repartition', stateLabel: 'Publiée' },
      { id: 'S3', day: 'mon', start: 14, end: 16, code: 'RES-102-A', lines: ['TP · labo 1', 'M. Adjovi'], tone: 'draft', origin: 'repartition', stateLabel: 'Brouillon' },
      { id: 'S4', day: 'tue', start: 8, end: 10, code: 'MAT-118-A', lines: ['CM · salle 7', 'Pr. Ahouandjinou'], tone: 'published', origin: 'repartition', stateLabel: 'Publiée' },
      { id: 'S5', day: 'tue', start: 14, end: 16, code: 'RES-102-B', lines: ['TP · labo 1', 'Mme Lawson'], tone: 'published', origin: 'choisi', stateLabel: 'Publiée · hors répartition' },
      { id: 'S6', day: 'wed', start: 14.5, end: 16, code: 'TRA-110-A', lines: ['TD · salle 4', 'Mme Lawson'], tone: 'published', origin: 'repartition', stateLabel: 'Publiée · 14 h 30' },
      { id: 'S7', day: 'thu', start: 8, end: 11, code: 'MAT-118 · ÉPREUVE', lines: ['Écrit · amphi A', 'Surveillance : Pr. Ahouandjinou'], tone: 'exam', stateLabel: 'Publiée le 4 septembre' },
      { id: 'S8', day: 'thu', start: 16, end: 18, code: 'INF-207-B', lines: ['TD · salle 4', 'Pr. Soglo'], tone: 'draft', origin: 'repartition', stateLabel: 'Brouillon' },
      { id: 'S9', day: 'fri', start: 10, end: 12, code: 'MAT-121-B', lines: ['TP · labo 2', 'Pr. Ahouandjinou'], tone: 'published', origin: 'repartition', stateLabel: 'Publiée' },
      { id: 'S10', day: 'fri', start: 14, end: 16, code: 'INF-201-C', lines: ['Projet · labo 2', 'Enseignant absent'], tone: 'cancelled', stateLabel: 'Annulée · reste publiée' },
    ],
    conflicts: [
      { level: 'wa', title: 'L’enseignante choisie n’a pas de ligne de service sur ce module.', detail: ' La répartition nomme M. Adjovi pour les travaux pratiques du groupe B.' },
      { level: 'ok', title: 'La séance est publiée et compte au réalisé de Mme Lawson.', detail: ' Un enseignant choisi gagne toujours : le signal enregistre l’écart, il ne le conteste pas.' },
    ],
  };
}

// ── Grappe 2 · structure — FORME SERVEUR ────────────────────────────────────
/**
 * ═══ LA MAQUETTE EST LA SOURCE UNIQUE, LE RETURN EST CELUI DU SERVEUR ═══
 *
 * `get_structure_tree` (structure.py:180) rend `{program, levels, terms[],
 * ects_cap}` — chaque `terms[].ues[]` porte les UE_TREE_FIELDS (dont
 * `validation_status` et les TRACES du maker-checker PAR NŒUD :
 * `proposed_by/proposed_on/validated_by/validated_on`, null = non tracé), et
 * ses `modules[]` avec `volumes` en MINUSCULES (seuls les types alloués — un
 * zéro de maquette n'est pas une allocation, structure.py:299).
 *
 * L'arbre APLATI `{id, parent, level}` que l'écran consomme est RECONSTRUIT
 * par l'adaptateur (`src/api/structure.js`) — plus aucune forme d'écran ici.
 * L'arbre serveur et le panneau d'unité (`get_ue`) dérivent des MÊMES
 * déclarations `UES` : ils ne peuvent pas se contredire.
 */
const PROGRAM_META = {
  name: 'L2-GL', program_name: 'L2 Génie logiciel', program_abbreviation: 'L2GL',
  custom_filiere_acronym: 'GL', custom_program_type: 'Licence',
  custom_catalogue_code: 'CAT-GL-2', custom_is_active: 1,
  custom_responsable_programme: 'A. Hounsou',
};
const LEVELS = [
  { name: 'L2-GL-N2', level_code: 'L2', level_name: 'Licence 2', level_order: 2, max_semesters: 2 },
];
const TERM = 'Semestre 3';

/** Les traces du circuit de maquette, PAR ÉTAT — null = non tracé (jamais reconstitué). */
const TRACES = {
  valide: { proposed_by: 'A. Hounsou', proposed_on: '2026-06-28', validated_by: 'M. Codjo', validated_on: '2026-07-02' },
  brouillon: { proposed_by: null, proposed_on: null, validated_by: null, validated_on: null },
};
/** Statut serveur depuis la clé interne du jeu d'essai. */
const STATUS_FR = { brouillon: 'Brouillon', propose: 'Proposé', valide: 'Validé' };

const UES = {
  'UE-3.2': {
    id: 'UE-3.2', code: 'UE-GL-3.2', label: 'Mathématiques appliquées', ects: 6, status: 'valide',
    modules: [
      { id: 'MAT-118', code: 'MAT-118', label: 'Probabilités', volumes: { cm: 24, td: 36, tp: 0, pj: 0 } },
      { id: 'MAT-121', code: 'MAT-121', label: 'Algèbre linéaire', volumes: { cm: 24, td: 36, tp: 0, pj: 0 } },
    ],
    // `since` existe en base (child `since_year`) mais get_ue ne le SELECTIONNE
    // pas : la forme rendue ne porte que {program, is_active}.
    partners: [
      { program: 'L2 Informatique de gestion', since: '2025-2026', active: true },
      { program: 'L2 Génie civil', since: '2026-2027', active: true },
      { program: 'L2 Génie électrique', since: '2024-2025', active: false },
    ],
  },
  'UE-3.1': {
    id: 'UE-3.1', code: 'UE-GL-3.1', label: 'Développement logiciel', ects: 9, status: 'valide',
    modules: [
      { id: 'INF-204', code: 'INF-204', label: 'Programmation objet', volumes: { cm: 24, td: 36, tp: 24, pj: 0 } },
      { id: 'RES-102', code: 'RES-102', label: 'Réseaux', volumes: { cm: 20, td: 0, tp: 32, pj: 0 } },
    ],
    partners: [],
  },
  'UE-3.3': {
    id: 'UE-3.3', code: 'UE-GL-3.3', label: 'Compétences transversales', ects: 3, status: 'valide',
    modules: [
      { id: 'TRA-110', code: 'TRA-110', label: 'Expression professionnelle', volumes: { cm: 0, td: 24, tp: 0, pj: 0 } },
      { id: 'INF-201', code: 'INF-201', label: 'Projet intégrateur', volumes: { cm: 0, td: 0, tp: 0, pj: 24 } },
    ],
    partners: [],
  },
  'UE-3.4': {
    id: 'UE-3.4', code: 'UE-GL-3.4', label: 'Systèmes et réseaux', ects: 9, status: 'brouillon',
    modules: [{ id: 'INF-207', code: 'INF-207', label: 'Bases de données', volumes: { cm: 24, td: 24, tp: 0, pj: 0 } }],
    partners: [],
  },
};

/** La ligne UE au format UE_TREE_FIELDS du serveur (structure.py:53). */
function ueRow(ue) {
  return {
    name: ue.id, ue_code: ue.code, ue_name: ue.label,
    program: PROGRAM_META.name, academic_level: LEVELS[0].name, academic_term: TERM,
    is_mutualized: (ue.partners || []).length ? 1 : 0,
    ects_credits: ue.ects, validation_threshold: 10, compensation_floor: 7, is_compensable: 1,
    validation_status: STATUS_FR[ue.status],
    ...TRACES[ue.status],
    is_shared_in: 0,
  };
}

/** La ligne module au format _modules_by_ue (MODULE_FIELDS + course/coefficient/volumes). */
function moduleRow(ue, m) {
  const volumes = Object.fromEntries(
    Object.entries(m.volumes || {}).filter(([, h]) => h > 0));
  return {
    name: m.id, course: m.id, course_name: m.label,
    custom_module_code: m.code, custom_ue: ue.id,
    custom_coefficient: 1, coefficient: 1,
    custom_module_nature: 'Standard',
    custom_heures_totales: Object.values(volumes).reduce((s, h) => s + h, 0),
    custom_coordinateur: null,
    // volumes en MINUSCULES, types alloués seulement (structure.py:310).
    volumes,
  };
}

export function structureTree(params = {}) {
  if (params.__empty) return { program: PROGRAM_META, levels: [], terms: [], ects_cap: 30 };
  const ues = Object.values(UES)
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((ue) => ({ ...ueRow(ue), modules: (ue.modules || []).map((m) => moduleRow(ue, m)) }));
  return {
    program: PROGRAM_META,
    levels: LEVELS,
    terms: [{
      name: TERM,
      ues,
      mhc_modules: [],
      parcours: [],
      total_ects: ues.filter((u) => !u.is_shared_in)
        .reduce((s, u) => s + (u.ects_credits || 0), 0),
    }],
    // Le PLAFOND est LA CONSTANTE DE LA GARDE (30/semestre), rendue par le
    // serveur — « rendre ce que la garde décide » (V-LEARN-F3-13).
    ects_cap: 30,
  };
}

/**
 * ⚠️ Un identifiant inconnu LÈVE UNE ERREUR — il ne rend jamais une unité
 * voisine (le serveur lève « UE introuvable », structure.py:339). Le repli
 * `|| UES['UE-3.2']` faisait afficher « Mathématiques appliquées » à quiconque
 * cliquait ailleurs : le silence est plus dangereux que l'erreur.
 */
export function ueDetail(params = {}) {
  const ue = UES[params.ue];
  if (!ue) {
    throw Object.assign(new Error('Cette unité est introuvable dans cette maquette.'),
      { code: 'NOT_FOUND', status: 404 });
  }
  return {
    ...ueRow(ue),
    modules: (ue.modules || []).map((m) => moduleRow(ue, m)),
    // get_ue (structure.py:347) ne rend que {program, is_active} du child —
    // since_year et le responsable n'y sont PAS : clés ABSENTES ici aussi.
    shared_programs: (ue.partners || []).map((p) => ({
      program: p.program, is_active: p.active ? 1 : 0,
    })),
  };
}

/**
 * Usage aval — FORME SERVEUR `get_unit_usage` (unit_usage.py:37, F3-COR S1) :
 * DEUX faits DISTINCTS — `lock` (le VERROU par usage aval, DEC-290) et
 * `validation` (l'état du CIRCUIT de maquette), jamais l'un lu dans l'autre.
 * UNE inscription suffit à verrouiller ; `downstream` dit d'où vient le verrou.
 */
const USAGE = {
  'UE-3.2': { courses: 2, enrollments: 96, grade_submissions: 192, ue_results: 192, origins: ['inscriptions', 'notes'] },
  'UE-3.1': { courses: 2, enrollments: 96, grade_submissions: 0, ue_results: 0, origins: ['inscriptions'] },
  'UE-3.3': { courses: 2, enrollments: 96, grade_submissions: 96, ue_results: 96, origins: ['inscriptions', 'notes'] },
  'UE-3.4': { courses: 1, enrollments: 0, grade_submissions: 0, ue_results: 0, origins: [] },
};
const FROZEN_FIELDS = [
  'Code de l’unité', 'Crédits ECTS', 'Seuil de validation',
  'Plancher de compensation', 'Caractère compensable',
];

/**
 * ⚠️ Même règle : un identifiant inconnu lève (« Unité introuvable »,
 * unit_usage.py:45). Le repli rendait `locked: false` — il annonçait une unité
 * MODIFIABLE pour une unité qu'il ne connaissait pas. Sur un verrou, le défaut
 * doit être le refus, jamais l'autorisation.
 */
export function ueDownstreamUsage(params = {}) {
  const u = USAGE[params.ue];
  const ue = UES[params.ue];
  if (!u || !ue) {
    throw Object.assign(new Error('Cette unité est introuvable dans cette maquette.'),
      { code: 'NOT_FOUND', status: 404 });
  }
  return {
    ue: params.ue, ue_name: ue.label,
    program: PROGRAM_META.name, academic_term: TERM,
    downstream: {
      courses: u.courses, enrollments: u.enrollments,
      grade_submissions: u.grade_submissions, ue_results: u.ue_results,
    },
    // LE VERROU — la LOI (usage aval), pas la validation (F3-COR S1).
    lock: {
      locked: u.origins.length > 0,
      origin: u.origins[0] || null,
      origins: u.origins,
      frozen_fields: FROZEN_FIELDS,
      note: 'Dès qu’un usage aval existe (inscription, note, séance, groupe, épreuve), '
        + 'les champs identifiants et les paramètres de calcul de l’unité sont FIGÉS '
        + '(DEC-290 — UE). Le libellé et le rattachement des modules restent modifiables.',
    },
    // LE CIRCUIT — un fait SÉPARÉ (l'état de maquette + l'auto-retour).
    validation: {
      status: STATUS_FR[ue.status],
      on_content_change: 'Modifier un champ SUIVI d’une unité Proposée ou Validée la renvoie '
        + 'AUTOMATIQUEMENT en Brouillon (retour journalisé) — le cycle de validation repart de zéro.',
    },
  };
}

// ── Grappe 3 · répartition de service — FORME SERVEUR ───────────────────────
/**
 * ═══ UNE SEULE SOURCE DE VÉRITÉ, ET LE RETURN DU SERVEUR ═══
 *
 * · `SERVICE_LINES` déclare les lignes de la filière — la ligne SANS enseignant
 *   du lot 6 (L9) N'EXISTE PLUS : le modèle Service Assignment exige
 *   l'enseignant, une ligne sans lui n'est pas enregistrable, donc le serveur
 *   ne peut pas la rendre. Ses 18 h se lisent en PARTIEL dans la couverture.
 * · `TEACHERS` déclare le MINIMUM par enseignant (lignes de sa filière, charge
 *   ailleurs) — l'engagé, le réalisé et les notes de norme sont CALCULÉS, et
 *   le plan, les signaux et le bilan lisent la même table.
 * · Les manques, la couverture et les signaux dérivent de la MAQUETTE (`UES`),
 *   la seule qui déclare les volumes.
 *
 * ⚠️ RÈGLE SERVEUR NON SIMULÉE, dite ici : la couverture et les signaux réels
 * ne comptent que Proposé + Validé (service_allocation.py:344, 807). Le jeu
 * d'essai de la filière est en Brouillon (le RF travaille encore) et ses heures
 * sont quand même comptées COUVERTES — un choix de jeu d'essai pour que les
 * états de la couverture existent à l'écran, pas une règle : la règle vit au
 * serveur, le simulacre ne décide rien.
 */
const YEAR = 'AY-2026';
const NORM_HOURS = 400;
const AS_OF = '2027-02-12 18:04:00';

const TEACHERS = {
  T1: {
    name: 'Pr. Célestine Ahouandjinou',
    elsewhere_hours: 302, elsewhere_lines: 9, proposed_hours: 72,
    // Dérogation née d'une AUTRE filière : aucun motif sur SES lignes — LE FAIT
    // (existence + caractère motivé) vit dans out_of_scope, jamais le contenu
    // (service_allocation.py:229 : champ ABSENT, jamais vide).
    out_of_scope_derogation: { has: true, motivated: true },
    own_lines: [
      { id: 'C1', course: 'MAT-118', at: 'CM', group: null, planned: 24, done: 14, status: 'valide' },
      { id: 'C2', course: 'MAT-118', at: 'TD', group: 'Groupe A', planned: 18, done: 10, status: 'valide' },
      { id: 'C3', course: 'MAT-121', at: 'CM', group: null, planned: 24, done: 12, status: 'valide' },
      { id: 'C4', course: 'MAT-121', at: 'TD', group: 'Groupe A', planned: 18, done: 8, status: 'propose' },
      { id: 'C5', course: 'MAT-121', at: 'TD', group: 'Groupe B', planned: 18, done: 8, status: 'propose' },
      // Mutualisée (DEC-169) : plusieurs lignes partagent la clé (module,
      // activité) → shared_key au rapprochement, réalisé compté UNE fois.
      { id: 'C6', course: 'MAT-140', at: 'CM', group: null, planned: 24, done: 16, status: 'valide', shared: true },
    ],
    per_activity: { CM: 168, TD: 206, TP: 36, PJ: 18 },
  },
  T2: {
    name: 'Pr. Léonard Hounkpatin',
    elsewhere_hours: 288, elsewhere_lines: 9, proposed_hours: 0,
    out_of_scope_derogation: { has: false, motivated: false },
    own_lines: [
      { id: 'F1', course: 'INF-204', at: 'CM', group: null, planned: 24, done: 14, status: 'valide' },
    ],
    per_activity: { CM: 168, TD: 96, PJ: 48 },
  },
  T3: {
    name: 'Pr. Bernard Soglo',
    elsewhere_hours: 356, elsewhere_lines: 11, proposed_hours: 0,
    out_of_scope_derogation: { has: false, motivated: false },
    own_lines: [
      // Dérogation née de SA filière : le motif est RENDU, posé sur la ligne
      // qui franchit la norme (service_allocation.py:221).
      { id: 'E1', course: 'INF-201', at: 'PJ', group: null, planned: 30, done: 9, status: 'valide',
        derogation_reason: 'Le projet intégrateur ne peut être encadré que par le responsable de la '
          + 'mention ; aucun autre enseignant ne porte la compétence cette année.' },
      { id: 'E2', course: 'INF-207', at: 'TD', group: 'Groupe B', planned: 18, done: 6, status: 'valide' },
    ],
    per_activity: { CM: 96, TD: 188, PJ: 120 },
  },
  T4: {
    name: 'Mme Estelle Lawson',
    elsewhere_hours: 162, elsewhere_lines: 7, proposed_hours: 0,
    out_of_scope_derogation: { has: false, motivated: false },
    own_lines: [
      { id: 'F2', course: 'INF-204', at: 'TD', group: 'Groupe B', planned: 18, done: 4, status: 'valide' },
      { id: 'F3', course: 'TRA-110', at: 'TD', group: 'Groupe A', planned: 12, done: 12, status: 'valide' },
      { id: 'F4', course: 'TRA-110', at: 'TD', group: 'Groupe B', planned: 12, done: 12, status: 'valide' },
    ],
    // La séance tenue HORS répartition (le signal du planning) : un réalisé
    // sans ligne — `unplanned_realized` au rapprochement.
    unplanned: [{ course: 'RES-102', at: 'TP', hours: 4 }],
    per_activity: { TD: 168, TP: 36 },
  },
  T5: {
    name: 'M. Firmin Dossou',
    elsewhere_hours: 342, elsewhere_lines: 12, proposed_hours: 96,
    // Dépassement acquis, AUCUN motif posé nulle part : ni sur ses lignes, ni
    // ailleurs — la troisième phrase du bandeau du bilan.
    out_of_scope_derogation: { has: false, motivated: false },
    own_lines: [
      { id: 'D1', course: 'INF-204', at: 'TD', group: 'Groupe A', planned: 18, done: 12, status: 'valide' },
      { id: 'D2', course: 'RES-102', at: 'CM', group: null, planned: 20, done: 12, status: 'valide' },
      { id: 'D3', course: 'RES-102', at: 'TP', group: 'Groupe A', planned: 16, done: 16, status: 'valide' },
      { id: 'D4', course: 'INF-207', at: 'TD', group: 'Groupe A', planned: 16, done: 0, status: 'propose' },
    ],
    per_activity: { CM: 140, TD: 158, TP: 114 },
  },
  T6: {
    name: 'M. Cyrille Adjovi',
    // AUCUNE charge hors de cette filière : le cas qui éprouve la zone masquée
    // absente — un vacataire d'une seule filière n'en a pas besoin.
    elsewhere_hours: 0, elsewhere_lines: 0, proposed_hours: 12,
    out_of_scope_derogation: { has: false, motivated: false },
    own_lines: [
      { id: 'F5', course: 'RES-102', at: 'TP', group: 'Groupe B', planned: 16, done: 20, status: 'valide' },
      { id: 'F6', course: 'INF-201', at: 'PJ', group: null, planned: 12, done: 0, status: 'propose' },
    ],
    per_activity: { TP: 16, PJ: 12 },
  },
};

/** own / engagé / réalisé sont CALCULÉS — les invariants tiennent seuls. */
function ownHours(t) { return t.own_lines.reduce((s, l) => s + l.planned, 0); }
function engagedHours(t) { return ownHours(t) + t.elsewhere_hours; }
function realizedHours(t) {
  return t.own_lines.reduce((s, l) => s + l.done, 0)
    + (t.unplanned || []).reduce((s, u) => s + u.hours, 0);
}
function teacherByName(name) {
  return Object.values(TEACHERS).find((t) => t.name === name) || null;
}

/** La note de norme, RÉDIGÉE comme au serveur (_norm_note) — null sous la norme. */
function normNote(engaged) {
  if (engaged <= NORM_HOURS) return null;
  return 'Charge ENGAGÉE de ' + engaged + ' h — au-delà de la norme annuelle de ' + NORM_HOURS
    + ' h (toutes filières, Validé + Proposé). Le dépassement n’est jamais bloqué : un MOTIF '
    + 'de dérogation est exigé à la validation (gate F3-S).';
}

/**
 * Les lignes de service de la filière — Brouillon, le RF travaille encore.
 * `group: null` = ligne-promotion (student_group vide au serveur).
 */
const SERVICE_LINES = [
  { name: 'L1', t: 'T2', course: 'INF-204', at: 'CM', group: null, hours: 24 },
  { name: 'L2', t: 'T5', course: 'INF-204', at: 'TD', group: 'Groupe A', hours: 18 },
  { name: 'L3', t: 'T4', course: 'INF-204', at: 'TD', group: 'Groupe B', hours: 18 },
  { name: 'L4', t: 'T5', course: 'RES-102', at: 'CM', group: null, hours: 20 },
  { name: 'L5', t: 'T5', course: 'RES-102', at: 'TP', group: 'Groupe A', hours: 16 },
  { name: 'L6', t: 'T6', course: 'RES-102', at: 'TP', group: 'Groupe B', hours: 16 },
  { name: 'L7', t: 'T1', course: 'MAT-118', at: 'CM', group: null, hours: 24 },
  { name: 'L8', t: 'T1', course: 'MAT-118', at: 'TD', group: 'Groupe A', hours: 18 },
  // F3-PROV : L9 EXISTE — le brouillon SANS enseignant est admis par le
  // modèle depuis F3-CH (cette fixture portait une CROYANCE périmée sur la
  // contrainte : le simulacre rend LA FORME SERVEUR, contraintes incluses).
  // Ses 18 h ne COUVRENT rien : « posées sans titulaire », dites à part.
  { name: 'L9', t: null, course: 'MAT-118', at: 'TD', group: 'Groupe B', hours: 18 },
  { name: 'L10', t: 'T1', course: 'MAT-121', at: 'CM', group: null, hours: 24 },
  { name: 'L11', t: 'T4', course: 'TRA-110', at: 'TD', group: 'Groupe A', hours: 12 },
  { name: 'L12', t: 'T4', course: 'TRA-110', at: 'TD', group: 'Groupe B', hours: 12 },
  { name: 'L13', t: 'T3', course: 'INF-201', at: 'PJ', group: null, hours: 18 },
  { name: 'L14', t: 'T6', course: 'INF-201', at: 'PJ', group: null, hours: 12 },
];

/** L'unité porteuse d'un module — lue de la maquette, la seule qui le sait. */
function ueOfCourse(course) {
  return Object.values(UES).find((ue) => (ue.modules || []).some((m) => m.id === course)) || null;
}

/** Cibles maquette par « course·ACTIVITÉ » — zéro EXCLU (comme _maquette_targets). */
function maquetteTargets() {
  const targets = {};
  for (const ue of Object.values(UES)) {
    for (const m of ue.modules || []) {
      for (const [act, hours] of Object.entries(m.volumes || {})) {
        if (hours > 0) targets[m.id + '·' + act.toUpperCase()] = hours;
      }
    }
  }
  return targets;
}

/** Heures réparties par « course·ACTIVITÉ » — dérivées des lignes, jamais déclarées. */
function assignedByKey() {
  const got = {};
  for (const l of SERVICE_LINES) {
    if (!l.t) continue;   // F3-PROV : sans enseignant, rien n'est couvert
    const k = l.course + '·' + l.at;
    got[k] = (got[k] || 0) + l.hours;
  }
  return got;
}

/** F3-PROV : les heures en brouillon SANS titulaire, par clé (forme serveur). */
function draftUnassignedByKey() {
  const got = {};
  for (const l of SERVICE_LINES) {
    if (l.t) continue;
    const k = l.course + '·' + l.at;
    got[k] = (got[k] || 0) + l.hours;
  }
  return got;
}

/**
 * `get_service_plan` (service_allocation.py:707) — les lignes ET LES MANQUES.
 * Un manque = une cible SANS AUCUNE ligne (assigned: 0 PAR CONSTRUCTION — les
 * partiels vivent dans la couverture) ; le zéro de maquette est exclu AU
 * SERVEUR. `ue`/`ue_label` par ligne : le front groupe l'arbre à l'AFFICHAGE,
 * le serveur donne la DONNÉE.
 */
export function servicePlan(params = {}) {
  const base = {
    program: PROGRAM_META.name, academic_year: YEAR,
    can_carry_over: true, previous_year_label: '2025-2026',
    note: 'Les manques = cibles de maquette SANS AUCUNE ligne (tous statuts) ; '
      + 'les cibles à 0 h sont exclues au serveur.',
  };
  if (params.__empty) return { ...base, lines: [], missing: [], teachers: [], over_norm_notes: {}, unassigned_draft_hours: 0 };
  const lines = SERVICE_LINES.map((l) => {
    const ue = ueOfCourse(l.course);
    return {
      name: l.name, instructor: l.t ? TEACHERS[l.t].name : null, course: l.course,
      activity_type: l.at, student_group: l.group, hours: l.hours,
      validation_status: 'Brouillon', derogation_reason: null,
      ue: ue ? ue.id : null, ue_label: ue ? ue.label : null,
    };
  });
  const covered = new Set(SERVICE_LINES.map((l) => l.course + '·' + l.at));
  const missing = Object.entries(maquetteTargets())
    .filter(([k]) => !covered.has(k))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, hours]) => {
      const [course, at] = k.split('·');
      const ue = ueOfCourse(course);
      return { course, activity_type: at, target_hours: hours, assigned: 0,
        ue: ue ? ue.id : null, ue_label: ue ? ue.label : null };
    });
  const teachers = [...new Set(SERVICE_LINES.filter((l) => l.t).map((l) => TEACHERS[l.t].name))]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ instructor: name, engaged: engagedHours(teacherByName(name)) }));
  const over_norm_notes = {};
  for (const t of teachers) {
    const note = normNote(t.engaged);
    if (note) over_norm_notes[t.instructor] = note;
  }
  // F3-PROV : la forme serveur — les heures posées SANS enseignant, à part.
  const unassigned_draft_hours = SERVICE_LINES
    .filter((l) => !l.t).reduce((n, l) => n + l.hours, 0);
  return { ...base, lines, missing, teachers, over_norm_notes, unassigned_draft_hours };
}

/**
 * `get_service_coverage` (service_allocation.py:795) — PLAT par (module, type
 * d'activité), l'EXACT inclus (contrairement au signal). Le zéro de maquette
 * est exclu ici aussi — les deux appels, même règle, un seul endroit.
 */
export function serviceCoverage(params = {}) {
  if (params.__empty) return { program: PROGRAM_META.name, academic_year: YEAR, coverage: [] };
  const targets = maquetteTargets();
  const got = assignedByKey();
  const drafts = draftUnassignedByKey();
  // F3-PROV (revues) : l'union inclut les clés draft-only — une clé HORS
  // maquette portée par un brouillon sans enseignant apparaît, état nommé
  // « hors maquette » (forme serveur).
  const coverage = [...new Set([...Object.keys(targets), ...Object.keys(got), ...Object.keys(drafts)])]
    .sort((a, b) => a.localeCompare(b))
    .map((k) => {
      const [course, at] = k.split('·');
      const target = targets[k] || 0;
      const coveredH = got[k] || 0;
      const draftH = drafts[k] || 0;
      const state = (target <= 0 && coveredH <= 0 && draftH > 0) ? 'hors maquette'
        : coveredH === target ? 'couvert'
          : coveredH === 0 ? 'non couvert'
            : coveredH < target ? 'partiel' : 'sur-couvert';
      return { course, activity_type: at, target_hours: target, covered_hours: coveredH,
        draft_unassigned_hours: draftH, state };
    })
    .filter((c) => c.target_hours > 0 || c.covered_hours > 0 || c.draft_unassigned_hours > 0);
  return { program: PROGRAM_META.name, academic_year: YEAR, coverage };
}

/**
 * Les lignes PROPOSÉES d'autres filières — la file de validation du DE.
 * `M. Serge Agossou` (L1-MI) n'est pas dans la table des enseignants : son
 * bilan serveur est l'agrégat VIDE, jamais une erreur (voir teacherLoad).
 */
const PROPOSED_LINES = [
  { name: 'B1', t: 'T2', course: 'INF-304', at: 'CM', group: null, hours: 24, program: 'L3-GL', proposed_by: 'A. Hounsou' },
  { name: 'B2', t: 'T5', course: 'INF-304', at: 'TD', group: 'Groupe A', hours: 18, program: 'L3-GL', proposed_by: 'A. Hounsou' },
  { name: 'B3', t: 'T1', course: 'MAT-318', at: 'CM', group: null, hours: 24, program: 'L3-GL', proposed_by: 'A. Hounsou' },
  { name: 'B4', t: 'T1', course: 'MAT-318', at: 'TD', group: 'Groupe A', hours: 18, program: 'L3-GL', proposed_by: 'A. Hounsou' },
  { name: 'B5', t: 'T6', course: 'RES-302', at: 'TP', group: 'Groupe B', hours: 16, program: 'L3-GL', proposed_by: 'A. Hounsou' },
  { name: 'B6', t: 'T3', course: 'INF-301', at: 'PJ', group: null, hours: 30, program: 'L3-GL', proposed_by: 'A. Hounsou' },
  { name: 'B7', t: 'T4', course: 'TRA-310', at: 'TD', group: 'Groupe A', hours: 12, program: 'L3-GL', proposed_by: 'A. Hounsou' },
  { name: 'A1', instructor: 'M. Serge Agossou', course: 'GES-105', at: 'CM', group: null, hours: 20, program: 'L1-MI', proposed_by: 'K. Bio' },
  { name: 'A2', t: 'T3', course: 'MAT-101', at: 'TD', group: null, hours: 24, program: 'L1-MI', proposed_by: 'K. Bio' },
];

/**
 * `list_service_lines` (service_allocation.py:165) — LISTE NUE de lignes
 * Service Assignment, filtrable par statut et par filière. L'agrégat par
 * filière que la file de validation affiche est un COMPTAGE de présentation,
 * fait à l'adaptateur — jamais une seconde construction de ligne.
 */
export function serviceLines(params = {}) {
  if (params.__empty) return [];
  const rows = [
    ...SERVICE_LINES.map((l) => ({
      name: l.name, instructor: l.t ? TEACHERS[l.t].name : null, course: l.course,
      activity_type: l.at, program: PROGRAM_META.name, student_group: l.group,
      academic_year: YEAR, hours: l.hours, validation_status: 'Brouillon',
      derogation_reason: null, proposed_by: null, validated_by: null, validated_on: null,
    })),
    ...PROPOSED_LINES.map((l) => ({
      name: l.name, instructor: l.instructor || TEACHERS[l.t].name, course: l.course,
      activity_type: l.at, program: l.program, student_group: l.group,
      academic_year: YEAR, hours: l.hours, validation_status: 'Proposé',
      derogation_reason: null, proposed_by: l.proposed_by, validated_by: null, validated_on: null,
    })),
  ];
  return rows
    .filter((r) => !params.status || r.validation_status === params.status)
    .filter((r) => !params.program || r.program === params.program);
}

/**
 * `get_instructor_service_summary` (service_allocation.py:192) — l'exception
 * au cloisonnement, BORNÉE À LA CHARGE : totaux honnêtes toutes filières, le
 * DÉTAIL hors du périmètre du lecteur EXPURGÉ dans `out_of_scope` — dont le
 * motif de dérogation reste un champ ABSENT, jamais vide (le FAIT est rendu :
 * has_derogation / derogations_motivated).
 *
 * ⚠️ Un enseignant inconnu ne LÈVE PAS (le serveur agrège, il ne vérifie pas
 * l'existence) : il rend l'agrégat VIDE qui ÉCHO le sujet demandé — jamais un
 * voisin. Le lecteur simulé est un RESPONSABLE DE FORMATION (détail = sa
 * filière) — pour un DE, le serveur rendrait tout le détail.
 */
export function teacherLoad(params = {}) {
  if (params.__empty) return null;
  const instructor = params.instructor;
  const t = teacherByName(instructor);
  if (!t) {
    return {
      instructor, academic_year: YEAR,
      validated_hours: 0, proposed_hours: 0, engaged_hours: 0,
      norm_hours: NORM_HOURS, over_norm: false, over_norm_note: null,
      per_activity: {}, realized_hours: 0, lines: [], lines_out_of_scope: 0,
      out_of_scope: { count: 0, hours: 0, has_derogation: false, derogations_motivated: false },
      as_of: AS_OF,
    };
  }
  const engaged = engagedHours(t);
  const oosd = t.out_of_scope_derogation || { has: false, motivated: false };
  return {
    instructor, academic_year: YEAR,
    validated_hours: engaged - t.proposed_hours,
    proposed_hours: t.proposed_hours,
    engaged_hours: engaged,
    norm_hours: NORM_HOURS,
    over_norm: engaged > NORM_HOURS,
    over_norm_note: normNote(engaged),
    per_activity: t.per_activity,
    realized_hours: realizedHours(t),
    lines: t.own_lines.map((l) => ({
      name: l.id, course: l.course, activity_type: l.at,
      program: PROGRAM_META.name, student_group: l.group, hours: l.planned,
      validation_status: STATUS_FR[l.status],
      derogation_reason: l.derogation_reason || null,
    })),
    lines_out_of_scope: t.elsewhere_lines,
    out_of_scope: {
      count: t.elsewhere_lines,
      hours: t.elsewhere_hours,
      has_derogation: oosd.has,
      derogations_motivated: oosd.has && oosd.motivated,
      // AUCUNE clé « derogation_reason » ici — par construction (py:240).
    },
    as_of: AS_OF,
  };
}

/**
 * `get_service_reconciliation` (service_allocation.py:521) — prévu contre
 * réalisé PAR ENSEIGNANT, écart SIGNÉ, millésime OBLIGATOIRE (`computed_at` :
 * un tableau de paie sans millésime n'est pas opposable). `unplanned_realized`
 * porte le réalisé SANS ligne — le contournement se lit, il ne se tait pas.
 */
export function serviceReconciliation(params = {}) {
  const instructor = params.instructor;
  const base = {
    instructor, academic_year: YEAR, computed_at: AS_OF,
    note: 'Écart SIGNALÉ au RF et au DE, SANS effet — pour un vacataire, un écart positif est une '
      + 'heure à payer en plus : une information, pas une décision (§2.7). Lignes partageant une '
      + 'clé (module, activité) : réalisé au pro-rata du prévu.',
  };
  const t = teacherByName(instructor);
  if (params.__empty || !t) {
    return { ...base, planned_hours: 0, realized_hours: 0, gap_hours: 0, lines: [], unplanned_realized: [] };
  }
  const lines = t.own_lines.map((l) => ({
    name: l.id, course: l.course, activity_type: l.at,
    program: PROGRAM_META.name, student_group: l.group, hours: l.planned,
    realized_hours: l.done, gap_hours: l.done - l.planned,
    shared_key: !!l.shared,
  }));
  const unplanned_realized = (t.unplanned || []).map((u) => ({
    course: u.course, activity_type: u.at, realized_hours: u.hours,
    state: 'réalisé hors répartition',
  }));
  const planned_hours = lines.reduce((s, l) => s + l.hours, 0);
  const realized_hours = realizedHours(t);
  return {
    ...base, planned_hours, realized_hours,
    gap_hours: realized_hours - planned_hours,
    lines, unplanned_realized,
  };
}

/**
 * `list_service_signals` (service_allocation.py:266) — TROIS clés + les
 * PHRASES DE FAMILLE serveur (`family_labels`). La navigation (route, libellé
 * d'action) reste au front : elle vit à l'adaptateur. La famille de couverture
 * est DÉRIVÉE de la même couverture que le panneau (écarts seuls — l'exact
 * n'est pas un signal) ; la norme, de la table des enseignants.
 */
export function serviceSignals(params = {}) {
  const family_labels = {
    coverage: {
      label: 'Couverture de maquette',
      note: 'Cibles d’heures non couvertes ou partiellement couvertes par la répartition.',
    },
    over_norm: {
      label: 'Au-delà du volume annuel',
      note: 'Enseignants dont l’engagé (validé + proposé) dépasse la norme — signalé, jamais bloqué.',
    },
    planning_mismatch: {
      label: 'Écart répartition ↔ planning',
      note: 'Séances dont l’enseignant diffère de la ligne de service validée.',
    },
  };
  const base = {
    academic_year: YEAR,
    note: 'SIGNAUX — aucun ne bloque : la norme est une norme, le planning n’est jamais contraint (gate F3-S).',
    family_labels,
  };
  if (params.__empty) return { ...base, coverage: [], over_norm: [], planning_mismatch: [] };
  const coverage = serviceCoverage({}).coverage
    .filter((c) => c.state !== 'couvert')
    .map((c) => ({
      course: c.course, activity_type: c.activity_type,
      target_hours: c.target_hours, assigned_hours: c.covered_hours, state: c.state,
    }));
  const over_norm = Object.values(TEACHERS)
    .filter((t) => engagedHours(t) > NORM_HOURS)
    .map((t) => ({
      instructor: t.name,
      validated_hours: engagedHours(t) - t.proposed_hours,
      proposed_hours: t.proposed_hours,
      engaged_hours: engagedHours(t),
      norm_hours: NORM_HOURS,
    }))
    .sort((a, b) => a.instructor.localeCompare(b.instructor));
  // Enseignant AU PLANNING sans ligne (course, enseignant) — aucun des trois
  // couples n'a de ligne de service : le signal est vrai par construction.
  const planning_mismatch = [
    { instructor: TEACHERS.T6.name, course: 'INF-207', state: 'au planning hors répartition' },
    { instructor: TEACHERS.T4.name, course: 'RES-102', state: 'au planning hors répartition' },
    { instructor: 'M. Karim Bio', course: 'MAT-118', state: 'au planning hors répartition' },
  ];
  return { ...base, coverage, over_norm, planning_mismatch };
}

/**
 * `list_structure_options()` — FORME SERVEUR (structure.py:438) : les
 * VOCABULAIRES des Selects du domaine — PAS la liste des filières. Elle vit
 * dans `list_programs` ; l'adaptateur `listStructureOptions` JOINT les deux
 * lectures réelles pour les consommateurs.
 */
export const structureOptions = {
  module_natures: ['Standard', 'Stage', 'Mémoire'],
  program_types: ['Licence', 'Master'],
  mhc_types: ['Certification', 'Développement personnel'],
  mhc_validation_methods: ['Présence', 'Épreuve'],
  parcours_types: ['Choix dirigé', 'Libre'],
  activity_types: ['CM', 'TD', 'TP', 'PJ'],
  evaluation_types: ['Contrôle continu', 'Examen final', 'Projet'],
};

/** `list_programs` (structure.py:159) — lignes PROGRAM_LIST_FIELDS. */
export function programs(params = {}) {
  if (params.__empty) return [];
  return [
    PROGRAM_META,
    { name: 'L1-MI', program_name: 'L1 Mathématiques-Informatique', program_abbreviation: 'L1MI',
      custom_filiere_acronym: 'MI', custom_program_type: 'Licence', custom_catalogue_code: 'CAT-MI-1',
      custom_is_active: 1, custom_responsable_programme: 'K. Bio' },
    { name: 'L3-GL', program_name: 'L3 Génie logiciel', program_abbreviation: 'L3GL',
      custom_filiere_acronym: 'GL', custom_program_type: 'Licence', custom_catalogue_code: 'CAT-GL-3',
      custom_is_active: 1, custom_responsable_programme: 'A. Hounsou' },
    { name: 'M1-SI', program_name: 'M1 Systèmes d’information', program_abbreviation: 'M1SI',
      custom_filiere_acronym: 'SI', custom_program_type: 'Master', custom_catalogue_code: 'CAT-SI-1',
      custom_is_active: 1, custom_responsable_programme: 'P. Zinsou' },
  ];
}

/** Refus de droit, au format serveur — details porte de quoi l'expliquer. */
export const denial = {
  message: 'Votre dossier est hors cursus : cet écran ne vous est pas ouvert.',
  details: {
    status: 'Congé académique',
    since: '2025-09-15',
    days_left: 200,
    allowed: ['Mon dossier', 'Mes documents', 'Mes démarches'],
  },
};
