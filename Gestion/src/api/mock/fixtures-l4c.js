/**
 * MANDAT-14 (L4-C, G-M1 à G-M8) — les FORMES SERVEUR des lectures neuves du back, dans le monde du simulacre
 * (« nous sommes le 10 septembre 2026 », année 2026-2027 ; 2025-2026 close). Chaque fonction cite son contrat.
 *
 * P18 (VERDICT-MANDAT-14-PC1B) : des données cohérentes. Une seule filière pour la cohorte (L-GL, « Licence Génie
 * logiciel »), un seul niveau (L2-GL), le semestre de L2 nommé comme dans l'espace (S3), une seule forme de matricule
 * (celle du simulacre, `ETU-25-0133`) et de délibération (`DELIB-…`). Q18 : chaque personne a son nom, chaque filière
 * et chaque niveau leur libellé, à côté du compte ou du code.
 */

// `location` n'existe pas sous Node (l'audit exécute les fixtures) : aucun paramètre, alors.
const q = (k) => (typeof location === 'undefined' ? null : new URLSearchParams(location.search).get(k));
const LECTEUR_SANS_ACTE = () => ['ga', 'de', 'director', 'rf', 'direction'].includes(q('as'));

const LGL = { program: 'L-GL', program_label: 'Licence Génie logiciel' };
const L2GL = { academic_level: 'L2-GL', academic_level_label: 'Licence 2 Génie logiciel' };
const L3GL = { academic_level: 'L3-GL', academic_level_label: 'Licence 3 Génie logiciel' };
const S3 = '2026-2027 (S3)';

/* ── C5 · deliberation_mgmt.list_semester_results(academic_level, academic_term, academic_year) ──────────────
 * La cohorte du S3 de 2026-2027, Licence 2 Génie logiciel ; une délibération en préparation. `on_compute` dit ce
 * que le calcul ferait de chaque ligne ; `skip_reason` est la phrase du serveur. */
const SR = (student, student_name, extra) => ({ student, student_name, ...L2GL, semester_result: null,
  total_ects_earned: null, total_ects_possible: null, cumulative_ects: null, all_mhc_validated: null,
  semester_validated: null, jury_decision: null, deliberation: null, on_compute: 'create', skip_reason: null, ...extra });
// Le simulacre suit le niveau choisi (P18) : sa filière et son libellé, et le semestre impair de ce niveau en
// septembre (L1 → S1, L2 → S3, L3 → S5) — une cohorte de L2 n'est jamais « au S1 ».
const FILIERES = { LIS: 'Licence Informatique et Systèmes', 'L-GL': 'Licence Génie logiciel' };
function cohorteDe(level) {
  const lis = /^LIS-L(\d)$/.exec(level || '');
  const gl = /^L(\d)-GL$/.exec(level || '');
  if (lis) {
    return { program: 'LIS', program_label: FILIERES.LIS, academic_level: level,
      academic_level_label: `Licence ${lis[1]} Informatique et Systèmes`, term: `2026-2027 (S${2 * lis[1] - 1})` };
  }
  const n = gl ? Number(gl[1]) : 2;
  return { ...LGL, academic_level: gl ? level : 'L2-GL', academic_level_label: `Licence ${n} Génie logiciel`,
    term: `2026-2027 (S${2 * n - 1})` };
}
export function semesterResults(p = {}) {
  const c = cohorteDe(p.academic_level);
  const niveau = { academic_level: c.academic_level, academic_level_label: c.academic_level_label };
  const rows = [
    SR('ETU-25-0087', 'Ange Sossou', { semester_result: 'SRES-2026-00412', total_ects_earned: 30,
      total_ects_possible: 30, cumulative_ects: 90, all_mhc_validated: true, semester_validated: true,
      on_compute: 'recompute' }),
    SR('ETU-25-0133', 'Marie Kponou', { semester_result: 'SRES-2026-00413', total_ects_earned: 24,
      total_ects_possible: 30, cumulative_ects: 84, all_mhc_validated: false, semester_validated: false,
      on_compute: 'recompute' }),
    SR('ETU-24-0164', 'Rachid Ouédraogo', { semester_result: 'SRES-2026-00414', total_ects_earned: 30,
      total_ects_possible: 30, cumulative_ects: 90, all_mhc_validated: true, semester_validated: true,
      on_compute: 'recompute' }),
    SR('ETU-25-0121', 'Marius Kpossou'),
    SR('ETU-23-0091', 'Serge Bocco', { ...L3GL, on_compute: 'skip',
      skip_reason: 'D’un autre niveau : son résultat se calcule avec sa propre cohorte.' }),
  ].map((r) => (r.on_compute === 'skip' ? r : { ...r, ...niveau }));
  const code = 'DELIB-2027-' + c.academic_level.replace(/[^A-Z0-9]/g, '') + '-' + c.term.slice(-3, -1);
  return { program: c.program, program_label: c.program_label, ...niveau,
    academic_term: c.term, academic_year: p.academic_year || '2026-2027',
    cohort_size: rows.length, counts: { create: 1, recompute: 3, skip: 1 }, rows,
    deliberations: [{ name: code, academic_term: c.term, status: 'Préparation', deliberation_date: null }],
    can_compute: !LECTEUR_SANS_ACTE() };
}
/* L'acte `compute_semester_results` : il rend les lignes calculées ; l'écran relit ensuite l'état. */
export function computeSemesterResults(p = {}) {
  const out = semesterResults(p);
  const rows = out.rows.filter((r) => r.on_compute !== 'skip');
  return { program: out.program, program_label: out.program_label, academic_level: out.academic_level,
    academic_level_label: out.academic_level_label, academic_term: out.academic_term, academic_year: out.academic_year,
    created: out.counts.create, recomputed: out.counts.recompute,
    rows: rows.map((r) => ({ student: r.student, semester_result: r.semester_result || 'SRES-2026-00420',
      mhc_recognized_in_full: false, semester_validated: r.semester_validated })),
    skipped: out.rows.filter((r) => r.on_compute === 'skip').map((r) => ({ student: r.student, reason: 'autre_niveau' })) };
}

/* ── C7 · people_search.search_people(query, kind='all', limit=20) ─────────────────────────────────────────
 * `{query, kind, students: [{student, student_name, person_id, program, program_label, academic_level,
 * academic_level_label, academic_status, academic_status_label, enabled}], staff: [{user, full_name, roles,
 * role_labels}], may_be_truncated: {students, staff}}` ; moins de 3 caractères : refus « La recherche demande au
 * moins 3 caractères. » */
const ETU = (student, student_name, person_id, level, status = 'ACT', extra = {}) => ({ student, student_name,
  person_id, ...LGL, ...level, academic_status: status,
  academic_status_label: { ACT: 'Actif', COA: 'Congé académique' }[status] || status, enabled: true, ...extra });
const ETUDIANTS = [
  ETU('ETU-25-0133', 'Marie Kponou', 'PER-25-1133', L2GL),
  ETU('ETU-25-0087', 'Ange Sossou', 'PER-25-1087', L2GL),
  ETU('ETU-24-0164', 'Rachid Ouédraogo', 'PER-24-0164', L2GL),
  ETU('ETU-24-0147', 'Grâce Aïvodji', 'PER-24-0147', { academic_level: 'M1-SI', academic_level_label: 'Master 1 Systèmes d’information' },
    'ACT', { program: 'M-SI', program_label: 'Master Systèmes d’information' }),
  ETU('ETU-23-0091', 'Serge Bocco', 'PER-23-0091', L3GL, 'COA'),
  ETU('ETU-25-0121', 'Marius Kpossou', 'PER-25-1121', L2GL),
];
const STAFF = (user, full_name, roles, role_labels = roles) => ({ user, full_name, roles, role_labels });
const PERSONNEL = [
  STAFF('a.kponou@lanem.bj', 'Adjoa Kponou', ['Gestionnaire académique']),
  STAFF('r.dossou-yovo@lanem.bj', 'Romuald Dossou-Yovo', ['Direction']),
  STAFF('f.agbo@lanem.bj', 'Florence Agbo', ['Directeur des Études']),
  STAFF('m.koudogbo@lanem.bj', 'Mathieu Koudogbo', ['Responsable de formation']),
  STAFF('k.hounkpe@lanem.bj', 'Komi Hounkpè', ['Instructor'], ['Enseignant']),
  STAFF('e.kpossou@lanem.bj', 'Edwige Kpossou', ['Education Manager']),
];

/* ── C9 · reorientation.list_target_terms(target_program, target_academic_year, target_level) ────────────────
 * `{target_program, target_academic_year, target_level, terms: [{academic_term, academic_levels, ue_count}]}` :
 * la filière visée (LRC) n'offre d'UE qu'au S1 et au S2 de 2026-2027, au niveau L1. */
export function targetTerms(p = {}) {
  return { target_program: p.target_program, target_academic_year: p.target_academic_year,
    target_level: p.target_level || null,
    terms: [
      { academic_term: '2026-2027 (S1)', academic_levels: ['LRC-L1'], ue_count: 6 },
      { academic_term: '2026-2027 (S2)', academic_levels: ['LRC-L1'], ue_count: 5 },
    ] };
}

/* ── C4 · module_grade.list_mhc_enrollments(academic_term, program, status, limit) ──────────────────────────
 * `{items, decisions: ['Validé', 'Non validé'], can_decide, may_be_truncated}` ; `can_decide` suit le lecteur
 * (`?as=ga` ou `?as=de` : lecture sans acte, Q5). S3 de 2026-2027, Licence 2 Génie logiciel. */
const MHC = (name, student, student_name, code, mhc_name, type, method, status, extra = {}) => ({
  name, student, student_name, mhc_module: 'MHC-' + code, mhc_code: code, mhc_type: type, mhc_name,
  ...LGL, ...L2GL, validation_method: method, academic_term: S3, status,
  is_validated: status === 'Inscrit' ? 'En attente' : status, validation_comment: null, validated_by: null,
  validated_by_name: null, validation_date: null, blocks_semester: type === 'Obligatoire' ? 1 : 0, ...extra });
const DECIDE_PAR = { validated_by: 'e.kpossou@lanem.bj', validated_by_name: 'Edwige Kpossou', validation_date: '2026-09-08' };
export function mhcEnrollments() {
  return {
    items: [
      MHC('SME-2026-0411', 'ETU-25-0133', 'Marie Kponou', 'EPS-2', 'Éducation physique et sportive', 'Obligatoire',
        'Assiduité', 'Inscrit'),
      MHC('SME-2026-0412', 'ETU-25-0087', 'Ange Sossou', 'EPS-2', 'Éducation physique et sportive', 'Obligatoire',
        'Assiduité', 'Validé', { ...DECIDE_PAR, validation_comment: 'Assiduité de 100 % au S3.' }),
      MHC('SME-2026-0413', 'ETU-24-0164', 'Rachid Ouédraogo', 'EPS-2', 'Éducation physique et sportive',
        'Obligatoire', 'Assiduité', 'Non validé', { ...DECIDE_PAR, validation_comment: 'Trois absences non justifiées.' }),
      MHC('SME-2026-0418', 'ETU-25-0133', 'Marie Kponou', 'ANG-2', 'Anglais de spécialité (TOEIC blanc)',
        'Obligatoire', 'Épreuve', 'Inscrit'),
      MHC('SME-2026-0421', 'ETU-25-0121', 'Marius Kpossou', 'CULT-1', 'Culture numérique', 'Facultatif',
        'Projet', 'Inscrit'),
    ],
    decisions: ['Validé', 'Non validé'],
    can_decide: !LECTEUR_SANS_ACTE(),
    may_be_truncated: false,
  };
}

/* ── C6 · module_grade.list_retake_candidates(course, academic_term, student_group, limit) ──────────────────
 * Le module INF-204 (UE « Programmation avancée », seuil 12, plancher 6) au S2 de 2025-2026, juste après la session
 * principale — la cohorte était alors en L1 ; `?etat=jury-clos` : le jury de fin d'année a statué, chaque ligne
 * porte sa phrase (l'écran la dit une fois, P21). */
const RT = (ue_result, student, student_name, module_average, ue_average, extra = {}) => ({ ue_result, student,
  student_name, ...LGL, course_ue: 'GL-S2-03', ue_name: 'Programmation avancée', module_average, original_grade: null,
  retake_posted: false, ue_average, ue_validated: false, eligible: true, blocked_reason: null, ...extra });
const JURY_CLOS = 'Le jury de fin d’année a statué (DELIB-2026-L1GL, clôturée) : le rattrapage le précède (Art. 31.1, '
  + '26.1) ; une session supplémentaire relève d’une décision du jury, l’année suivante (Art. 30.2).';
export function retakeCandidates(p = {}) {
  let rows = [
    RT('UER-2026-03311', 'ETU-25-0133', 'Marie Kponou', 9.5, 10.25),
    RT('UER-2026-03312', 'ETU-25-0121', 'Marius Kpossou', 11.0, 11.4),
    RT('UER-2026-03313', 'ETU-25-0087', 'Ange Sossou', 14.0, 13.2, { ue_validated: true, eligible: false,
      blocked_reason: 'L’UE GL-S2-03 est validée (moyenne 13.2) : pas de rattrapage, les notes sont conservées (Art. 29.2).' }),
    RT('UER-2026-03314', 'ETU-24-0164', 'Rachid Ouédraogo', 4.0, 5.1, { eligible: false,
      blocked_reason: 'L’UE GL-S2-03 est sous 6/20 (5.1) en session principale : non éligible au rattrapage (Art. 27.2) — le jury tranche (Art. 31.2).' }),
    RT('UER-2026-03315', 'ETU-25-0140', 'Prudence Gbaguidi', 12.5, 10.8, { original_grade: 8.0, retake_posted: true,
      eligible: false, blocked_reason: 'Le module INF-204 a déjà sa note de rattrapage : une session unique (Art. 26.1).' }),
  ];
  if (q('etat') === 'jury-clos') rows = rows.map((r) => ({ ...r, eligible: false, blocked_reason: JURY_CLOS }));
  // Le simulacre a un seul module de rattrapage, au S2 de l'année close : le semestre du contexte n'y change rien.
  if ((p.course || 'INF-204') !== 'INF-204') rows = [];
  return { course: p.course || 'INF-204', course_name: 'Programmation avancée',
    academic_term: '2025-2026 (S2)', rows,
    eligible_count: rows.filter((r) => r.eligible).length, may_be_truncated: false };
}

/* Les actes de l'étape 5 et de l'étape 11, dans le simulacre : ils réussissent ; l'écran relit ensuite la liste. */
export function validateMhcEnrollment(p = {}) {
  return { student: p.student, mhc_module: p.mhc_module, status: p.decision };
}
export function recordRetakeGrade(p = {}) {
  return { ue_result: p.ue_result, course: p.course, retake_grade: Number(p.retake_grade) };
}

const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export function searchPeople(p = {}) {
  const query = (p.query || '').trim();
  if (query.length < 3) {
    throw Object.assign(new Error('La recherche demande au moins 3 caractères.'), { code: 'VALIDATION' });
  }
  const kind = p.kind || 'all';
  const n = norm(query);
  const students = kind === 'staff' ? [] : ETUDIANTS.filter((e) => norm(e.student_name + ' ' + e.student + ' '
    + e.person_id).includes(n));
  const staff = kind === 'student' ? [] : PERSONNEL.filter((s) => norm(s.full_name + ' ' + s.user).includes(n));
  return { query, kind, students, staff, may_be_truncated: { students: false, staff: false } };
}
