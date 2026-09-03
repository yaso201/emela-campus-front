/**
 * Grappe 6 · notes, moyennes de module, délibération.
 *
 * ⚠️ TOUS LES NOMS SONT LUS dans `portal_app/api/academic/` — `grade_control.py`
 * (sept points), `module_grade.py` (trois), `deliberation_mgmt.py` (sept).
 * Surfaces MINCES, gardes en première ligne du service. Aucun nom inventé, et
 * jamais la fonction du vendor derrière : la surface mince est la seule qui porte
 * le scope et les gardes de rôle.
 *
 * ═══ CE QUE LA LECTURE A APPRIS, ET QUI CHANGE LES ÉCRANS ═══
 *
 * 1. LE MAKER-CHECKER DE LA DÉLIBÉRATION VIT AU CONTRÔLEUR, PAS DANS L'ÉCRAN.
 *    « L'EM INSTRUIT (create/jury/start/décisions) ; la CLÔTURE est réservée à
 *    {Directeur des Études, Direction} ≠ créateur, jury enregistré. » Trois
 *    conditions, dont une — **≠ créateur** — que le front ne peut pas évaluer
 *    seul : il ne sait pas qui a créé la délibération avant de l'avoir lue.
 *    L'écran affiche donc le bouton de clôture selon la permission, et le refus
 *    qui fait autorité reste au serveur.
 *
 * 2. LE TABLEAU DE JURY NE LISTE QUE LES DÉCISIONS DÉJÀ INSTRUITES.
 *    `get_deliberation_dashboard` itère `doc.decisions` — les étudiants sans
 *    décision instruite n'y sont PAS. Ma maquette du lot 8 montrait quatre-vingt-
 *    seize étudiants dont onze décidés : ce point d'entrée n'en rend que onze.
 *    C'est un manque nommé, et il est structurant (voir §6.4 du relevé).
 *
 * 3. LA MOYENNE ANNUELLE EST INDICATIVE, JAMAIS BLOQUANTE. « Art. 33 — fonctions
 *    moteur réveillées ». L'écran ne doit pas la présenter comme un résultat
 *    arrêté : c'est un calcul d'aide à la décision.
 *
 * 4. L'ASSIDUITÉ EST UN FLAG POSÉ À L'INSTRUCTION, et la dérogation motivée est
 *    exigée À LA CLÔTURE pour un passage en dépassement. Deux moments distincts —
 *    « le jury reste souverain, Art. 31.2 ».
 */
import { call } from './client.js';

const GC = 'portal_app.api.academic.grade_control.';
const MG = 'portal_app.api.academic.module_grade.';
const DL = 'portal_app.api.academic.deliberation_mgmt.';

/* ─── Contrôle des notes [Education Manager (+SM)] ───────────────────────── */

/**
 * LA FILE DE CONTRÔLE — et le croisement notes ↔ assiduité.
 * 🟢 `grade_control.py:44` — `list_submissions_for_control(status, course,
 * student_group, evaluation_component, limit, include_attendance)`.
 *
 * ⚠️ `include_attendance=1` EST L'AMENDEMENT A7 DU LOT 8, et il existait déjà.
 * La docstring serveur dit la phrase que la maquette avait écrite :
 *
 *   « au contrôle, un zéro d'évaluation ne se lit pas comme un zéro d'absence
 *     (Art. 12.3) »
 *
 * Chaque ligne de note reçoit alors `unexcused_absences` et `attendance_rows` —
 * « mêmes rôles, aucune donnée nouvelle : un croisement ».
 *
 * ⚠️ L'assiduité porte sur LE MODULE, toutes séances confondues — jointure
 * `Student Attendance ↔ Course Schedule du cours`. Pas sur la composante soumise :
 * la correspondance composante ↔ type d'activité n'est pas fiable, et c'est
 * pourquoi le signalement dit « probable ».
 *
 * ⚠️ `student_count` est renseigné POUR CHAQUE LIGNE, même sans le croisement :
 * l'écran annonce le volume sans charger le détail.
 */
/**
 * ⚠️ FORMES (F3-FORMES) — l'appel et la réponse, alignés à la SIGNATURE :
 * — `academic_year` est DÉCLARÉ ET APPLIQUÉ par le serveur (jointure
 *   groupes) ; `term` N'EST PLUS ENVOYÉ : les groupes sont annuels (décision
 *   grappe 4) — il partait dans le vide (V-LEARN-F3-14) ;
 * — le serveur nomme l'assiduité SUR LE MODULE `*_on_course` : mappée ICI
 *   pour l'écran (le simulacre rend la forme SERVEUR — il disait le faux).
 */
export const listSubmissionsForControl = async (p) => {
  const rows = await call(GC + 'list_submissions_for_control', {
    status: p && p.status, course: p && p.course,
    student_group: p && p.student_group,
    evaluation_component: p && p.evaluation_component,
    include_attendance: p && p.include_attendance,
    academic_year: p && p.academic_year,
  });
  return (rows || []).map((r) => ({
    ...r,
    lines: (r.lines || []).map((l) => ({
      ...l,
      unexcused_absences: l.unexcused_absences_on_course,
      attendance_rows: l.attendance_rows_on_course,
    })),
  }));
};

/** 🟢 `:20` — `receive_submission(name)`. ÉCRITURE. */
export const receiveSubmission = (p) => call(GC + 'receive_submission', p);

/** 🟢 `:26` — `process_submission(name)`. ÉCRITURE. */
export const processSubmission = (p) => call(GC + 'process_submission', p);

/** 🟢 `:32` — `integrate_submission(name)`. ÉCRITURE. */
export const integrateSubmission = (p) => call(GC + 'integrate_submission', p);

/**
 * RENVOYER — un seul acte, avec son motif.
 * 🟢 `:38` — `reject_submission(name, reason)`.
 *
 * ⚠️ **Renvoyer et rejeter sont le même acte serveur** : un point d'entrée, un
 * motif obligatoire. La catégorie que l'écran demande oriente le travail de
 * l'enseignant ; elle ne change pas la nature de l'acte, et elle voyage dans
 * `reason`. Deux boutons auraient promis deux actes.
 */
export const rejectSubmission = (p) => call(GC + 'reject_submission', p);

/**
 * Décision sur une demande de modification de note.
 * 🟢 `:56` — `decide_modification(name, decision, reason)`.
 * Gardée par un rôle DISTINCT du contrôle : EM/PM (+SM).
 */
export const decideModification = (p) => call(GC + 'decide_modification', p);

/**
 * L'échéance de saisie, par composante.
 * 🟢 `:62` — `set_module_deadline(course, evaluation_component, deadline_date)`.
 *
 * ⚠️ « DEC-289 — pose la deadline EXPLICITE par composante sur le module.
 * Prioritaire sur "dernière séance". » Donc une échéance absente n'est pas une
 * absence d'échéance : elle retombe sur la dernière séance planifiée. L'écran doit
 * dire laquelle des deux règles s'applique, sinon un enseignant croit avoir le
 * temps.
 */
export const setModuleDeadline = (p) => call(GC + 'set_module_deadline', p);

/* ─── Moyennes de module ─────────────────────────────────────────────────── */

/** 🟢 `module_grade.py:21` — `propose_module_average(course, student_group)`. ÉCRITURE. */
export const proposeModuleAverage = (p) => call(MG + 'propose_module_average', p);

/**
 * 🟢 `:27` — `validate_module_average(course, student_group, decisions)`.
 * ÉCRITURE. `decisions` porte les ajustements ligne à ligne.
 */
export const validateModuleAverage = (p) => call(MG + 'validate_module_average', p);

/**
 * Les moyennes AJUSTÉES — celles où le jury ou l'EM a écarté le calcul.
 * 🟢 `:33` — `list_adjusted_module_averages(course, student, limit)`.
 *
 * ⚠️ Une liste d'écarts n'est pas une liste d'erreurs : un ajustement est un acte
 * motivé. L'écran ne doit pas en faire un signalement.
 */
export const listAdjustedModuleAverages = (p) =>
  call(MG + 'list_adjusted_module_averages', p);

/* ─── Délibération ──────────────────────────────────────────────────────── */

/**
 * LE TABLEAU DE JURY.
 * 🟢 `deliberation_mgmt.py:62` — `get_deliberation_dashboard(name)`.
 *
 * Retour :
 *
 *     { name, status, program, academic_term,
 *       jury_members: [{ member_role, user }],
 *       rows: [{ student, decision, new_academic_status,
 *                attendance_exceeded, attendance_derogation_reason, attendance,
 *                semester_result: { total_ects_earned, total_ects_possible,
 *                                   semester_validated, all_mhc_validated,
 *                                   jury_decision },
 *                ue_results: [{ course_ue, academic_term, ue_average,
 *                               is_validated, is_compensated,
 *                               has_floor_violation, ects_earned, ects_grade,
 *                               is_after_retake, is_jury_validated }],
 *                annual_average,
 *                cps_history: { preconisations: [{ kind, academic_term, status,
 *                                                  details, finding, closed_on }],
 *                               unjustified_cps_absences: [{ session,
 *                                                            academic_term,
 *                                                            session_date }] } }] }
 *
 * ⚠️ **`cps_history` EST L'AJOUT LE PLUS IMPORTANT DU LOT 8, ET IL EXISTE.** La
 * docstring serveur porte la même intention que la maquette :
 *
 *   « Le jury voit tout (Art. 32.4) : les préconisations du CPS (avec le constat
 *     du contrat) et l'absence NON justifiée à une convocation (32.5) — des
 *     INFORMATIONS présentées au jury, jamais des décisions (32.3). »
 *
 * `finding` est le constat du contrat de remédiation ; `closed_on` dit s'il a été
 * posé. Une préconisation sans constat se lit **telle quelle** — le jury la lit,
 * elle ne le bloque pas.
 *
 * ⚠️ L'historique est lu sur TOUS LES SEMESTRES DE L'ANNÉE, pas sur le semestre
 * délibéré : c'est ce qui fait que l'alerte de janvier éclaire la décision de
 * juillet.
 *
 * ⚠️ **`rows` NE PORTE QUE LES DÉCISIONS DÉJÀ INSTRUITES** — voir l'en-tête, §2.
 */
export const getDeliberationDashboard = (p) =>
  call(DL + 'get_deliberation_dashboard', p);

/** 🟢 `:22` — `create_deliberation(...)`. ÉCRITURE, instruction EM. */
export const createDeliberation = (p) => call(DL + 'create_deliberation', p);

/** 🟢 `:32` — `add_jury_member(deliberation, member_role, user)`. ÉCRITURE. */
export const addJuryMember = (p) => call(DL + 'add_jury_member', p);

/** 🟢 `:38` — `start_deliberation(name)`. ÉCRITURE. */
export const startDeliberation = (p) => call(DL + 'start_deliberation', p);

/**
 * Instruire une décision.
 * 🟢 `:44` — `add_decision(deliberation, student, semester_result, decision,
 * new_academic_status, decision_reason, attendance_derogation_reason)`.
 *
 * ⚠️ `attendance_derogation_reason` est accepté ICI, à l'instruction, **et exigé à
 * la clôture** pour un passage en dépassement d'absences. Deux moments : le flag
 * est posé à l'instruction, le motif est réclamé au moment de clore. L'écran peut
 * donc le recueillir tôt — mais il ne doit pas laisser croire que l'avoir saisi
 * dispense de la vérification à la clôture.
 */
export const addDecision = (p) => call(DL + 'add_decision', p);

/**
 * Décision de jury sur une UNITÉ.
 * 🟢 `:56` — `apply_jury_ue_decision(deliberation, ue_result, kind, basis)`.
 *
 * ⚠️ Distincte de la décision sur l'étudiant : le jury peut valider une unité sans
 * trancher le sort de l'étudiant. C'est `is_jury_validated` sur l'UE Result.
 */
export const applyJuryUeDecision = (p) => call(DL + 'apply_jury_ue_decision', p);

/**
 * CLORE — l'acte gardé par le maker-checker.
 * 🟢 `:68` — `close_deliberation(name)`.
 *
 * ⚠️ Trois conditions AU CONTRÔLEUR : (a) ≠ créateur, (b) Directeur des Études ou
 * Direction, (c) jury enregistré. La première ne peut pas être évaluée au front —
 * l'écran affiche le bouton selon `close:deliberation` et laisse le serveur
 * refuser. Un refus de droit ici n'est pas une erreur : c'est le maker-checker qui
 * fonctionne, et l'écran doit le dire dans ces mots.
 *
 * ⚠️ La clôture propage les résultats et **gèle le procès-verbal**
 * (`pv_attachment`). Elle n'est pas réversible depuis l'interface.
 */
export const closeDeliberation = (p) => call(DL + 'close_deliberation', p);
