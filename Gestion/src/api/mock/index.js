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
const SA = 'portal_app.api.academic.service_allocation.';

const HANDLERS = {
  // ─── Grappe 1 · châssis ─────────────────────────────────────────────────
  'portal_app.api.identity.session_context.get_session_context': () => F.session,
  'portal_app.api.academic.chassis.get_academic_context': () => F.academicContext,
  'portal_app.api.academic.chassis.get_work_queue': (p) => F.workQueue(p),
  'portal_app.api.academic.chassis.get_work_queue_counts': () => F.workQueueCounts,

  // ─── Grappe 2 · structure ───────────────────────────────────────────────
  // F3-FORMES : chaque fixture rend LA FORME SERVEUR (le return réel du .py) —
  // la forme d'écran est reconstruite par les adaptateurs.
  [ST + 'get_structure_tree']: (p) => F.structureTree(p),
  [ST + 'get_ue']: (p) => F.ueDetail(p),
  [ST + 'list_structure_options']: () => F.structureOptions,
  [ST + 'list_programs']: (p) => F.programs(p),
  // Actes M2 g2 — forme serveur inline (UE + cycle de maquette).
  [ST + 'create_ue']: (p) => ({ name: 'UE-MOCK-0001', ue_name: (p.values || {}).ue_name }),
  [ST + 'update_ue']: (p) => ({ name: p && p.ue, ue_name: (p.values || {}).ue_name }),
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
  // L'ACTE d'écriture — appelé sur un geste, jamais au chargement d'un écran.
  'emela_core.academic_core.api.enrollment.create_student_from_applicant': (p) => G.enrollmentReport(p),
  [EN + 'replay_enrollment']: (p) => G.enrollmentReport(p),
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
  // Acte M2 g5 — changement de statut (dont annulation). Forme serveur inline.
  [PL + 'set_schedule_status']: (p) => ({ name: p && p.name, custom_status: p && p.status }),
  [PL + 'get_instructor_day_load']: (p) => P.instructorDayLoad(p),
  [PL + 'list_tp_requalification_candidates']: (p) => P.tpRequalification(p),
  [EX + 'list_exam_schedules']: (p) => P.examSchedules(p),
  [EX + 'get_exam_schedule']: (p) => N.examSchedule(p),
  [EX + 'populate_exam_students_from_group']: (p) => N.examPopulateReport(p),

  // ─── Grappe 6 · notes et délibération ───────────────────────────────────
  [GC + 'list_submissions_for_control']: (p) => N.submissionsForControl(p),
  [MG + 'list_adjusted_module_averages']: (p) => N.adjustedModuleAverages(p),
  [DL + 'get_deliberation_dashboard']: (p) => N.deliberationDashboard(p),
  [DL + 'list_deliberations']: (p) => N.listDeliberations(p),
  // 🟢 Le manque du roster est COMBLÉ (stabilisation §3.2) : le module d'appel
  // consomme le drapeau du dashboard — la clé nue a disparu avec lui.

  // ─── Grappe 7 · les dossiers ────────────────────────────────────────────
  // 🔴 Les deux lectures transversales sont des manques nommés : aucune surface
  // ne les rend, les lectures serveur sont ÉCLATÉES par procédure.
  'portal_app.api.academic.dossiers_read.list_dossiers': (p) => D.dossiers(p),
  get_dossier: (p) => D.dossier(p),
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
  [EW + 'get_cps_session']: (p) => C.councilSession(p),
  [EW + 'list_preconisations']: (p) => C.councilPreconisations(p),
  [EW + 'list_absence_threshold_signals']: (p) => C.absenceThresholds(p),

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
