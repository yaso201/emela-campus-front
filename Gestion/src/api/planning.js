/**
 * Grappe 5 · planning et examens.
 *
 * ⚠️ TOUS LES NOMS SONT LUS dans `portal_app/api/academic/planning_mgmt.py` et
 * `exam_mgmt.py` — surfaces MINCES, onze et sept points whitelistés, gardes en
 * première ligne du service. Aucun nom inventé.
 *
 * Ce que la lecture a appris, et qu'aucune liste de noms n'aurait dit :
 *
 * 1. LES DEUX STATUTS SONT DEUX CHAMPS. `custom_status` porte le cycle de la
 *    séance (Planifié → Confirmé → Réalisé, ou Annulé) ; `custom_planning_status`
 *    porte sa publication (Brouillon / Publié / Modifié). « Une séance annulée
 *    reste publiée » n'est donc pas une convention d'écran : c'est la forme du
 *    modèle. L'écran doit montrer LES DEUX, jamais l'un à la place de l'autre.
 *
 * 2. LA PROVENANCE DE L'ENSEIGNANT EST DÉRIVÉE, JAMAIS STOCKÉE.
 *    `get_schedule` rend `instructor_service_source`, calculé à la lecture —
 *    « même après remplacement : toujours vraie ». L'écran n'a donc rien à
 *    déduire, et surtout rien à mémoriser.
 *
 * 3. LA PROPOSITION SE FAIT PAR TYPE D'ACTIVITÉ, À LA CRÉATION.
 *    `create_schedule` appelle `suggested_instructor_for(course, group,
 *    activity_type=custom_session_type)` quand aucun enseignant n'est fourni, et
 *    rend `instructor_source` : « choisi » si l'appelant l'a nommé,
 *    « répartition » si la ligne de service l'a proposé. Jamais une contrainte —
 *    un enseignant explicite gagne toujours.
 *
 * 4. LES CONFLITS SONT UNE VUE, PAS UNE GARDE. `check_schedule_conflicts` est
 *    « lecture pure : le point d'enforcement reste `validate_overlap` au save ».
 *    C'est exactement le contrat que la grille temporelle attendait.
 */
import { call } from './client.js';

const PLAN = 'portal_app.api.academic.planning_mgmt.';
const EXAM = 'portal_app.api.academic.exam_mgmt.';

/* ─── Séances · lecture ──────────────────────────────────────────────────── */

/**
 * Les séances d'une semaine, d'un groupe, d'un module ou d'un enseignant.
 * 🟢 `planning_mgmt.py:27` — `list_schedules(student_group, course, instructor,
 * room, program, date_from, date_to, planning_status, session_type, status,
 * limit, count_only)`.
 *
 * ⚠️ `count_only=1` rend `{count}` « sous les MÊMES gardes et le MÊME périmètre —
 * l'écran annonce le volume pendant le chargement ». Le décompte-avant-chargement
 * du châssis est donc porté par le serveur, sur ce point d'entrée même.
 *
 * ⚠️ Le scope d'un rôle par filière est FAIL-CLOSED et SILENCIEUX en liste : un
 * groupe hors périmètre rend `[]`, sans erreur. L'écran ne doit donc pas lire une
 * liste vide comme « rien cette semaine » sans dire qu'un filtre de portée
 * s'applique — c'est le vide crédible, encore.
 */
/**
 * ⚠️ FORMES (F3-FORMES) — la SIGNATURE fait foi : year/term NE PARTENT PLUS
 * (décision actée : la liste se filtre par DATES) ; `day` et `is_exam` sont
 * de l'AFFICHAGE, dérivés ici de schedule_date / custom_session_type ; la
 * provenance arrive du serveur par ligne (exposée F3-FORMES).
 */
const EXAM_SESSION_TYPES = new Set(['DS', 'CC', 'EXM', 'ORAL', 'Colle', 'Soutenance']);
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
export const listSchedules = async (p) => {
  const q = { ...p };
  delete q.academic_year; delete q.term;
  const rows = await call(PLAN + 'list_schedules', q);
  return (rows || []).map((r) => ({
    ...r,
    day: r.schedule_date ? DAY_KEYS[new Date(r.schedule_date + 'T00:00:00').getDay()] : r.day,
    is_exam: EXAM_SESSION_TYPES.has(r.custom_session_type),
  }));
};

/**
 * Une séance, avec la provenance de son enseignant.
 * 🟢 `planning_mgmt.py:44` — `get_schedule(name)`.
 *
 * Rend en plus des champs de liste : `instructor_service_source` (dérivée),
 * `custom_j7_override_reason`, `program`, `custom_programs[]`.
 */
export const getSchedule = (p) => call(PLAN + 'get_schedule', p);

/**
 * Alloué contre planifié, par type de séance, pour un module.
 * 🟢 `planning_mgmt.py:50` — `get_module_planning_summary(course)`.
 *
 * Rend `{ heures_totales, by_type: [{ session_type, allocated_hours,
 * planned_hours, … }], group_plans }` — « mêmes définitions que la validation
 * V1-CRS-09, fonctions importées de l'override : zéro duplication de règle ».
 *
 * ⚠️ Un type d'activité sans allocation est ABSENT de `by_type` (`if allocated is
 * None: continue`) — pas rendu à zéro. C'est la règle du lot 6 côté serveur :
 * zéro heure prévue n'est pas un manque. L'écran ne doit donc pas compléter la
 * liste par les types qu'il connaît.
 */
export const getModulePlanningSummary = (p) =>
  call(PLAN + 'get_module_planning_summary', p);

/**
 * Les conflits d'une case horaire, avant création.
 * 🟢 `planning_mgmt.py:56` — `check_schedule_conflicts(schedule_date, from_time,
 * to_time, student_group, instructor, room, exclude)`.
 *
 * Rend `{ conflicts: { student_group[], instructor[], room[] }, has_conflicts }`.
 *
 * ⚠️ Trois axes, et ils ne se valent pas : le scope par filière s'applique à
 * l'axe GROUPE, tandis que les axes SALLE et ENSEIGNANT restent volontairement
 * cross-filière — « détecter le conflit d'une ressource PARTAGÉE est l'objet même
 * de la vue ». Un conflit d'enseignant peut donc nommer une séance d'une filière
 * que le lecteur ne voit pas : l'écran doit le dire plutôt que d'afficher une
 * ligne muette.
 *
 * ⚠️ Il faut AU MOINS un axe, sinon la fonction lève.
 */
export const checkScheduleConflicts = (p) => call(PLAN + 'check_schedule_conflicts', p);

/**
 * La charge d'un enseignant sur une journée.
 * 🟢 `planning_mgmt.py:104` — `get_instructor_day_load(instructor, day)`.
 */
export const getInstructorDayLoad = (p) => call(PLAN + 'get_instructor_day_load', p);

/**
 * La liste de requalification des travaux pratiques.
 * 🟢 `planning_mgmt.py:98` — `list_tp_requalification_candidates(limit)`.
 *
 * ⚠️ LECTURE SEULE, et geste de RUNBOOK à la mise en service : « TP est sorti des
 * types d'épreuve — les séances TP qui étaient de VRAIES épreuves ont perdu
 * préavis et convocation ; le système présente les INDICES ». Le système ne
 * requalifie rien tout seul, et l'écran ne doit pas suggérer qu'il le ferait.
 */
export const listTpRequalificationCandidates = (p) =>
  call(PLAN + 'list_tp_requalification_candidates', p);

/* ─── Séances · écriture [GA (+SM)] ──────────────────────────────────────── */

/**
 * Créer une séance.
 * 🟢 `planning_mgmt.py:70` — `create_schedule(values)`.
 *
 * Rend `{ name, custom_status, custom_planning_status, instructor,
 * instructor_source }`.
 *
 * ⚠️ `instructor_source` vaut « choisi », « répartition », ou `null` quand aucune
 * ligne de service n'a proposé personne. Les trois cas se distinguent à l'écran :
 * un enseignant sans provenance n'est pas un enseignant proposé.
 */
export const createSchedule = (p) => call(PLAN + 'create_schedule', p);

/**
 * Modifier une séance.
 * 🟢 `planning_mgmt.py:76` — `update_schedule(name, values)`.
 *
 * ⚠️ « L'édition d'une séance PUBLIÉE repasse Modifié avec trace — machine du
 * contrôleur. » Le front ne pose pas ce statut : il le LIT dans la réponse. Une
 * modification n'est donc jamais silencieuse pour les étudiants qui ont déjà vu
 * la séance.
 */
export const updateSchedule = (p) => call(PLAN + 'update_schedule', p);

/**
 * Changer le statut d'une séance — dont l'annulation.
 * 🟢 `planning_mgmt.py:82` — `set_schedule_status(name, status, reason)`.
 *
 * ⚠️ Ce point d'entrée ne touche QUE `custom_status`. Annuler ne dépublie pas :
 * c'est ici que « la séance annulée reste publiée » devient vérifiable, et non
 * une promesse d'écran.
 *
 * ⚠️ Le motif est FACULTATIF côté serveur (tracé en Comment). L'écran peut
 * l'exiger pour une annulation — mais il doit alors savoir qu'il ajoute une règle
 * d'interface, non qu'il relaie une règle serveur.
 */
export const setScheduleStatus = (p) => call(PLAN + 'set_schedule_status', p);

/**
 * Affecter un enseignant à plusieurs séances.
 * 🟢 `planning_mgmt.py:88` — `assign_instructor(schedules, instructor)`.
 * Rend `{ instructor, rows }`.
 */
export const assignScheduleInstructor = (p) => call(PLAN + 'assign_instructor', p);

/**
 * PUBLIER — et la dérogation de préavis.
 * 🟢 `planning_mgmt.py:94` — `publish_schedules(schedules, override_reason)`.
 *
 * Rend un rapport de masse au contrat commun : `{ total, ok, ko, retry_ids,
 * rows }`.
 *
 * ⚠️ La garde du préavis MORD PAR SÉANCE, pas par lot : une ligne peut revenir
 * `j7_derogation_required` avec son message et `min_days`, tandis que les autres
 * sont publiées. C'est un succès partiel au sens strict — et il est courant, pas
 * exceptionnel.
 *
 * ⚠️ `retry_ids` ne contient QUE les rejouables : « une dérogation J-7 peut être
 * accordée ; un introuvable restera introuvable ». L'écran ne doit donc pas
 * offrir de tout réessayer.
 *
 * ⚠️ La dérogation exige le rôle Directeur des Études CHEZ L'APPELANT — donc
 * `derogate:planning` commande la présence du champ de motif, pas du bouton de
 * publication.
 */
/** ⚠️ FORMES — le CONTRAT DE MASSE serveur, mappé pour le composant
 * (ok/ko/lines ← succeeded_count/failed_count/rows). */
export const publishSchedules = async (p) => {
  const d = await call(PLAN + 'publish_schedules', p);
  return d && { ...d, ok: d.succeeded_count, ko: d.failed_count, lines: d.rows };
};

/* ─── Examens ────────────────────────────────────────────────────────────── */

/** 🟢 `exam_mgmt.py:25` — `list_exam_schedules(program, academic_year, academic_term, …)`. */
/** ⚠️ FORMES — `term` du contexte → `academic_term` (déclaré) ; le statut de
 * publication vient de la SÉANCE LIÉE (null explicite sans lien —
 * has_linked_schedule distingue les deux faits). */
export const listExamSchedules = (p) =>
  call(EXAM + 'list_exam_schedules', {
    program: p && p.program, academic_year: p && p.academic_year,
    academic_term: p && (p.academic_term || p.term),
    course: p && p.course, date_from: p && p.date_from, date_to: p && p.date_to,
  });

/** 🟢 `exam_mgmt.py:36` — `get_exam_schedule(name)`. */
export const getExamSchedule = (p) => call(EXAM + 'get_exam_schedule', p);

/** 🟢 `exam_mgmt.py:42` — `create_exam_schedule(values)`. ÉCRITURE. */
export const createExamSchedule = (p) => call(EXAM + 'create_exam_schedule', p);

/** 🟢 `exam_mgmt.py:48` — `update_exam_schedule(name, values)`. ÉCRITURE. */
export const updateExamSchedule = (p) => call(EXAM + 'update_exam_schedule', p);

/**
 * Inscrire des candidats à une épreuve.
 * 🟢 `exam_mgmt.py:54` — `add_exam_students(exam_schedule, students)`. ÉCRITURE.
 *
 * ⚠️ INSCRIRE N'EST PAS CONVOQUER. Ces points d'entrée composent la liste des
 * candidats ; la convocation naît de la PUBLICATION de la séance d'examen. Un
 * écran qui dit « convoquer » sur ce bouton promet un acte qu'il ne fait pas.
 */
export const addExamStudents = (p) => call(EXAM + 'add_exam_students', p);

/** 🟢 `exam_mgmt.py:60` — `remove_exam_students(exam_schedule, students)`. ÉCRITURE. */
export const removeExamStudents = (p) => call(EXAM + 'remove_exam_students', p);

/**
 * Peupler la liste des candidats depuis un groupe.
 * 🟢 `exam_mgmt.py:66` — `populate_exam_students_from_group(exam_schedule,
 * student_group)`. ÉCRITURE — acte de masse, rapport ligne à ligne.
 */
/** ⚠️ FORMES — le CONTRAT DE MASSE serveur, mappé pour le composant. */
export const populateExamStudentsFromGroup = async (p) => {
  const d = await call(EXAM + 'populate_exam_students_from_group', p);
  return d && { ...d, ok: d.succeeded_count, ko: d.failed_count, lines: d.rows };
};
