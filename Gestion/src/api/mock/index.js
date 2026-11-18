/**
 * Simulacre de serveur — fait tourner l'application sans branchement.
 * Une seule table : nom du point d'entrée → fonction. Les formes rendues sont
 * celles du manifeste des appels ; quand le branchement arrivera, ce dossier
 * disparaît sans toucher aux vues.
 *
 * ⚠️ LES CLÉS SONT LES VRAIS CHEMINS, préfixés du module qui les expose. La
 * grappe 4 les portait NUS ou visait le vendor `education.*` : les fonctions
 * existaient, mais sous les gardes de personne. Les surfaces minces de
 * `portal_app.api.academic.*` sont les bonnes — c'est là que vivent le scope par
 * filière et les gardes de rôle.
 *
 * La latence simulée n'est pas une coquetterie : elle rend l'état de chargement
 * visible en développement, et c'est là qu'on découvre qu'on l'avait oublié.
 */
import { denied } from '../client.js';
import * as F from './fixtures.js';
import * as G from './fixtures-groupes.js';
import * as P from './fixtures-planning.js';
import * as N from './fixtures-notes.js';
import * as D from './fixtures-dossiers.js';
import * as C from './fixtures-conseil.js';
import * as Z from './fixtures-fin-de-cycle.js';
import * as K from './fixtures-charpente.js';


const LATENCY = 260;

const ST = 'portal_app.api.academic.structure.';
const GR = 'portal_app.api.academic.groups.';
const EN = 'portal_app.api.academic.enrollment_mgmt.';
const PL = 'portal_app.api.academic.planning_mgmt.';
const EX = 'portal_app.api.academic.exam_mgmt.';
const GC = 'portal_app.api.academic.grade_control.';
const MG = 'portal_app.api.academic.module_grade.';
const DL = 'portal_app.api.academic.deliberation_mgmt.';
const EW = 'portal_app.api.academic.early_warning.';

/* ── MANDAT-12 (maquettes M5, M6) — `?as=` choisit le lecteur ; `?cps=` l'état de la séance. ── */
const query = (k) => new URLSearchParams(location.search).get(k);
const readerRoles = () => (query('as') ? (F.sessionAs(query('as')).roles || [])
  : ['Gestionnaire académique', 'Education Manager']);

/** S-18 — un dossier par procédure ; les actes sont filtrés par les rôles du lecteur. */
const S18 = {
  conge: {
    domain: 'coa', doctype: 'Academic Leave Request', status: 'Approuvée', decider_role: 'Directeur des Études',
    machine: { Brouillon: ['Annulée', 'Soumise'], Soumise: ['Annulée', 'En revue'], 'En revue': ['Approuvée', 'Rejetée'],
      Approuvée: ['Rejetée', 'Réactivée'], Rejetée: ['Approuvée'], Annulée: [], Réactivée: [] },
    // C11 (PC1C) : dates cohérentes avec le « 10 septembre 2026 » du simulacre — un congé ouvert en mars 2026.
    detail: { from_date: '2026-03-15', to_date: '2027-03-14', event_date: null, reason: 'Situation familiale documentée',
      force_majeure_reason: null, previous_academic_status: 'ACT', is_second_leave: 0, instructed_by: 'e.mensah@lanem.bj',
      instructed_on: '2026-03-09', decision_by: 's.kouassi@lanem.bj', decision_on: '2026-03-16',
      decision_reason: 'Congé d’un an accordé, premier des deux autorisés.', arbitrated_by: null, arbitrated_on: null,
      arbitration_reason: null, student_academic_status: 'COA' },
    detail_labels: { instructed_by: 'Edwige Mensah', decision_by: 'Serge Kouassi',
      previous_academic_status: 'Actif', student_academic_status: 'Congé académique' },
    acts: [
      { act: 'arbitrateCoaRequest', method: 'academic_leave_request.arbitrate_coa_request', roles: ['Director'], outcomes: ['Rejetée'], requires_reason: true },
      { act: 'reactivateFromCoa', method: 'academic_leave_request.reactivate_from_coa', roles: ['Directeur des Études'], outcomes: null, requires_reason: false },
    ],
  },
  reorientation: {
    domain: 'reorientation', doctype: 'Reorientation Request', status: 'En commission', decider_role: 'Directeur des Études',
    machine: { Brouillon: ['Annulée', 'Soumise'], Soumise: ['Annulée', 'En commission'],
      'En commission': ['Acceptée', 'Rejetée'], Acceptée: [], Rejetée: [], Annulée: [] },
    detail: { case: 'Demande volontaire de réorientation', origin_program: 'LIS', target_program: 'LRC',
      motivation: 'Projet professionnel orienté infrastructure.', mutualization_rate: 62, decided_by: null, decided_on: null,
      decision_reason: null, notified_on: null,
      commission_members: [{ member_role: 'Directeur des Études', user: 's.kouassi@lanem.bj', user_label: 'Serge Kouassi' },
        { member_role: 'Responsable de la formation d’origine', user: 'a.hounsou@lanem.bj', user_label: 'Aline Hounsou' },
        ...(query('reo') === 'complete'
          ? [{ member_role: 'Responsable de la formation visée', user: 'p.zinsou@lanem.bj', user_label: 'Pascal Zinsou' }] : [])],
      commission_missing_roles: query('reo') === 'complete' ? [] : ['Responsable de la formation visée'],
      recognized_credits: [{ source_label: 'UE 2.1 Algorithmique', credits_recognized: 6, basis: 'Programme équivalent' }] },
    detail_labels: { origin_program: 'Licence Informatique et Systèmes', target_program: 'Licence Réseaux et Cloud' },
    acts: [
      { act: 'addCommissionMember', method: 'reorientation.add_commission_member', roles: ['Directeur des Études'], outcomes: null, requires_reason: false },
      { act: 'addCreditRecognition', method: 'reorientation.add_credit_recognition', roles: ['Directeur des Études'], outcomes: null, requires_reason: false },
      // M9 : `?reo=complete` — la commission est complète, la décision est ouverte (acceptation : placement).
      query('reo') === 'complete'
        ? { act: 'decideReorientation', method: 'reorientation.decide_reorientation', roles: ['Directeur des Études'],
          outcomes: ['Acceptée', 'Rejetée'], requires_reason: true }
        : { act: 'decideReorientation', roles: ['Directeur des Études'],
          blocked: 'Art. 42.13 — la commission n’est pas complète. Manquent : Responsable de la formation visée.' },
    ],
  },
  // MANDAT-12 (M9) — un dossier disciplinaire au conseil convoqué : le DE prononce ou clôt.
  discipline: {
    domain: 'discipline', doctype: 'Disciplinary Suspension', status: 'Convoquée', decider_role: 'Directeur des Études',
    machine: { Brouillon: ['Convoquée'], Convoquée: ['Prononcée', 'Sans sanction'], Prononcée: ['Notifiée'],
      'Sans sanction': [], Notifiée: [] },
    detail: { ground_category: 'Comportement répréhensible', ground_details: 'Altercation en salle de TP, rapport du surveillant.',
      convocation_date: '2026-06-26', council_date: '2026-07-04', duration_weeks: null, pronounce_reason: null,
      council_members: [] },
    detail_labels: {},
    acts: [
      { act: 'pronounceDisciplinarySuspension', method: 'discipline.pronounce_disciplinary_suspension',
        roles: ['Directeur des Études'], outcomes: ['Prononcée'], requires_reason: true },
      { act: 'closeWithoutSanction', method: 'discipline.close_without_sanction',
        roles: ['Directeur des Études'], outcomes: ['Sans sanction'], requires_reason: true },
    ],
  },
};
function s18Dossier(p = {}) {
  const item = (D.dossiers({}).items || []).find((i) => i.name === p.name);
  if (!item) throw Object.assign(new Error('Dossier introuvable : ' + p.name + '.'), { status: 404 });
  const spec = S18[item.kind] || { domain: item.kind, status: item.status, machine: {}, detail: {},
    detail_labels: {}, acts: [], decider_role: 'Directeur des Études' };
  const roles = readerRoles();
  const mine = spec.acts.filter((a) => a.roles.some((r) => roles.includes(r)));
  return {
    ...item, domain: spec.domain, doctype: spec.doctype, status: spec.status, decider_role: spec.decider_role,
    machine: spec.machine, detail: spec.detail, detail_labels: spec.detail_labels,
    available_acts: mine.filter((a) => !a.blocked).map(({ act, method, outcomes, requires_reason }) =>
      ({ act, method: 'portal_app.api.academic.' + method, outcomes, requires_reason })),
    blocked_acts: mine.filter((a) => a.blocked).map(({ act, blocked }) => ({ act, reason: blocked })),
    waiting_for_roles: [...new Set(spec.acts.filter((a) => !a.blocked).flatMap((a) => a.roles))],
  };
}

/**
 * S-17 — une séance du conseil, dans l'état choisi par `?cps=` (brouillon, convoquee, tenue).
 * C5 : les dates s'accordent au « 10 septembre » du simulacre ; C7 : une séance ne se tient pas avant sa date.
 */
function s17Session(p = {}) {
  const phase = query('cps') || 'convoquee';
  const status = { brouillon: 'Brouillon', convoquee: 'Convoquée', tenue: 'Tenue' }[phase];
  const date = { brouillon: '2026-09-17', convoquee: '2026-09-10', tenue: '2026-09-08' }[phase];
  const roles = readerRoles();
  const isDe = roles.includes('Directeur des Études');
  const isEm = roles.includes('Education Manager');
  const rows = [
    ['ETU-24-0188', 'Fabrice Ahodékon', 'Retard : 24 ECTS non acquis sur 60 possibles (seuil 20)', [1, 0]],
    ['ETU-24-0203', 'Yasmine Toko', 'Absences : 12 séances non excusées au semestre 1 (seuil 10)', [1, 0]],
    ['ETU-23-0091', 'Serge Bocco', 'Détresse : UE 3.4 Systèmes et réseaux à 5,00/20 (plancher 6)', [1, 0]],
    ['ETU-24-0147', 'Grâce Aïvodji', 'Absences : 16 séances non excusées au semestre 1 (seuil 10)', [0, 1]],
    ['ETU-24-0112', 'Ange Sossou', 'Retard : 21 ECTS non acquis sur 60 possibles (seuil 20)', [0, 0]],
  ];
  const presence = ([pr, un]) => (status !== 'Tenue' ? null
    : pr ? 'present' : un ? 'absent_non_justifie' : 'absent_justifie');
  const convokedOn = status === 'Brouillon' ? null : '2026-09-03';
  const agenda = rows.map(([student, name, , att], i) => ({
    row: 'PCS-ROW-' + i, student, student_name: name, convoked_on: convokedOn, presence: presence(att),
    preconisations: student === 'ETU-23-0091' ? 1 : 0,
  }));
  const subjectRow = rows.find((r) => r[0] === (p.student || 'ETU-23-0091'));
  const subject = subjectRow ? {
    ...agenda.find((a) => a.student === subjectRow[0]), criteria_snapshot: subjectRow[2], notes: null,
    preconisation_list: subjectRow[0] === 'ETU-23-0091'
      ? [{ name: 'PRECO-2026-0004', kind: 'Contrat de remédiation', status: 'Ouverte' }] : [],
  } : null;
  const closeState = status === 'Tenue' ? [false, 'La séance est tenue : elle ne se modifie plus.']
    : status === 'Brouillon' ? [false, 'La séance n’est pas convoquée : l’Education Manager la convoque d’abord.']
      : isDe ? [true, null] : [false, 'Tenir la séance appartient au directeur des études (Art. 32.5).'];
  const convokeState = status !== 'Brouillon' ? [false, 'La séance est déjà convoquée.']
    : isEm ? [true, null] : [false, 'La convocation appartient à l’Education Manager.'];
  return {
    name: 'PCS-2026-0003', status, academic_term: '2026-2027 (S1)', session_date: date,
    members: [], examined: [], convoked_on: convokedOn || '', held_on: status === 'Tenue' ? date : '',
    date, convoked: status === 'Brouillon' ? 0 : rows.length,
    examined_count: status === 'Tenue' ? rows.length : 0, agenda, subject,
    chair: status === 'Tenue' ? { user: 'f.ahoyo@lanem.bj', label: 'Florence Ahoyo' } : null,
    chair_rule: 'Le directeur des études qui tient la séance (Art. 32.5) — connu une fois la séance tenue.',
    can_close: closeState[0], close_blocked_reason: closeState[1],
    can_convoke: convokeState[0], convoke_blocked_reason: convokeState[1],
    unavailable: ['opened_at', 'examined_at', 'program_label'],
  };
}
const SA = 'portal_app.api.academic.service_allocation.';

const HANDLERS = {
  // AN-09 (M3) : fermeture de session — cœur Frappe, no-op en simulacre.
  logout: (p) => ({}),
  // ─── Grappe 1 · châssis ─────────────────────────────────────────────────
  // E3' (maquette) : `?as=rf` ou `?as=de` rend un lecteur SANS les droits de charpente — pour voir la règle 3.
  'portal_app.api.identity.session_context.get_session_context': () =>
    F.sessionAs(new URLSearchParams(location.search).get('as')),
  // MANDAT-12 (M8) : `?ctx=plusieurs` — deux semestres couvrent aujourd'hui (S1 et un semestre de
  // parcours, même date de début) ; le serveur n'en choisit aucun et rend les candidats.
  'portal_app.api.academic.chassis.get_academic_context': () => (
    query('ctx') === 'plusieurs'
      ? { ...F.academicContext,
        terms: [...F.academicContext.terms, { id: 'T-S5-COM', label: 'S5 — parcours COM', parity: 'impair' }],
        current: { year: 'AY-2026', term: null }, candidates: ['T-1', 'T-S5-COM'],
        note: 'Année académique 2026-2027 — plusieurs semestres sont en cours aujourd’hui : choisissez celui de votre travail.' }
      : F.academicContext),
  'portal_app.api.academic.chassis.get_work_queue': (p) => F.workQueue(p),
  'portal_app.api.academic.chassis.get_work_queue_counts': () => F.workQueueCounts,

  // ─── Grappe 2 · structure ───────────────────────────────────────────────
  // F3-FORMES : chaque fixture rend LA FORME SERVEUR (le return réel du .py) —
  // la forme d'écran est reconstruite par les adaptateurs.
  [ST + 'get_structure_tree']: (p) => F.structureTree(p),
  [ST + 'get_ue']: (p) => F.ueDetail(p),
  [ST + 'list_structure_options']: () => F.structureOptions,
  // E3' : le catalogue des filières lit `list_programs(include_inactive=1)` — servi par le simulacre de la
  // charpente (filières du banc) ; les sélecteurs de filière des autres écrans gardent leur simulacre.
  [ST + 'list_programs']: (p) => (p && Number(p.include_inactive) === 1 ? K.programCatalogue(p) : F.programs(p)),
  // Actes M2 g2 — forme serveur inline (UE + cycle de maquette).
  [ST + 'create_ue']: (p) => ({ name: 'UE-MOCK-0001', ue_name: (p.values || {}).ue_name }),
  [ST + 'update_ue']: (p) => ({ name: p && p.ue, ue_name: (p.values || {}).ue_name }),
  // MANDAT-12 (M3) — S-10 et les écritures de module, forme serveur.
  [ST + 'list_ue_module_catalogue']: (p) => ({
    ue: p.ue,
    modules: [
      ...((F.ueDetail({ ue: p.ue }) || {}).modules || []).map((m) => ({
        course: m.course, course_name: m.course_name, module_code: m.custom_module_code,
        coefficient: m.coefficient, module_nature: m.custom_module_nature, attached: true, linked_elsewhere: false })),
      { course: 'INF-209', course_name: 'Génie logiciel avancé', module_code: 'INF-209', coefficient: 2,
        module_nature: 'Standard', attached: false, linked_elsewhere: false },
      { course: 'INF-211', course_name: 'Projet tutoré', module_code: 'INF-211', coefficient: 3,
        module_nature: 'Stage', attached: false, linked_elsewhere: false },
    ],
  }),
  [ST + 'create_module']: () => ({ name: 'INF-299', custom_module_code: 'INF-299' }),
  [ST + 'update_module']: (p) => ({ name: p.course }),
  [ST + 'attach_module_to_ue']: (p) => ({ name: p.ue, validation_status: 'Brouillon' }),
  [ST + 'detach_module_from_ue']: (p) => ({ name: p.ue, validation_status: 'Brouillon' }),
  [ST + 'propose_maquette']: () => ({ proposed: ['UE-MOCK-0001'], count: 1 }),
  [ST + 'validate_maquette']: () => ({ validated: ['UE-MOCK-0001'], count: 1 }),
  [ST + 'return_maquette_to_draft']: () => ({ returned: ['UE-MOCK-0001'], count: 1 }),
  // 🟢 F3-COR S1 : l'usage aval vit AU CHÂSSIS — la clé nue a disparu.
  'portal_app.api.academic.chassis.get_unit_usage': (p) => F.ueDownstreamUsage(p),

  // ─── Grappe 3 · répartition ─────────────────────────────────────────────
  [SA + 'get_service_plan']: (p) => F.servicePlan(p),
  [SA + 'get_service_coverage']: (p) => F.serviceCoverage(p),
  [SA + 'list_service_lines']: (p) => F.serviceLines(p),
  [SA + 'get_service_reconciliation']: (p) => F.serviceReconciliation(p),
  [SA + 'get_instructor_service_summary']: (p) => F.teacherLoad(p),
  [SA + 'list_service_signals']: (p) => F.serviceSignals(p),
  // (get_service_progress : l'adaptateur compose list_service_lines + reconciliation)
  // Actes M2 g3 — mock + point d'appel ENSEMBLE. Réponses en FORME SERVEUR
  // (upsert : écho `applied`/`ignored_fields` ; propose/validate/carry :
  // contrat `batch_report`). Non stateful — le simulacre fait tourner l'écran,
  // il ne persiste rien. Inlinés ici (pas des fixtures exportées : rien à sonder).
  [SA + 'upsert_service_line']: (p) => svcUpsert(p),
  [SA + 'delete_service_line']: (p) => ({ deleted: p && p.name }),
  [SA + 'propose_service_lines']: () => svcProposeReport(),
  [SA + 'validate_service_lines']: (p) => svcValidateReport(p),
  [SA + 'return_service_line']: (p) => ({ name: p && p.name, validation_status: 'Brouillon' }),
  [SA + 'carry_over_service_lines']: () => svcCarryReport(),

  // ─── Grappe 4 · groupes et inscriptions ─────────────────────────────────
  [GR + 'list_groups']: (p) => G.groups(p),
  [GR + 'get_group']: (p) => G.group(p),
  [GR + 'list_group_candidates']: (p) => G.groupCandidates(p),
  [GR + 'get_cohort_overview']: (p) => G.cohortOverview(p),
  [GR + 'get_student_groups']: (p) => G.studentGroupsOf(p),
  // Actes M2 g4 — forme serveur inline (create + batch peuplement + désactivation).
  [GR + 'create_group']: (p) => ({ name: 'SG-MOCK-0001', student_group_name: (p.values || {}).student_group_name }),
  [GR + 'add_students_to_group']: (p) => grpAddReport(p),
  [GR + 'deactivate_students_in_group']: (p) => ({ deactivated: (p.students || []) }),
  // MANDAT-12 (M1) — S-7 et les actes du détail d'un groupe, forme serveur.
  [GR + 'list_assignable_instructors']: (p) => G.assignableInstructors(p),
  [GR + 'update_group']: (p) => ({ name: p.name }),
  [GR + 'set_group_disabled']: (p) => ({ name: p.name, disabled: p.disabled }),
  [GR + 'transfer_student']: (p) => ({ status: 'transferred', student: p.student, from_group: p.from_group, to_group: p.to_group }),
  [GR + 'assign_instructor']: (p) => ({ group: p.group, status: 'assigned' }),
  [GR + 'remove_instructor']: (p) => ({ group: p.group, status: 'removed' }),
  // L'ACTE d'écriture — appelé sur un geste, jamais au chargement d'un écran. (La cascade d'admission
  // `create_student_from_applicant` n'est plus appelée par ce front : MANDAT-10, Q3.)
  [EN + 'replay_enrollment']: (p) => G.enrollmentReport(p),
  // MANDAT-12 (M7) — la complétion pédagogique, forme serveur.
  [EN + 'run_pedagogical_enrollment']: (p) => ({ student: p.student, course_enrollments: 3, groups: 1, skipped: 2 }),
  [EN + 'list_incomplete_enrollments']: (p) => G.enrollmentReplayQueue(p),
  [EN + 'list_moodle_orphans']: (p) => G.moodleOrphans(p),
  // La LECTURE du journal — c'est elle que l'écran du rapport consomme.
  // 🟢 RF-G-01 — apparié au chemin réel (le point d'appel est traduit).
  'portal_app.api.academic.enrollment_mgmt.get_enrollment_log': (p) => G.enrollmentLog(p),

  // ─── Grappe 5 · planning et examens ─────────────────────────────────────
  [PL + 'list_schedules']: (p) => P.schedules(p),
  [PL + 'get_schedule']: (p) => P.schedule(p),
  [PL + 'get_module_planning_summary']: (p) => P.modulePlanningSummary(p),
  [PL + 'check_schedule_conflicts']: (p) => P.scheduleConflicts(p),
  [PL + 'publish_schedules']: (p) => P.publishReport(p),
  // MANDAT-12 (M2) — S-9 et les écritures de séance, forme serveur.
  [PL + 'list_schedule_options']: (p) => P.scheduleOptions(p),
  [PL + 'create_schedule']: (p) => ({ name: 'CS-MOCK-0100', custom_status: 'Planifié', custom_planning_status: 'Brouillon',
    instructor: (p.values || {}).instructor || null, instructor_source: (p.values || {}).instructor ? 'choisi' : 'répartition' }),
  [PL + 'update_schedule']: (p) => ({ name: p.name, custom_status: 'Planifié', custom_planning_status: 'Modifié' }),
  [PL + 'assign_instructor']: (p) => ({ instructor: p.instructor, rows: (p.schedules || []).map((s) => ({ schedule: s, status: 'assigned' })) }),
  // Acte M2 g5 — changement de statut (dont annulation). Forme serveur inline.
  [PL + 'set_schedule_status']: (p) => ({ name: p && p.name, custom_status: p && p.status }),
  [PL + 'get_instructor_day_load']: (p) => P.instructorDayLoad(p),
  [PL + 'list_tp_requalification_candidates']: (p) => P.tpRequalification(p),
  [EX + 'list_exam_schedules']: (p) => P.examSchedules(p),
  [EX + 'get_exam_schedule']: (p) => N.examSchedule(p),
  [EX + 'populate_exam_students_from_group']: (p) => N.examPopulateReport(p),

  // ─── Grappe 6 · notes et délibération ───────────────────────────────────
  [GC + 'list_submissions_for_control']: (p) => N.submissionsForControl(p),
  // Actes M3 g6 — forme serveur inline.
  [GC + 'process_submission']: (p) => ({ name: p && p.name, status: 'En traitement' }),
  [GC + 'integrate_submission']: (p) => ({ name: p && p.name, status: 'Intégrée' }),
  [GC + 'reject_submission']: (p) => ({ name: p && p.name, status: 'Renvoyée' }),
  [DL + 'create_deliberation']: (p) => ({ name: 'DELIB-MOCK-0001', status: 'Brouillon' }),
  [DL + 'add_jury_member']: (p) => ({ name: p && p.deliberation, jury_members: 3 }),
  [DL + 'start_deliberation']: (p) => ({ name: p && p.name, status: 'En cours' }),
  [DL + 'add_decision']: (p) => ({ name: 'DEC-MOCK-0001', decision: p && p.decision }),
  [DL + 'apply_jury_ue_decision']: (p) => ({ ue_result: p && p.ue_result, kind: p && p.kind }),
  [DL + 'close_deliberation']: (p) => ({ name: p && p.name, status: 'Clôturée', pv_attachment: '/mock/pv.md' }),
  [EX + 'remove_exam_students']: (p) => ({ total: 1, succeeded_count: 1, failed_count: 0, succeeded: [{ student: 'ETU-MOCK' , status: 'removed' }], failed: [], retry_ids: [] }),

  [MG + 'list_adjusted_module_averages']: (p) => N.adjustedModuleAverages(p),
  [DL + 'get_deliberation_dashboard']: (p) => N.deliberationDashboard(p),
  [DL + 'list_deliberations']: (p) => N.listDeliberations(p),
  // 🟢 Le manque du roster est COMBLÉ (stabilisation §3.2) : le module d'appel
  // consomme le drapeau du dashboard — la clé nue a disparu avec lui.

  // ─── Grappe 7 · les dossiers ────────────────────────────────────────────
  // 🔴 Les deux lectures transversales sont des manques nommés : aucune surface
  // ne les rend, les lectures serveur sont ÉCLATÉES par procédure.
  'portal_app.api.academic.dossiers_read.list_dossiers': (p) => D.dossiers(p),
  // MANDAT-12 (S-18) : la clé nue disparaît — la lecture unitaire a son chemin serveur.
  'portal_app.api.academic.dossiers_read.get_dossier': (p) => s18Dossier(p),
  // MANDAT-12 (M9) — ouvrir un dossier : les candidats signalés (forme serveur), puis la naissance en Brouillon.
  'portal_app.api.academic.abandonment.list_abandonment_candidates': (p) => ({
    as_of: '2026-09-10', academic_term: p.academic_term, note: 'SIGNAL uniquement — figurer n’emporte rien.',
    candidates: p.__empty ? [] : [
      { student: 'ETU-24-0164', status: 'ACT', fact_1_four_consecutive_weeks: true, fact_2_no_evaluation_line: false,
        fact_3_over_20_percent_prolonged: true, fact_4_leave_expired_no_return: false, term_absence_percent: 41, term_sessions: 58, weekly: [] },
      { student: 'ETU-24-0203', status: 'RED', fact_1_four_consecutive_weeks: false, fact_2_no_evaluation_line: true,
        fact_3_over_20_percent_prolonged: false, fact_4_leave_expired_no_return: false, term_absence_percent: 12, term_sessions: 58, weekly: [] },
    ] }),
  'portal_app.api.academic.abandonment.create_abandonment_finding': () => ({ name: 'ABD-2026-012', status: 'Brouillon' }),
  'portal_app.api.academic.discipline.create_disciplinary_case': () => ({ name: 'DIS-2026-021', status: 'Brouillon' }),
  'portal_app.api.academic.chassis.list_stalled_dossiers': (p) => D.awaitingOtherDecider(p),
  'portal_app.api.academic.discipline.list_active_suspensions': (p) => D.activeSuspensions(p),
  'portal_app.api.academic.discipline.list_suspensions_needing_moodle_reactivation':
    (p) => D.suspensionsNeedingReactivation(p),
  'portal_app.api.academic.status_cause.get_my_status_cause': (p) => D.statusCause(p),

  // ─── Grappe 8 · conseil pédagogique ─────────────────────────────────────
  // 🔴 AUCUN de ces chemins n'est tranché : la carte des surfaces ne porte pas
  // de conseil pédagogique. Voir `api/council.js` et le relevé des grappes 8-11.
  [EW + 'list_cps_candidates']: (p) => C.councilCandidates(p),
  [EW + 'list_cps_sessions']: (p) => ({ items: [{ name: 'PCS-MOCK-1' }] }),
  // MANDAT-12 (M5) — la forme S-17 ; `?cps=brouillon|convoquee|tenue` choisit l'état montré.
  [EW + 'get_cps_session']: (p) => s17Session(p),
  [EW + 'convoke_cps_session']: (p) => ({ name: p.name, status: 'Convoquée', notified: [] }),
  [EW + 'list_preconisations']: (p) => C.councilPreconisations(p),
  [EW + 'list_absence_threshold_signals']: (p) => C.absenceThresholds(p),
  // Actes M3 g8 — forme serveur inline (non stateful ; le mode branché fait foi).
  [EW + 'create_cps_session']: (p) => ({ name: 'PCS-MOCK-1', status: 'Brouillon', examined_count: 0 }),
  [EW + 'update_cps_examined']: (p) => ({ name: p.name, examined_count: (p.examined || []).length }),
  [EW + 'add_preconisation']: (p) => ({ name: 'PRECO-MOCK-1', kind: p.kind, status: 'Ouverte', owner_user: null, notification: null }),
  [EW + 'record_contract_finding']: (p) => ({ name: p.name, finding: p.finding, finding_on: '' }),
  [EW + 'close_preconisation']: (p) => ({ name: p.name, status: 'Clôturée' }),
  [EW + 'hold_cps_session']: (p) => ({ name: p.name, status: 'Tenue', unjustified_absences: [] }),

  // Actes M3 g7 — tronc du patron (instruire / décider). Forme serveur inline.
  'portal_app.api.academic.academic_leave_request.instruct_coa_request': (p) => ({ name: p.name, status: 'En revue' }),
  'portal_app.api.academic.academic_leave_request.decide_coa_request': (p) => ({ name: p.name, status: p.decision }),
  'portal_app.api.academic.leave_return.instruct_leave_return_request': (p) => ({ name: p.name, status: 'En revue' }),
  'portal_app.api.academic.leave_return.decide_leave_return_request': (p) => ({ name: p.name, status: p.decision }),

  // ─── Grappe 9 · documents et clôture ────────────────────────────────────
  // 🔴 Même statut. Le code de vérification NAÎT de l'émission : la fixture rend
  // `verification_code: null` avant l'acte, et ce n'est pas un oubli.
  'portal_app.api.academic.document_requests.list_document_requests': (p) => Z.documentRequests(p),
  get_document_request: (p) => Z.documentRequest(p),
  'portal_app.api.academic.year_closure.get_year_status': (p) => Z.yearClosure(p),

  // ─── Grappe 10 · diplomation ────────────────────────────────────────────
  // 🟢 RF-G-01 — chemins réels confrontés et posés (graduation.py, mêmes noms).
  'portal_app.api.academic.graduation.list_graduation_dossiers': (p) => Z.graduationDossiers(p),
  'portal_app.api.academic.graduation.get_graduation_dossier': (p) => Z.graduationDossier(p),

  // ─── Grappe 11 · attribution des rôles ──────────────────────────────────
  // 🔴 Le trou T5 : les rôles existent depuis F3-V0, rien ne permet de les
  // donner. `preview_grant_effect` n'est PAS simulé — l'écran ne le consomme
  // pas, parce que le panneau de dotation qui en dépend n'est pas produit.
  'portal_app.api.identity.role_administration.list_role_holders': (p) => Z.roleGrants(p),
  'portal_app.api.identity.role_administration.list_role_profiles': () => Z.roleProfiles(),
  'portal_app.api.identity.role_administration.list_anomalies': (p) => Z.grantAnomalies(p),
  'portal_app.api.identity.role_administration.get_assignment_journal': (p) => Z.grantJournal(p),
  // Actes M2 g11 — forme serveur inline (simulate + 5 écritures). Non stateful.
  'portal_app.api.identity.role_administration.list_roles_catalog': () => raCatalog(),
  'portal_app.api.identity.role_administration.simulate_assignment': (p) => raSimulate(p),
  'portal_app.api.identity.role_administration.apply_profile': (p) => raApplied(p),
  'portal_app.api.identity.role_administration.add_role': (p) => raApplied(p),
  'portal_app.api.identity.role_administration.remove_role': (p) => raApplied(p),
  'portal_app.api.identity.role_administration.add_scope': (p) => raApplied(p),
  'portal_app.api.identity.role_administration.remove_scope': (p) => raApplied(p),

  // ─── Étapes 1 et 2 · charpente (MANDAT-10, E3', maquette) ───────────────
  // Proposés (⏳ E3') : la lecture du calendrier, les fériés, l'année courante.
  [ST + 'get_academic_calendar']: (p) => K.academicCalendar(p),
  [ST + 'add_holiday']: (p) => K.echo.holiday(p),
  [ST + 'remove_holiday']: (p) => K.echo.removed(p),
  [ST + 'set_current_academic_year']: (p) => K.echo.current(p),
  // Existants au serveur, sans écran jusqu'ici — échos de leur forme.
  [ST + 'create_academic_year']: (p) => K.echo.year(p),
  [ST + 'create_academic_term']: (p) => K.echo.term(p),
  [ST + 'get_program']: (p) => K.programDetail(p),
  [ST + 'create_program']: (p) => K.echo.program(p),
  [ST + 'update_program']: (p) => K.echo.program(p),
  [ST + 'set_program_active']: (p) => K.echo.active(p),
  [ST + 'create_academic_level']: (p) => K.echo.level(p),
  [ST + 'create_parcours']: (p) => K.echo.parcours(p),
};

/* ── Acte de peuplement de groupe (M2 g4) — rapport de masse, forme serveur ── */
function grpAddReport(p = {}) {
  const students = p.students || [];
  const ok = students.slice(0, Math.max(1, students.length - 1)).map((s) => ({ student: s, student_name: s, status: 'added' }));
  const ko = students.slice(Math.max(1, students.length - 1)).map((s) => ({ student: s, student_name: s, status: 'error', message: 'Inscription au programme hors filière éligible.' }));
  return { total: students.length, succeeded_count: ok.length, failed_count: ko.length,
    succeeded: ok, failed: ko, retry_ids: [] };
}

/* ── Actes d'administration des rôles (M2 g11) — forme serveur, non stateful ── */
function raCatalog() {
  return {
    roles: [
      { role: 'Responsable de formation', opens: 'Maquette pédagogique de sa filière.', scoped: true, bypass: false, decision_bearer: false },
      { role: 'Directeur des Études', opens: 'Autorité académique : valide les maquettes, prononce.', scoped: false, bypass: true, decision_bearer: true },
      { role: 'Gestionnaire académique', opens: 'Charpente structurelle et scolarité.', scoped: false, bypass: true, decision_bearer: false },
    ],
    forbidden: [{ role: 'System Manager', why: 'administration technique — hors surface métier' }],
  };
}
function raSimulate(p = {}) {
  const before = { roles: ['Responsable de formation'], scopes: ['LIS'] };
  const after = { roles: ['Responsable de formation'], scopes: ['LIS'] };
  if (p.kind === 'role_ajoute') after.roles = [...new Set([...before.roles, p.value])];
  else if (p.kind === 'role_retire') after.roles = before.roles.filter((r) => r !== p.value);
  else if (p.kind === 'portee_armee') after.scopes = [...new Set([...before.scopes, p.value])];
  else if (p.kind === 'portee_retiree') after.scopes = before.scopes.filter((s) => s !== p.value);
  const warnings = (p.kind === 'role_ajoute' && (p.value === 'Directeur des Études' || p.value === 'Gestionnaire académique'))
    ? [{ code: 'W-CLOISONNEMENT', message: 'CE CUMUL ANNULE LE CLOISONNEMENT : la personne verra toutes les filières.' }]
    : [];
  return {
    target_user: p.target_user, change: { kind: p.kind, value: p.value },
    before, after, would_be_noop: JSON.stringify(before) === JSON.stringify(after),
    opens: p.kind === 'role_ajoute' ? [{ role: p.value, opens: 'Ce que ce rôle ouvre (rédigé au serveur).' }] : [],
    scope_report: { note: 'Portée effective calculée au serveur.' },
    warnings,
    acknowledgement_contract: 'L’attribution exige l’accusé de ces codes, exactement.',
  };
}
function raApplied(p = {}) {
  return { status: 'appliqué', target_user: p.target_user, state: { roles: [], scopes: [] },
    warnings: [], journal: 'RAL-MOCK-0001' };
}

/* ── Actes de répartition (M2 g3) — helpers locaux, forme serveur ──────────── */
const SVC_ALLOWED = ['instructor', 'course', 'activity_type', 'program',
  'student_group', 'academic_year', 'hours'];
function svcUpsert(params = {}) {
  const values = params.values || {};
  const applied = {};
  for (const f of SVC_ALLOWED) applied[f] = values[f] ?? null;
  return {
    name: params.name || 'SRV-MOCK-0001',
    validation_status: 'Brouillon',
    applied,
    ignored_fields: Object.keys(values).filter((k) => !SVC_ALLOWED.includes(k)).sort(),
  };
}
function svcProposeReport() {
  const ok = [
    { line: 'SRV-MOCK-0002', course: 'Algèbre linéaire', status: 'proposed' },
    { line: 'SRV-MOCK-0003', course: 'Introduction à la programmation Python', status: 'proposed' },
  ];
  const ko = [{ line: 'SRV-MOCK-0001', course: 'Expression écrite et orale', status: 'error',
    message: 'Ligne sans enseignant — le titulaire est exigé à la proposition.' }];
  return { total: ok.length + ko.length, succeeded_count: ok.length, failed_count: ko.length,
    succeeded: ok, failed: ko, retry_ids: ko.map((l) => l.line),
    proposed: ok.map((l) => l.line), count: ok.length };
}
function svcValidateReport(params = {}) {
  const names = params.names || [];
  const ok = names.map((n) => ({ line: n, status: 'validated' }));
  return { total: ok.length, succeeded_count: ok.length, failed_count: 0,
    succeeded: ok, failed: [], retry_ids: [], validated: names };
}
function svcCarryReport() {
  const ok = [
    { source: 'SRV-2025-0001', course: 'Algèbre linéaire', status: 'reconduite', name: 'SRV-MOCK-0010' },
    { source: 'SRV-2025-0002', course: 'Architecture matérielle', status: 'déjà présente', name: 'SRV-MOCK-0011' },
  ];
  return { total: ok.length, succeeded_count: ok.length, failed_count: 0,
    succeeded: ok, failed: [], retry_ids: [] };
}

export async function mockCall(method, params = {}) {
  await new Promise((r) => setTimeout(r, LATENCY));

  // Bascule de mise au point : ?simulate=denied|error|empty sur l'URL fait
  // tomber TOUS les appels dans un état, pour voir les branches en vrai.
  const sim = new URLSearchParams(location.search).get('simulate');
  if (sim === 'denied') throw denied(F.denial.message, F.denial.details);
  if (sim === 'error') throw Object.assign(new Error('Le serveur n’a pas répondu.'), { code: 'SERVER_ERROR' });

  const handler = HANDLERS[method];
  if (!handler) {
    throw Object.assign(new Error('Point d’entrée non simulé : ' + method), { code: 'NOT_IMPLEMENTED' });
  }
  // `__empty` vient de la bascule d'URL ; `__fail` vient de l'APPELANT — une vue
  // qui veut montrer côté à côté un cas passé et un cas refusé. Les deux
  // traversent tels quels : le simulacre ne filtre pas les paramètres.
  return handler(sim === 'empty' ? { ...params, __empty: true } : params);
}
