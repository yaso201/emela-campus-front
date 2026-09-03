/**
 * Grappe 6 · notes et délibération — formes lues dans
 * `portal_app/services/academic/grade_control.py` et `deliberation_mgmt.py`.
 *
 * ⚠️ UNE SEULE TABLE D'ÉTUDIANTS, et tout en dérive : les unités, le semestre,
 * la moyenne annuelle, l'historique du conseil. Un tableau de jury dont les
 * crédits ne s'accordent pas avec ses unités serait pire qu'inutile — c'est la
 * seule page du système où une divergence se lit comme une décision arbitraire.
 */

const YEAR = '2026-2027';

/**
 * Les unités de l'année, par semestre. Elles font foi pour les crédits.
 *
 * ⚠️ Sept unités par semestre : c'est ce qui rend la synthèse nécessaire. Le lot 2
 * l'a tranché comme une MESURE, pas un arbitrage — quatorze colonnes ne tiennent
 * pas dans 1280 px avec le bloc de décision épinglé.
 */
const UES = {
  'T-1': [
    { code: 'UE 3.1', label: 'Développement logiciel', ects: 9 },
    { code: 'UE 3.2', label: 'Mathématiques appliquées', ects: 6 },
    { code: 'UE 3.3', label: 'Compétences transversales', ects: 3 },
    { code: 'UE 3.4', label: 'Systèmes et réseaux', ects: 9 },
    { code: 'UE 3.5', label: 'Anglais technique', ects: 3 },
    { code: 'UE 3.6', label: 'Projet court', ects: 3 },
    { code: 'UE 3.7', label: 'Ouverture', ects: 3 },
  ],
  'T-2': [
    { code: 'UE 4.1', label: 'Génie logiciel avancé', ects: 9 },
    { code: 'UE 4.2', label: 'Bases de données', ects: 6 },
    { code: 'UE 4.3', label: 'Systèmes d’exploitation', ects: 6 },
    { code: 'UE 4.4', label: 'Statistiques', ects: 3 },
    { code: 'UE 4.5', label: 'Communication', ects: 3 },
    { code: 'UE 4.6', label: 'Projet intégrateur', ects: 6 },
    { code: 'UE 4.7', label: 'Stage', ects: 3 },
  ],
};

/**
 * Les étudiants. Chacun déclare ses NOTES d'unité et rien d'autre : les crédits,
 * les moyennes de semestre et la moyenne annuelle sont CALCULÉS.
 *
 * ⚠️ Une note ≥ 10 valide. Entre 8 et 10, l'unité peut être COMPENSÉE — le jury
 * décide ; le calcul ne compense que si la moyenne du semestre atteint 10. Sous 6,
 * il y a violation de plancher, et le plancher **empêche la compensation** : c'est
 * la règle qui fait qu'un étudiant à 11 de moyenne peut ne pas passer.
 */
const STUDENTS = [
  { student: 'ETU-24-0188', name: 'Fabrice Ahodékon',
    grades: { 'T-1': [6.2, 9.4, 12.0, 5.1, 11.0, 10.5, 9.8],
              'T-2': [9.8, 11.2, 13.0, 7.4, 10.0, 11.5, 12.0] },
    decision: 'Redoublement', new_status: 'Redoublant',
    absences: 12, modules_with_absence: 5, attendance_exceeded: 1,
    cps: {
      preconisations: [
        { kind: 'Avertissement solennel', academic_term: 'T-1', status: 'Prononcée',
          details: 'Résultats très en deçà des attentes sur les deux unités fondamentales.',
          finding: null, closed_on: null },
        { kind: 'Contrat de remédiation', academic_term: 'T-1', status: 'Close',
          details: 'Tutorat hebdomadaire en programmation objet, jusqu’en avril.',
          finding: 'Partiellement atteints — assiduité au tutorat irrégulière.',
          closed_on: '2027-05-04' },
      ],
      unjustified_cps_absences: [],
    } },
  { student: 'ETU-24-0147', name: 'Grâce Aïvodji',
    grades: { 'T-1': [11.5, 12.2, 9.1, 10.8, 12.0, 11.0, 10.2],
              'T-2': [4.0, 5.5, null, null, null, null, null] },
    decision: 'Ajournement', new_status: 'Ajourné',
    absences: 16, modules_with_absence: 7, attendance_exceeded: 1,
    cps: {
      preconisations: [
        { kind: 'Signalement', academic_term: 'T-2', status: 'Prononcée',
          details: 'Rupture d’assiduité à partir de février, sans justificatif.',
          finding: null, closed_on: null },
      ],
      // ⚠️ Absence NON JUSTIFIÉE à la convocation — le seul effet automatique de
      // la séance du conseil, et il se lit ici, au jury.
      unjustified_cps_absences: [
        { session: 'PCS-2027-004', academic_term: 'T-2', session_date: '2027-01-12' },
      ],
    } },
  { student: 'ETU-23-0091', name: 'Serge Bocco',
    grades: { 'T-1': [12.0, 11.4, 13.8, 9.2, 12.5, 11.8, 10.6],
              'T-2': [12.6, 11.9, 14.1, 10.5, 12.0, 13.2, 11.4] },
    decision: 'Passage', new_status: 'Admis',
    absences: 1, modules_with_absence: 1, attendance_exceeded: 0,
    cps: {
      preconisations: [
        { kind: 'Contrat de remédiation', academic_term: 'T-1', status: 'Close',
          details: 'Soutien méthodologique en mathématiques appliquées.',
          finding: 'Objectifs atteints.', closed_on: '2027-06-02' },
      ],
      unjustified_cps_absences: [],
    } },
  { student: 'ETU-24-0203', name: 'Yasmine Toko',
    grades: { 'T-1': [9.6, 10.4, 12.2, 6.8, 11.0, 10.8, 11.4],
              'T-2': [11.0, 9.5, 12.8, 10.2, 11.6, 12.0, 10.4] },
    decision: null, new_status: null,
    absences: 2, modules_with_absence: 2, attendance_exceeded: 0,
    cps: {
      preconisations: [
        // ⚠️ CONTRAT SANS CONSTAT : `finding` est null et `closed_on` aussi. Le
        // jury le lit TEL QUEL — c'est une continuation, pas une anomalie.
        { kind: 'Contrat de remédiation', academic_term: 'T-1', status: 'Prononcée',
          details: 'Reprise des travaux pratiques de systèmes et réseaux.',
          finding: null, closed_on: null },
      ],
      unjustified_cps_absences: [],
    } },
  { student: 'ETU-24-0164', name: 'Rachid Ouédraogo',
    grades: { 'T-1': [5.5, 9.0, 11.5, 6.2, 10.0, 9.4, 10.8],
              'T-2': [9.2, 10.8, 11.4, 9.6, 10.2, 11.0, 9.8] },
    decision: 'Redoublement', new_status: 'Redoublant',
    absences: 11, modules_with_absence: 3, attendance_exceeded: 1,
    cps: {
      preconisations: [
        { kind: 'Réorientation conseillée', academic_term: 'T-2', status: 'Prononcée',
          details: 'Entretien mené le 14 mars ; piste évoquée : informatique de gestion.',
          finding: null, closed_on: null },
      ],
      unjustified_cps_absences: [],
    } },
  { student: 'ETU-24-0112', name: 'Ange Sossou',
    grades: { 'T-1': [9.4, 10.2, 12.5, 10.0, 11.2, 10.6, 11.8],
              'T-2': [11.8, 12.4, 13.2, 11.0, 12.2, 11.6, 12.8] },
    decision: null, new_status: null,
    absences: 4, modules_with_absence: 3, attendance_exceeded: 0,
    cps: {
      preconisations: [
        { kind: 'Avertissement d’absences', academic_term: 'T-1', status: 'Prononcée',
          details: 'Premier seuil franchi le 12 novembre.',
          finding: null, closed_on: null },
      ],
      unjustified_cps_absences: [],
    } },
  { student: 'ETU-24-0175', name: 'Nadia Gbaguidi',
    grades: { 'T-1': [10.8, 11.2, 12.0, 9.4, 11.6, 10.4, 12.2],
              'T-2': [10.6, 11.5, 12.2, 10.9, 11.0, 11.8, 10.2] },
    decision: null, new_status: null,
    absences: 0, modules_with_absence: 0, attendance_exceeded: 0,
    // ⚠️ AUCUNE PRÉCONISATION — le cas majoritaire, et l'écran doit le rendre
    // discret : « aucune préconisation » en gris, jamais un vide qui inquiète.
    cps: { preconisations: [], unjustified_cps_absences: [] } },
  { student: 'ETU-24-0129', name: 'Ibrahim Salifou',
    grades: { 'T-1': [11.0, 5.8, 12.4, 10.2, 11.4, 10.8, 11.2],
              'T-2': [11.6, 10.4, 12.0, 11.2, 10.6, 11.4, 12.2] },
    decision: null, new_status: null,
    absences: 0, modules_with_absence: 0, attendance_exceeded: 0,
    cps: { preconisations: [], unjustified_cps_absences: [] } },
];

/* ─── Les dérivations. Aucun nombre du tableau n'est écrit à la main. ─────── */

const FLOOR = 6;
const PASS = 10;
const COMPENSABLE = 8;

/** Les résultats d'unité d'un étudiant pour un semestre. */
function ueResults(s, term) {
  const list = UES[term];
  return (s.grades[term] || []).map((avg, i) => {
    const ue = list[i];
    if (avg === null || avg === undefined) {
      // Une unité sans note n'est ni acquise ni ratée : elle est absente.
      return { course_ue: ue.code, ue_label: ue.label, academic_term: term,
               ue_average: null, is_validated: 0, is_compensated: 0,
               has_floor_violation: 0, ects_earned: 0, ects_possible: ue.ects,
               ects_grade: null, is_after_retake: 0, is_jury_validated: 0 };
    }
    const validated = avg >= PASS ? 1 : 0;
    const floor = avg < FLOOR ? 1 : 0;
    return { course_ue: ue.code, ue_label: ue.label, academic_term: term,
             ue_average: avg, is_validated: validated,
             // La compensation dépend de la moyenne du semestre : posée ci-dessous.
             is_compensated: 0, has_floor_violation: floor,
             ects_earned: validated ? ue.ects : 0, ects_possible: ue.ects,
             ects_grade: null, is_after_retake: 0, is_jury_validated: 0 };
  });
}

/**
 * Le résultat de semestre — CALCULÉ, avec la compensation.
 *
 * ⚠️ Le plancher EMPÊCHE la compensation. C'est la règle qui fait qu'un étudiant à
 * onze de moyenne peut ne pas valider son semestre, et l'écran doit pouvoir
 * l'expliquer : sans elle, une décision de redoublement au-dessus de dix passe
 * pour arbitraire.
 */
function semesterResult(s, term) {
  const rows = ueResults(s, term);
  const graded = rows.filter((r) => r.ue_average !== null);
  const possible = rows.reduce((a, r) => a + r.ects_possible, 0);
  const average = graded.length
    ? graded.reduce((a, r) => a + r.ue_average * r.ects_possible, 0)
      / graded.reduce((a, r) => a + r.ects_possible, 0)
    : null;
  if (average !== null && average >= PASS) {
    for (const r of rows) {
      if (!r.is_validated && r.ue_average !== null
          && r.ue_average >= COMPENSABLE && !r.has_floor_violation) {
        r.is_compensated = 1;
        r.ects_earned = r.ects_possible;
      }
    }
  }
  const earned = rows.reduce((a, r) => a + r.ects_earned, 0);
  const anyFloor = rows.some((r) => r.has_floor_violation);
  return {
    rows,
    result: {
      name: 'SR-' + s.student + '-' + term,
      semester_average: average === null ? null : Math.round(average * 100) / 100,
      total_ects_earned: earned,
      total_ects_possible: possible,
      // Un semestre est validé si tous les crédits sont acquis ET aucun plancher.
      semester_validated: earned === possible && !anyFloor ? 1 : 0,
      all_mhc_validated: 1,
      jury_decision: null,
      // Les unités non acquises, NOMMÉES — le jury voit lesquelles, pas combien.
      unacquired: rows.filter((r) => !r.is_validated && !r.is_compensated)
        .map((r) => r.course_ue),
    },
  };
}

/** La moyenne annuelle — INDICATIVE, jamais bloquante (Art. 33). */
function annualAverage(s) {
  const a = semesterResult(s, 'T-1').result.semester_average;
  const b = semesterResult(s, 'T-2').result.semester_average;
  if (a === null && b === null) return null;
  if (a === null || b === null) return Math.round((a ?? b) * 100) / 100;
  return Math.round(((a + b) / 2) * 100) / 100;
}

/**
 * `get_deliberation_dashboard(name)`.
 *
 * ⚠️ `rows` NE PORTE QUE LES DÉCISIONS DÉJÀ INSTRUITES — c'est la forme du serveur
 * (`for decision in doc.decisions`). Le simulacre la respecte : trois étudiants
 * seulement, sur huit. C'est ce qui rend le manque visible plutôt que masqué par
 * un jeu d'essai complaisant.
 */
/**
 * F3-PROV : `list_deliberations` — IDENTIFICATION seule (forme serveur) ;
 * le simulacre rend deux jurys pour que le sélecteur ait un choix réel.
 */
/** F3-PROV : le simulacre refuse SANS sujet, comme le serveur — un
 * fallback complaisant rendrait un succès à un appel sans sujet (« un lien
 * qui ressemble à un succès est pire qu'un lien mort »). */
function requireName(params = {}) {
  if (!params.name) throw new Error('deliberation manquante — le sujet voyage dans l\'adresse');
  return params.name;
}

export function listDeliberations(params = {}) {
  if (params.__empty) return { deliberations: [], truncated: false };
  // l'année du MONDE SIMULÉ (le contexte mock la nomme AY-2026) — la
  // cohérence interne du simulacre prime : le filtre du composable envoie
  // cet identifiant.
  const rows = [
    { name: 'DELIB-2027-L2GL', program: 'L2-GL', academic_level: 'L2',
      academic_year: 'AY-2026', academic_term: '2026-2027 (S4)',
      status: 'En cours', deliberation_date: '2027-06-28' },
    { name: 'DELIB-2027-L1MI', program: 'L1-MI', academic_level: 'L1',
      academic_year: 'AY-2026', academic_term: '2026-2027 (S2)',
      status: 'Préparation', deliberation_date: '2027-07-02' },
  ];
  const out = rows
    .filter((r) => !params.academic_year || r.academic_year === params.academic_year)
    .filter((r) => !params.academic_level || r.academic_level === params.academic_level)
    .filter((r) => !params.status || r.status === params.status);
  return { deliberations: out, truncated: false };   // l'enveloppe serveur
}

export function deliberationDashboard(params = {}) {
  if (params.__empty) {
    return { name: requireName(params), status: 'En cours',
             program: 'L2 Génie logiciel', academic_term: 'T-2',
             jury_members: [], rows: [] };
  }
  // Stabilisation §3.2 — le DRAPEAU du serveur, simulé fidèlement : sans lui,
  // les instruites seules ; avec lui, tout le jury (non-décidés marqués).
  const pool = params.include_undecided ? STUDENTS : STUDENTS.filter((s) => s.decision);
  const instructed = pool;
  return {
    name: requireName(params),
    status: 'En cours',
    program: 'L2 Génie logiciel',
    academic_year: YEAR,
    academic_term: 'T-2',
    jury_members: [
      { member_role: 'Président', user: 'S. Kouassi' },
      { member_role: 'Membre', user: 'A. Hounsou' },
      { member_role: 'Membre', user: 'E. Mensah' },
    ],
    rows: instructed.map((s) => ({ ...juryRow(s), undecided: !s.decision })),
  };
}

function juryRow(s) {
  const s1 = semesterResult(s, 'T-1');
  const s2 = semesterResult(s, 'T-2');
  return {
    student: s.student,
    student_name: s.name,
    decision: s.decision,
    new_academic_status: s.new_status,
    attendance_exceeded: s.attendance_exceeded,
    attendance_derogation_reason: null,
    attendance: {
      unjustified_absences: s.absences,
      modules_with_absence: s.modules_with_absence,
      threshold: 10,
    },
    // Le semestre délibéré, et le précédent : la synthèse porte les deux.
    semester_result: s2.result,
    previous_semester_result: s1.result,
    ue_results: [...s1.rows, ...s2.rows],
    annual_average: annualAverage(s),
    cps_history: s.cps,
  };
}

/**
 * LA LISTE DES ÉTUDIANTS À DÉLIBÉRER — 🔴 forme supposée.
 *
 * ⚠️ Aucun point d'entrée lu ne la rend. `get_deliberation_dashboard` ne connaît
 * que les décisions instruites : sans cette lecture, l'écran ne peut pas montrer
 * les quatre-vingt-cinq étudiants qui restent à décider, et le tableau de jury
 * devient une liste de ce qui est déjà fait — l'inverse de son usage.
 *
 * Rendue ici pour que l'écran existe et que le manque se voie, avec la même forme
 * de ligne que le tableau : quand le point d'entrée arrivera, l'écran ne changera
 * pas.
 */
export function deliberationRoster(params = {}) {
  if (params.__empty) return { count: 0, items: [] };
  requireName(params);   // F3-PROV : jamais un jury sans sujet
  return {
    count: STUDENTS.length,
    instructed: STUDENTS.filter((s) => s.decision).length,
    items: STUDENTS.map((s) => juryRow(s)),
  };
}

/* ─── Contrôle des notes ─────────────────────────────────────────────────── */

const SUBMISSIONS = [
  { name: 'GS-0118', course: 'MAT-118', course_name: 'Probabilités',
    student_group: 'SG-L2GL-PROMO', evaluation_component: 'CC',
    status: 'Reçue', instructor: 'Pr. Célestine Ahouandjinou',
    submitted_at: '2027-02-06 09:12', received_at: '2027-02-06 14:40',
    received_by: 'E. Mensah', submission_deadline: '2027-02-05',
    lines: [
      // ⚠️ Zéro AVEC absences massives : « zéro d'absence probable ».
      { student: 'ETU-24-0188', student_name: 'Fabrice Ahodékon', proposed_grade: 0,
        unexcused_absences_on_course: 7, attendance_rows_on_course: 12 },
      // ⚠️ Zéro SANS absence : « zéro d'évaluation probable ». Même note, deux
      // lectures — c'est tout l'objet du croisement.
      { student: 'ETU-24-0147', student_name: 'Grâce Aïvodji', proposed_grade: 0,
        unexcused_absences_on_course: 0, attendance_rows_on_course: 12 },
      { student: 'ETU-24-0210', student_name: 'Josué Kpadonou', proposed_grade: null,
        unexcused_absences_on_course: 9, attendance_rows_on_course: 12 },
      { student: 'ETU-23-0091', student_name: 'Serge Bocco', proposed_grade: 12.5,
        unexcused_absences_on_course: 1, attendance_rows_on_course: 12 },
      { student: 'ETU-24-0203', student_name: 'Yasmine Toko', proposed_grade: 9.75,
        unexcused_absences_on_course: 2, attendance_rows_on_course: 12 },
      { student: 'ETU-24-0112', student_name: 'Ange Sossou', proposed_grade: 11.0,
        unexcused_absences_on_course: 3, attendance_rows_on_course: 12 },
      { student: 'ETU-24-0175', student_name: 'Nadia Gbaguidi', proposed_grade: 14.25,
        unexcused_absences_on_course: 0, attendance_rows_on_course: 12 },
      { student: 'ETU-24-0129', student_name: 'Ibrahim Salifou', proposed_grade: 8.5,
        unexcused_absences_on_course: 0, attendance_rows_on_course: 12 },
    ] },
  { name: 'GS-0204', course: 'INF-204', course_name: 'Programmation objet',
    student_group: 'SG-L2GL-PROMO', evaluation_component: 'PJ',
    status: 'Reçue', instructor: 'Pr. Léonard Hounkpatin',
    submitted_at: '2027-02-07 08:30', received_at: '2027-02-07 11:02',
    received_by: 'E. Mensah', submission_deadline: '2027-02-10',
    lines: [
      { student: 'ETU-24-0188', student_name: 'Fabrice Ahodékon', proposed_grade: 11.0,
        unexcused_absences_on_course: 4, attendance_rows_on_course: 10 },
      { student: 'ETU-23-0091', student_name: 'Serge Bocco', proposed_grade: 13.5,
        unexcused_absences_on_course: 0, attendance_rows_on_course: 10 },
    ] },
  { name: 'GS-0102', course: 'RES-102', course_name: 'Réseaux',
    student_group: 'SG-L2GL-RES', evaluation_component: 'TP',
    status: 'En traitement', instructor: 'M. Cyrille Adjovi',
    submitted_at: '2027-02-07 16:20', received_at: '2027-02-08 09:00',
    received_by: 'E. Mensah', submission_deadline: '2027-02-06',
    lines: [] },
  { name: 'GS-0110', course: 'TRA-110', course_name: 'Expression professionnelle',
    student_group: 'SG-L2GL-A', evaluation_component: 'CC',
    status: 'Intégrée', instructor: 'Mme Estelle Lawson',
    submitted_at: '2027-02-04 10:00', received_at: '2027-02-04 15:30',
    received_by: 'E. Mensah', integrated_at: '2027-02-05 09:10',
    integrated_by: 'E. Mensah', submission_deadline: '2027-02-05',
    lines: [] },
  { name: 'GS-0121', course: 'MAT-121', course_name: 'Algèbre linéaire',
    student_group: 'SG-L2GL-PROMO', evaluation_component: 'DE',
    status: 'Rejetée', instructor: 'Pr. Célestine Ahouandjinou',
    submitted_at: '2027-02-02 09:00', received_at: '2027-02-02 14:00',
    received_by: 'E. Mensah', rejected_at: '2027-02-03 10:20',
    rejected_by: 'E. Mensah',
    rejected_reason: 'Complément attendu — trois notes manquantes sur la promotion.',
    submission_deadline: '2027-02-01',
    lines: [] },
];

/**
 * `list_submissions_for_control(status, course, student_group,
 * evaluation_component, limit, include_attendance)`.
 *
 * ⚠️ `student_count` est SOMMÉ sur les lignes — le serveur le compte
 * (`frappe.db.count` sur le child). Un compte déclaré à côté d'une liste
 * divergerait.
 *
 * ⚠️ `lines` n'est rendu QUE si `include_attendance=1`. Sans le drapeau, l'écran
 * a le volume et pas le détail : c'est le décompte-avant-chargement, au niveau du
 * point d'entrée.
 */
export function submissionsForControl(params = {}) {
  if (params.__empty) return [];
  let rows = SUBMISSIONS;
  if (params.status) rows = rows.filter((r) => r.status === params.status);
  if (params.course) rows = rows.filter((r) => r.course === params.course);
  if (params.student_group) rows = rows.filter((r) => r.student_group === params.student_group);
  if (params.evaluation_component) {
    rows = rows.filter((r) => r.evaluation_component === params.evaluation_component);
  }
  return rows.map((r) => {
    const out = { ...r, student_count: r.lines.length };
    if (!Number(params.include_attendance)) delete out.lines;
    return out;
  });
}

/**
 * Les moyennes de module AJUSTÉES.
 *
 * ⚠️ Une liste d'écarts n'est pas une liste d'erreurs : chaque ajustement porte
 * son motif. L'écran ne doit pas en faire un signalement.
 */
export function adjustedModuleAverages(params = {}) {
  if (params.__empty) return [];
  return [
    { course: 'MAT-118', course_name: 'Probabilités', student: 'ETU-24-0203',
      student_name: 'Yasmine Toko', computed: 9.75, adjusted: 10.0,
      reason: 'Épreuve de rattrapage tenue hors session, note reportée.',
      adjusted_by: 'E. Mensah', adjusted_on: '2027-02-09' },
    { course: 'INF-204', course_name: 'Programmation objet', student: 'ETU-24-0188',
      student_name: 'Fabrice Ahodékon', computed: 6.2, adjusted: 6.5,
      reason: 'Erreur de report sur la composante projet, corrigée.',
      adjusted_by: 'E. Mensah', adjusted_on: '2027-02-10' },
  ];
}

/* ─── Examens · l'écran de composition ──────────────────────────────────── */

const EXAM_CANDIDATES = {
  'EX-0044': ['ETU-24-0188', 'ETU-24-0147', 'ETU-23-0091', 'ETU-24-0203'],
  'EX-0045': [],
};

/**
 * `get_exam_schedule(name)` — l'épreuve et ses candidats.
 *
 * ⚠️ `custom_planning_status` dit si la publication a eu lieu, donc si la
 * convocation est partie. Composer la liste ne convoque personne.
 */
export function examSchedule(params = {}) {
  if (params.__empty) return null;
  const known = {
    'EX-0044': { course: 'MAT-118', course_name: 'Probabilités', exam_type: 'Écrit',
      schedule_date: '2026-09-17', from_time: '08:00', to_time: '11:00',
      room: 'Amphi A', custom_planning_status: 'Publié', custom_status: 'Confirmé',
      published_on: '2026-09-04' },
    'EX-0045': { course: 'INF-204', course_name: 'Programmation objet',
      exam_type: 'Écrit', schedule_date: '2026-09-24', from_time: '08:00',
      to_time: '10:00', room: 'Amphi B', custom_planning_status: 'Brouillon',
      custom_status: 'Planifié', published_on: null },
  };
  const meta = known[params.name];
  if (!meta) {
    throw Object.assign(new Error('Épreuve introuvable : ' + params.name + '.'),
      { code: 'NOT_FOUND', status: 404 });
  }
  const ids = EXAM_CANDIDATES[params.name] || [];
  return {
    name: params.name,
    ...meta,
    students: ids.map((id) => {
      const s = STUDENTS.find((x) => x.student === id);
      return { student: id, student_name: s ? s.name : id };
    }),
    student_count: ids.length,
  };
}

/**
 * ⚠️ PAS DE FIXTURE POUR « LES CANDIDATS D'UN GROUPE ».
 *
 * J'en avais écrit une. Elle dupliquait la liste des membres du groupe, que
 * `groups.get_group(name)` rend déjà — deux listes du même ensemble, qui auraient
 * divergé au premier changement. L'écran de composition lit donc le groupe par son
 * vrai point d'entrée, et `already_registered` se calcule dans la vue contre la
 * liste courante des candidats.
 *
 * Une fixture de moins est une divergence de moins.
 */

/** Le rapport d'un peuplement — acte de masse, succès partiel courant. */
export function examPopulateReport(params = {}) {
  const already = new Set(EXAM_CANDIDATES[params.exam_schedule] || []);
  // F3-FORMES : statuts et CONTRAT DE MASSE du serveur (already_listed —
  // le no-op idempotent compte réussi ; unknown_student non rejouable).
  const rows = STUDENTS.map((s) => already.has(s.student)
    ? { student: s.student, status: 'already_listed' }
    : { student: s.student, status: 'added' });
  const OK = new Set(['added', 'already_listed']);
  const succeeded = rows.filter((r) => OK.has(r.status));
  const failed = rows.filter((r) => !OK.has(r.status));
  return {
    exam_schedule: params.exam_schedule, student_group: params.student_group,
    rows, added_count: rows.filter((r) => r.status === 'added').length,
    total: rows.length,
    succeeded_count: succeeded.length, failed_count: failed.length,
    succeeded, failed, retry_ids: [],
  };
}
