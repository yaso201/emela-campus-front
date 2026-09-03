/**
 * P-03 · Répartition de service — la ligne de service prévisionnelle.
 *
 * F3-FORMES : le serveur rend SA forme (les `return` réels de
 * `service_allocation.py`, que le simulacre reproduit désormais) ; CE MODULE
 * reconstruit la forme que les ÉCRANS consomment. Chaque adaptation porte son
 * motif — « FORMES : <clé> serveur → <clé> écran » — pour que le jour où le
 * serveur change, on sache ce qui se recâble ici et rien d'autre.
 *
 * Règle du domaine : une heure vaut une heure, aucune conversion. Et la
 * couverture d'un module se calcule SUR LES HEURES, jamais sur le nombre de
 * lignes — deux lignes de 9 h pour 18 h de maquette sont un partage légitime.
 */
import { call } from './client.js';

const SA = 'portal_app.api.academic.service_allocation.';

/** FORMES : validation_status serveur (Brouillon/Proposé/Validé) → clé de pastille écran. */
const LINE_STATUS = { Brouillon: 'brouillon', 'Proposé': 'propose', 'Validé': 'valide' };
/** FORMES : activity_type serveur (CM/TD/TP/PJ) → clé d'étiquette écran (cm/td/tp/pj). */
const act = (at) => (at || '').toLowerCase();

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
/** FORMES : as_of / computed_at serveur (horodatage) → millésime lisible de l'écran. */
function dateLabel(iso) {
  if (!iso) return null;
  const d = new Date(String(iso).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return null;
  return d.getDate() + ' ' + MONTHS[d.getMonth()];
}

/** Lignes de service d'une filière, groupées par module et type d'activité. */
/** 🟢 service_allocation.get_service_plan(program, academic_year) — la forme
 * serveur est PLATE (lines + missing + teachers + over_norm_notes) ; le
 * groupement UE → module de l'écran est reconstruit ici depuis `ue`/`ue_label`
 * portés par CHAQUE ligne et chaque manque. */
export const getServicePlan = (p) =>
  call('portal_app.api.academic.service_allocation.get_service_plan',
    { program: p && p.program, academic_year: p && p.academic_year })
    .then(adaptPlan);

function adaptPlan(plan) {
  if (!plan) return plan;
  const notes = plan.over_norm_notes || {};
  // FORMES : teachers[].engaged serveur → engagé JOINT à chaque ligne (l'écran
  // l'affiche par ligne ; le serveur le donne par enseignant — même mesure).
  const engagedBy = {};
  for (const t of plan.teachers || []) engagedBy[t.instructor] = t.engaged;

  const groups = new Map();
  const moduleOf = (ueId, ueLabel, course) => {
    const gKey = ueId || '—';
    if (!groups.has(gKey)) {
      groups.set(gKey, {
        id: gKey,
        // FORMES : ue (identifiant) serveur → code court d'affichage (« UE-3.1 » → « UE 3.1 »).
        code: (ueId || '').replace('-', ' '),
        label: ueLabel,           // FORMES : ue_label serveur → label écran
        modules: new Map(),
      });
    }
    const g = groups.get(gKey);
    if (!g.modules.has(course)) {
      // FORMES : le plan serveur ne porte pas de libellé de module — id/code = course.
      g.modules.set(course, { id: course, code: course, lines: [], uncovered: [] });
    }
    return g.modules.get(course);
  };

  for (const l of plan.lines || []) {
    const mod = moduleOf(l.ue, l.ue_label, l.course);
    mod.lines.push({
      id: l.name,                                 // FORMES : name serveur → id écran
      teacher: l.instructor,                      // FORMES : instructor serveur → teacher écran
      group: l.student_group,                     // FORMES : student_group (null = promotion) → group
      hours: l.hours,
      activity: act(l.activity_type),
      engaged: engagedBy[l.instructor],
      // FORMES : la présence d'une note de norme pour cet enseignant = dépassement
      // (over_norm_notes ne porte QUE les enseignants au-delà de la norme).
      over_norm: !!notes[l.instructor],
      status: LINE_STATUS[l.validation_status] || 'brouillon',
    });
    // FORMES : over_norm_notes{instructor} serveur → note posée au module qui l'emploie.
    if (notes[l.instructor] && !mod.over_norm_note) mod.over_norm_note = notes[l.instructor];
  }
  for (const m of plan.missing || []) {
    const mod = moduleOf(m.ue, m.ue_label, m.course);
    // FORMES : missing serveur (cible SANS AUCUNE ligne, assigned 0 par
    // construction) → uncovered écran. Les PARTIELS vivent dans la couverture.
    mod.uncovered.push({ activity: act(m.activity_type), expected: m.target_hours, assigned: m.assigned || 0 });
  }

  const lineCount = (plan.lines || []).length;
  const statuses = new Set((plan.lines || []).map((l) => l.validation_status));
  return {
    groups: [...groups.values()].map((g) => ({ ...g, modules: [...g.modules.values()] })),
    // Comptages de PRÉSENTATION (le serveur ne rend pas d'en-têtes) :
    count: lineCount,
    module_count: new Set([...(plan.lines || []), ...(plan.missing || [])].map((x) => x.course)).size,
    program_label: plan.program,                  // FORMES : program serveur → program_label écran
    year_label: plan.academic_year,               // FORMES : academic_year serveur → year_label écran
    can_carry_over: plan.can_carry_over,
    previous_year_label: plan.previous_year_label,
    // F3-PROV : les heures posées SANS titulaire — nommées, à part.
    unassigned_draft_hours: plan.unassigned_draft_hours || 0,
    // FORMES : teachers[{instructor, engaged}] serveur → [{id, name, engaged}] écran
    // (le sujet EST l'identifiant — aucun libellé serveur distinct).
    teachers: (plan.teachers || []).map((t) => ({ id: t.instructor, name: t.instructor, engaged: t.engaged })),
    // Présentation : tout-Brouillon = « rien n'est encore proposé ».
    state: statuses.size && [...statuses].every((s) => s === 'Brouillon') ? 'brouillon' : undefined,
  };
}

/** Couverture : heures réparties contre volume de maquette, module par module. */
/** 🟢 get_service_coverage(program, academic_year) — PLAT par (course,
 * activité) ; le groupement par module de l'écran est reconstruit ici. */
export const getServiceCoverage = (p) =>
  call('portal_app.api.academic.service_allocation.get_service_coverage',
    { program: p && p.program, academic_year: p && p.academic_year })
    .then((d) => {
      if (!d) return d;
      const mods = new Map();
      for (const c of d.coverage || []) {
        if (!mods.has(c.course)) {
          // FORMES : la couverture serveur ne porte pas de libellé — id/code = course.
          mods.set(c.course, { id: c.course, code: c.course, activities: [] });
        }
        mods.get(c.course).activities.push({
          activity: act(c.activity_type),
          covered_hours: c.covered_hours,          // FORMES : covered_hours, tel quel
          expected_hours: c.target_hours,          // FORMES : target_hours serveur → expected_hours écran
          // F3-PROV : la promesse RESTAURÉE — le serveur expose désormais
          // les heures posées sans titulaire (draft_unassigned_hours).
          pending_hours: c.draft_unassigned_hours || 0,
        });
      }
      return { modules: [...mods.values()] };
    });

/** Les propositions en attente de validation — file de l'écran N2. */
/** 🟢 list_service_lines(status='Proposé') — LISTE NUE serveur ; l'agrégat par
 * filière (compte + somme d'heures) est un COMPTAGE de présentation, fait ici —
 * jamais une seconde construction de ligne. */
export const listServiceProposals = async (p) => {
  const rows = await call(SA + 'list_service_lines',
    { academic_year: p && p.academic_year, status: 'Proposé' }) || [];
  const by = new Map();
  for (const l of rows) {
    const k = l.program || '—';
    if (!by.has(k)) by.set(k, { program: k, count: 0, hours: 0, proposed_by: l.proposed_by });
    const g = by.get(k);
    g.count += 1; g.hours += l.hours || 0;
    if (!g.proposed_by && l.proposed_by) g.proposed_by = l.proposed_by;
  }
  return {
    items: [...by.values()].map((g) => ({
      id: g.program,                               // FORMES : program serveur → identifiant de file
      title: g.program,
      subtitle: g.count + ' lignes · ' + g.hours + ' h' + (g.proposed_by ? ' · ' + g.proposed_by : ''),
      status: 'propose', statusLabel: 'Proposée',  // présentation : la file ne porte que du Proposé
    })),
  };
};

/** Une proposition, ligne par ligne. */
/** 🟢 list_service_lines(program, status='Proposé') + get_instructor_service_summary
 * par enseignant DISTINCT — l'engagé et le dépassement de norme de chaque ligne
 * viennent du bilan serveur (jamais recalculés ici, jamais écrits en dur). */
export const getServiceProposal = async (p) => {
  const program = p && (p.proposal || p.program);
  const rows = await call(SA + 'list_service_lines',
    { program: program, status: 'Proposé', academic_year: p && p.academic_year }) || [];
  const instructors = [...new Set(rows.map((l) => l.instructor).filter(Boolean))];
  const summaries = (await Promise.all(instructors.map((i) =>
    call(SA + 'get_instructor_service_summary',
      { instructor: i, academic_year: p && p.academic_year }).catch(() => null))))
    .filter(Boolean);
  const engagedBy = {}; const normBy = {};
  for (const s of summaries) { engagedBy[s.instructor] = s.engaged_hours; normBy[s.instructor] = s.norm_hours; }
  const lines = rows.map((l) => {
    const over = normBy[l.instructor] != null && engagedBy[l.instructor] > normBy[l.instructor];
    // FORMES : needs_reason est DÉRIVÉ du contrat serveur — au-delà de la norme
    // SANS derogation_reason posé (la correspondance motif↔dépassement, py:111).
    const needs = over && !l.derogation_reason;
    return {
      id: l.name,                                  // FORMES : name serveur → id écran
      module_id: l.course, module_code: l.course,  // FORMES : course serveur → module_* écran (pas de libellé serveur)
      activity: act(l.activity_type),
      teacher: l.instructor,                       // FORMES : instructor → teacher
      hours: l.hours,
      engaged: engagedBy[l.instructor],            // FORMES : engaged_hours du bilan serveur, joint par ligne
      over_norm: over,
      needs_reason: needs,
      state_label: needs ? 'Motif exigé' : 'À valider',   // présentation
    };
  });
  return {
    program_label: program,                        // FORMES : le paramètre EST l'identifiant de filière
    line_count: lines.length,
    total_hours: rows.reduce((s, l) => s + (l.hours || 0), 0),
    proposed_by: (rows.find((l) => l.proposed_by) || {}).proposed_by,
    // FORMES : aucune donnée serveur de dérogation AGRÉGÉE (le motif se pose à
    // la LIGNE, à la validation) — liste vide, l'écran dégrade.
    derogations: [],
    lines,
  };
};

/**
 * Charge d'un enseignant, toutes filières — total complet, détail expurgé.
 *
 * ⚠️ Le motif d'une dérogation née d'une AUTRE filière n'est pas rendu : le
 * serveur SUPPRIME la clé (jamais un champ vide) et rend LE FAIT dans
 * `out_of_scope` (has_derogation / derogations_motivated). L'adaptateur en
 * dérive le bloc `derogation` de l'écran — dont `reason_withheld`.
 */
/** 🟢 get_instructor_service_summary(instructor, academic_year) + le réalisé
 * PAR LIGNE lu du rapprochement (get_service_reconciliation — même source
 * serveur que le millésime). Le param `teacher` du contexte devient
 * `instructor` (la table de correspondance). */
export const getTeacherLoad = async (p) => {
  const instructor = p && (p.teacher || p.instructor);
  const academic_year = p && p.academic_year;
  const s = await call(SA + 'get_instructor_service_summary',
    { instructor: instructor, academic_year: academic_year });
  if (!s) return s;
  let rec = null;
  try {
    rec = await call(SA + 'get_service_reconciliation',
      { instructor: instructor, academic_year: academic_year });
  } catch { rec = null; }
  const doneBy = {}; const sharedBy = {};
  for (const l of (rec && rec.lines) || []) { doneBy[l.name] = l.realized_hours; sharedBy[l.name] = l.shared_key; }

  // FORMES : own_hours = Σ lines (Proposé + Validé) — le détail rendu EST
  // « chez vous » ; le reste vit dans out_of_scope (patron « total honnête,
  // détail expurgé »).
  const ownHours = (s.lines || [])
    .filter((l) => l.validation_status === 'Proposé' || l.validation_status === 'Validé')
    .reduce((a, l) => a + (l.hours || 0), 0);
  const oos = s.out_of_scope || {};

  // FORMES : le bloc `derogation` de l'écran est DÉRIVÉ des deux faits serveur —
  // motif posé sur SES lignes (rendu) OU dérogation hors périmètre (fait sans
  // contenu → reason_withheld) OU dépassement sans motif (motivated: false).
  const ownReason = (s.lines || []).map((l) => l.derogation_reason).find((r) => (r || '').trim());
  let derogation = null;
  if (s.over_norm) {
    if (ownReason) derogation = { motivated: true, reason: ownReason };
    else if (oos.has_derogation) derogation = { motivated: !!oos.derogations_motivated, reason_withheld: true };
    else derogation = { motivated: false };
  }

  return {
    teacher_id: instructor,
    teacher_name: instructor,                      // FORMES : pas de libellé serveur — le sujet EST l'identifiant
    year_label: s.academic_year,                   // FORMES : academic_year serveur → year_label écran
    norm_hours: s.norm_hours,
    validated_hours: s.validated_hours,
    proposed_hours: s.proposed_hours,
    engaged_hours: s.engaged_hours,
    done_hours: s.realized_hours,                  // FORMES : realized_hours serveur → done_hours écran
    computed_at: s.as_of,                          // FORMES : as_of serveur → millésime écran
    computed_at_label: dateLabel(s.as_of),
    own_hours: ownHours,
    elsewhere_hours: oos.hours || 0,               // FORMES : out_of_scope.hours → elsewhere_hours
    elsewhere_lines: oos.count || 0,               // FORMES : out_of_scope.count → elsewhere_lines
    // FORMES : le COMPTE de filières hors périmètre n'est PAS rendu par le
    // serveur (out_of_scope ne porte que count/hours) — clé absente, l'écran dégrade.
    derogation,
    own_lines: (s.lines || []).map((l) => ({
      id: l.name,
      module_code: l.course,                       // FORMES : course serveur → module_code (pas de libellé serveur)
      activity: act(l.activity_type),
      group: l.student_group,
      planned: l.hours,                            // FORMES : hours serveur → planned écran
      done: doneBy[l.name] ?? 0,                   // FORMES : realized_hours du rapprochement, joint par nom de ligne
      status: LINE_STATUS[l.validation_status] || 'brouillon',
      // FORMES : shared_key booléen serveur → compte minimal (1) pour le badge écran.
      shared_count: sharedBy[l.name] ? 1 : 0,
    })),
    // FORMES : per_activity{TYPE: heures} serveur → by_activity[{activity, hours}] écran.
    by_activity: Object.entries(s.per_activity || {}).map(([k, v]) => ({ activity: act(k), hours: v })),
  };
};

/** Les trois signaux : couverture, dépassement de norme, planning hors répartition. */
/** 🟢 list_service_signals(academic_year, program?) — 3 clés + family_labels
 * serveur ; les FAMILLES de l'écran sont reconstruites ici. */
/**
 * FORMES : la navigation (route / libellé d'action) est un DICTIONNAIRE FRONT —
 * le serveur rend les signaux et les phrases de famille, jamais des routes.
 * Une action de CONSULTATION par famille, et le sujet voyage avec le lien.
 */
const SIGNAL_NAV = {
  coverage: { route: 'service', action_label: 'Ouvrir la répartition' },
  over_norm: { route: 'service-charge', action_label: 'Bilan de charge' },
  planning_mismatch: { route: 'planning', action_label: 'Ouvrir la séance' },
};

export const listServiceSignals = (p) =>
  call(SA + 'list_service_signals',
    { academic_year: p && p.academic_year, program: p && p.program })
    .then(adaptSignals);

function adaptSignals(d) {
  if (!d) return d;
  const labels = d.family_labels || {};
  // FORMES : family_labels{label, note} serveur → title/description écran.
  const family = (key, items) => ({
    key,
    title: (labels[key] || {}).label,
    description: (labels[key] || {}).note,
    items,
  });
  const coverage = (d.coverage || []).map((c) => ({
    id: 'cov-' + c.course + '-' + c.activity_type,
    subject: c.course + ' · ' + (c.activity_type || ''),
    // FORMES : target_hours/assigned_hours/state serveur → phrase de détail écran.
    detail: c.assigned_hours + ' h réparties sur ' + c.target_hours + ' h prévues — ' + c.state,
    status: c.state === 'sur-couvert' ? 'propose' : 'suspendue',
    status_label: c.state === 'sur-couvert' ? 'Au-delà du volume' : 'Heures manquantes',
    ...SIGNAL_NAV.coverage,
  }));
  const overNorm = (d.over_norm || []).map((o) => ({
    id: 'norm-' + o.instructor,
    subject: o.instructor,
    teacher_id: o.instructor,                      // FORMES : instructor serveur → teacher_id (le sujet voyage avec le lien)
    detail: o.engaged_hours + ' h engagées · norme ' + o.norm_hours + ' h'
      + (o.proposed_hours ? ' · ' + o.proposed_hours + ' h encore en proposition' : ''),
    status: 'suspendue', status_label: 'À motiver à la validation',
    ...SIGNAL_NAV.over_norm,
  }));
  const mismatch = (d.planning_mismatch || []).map((m, i) => ({
    id: 'pm-' + i,
    subject: m.course,
    detail: m.instructor + ' — ' + m.state,        // FORMES : state serveur = la phrase du signal
    status: 'propose', status_label: 'Choisi au planning',
    ...SIGNAL_NAV.planning_mismatch,
  }));
  return {
    families: [
      family('coverage', coverage),
      family('over_norm', overNorm),
      family('planning_mismatch', mismatch),
    ],
  };
}

/**
 * Prévu contre réalisé — l'axe DIVERGE (table F3-MAP) : le serveur rapproche
 * PAR ENSEIGNANT, l'écran veut la filière. PROVISOIRE tracé : on liste les
 * enseignants des lignes de la filière puis on CONCATÈNE leurs rapprochements
 * serveur (aucune ligne reconstruite ; les totaux sont des sommes, dits tels
 * quels). Le vrai geste — un rapprochement par filière côté serveur — est au
 * reversement.
 */
/** 🟢 list_service_lines + get_service_reconciliation(instructor, academic_year). */
export const getServiceProgress = async (p) => {
  const academic_year = p && p.academic_year;
  const rows = await call(SA + 'list_service_lines',
    { academic_year: academic_year, program: p && p.program }) || [];
  const teachers = [...new Set(rows.map((l) => l.instructor).filter(Boolean))];
  const recs = (await Promise.all(teachers.map((t) =>
    call(SA + 'get_service_reconciliation',
      { instructor: t, academic_year: academic_year }).catch(() => null))))
    .filter(Boolean);
  const lines = recs.flatMap((r) => (r.lines || []).map((l) => ({
    id: l.name,                                    // FORMES : name serveur → id écran
    teacher: r.instructor,                         // FORMES : le rapprochement est PAR enseignant — le sujet vient du rapport
    activity: act(l.activity_type),
    group: l.student_group,
    module_code: l.course,                         // FORMES : course serveur → module_code (pas de libellé serveur)
    planned: l.hours,                              // FORMES : hours serveur → planned écran
    done: l.realized_hours,                        // FORMES : realized_hours serveur → done écran
    gap: l.gap_hours,                              // FORMES : gap_hours SIGNÉ serveur → gap (jamais recalculé ici)
    shared_count: l.shared_key ? 1 : 0,            // FORMES : shared_key booléen → compte minimal (1)
  })));
  const sum = (k) => recs.reduce((a, r) => a + (r[k] || 0), 0);
  const computedAt = (recs.find((r) => r.computed_at) || {}).computed_at;
  return {
    program_label: p && p.program,
    line_count: lines.length,
    lines,
    planned_hours: sum('planned_hours'),
    done_hours: sum('realized_hours'),             // FORMES : realized_hours serveur → done_hours écran
    gap_hours: sum('gap_hours'),
    computed_at: computedAt,                       // FORMES : computed_at serveur — le millésime, obligatoire
    computed_at_label: dateLabel(computedAt),
    note: 'Concaténation des rapprochements PAR ENSEIGNANT (provisoire — '
      + 'le rapprochement par filière est à rendre côté serveur).',
  };
};

/** 🔴 acte en clé nue — le réel vit dans service_allocation (upsert/propose/validate/return/carry_over_service_lines), formes à confronter avant branchement. */
export const createServiceLine = (p) => call('create_service_line', p);
/** 🔴 acte en clé nue — le réel vit dans service_allocation (upsert/propose/validate/return/carry_over_service_lines), formes à confronter avant branchement. */
export const updateServiceLine = (p) => call('update_service_line', p);
/** 🔴 acte en clé nue — le réel vit dans service_allocation (upsert/propose/validate/return/carry_over_service_lines), formes à confronter avant branchement. */
export const deleteServiceLine = (p) => call('delete_service_line', p);
/** 🔴 acte en clé nue — le réel vit dans service_allocation (upsert/propose/validate/return/carry_over_service_lines), formes à confronter avant branchement. */
export const proposeServicePlan = (p) => call('propose_service_plan', p);
/** 🔴 acte en clé nue — le réel vit dans service_allocation (upsert/propose/validate/return/carry_over_service_lines), formes à confronter avant branchement. */
export const validateServicePlan = (p) => call('validate_service_plan', p);
/** 🔴 acte en clé nue — le réel vit dans service_allocation (upsert/propose/validate/return/carry_over_service_lines), formes à confronter avant branchement. */
export const returnServicePlan = (p) => call('return_service_plan', p);

/**
 * Reconduction annuelle. 🔴 L'un des neuf ajustements : sans reprise, juillet
 * est une re-saisie intégrale. Reprend les lignes validées de N-1 en brouillon.
 */
/** 🔴 acte en clé nue — le réel vit dans service_allocation (upsert/propose/validate/return/carry_over_service_lines), formes à confronter avant branchement. */
export const carryOverServicePlan = (p) => call('carry_over_service_plan', p);
