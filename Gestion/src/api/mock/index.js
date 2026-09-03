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

  // ─── Grappe 4 · groupes et inscriptions ─────────────────────────────────
  [GR + 'list_groups']: (p) => G.groups(p),
  [GR + 'get_group']: (p) => G.group(p),
  [GR + 'list_group_candidates']: (p) => G.groupCandidates(p),
  [GR + 'get_cohort_overview']: (p) => G.cohortOverview(p),
  [GR + 'get_student_groups']: (p) => G.studentGroupsOf(p),
  // L'ACTE d'écriture — appelé sur un geste, jamais au chargement d'un écran.
  'emela_core.academic_core.api.enrollment.create_student_from_applicant': (p) => G.enrollmentReport(p),
  [EN + 'replay_enrollment']: (p) => G.enrollmentReport(p),
  [EN + 'list_incomplete_enrollments']: (p) => G.enrollmentReplayQueue(p),
  [EN + 'list_moodle_orphans']: (p) => G.moodleOrphans(p),
  // La LECTURE du journal — c'est elle que l'écran du rapport consomme.
  get_enrollment_log: (p) => G.enrollmentLog(p),

  // ─── Grappe 5 · planning et examens ─────────────────────────────────────
  [PL + 'list_schedules']: (p) => P.schedules(p),
  [PL + 'get_schedule']: (p) => P.schedule(p),
  [PL + 'get_module_planning_summary']: (p) => P.modulePlanningSummary(p),
  [PL + 'check_schedule_conflicts']: (p) => P.scheduleConflicts(p),
  [PL + 'publish_schedules']: (p) => P.publishReport(p),
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
  // 🟡 Les fonctions sont annoncées existantes (carte P-06) ; leur chemin
  // d'exposition est inconnu, donc les noms sont portés nus.
  'portal_app.api.academic.graduation.list_graduation_dossiers': (p) => Z.graduationDossiers(p),
  get_graduation_dossier: (p) => Z.graduationDossier(p),

  // ─── Grappe 11 · attribution des rôles ──────────────────────────────────
  // 🔴 Le trou T5 : les rôles existent depuis F3-V0, rien ne permet de les
  // donner. `preview_grant_effect` n'est PAS simulé — l'écran ne le consomme
  // pas, parce que le panneau de dotation qui en dépend n'est pas produit.
  'portal_app.api.identity.role_administration.list_role_holders': (p) => Z.roleGrants(p),
  'portal_app.api.identity.role_administration.list_role_profiles': () => Z.roleProfiles(),
  'portal_app.api.identity.role_administration.list_anomalies': (p) => Z.grantAnomalies(p),
  'portal_app.api.identity.role_administration.get_assignment_journal': (p) => Z.grantJournal(p),

};

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
