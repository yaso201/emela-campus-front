/**
 * Grappe 5 · planning et examens — formes lues dans
 * `portal_app/services/academic/planning_mgmt.py`.
 *
 * ⚠️ TROIS CHOSES QUE LA LECTURE A APPRISES, et qu'aucune liste de noms n'aurait
 * dites :
 *
 * 1. LES DEUX STATUTS SONT DEUX CHAMPS INDÉPENDANTS. `custom_status` porte le
 *    cycle de la séance, `custom_planning_status` sa publication. « Une séance
 *    annulée reste publiée » n'est pas une convention d'écran : c'est la forme du
 *    modèle, et les fixtures la portent — la séance annulée d'ici est
 *    `custom_status: 'Annulé'` ET `custom_planning_status: 'Publié'`.
 *
 * 2. LA PROVENANCE EST DÉRIVÉE, JAMAIS STOCKÉE. `service_source_for_session()`
 *    la recalcule à chaque lecture, « même après remplacement : toujours vraie ».
 *    Ici aussi : elle se déduit de la table des lignes de service, pas d'un champ
 *    posé sur la séance.
 *
 * 3. UN TYPE D'ACTIVITÉ SANS ALLOCATION EST ABSENT du sommaire (`if allocated is
 *    None: continue`) — pas rendu à zéro. C'est la règle du lot 6 côté serveur :
 *    zéro heure prévue n'est pas un manque.
 */

const DAYS = [
  { key: 'mon', label: 'Lundi', dayNumber: 14, date: '2026-09-14' },
  { key: 'tue', label: 'Mardi', dayNumber: 15, date: '2026-09-15' },
  { key: 'wed', label: 'Mercredi', dayNumber: 16, date: '2026-09-16', today: true },
  { key: 'thu', label: 'Jeudi', dayNumber: 17, date: '2026-09-17' },
  { key: 'fri', label: 'Vendredi', dayNumber: 18, date: '2026-09-18' },
];

/**
 * LES LIGNES DE SERVICE VALIDÉES — la source de la proposition.
 *
 * ⚠️ Clé : module + TYPE D'ACTIVITÉ. C'est tout l'objet de l'amendement A2 du
 * lot 8 : la séance de travaux dirigés reçoit l'enseignant des travaux dirigés,
 * pas celui du cours magistral. Un seul enseignant par module aurait rendu le
 * bogue invisible dans le simulacre.
 */
const SERVICE_LINES = {
  'INF-204|CM': 'Pr. Léonard Hounkpatin',
  'INF-204|TD': 'M. Firmin Dossou',
  'RES-102|CM': 'M. Firmin Dossou',
  'RES-102|TP': 'M. Cyrille Adjovi',
  'MAT-118|CM': 'Pr. Célestine Ahouandjinou',
  'MAT-118|TD': 'Pr. Célestine Ahouandjinou',
  'MAT-121|TP': 'Pr. Célestine Ahouandjinou',
  'TRA-110|TD': 'Mme Estelle Lawson',
  'INF-207|TD': 'Pr. Bernard Soglo',
  'INF-201|PJ': 'Pr. Bernard Soglo',
};

/** `suggested_instructor_for(course, group, activity_type)`. */
export function suggestedInstructor(course, sessionType) {
  const found = SERVICE_LINES[course + '|' + sessionType];
  return found ? { instructor: found } : null;
}

/**
 * `service_source_for_session(course, group, instructor, session_type)` —
 * DÉRIVÉE. Trois issues, et elles ne se confondent pas :
 *   « répartition » — l'enseignant est celui de la ligne de service ;
 *   « choisi »      — quelqu'un d'autre a été désigné, la ligne existe ;
 *   null            — aucune ligne de service sur ce module et ce type.
 *
 * Le troisième cas n'est pas « choisi » : personne n'a été contourné. L'écran
 * doit les distinguer, sinon il accuse un planificateur d'un écart qui n'existe
 * pas.
 */
export function serviceSource(course, sessionType, instructor) {
  const expected = SERVICE_LINES[course + '|' + sessionType];
  if (!expected) return null;
  return expected === instructor ? 'répartition' : 'choisi';
}

/**
 * Les séances de la semaine.
 *
 * `custom_status` : Planifié · Confirmé · Réalisé · Annulé
 * `custom_planning_status` : Brouillon · Publié · Modifié
 */
const SESSIONS = [
  { name: 'CS-0001', day: 'mon', from_time: '08:00', to_time: '10:00',
    course: 'INF-204', course_name: 'Programmation objet', custom_session_type: 'CM',
    student_group: 'SG-L2GL-PROMO', room: 'Amphi B',
    instructor: 'Pr. Léonard Hounkpatin',
    custom_status: 'Confirmé', custom_planning_status: 'Publié' },
  { name: 'CS-0002', day: 'mon', from_time: '10:00', to_time: '12:00',
    course: 'INF-204', course_name: 'Programmation objet', custom_session_type: 'TD',
    student_group: 'SG-L2GL-A', room: 'Salle 12',
    instructor: 'M. Firmin Dossou',
    custom_status: 'Confirmé', custom_planning_status: 'Publié' },
  { name: 'CS-0003', day: 'mon', from_time: '14:00', to_time: '16:00',
    course: 'RES-102', course_name: 'Réseaux', custom_session_type: 'TP',
    student_group: 'SG-L2GL-RES', room: 'Labo 1',
    instructor: 'M. Cyrille Adjovi',
    // ⚠️ TP en BROUILLON, et sans préavis : les travaux pratiques sont sortis des
    // types d'épreuve, ils se publient comme un cours.
    custom_status: 'Planifié', custom_planning_status: 'Brouillon' },
  { name: 'CS-0004', day: 'tue', from_time: '08:00', to_time: '10:00',
    course: 'MAT-118', course_name: 'Probabilités', custom_session_type: 'CM',
    student_group: 'SG-L2GL-PROMO', room: 'Salle 7',
    instructor: 'Pr. Célestine Ahouandjinou',
    custom_status: 'Confirmé', custom_planning_status: 'Publié' },
  { name: 'CS-0005', day: 'tue', from_time: '14:00', to_time: '16:00',
    course: 'RES-102', course_name: 'Réseaux', custom_session_type: 'TP',
    student_group: 'SG-L2GL-RES', room: 'Labo 1',
    // ⚠️ Enseignante CHOISIE : la ligne de service nomme M. Adjovi. La provenance
    // est dérivée, donc ce cas se voit sans qu'aucun champ ne le déclare.
    instructor: 'Mme Estelle Lawson',
    custom_status: 'Confirmé', custom_planning_status: 'Publié' },
  { name: 'CS-0006', day: 'wed', from_time: '14:00', to_time: '16:00',
    course: 'TRA-110', course_name: 'Expression professionnelle', custom_session_type: 'TD',
    student_group: 'SG-L2GL-A', room: 'Salle 4',
    instructor: 'Mme Estelle Lawson',
    // ⚠️ MODIFIÉE après publication : les étudiants avaient déjà vu la séance.
    custom_status: 'Planifié', custom_planning_status: 'Modifié' },
  { name: 'CS-0007', day: 'thu', from_time: '08:00', to_time: '11:00',
    course: 'MAT-118', course_name: 'Probabilités', custom_session_type: 'Examen',
    student_group: 'SG-L2GL-PROMO', room: 'Amphi A',
    instructor: 'Pr. Célestine Ahouandjinou',
    custom_status: 'Confirmé', custom_planning_status: 'Publié',
    is_exam: true, exam_type: 'Écrit' },
  { name: 'CS-0008', day: 'thu', from_time: '16:00', to_time: '18:00',
    course: 'INF-207', course_name: 'Bases de données', custom_session_type: 'TD',
    student_group: 'SG-L2GL-A', room: 'Salle 4',
    instructor: 'Pr. Bernard Soglo',
    custom_status: 'Planifié', custom_planning_status: 'Brouillon' },
  { name: 'CS-0009', day: 'fri', from_time: '10:00', to_time: '12:00',
    course: 'MAT-121', course_name: 'Algèbre linéaire', custom_session_type: 'TP',
    student_group: 'SG-L2GL-RES', room: 'Labo 2',
    instructor: 'Pr. Célestine Ahouandjinou',
    custom_status: 'Réalisé', custom_planning_status: 'Publié' },
  { name: 'CS-0010', day: 'fri', from_time: '14:00', to_time: '16:00',
    course: 'INF-201', course_name: 'Projet intégrateur', custom_session_type: 'PJ',
    student_group: 'SG-L2GL-PROMO', room: 'Labo 2',
    instructor: 'Pr. Bernard Soglo',
    // ⚠️ ANNULÉE ET TOUJOURS PUBLIÉE — les deux champs le disent ensemble. C'est
    // le cas qui prouve que l'écran lit bien deux statuts et non un seul.
    custom_status: 'Annulé', custom_planning_status: 'Publié' },
  { name: 'CS-0011', day: 'wed', from_time: '08:00', to_time: '10:00',
    course: 'INF-204', course_name: 'Programmation objet', custom_session_type: 'CM',
    student_group: 'SG-L2GL-B', room: 'Amphi B',
    // ⚠️ AUCUNE ligne de service pour ce couple hors du groupe A : provenance
    // nulle, et ce n'est pas un contournement.
    instructor: 'M. Kossi Bio',
    custom_status: 'Planifié', custom_planning_status: 'Brouillon' },
  // ⚠️ UNE ÉPREUVE EN BROUILLON, à trois jours. Sans elle, la branche du préavis
  // ne s'ouvre JAMAIS : toutes les séances à publier étaient des cours et des TP,
  // la publication passait entièrement, et l'écran de succès partiel n'avait rien
  // à montrer. Le jeu d'essai doit produire le cas, pas seulement le permettre —
  // troisième fois que cette leçon mord, après le groupe au-delà de sa capacité.
  { name: 'CS-0012', day: 'wed', from_time: '10:00', to_time: '12:00',
    course: 'RES-102', course_name: 'Réseaux', custom_session_type: 'Examen',
    student_group: 'SG-L2GL-PROMO', room: 'Amphi A',
    instructor: 'M. Firmin Dossou',
    custom_status: 'Planifié', custom_planning_status: 'Brouillon',
    is_exam: true, exam_type: 'Pratique' },
];

// F3-FORMES : la fixture émet la FORME SERVEUR — schedule_date (jamais
// `day`, une clé d'affichage que l'adaptateur dérive) et la provenance par
// ligne (le serveur la rend désormais en liste).
const enrich = (s) => {
  const { day, is_exam, exam_type, ...serverShape } = s;
  return {
    ...serverShape,
    schedule_date: (DAYS.find((d) => d.key === s.day) || {}).date,
    instructor_service_source: serviceSource(s.course, s.custom_session_type, s.instructor),
  };
};

export function schedules(params = {}) {
  if (params.__empty) return [];
  let rows = SESSIONS;
  if (params.student_group) rows = rows.filter((s) => s.student_group === params.student_group);
  if (params.course) rows = rows.filter((s) => s.course === params.course);
  if (params.instructor) rows = rows.filter((s) => s.instructor === params.instructor);
  if (params.planning_status) rows = rows.filter((s) => s.custom_planning_status === params.planning_status);
  if (params.session_type) rows = rows.filter((s) => s.custom_session_type === params.session_type);
  if (params.status) rows = rows.filter((s) => s.custom_status === params.status);
  // Le décompte-avant-chargement, sous le MÊME périmètre — pas un second contrat.
  if (Number(params.count_only)) return { count: rows.length };
  return rows.map(enrich);
}

export function schedule(params = {}) {
  if (params.__empty) return null;
  const s = SESSIONS.find((x) => x.name === params.name);
  if (!s) {
    throw Object.assign(new Error('Séance introuvable : ' + params.name + '.'),
      { code: 'NOT_FOUND', status: 404 });
  }
  return { ...enrich(s), program: 'L2 Génie logiciel', custom_j7_override_reason: null };
}

/** La semaine, pour la grille temporelle. Les jours viennent d'ici, pas de l'écran. */
export function planningWeek(params = {}) {
  return {
    days: DAYS,
    hours: { from: 8, to: 18, step: 0.5 },
    items: schedules(params),
  };
}

/**
 * `get_module_planning_summary(course)` — alloué contre planifié par type.
 *
 * ⚠️ Les heures planifiées sont SOMMÉES sur les séances, jamais déclarées. Et un
 * type sans allocation est absent : zéro heure prévue n'est pas un manque.
 */
const ALLOCATIONS = {
  'INF-204': { CM: 24, TD: 36, TP: 24 },
  'RES-102': { CM: 20, TP: 32 },
  'MAT-118': { CM: 24, TD: 36 },
  'INF-207': { CM: 24, TD: 24 },
};

export function modulePlanningSummary(params = {}) {
  const course = params.course || 'INF-204';
  const alloc = ALLOCATIONS[course] || {};
  if (params.__empty) return { course, by_type: [], group_plans: [] };
  const by_type = Object.entries(alloc).map(([type, allocated_hours]) => {
    const planned_hours = SESSIONS
      .filter((s) => s.course === course && s.custom_session_type === type
        && s.custom_status !== 'Annulé')
      .reduce((sum, s) => sum + hoursOf(s), 0);
    return {
      session_type: type,
      allocated_hours,
      planned_hours,
      remaining_hours: allocated_hours - planned_hours,
    };
  });
  return {
    course,
    course_name: (SESSIONS.find((s) => s.course === course) || {}).course_name || course,
    heures_totales: Object.values(alloc).reduce((a, b) => a + b, 0),
    by_type,
    group_plans: [],
  };
}

function hoursOf(s) {
  const [h1, m1] = s.from_time.split(':').map(Number);
  const [h2, m2] = s.to_time.split(':').map(Number);
  return (h2 * 60 + m2 - h1 * 60 - m1) / 60;
}

/**
 * `check_schedule_conflicts(...)` — LECTURE PURE, trois axes.
 *
 * ⚠️ Les axes SALLE et ENSEIGNANT sont volontairement cross-filière : « détecter
 * le conflit d'une ressource PARTAGÉE est l'objet même de la vue ». Une ligne
 * peut donc nommer une séance d'une filière que le lecteur ne voit pas.
 */
export function scheduleConflicts(params = {}) {
  const date = params.schedule_date || '2026-09-16';
  const from = params.from_time || '10:00';
  const to = params.to_time || '12:00';
  const overlaps = (s) => s.schedule_date === date && s.custom_status !== 'Annulé'
    && s.from_time < to && s.to_time > from;
  const rows = SESSIONS.map(enrich).filter(overlaps);
  const conflicts = {};
  if (params.student_group) {
    conflicts.student_group = rows.filter((s) => s.student_group === params.student_group);
  }
  if (params.instructor) {
    conflicts.instructor = rows.filter((s) => s.instructor === params.instructor)
      .map((s) => ({ ...s, cross_program: s.student_group === 'SG-L2GL-B' }));
  }
  if (params.room) conflicts.room = rows.filter((s) => s.room === params.room);
  return {
    schedule_date: date, from_time: from, to_time: to,
    conflicts,
    has_conflicts: Object.values(conflicts).some((v) => v && v.length),
  };
}

/**
 * `publish_schedules(schedules, override_reason)` — rapport de masse.
 *
 * ⚠️ LA GARDE DU PRÉAVIS MORD PAR SÉANCE, pas par lot : une ligne revient
 * `j7_derogation_required` tandis que les autres sont publiées. Succès partiel au
 * sens strict, et courant.
 *
 * ⚠️ `retry_ids` ne contient QUE les rejouables — « une dérogation peut être
 * accordée ; un introuvable restera introuvable ».
 */
export function publishReport(params = {}) {
  const names = params.schedules
    || SESSIONS.filter((s) => s.custom_planning_status === 'Brouillon').map((s) => s.name);
  const rows = names.map((name) => {
    const s = SESSIONS.find((x) => x.name === name);
    if (!s) return { schedule: name, status: 'not_found', message: 'Séance introuvable.' };
    if (s.custom_planning_status === 'Publié') return { schedule: name, status: 'already_published' };
    // Seule une ÉPREUVE tombe sous le préavis. Un TP n'y tombe plus.
    if (s.is_exam && !params.override_reason) {
      return {
        schedule: name, status: 'j7_derogation_required', min_days: 7,
        message: 'Une épreuve se publie au moins sept jours ouvrables avant sa tenue. '
          + 'La dérogation exige un motif et le rôle Directeur des Études.',
      };
    }
    return { schedule: name, status: 'published', custom_portal_published: 1 };
  });
  const OK = new Set(['published', 'already_published']);
  const retryable = new Set(['j7_derogation_required']);
  // F3-FORMES : LE CONTRAT DE MASSE serveur (make_batch_report + rows compat).
  const succeeded = rows.filter((r) => OK.has(r.status));
  const failed = rows.filter((r) => !OK.has(r.status));
  return {
    total: rows.length,
    succeeded_count: succeeded.length,
    failed_count: failed.length,
    succeeded, failed,
    retry_ids: rows.filter((r) => retryable.has(r.status)).map((r) => r.schedule),
    rows,
  };
}

/** `get_instructor_day_load(instructor, day)`. */
export function instructorDayLoad(params = {}) {
  const rows = SESSIONS.map(enrich)
    .filter((s) => s.instructor === params.instructor && s.custom_status !== 'Annulé');
  return {
    instructor: params.instructor,
    day: params.day || '2026-09-16',
    hours: rows.reduce((a, s) => a + hoursOf(s), 0),
    sessions: rows,
  };
}

/**
 * `list_tp_requalification_candidates(limit)` — LECTURE SEULE, geste de runbook.
 *
 * « TP est sorti des types d'épreuve — les séances TP qui étaient de VRAIES
 * épreuves ont perdu préavis et convocation : le système présente les INDICES. »
 * Le système ne requalifie rien seul.
 */
export function tpRequalification(params = {}) {
  if (params.__empty) return { items: [] };
  return {
    items: [
      { schedule: 'CS-0203', course: 'RES-102', course_name: 'Réseaux',
        schedule_date: '2026-03-12', student_group: 'SG-L2GL-RES',
        indices: ['une fiche d’examen existe pour cette date',
                  'une convocation a été envoyée aux étudiants'] },
      { schedule: 'CS-0217', course: 'INF-204', course_name: 'Programmation objet',
        schedule_date: '2026-04-02', student_group: 'SG-L2GL-A',
        indices: ['des notes ont été saisies sur cette séance'] },
    ],
  };
}

/** `list_exam_schedules(...)` — inscrire n'est pas convoquer. */
export function examSchedules(params = {}) {
  if (params.__empty) return [];
  return [
    { name: 'EX-0044', course: 'MAT-118', course_name: 'Probabilités',
      schedule_date: '2026-09-17', from_time: '08:00', to_time: '11:00',
      room: 'Amphi A', exam_type: 'Écrit', student_count: 44,
      custom_planning_status: 'Publié', custom_status: 'Confirmé' },
    { name: 'EX-0045', course: 'INF-204', course_name: 'Programmation objet',
      schedule_date: '2026-09-24', from_time: '08:00', to_time: '10:00',
      room: 'Amphi B', exam_type: 'Écrit', student_count: 0,
      // ⚠️ Zéro candidat ET en brouillon : la liste se compose avant publication,
      // et c'est la publication qui convoque.
      custom_planning_status: 'Brouillon', custom_status: 'Planifié' },
  ];
}
