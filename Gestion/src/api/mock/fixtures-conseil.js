/**
 * Grappe 8 · le conseil pédagogique — QUATRE ÉCRANS, AUCUNE DÉCISION.
 *
 * ⚠️ LA THÈSE DE CETTE GRAPPE EST NÉGATIVE : le conseil ne prononce rien. Ni
 * progression, ni redoublement, ni exclusion. Il constate, il alerte, il
 * préconise — et les décisions appartiennent au jury de fin d'année.
 *
 * Trois conséquences dans les données elles-mêmes, et non dans l'écran :
 *
 *   — les valeurs de janvier portent `official: false`. Elles sont CALCULÉES, pas
 *     arrêtées : la délibération est annuelle et se tient en juillet. L'écran ne
 *     décide pas de cette mention, il la lit ;
 *   — la liste des candidats n'a NI SCORE, NI RANG. Trois critères booléens la
 *     produisent, et rien d'autre. Un tri par gravité serait un classement des
 *     étudiants — ce que la liste n'est pas ;
 *   — les préconisations ne portent aucune date d'ENVOI au jury. Elles sont lues
 *     en permanence, donc une préconisation postérieure à une séance figure au
 *     jury comme les autres. Un horodatage de transmission ferait croire à un
 *     instantané, et il en manquerait toujours une.
 */

/** Les trois critères, DÉCLARÉS une fois : les lignes s'y rangent. */
export const CRITERIA = [
  { key: 'credits', label: '20 crédits', title: '20 crédits non acquis',
    rule: 'Vingt crédits ou plus non acquis sur trente.' },
  { key: 'floor', label: 'UE < 6', title: 'Unité sous 6/20',
    rule: 'Une unité d’enseignement sous 6/20.' },
  { key: 'absence', label: 'absences', title: 'Seuil d’absence',
    rule: 'Dix séances ou plus sur le semestre, toutes activités confondues. '
      + 'Le nombre de modules concernés est une information, jamais un seuil.' },
];

/**
 * ⚠️ AUCUN CHAMP DE GRAVITÉ. Les lignes sont rangées dans l'ordre du registre —
 * `roll` — et non par nombre de critères ou par crédits manquants.
 *
 * Trier par gravité aurait produit un classement, donc une conclusion. Or figurer
 * sur cette liste n'emporte rien : c'est le résultat de trois calculs, et le
 * conseil examine qui il veut.
 */
const CANDIDATES = [
  { student: 'ETU-24-0112', student_name: 'Ange Sossou', roll: 3,
    credits_missing: 20, credits_total: 30, lowest_ue: 6.75, lowest_ue_code: 'UE 3.4',
    absences: 11, absence_modules: 3, credits: true, floor: false, absence: true,
    previous_council: null, retained: true },
  { student: 'ETU-24-0129', student_name: 'Ibrahim Salifou', roll: 5,
    credits_missing: 6, credits_total: 30, lowest_ue: 5.75, lowest_ue_code: 'UE 3.2',
    absences: 0, absence_modules: 0, credits: false, floor: true, absence: false,
    previous_council: null, retained: false },
  { student: 'ETU-24-0147', student_name: 'Grâce Aïvodji', roll: 8,
    credits_missing: 9, credits_total: 30, lowest_ue: 9.25, lowest_ue_code: 'UE 3.5',
    absences: 16, absence_modules: 7, credits: false, floor: false, absence: true,
    previous_council: null, retained: true },
  { student: 'ETU-24-0164', student_name: 'Rachid Ouédraogo', roll: 11,
    credits_missing: 22, credits_total: 30, lowest_ue: 5.50, lowest_ue_code: 'UE 3.1',
    absences: 4, absence_modules: 3, credits: true, floor: true, absence: false,
    previous_council: null, retained: true },
  { student: 'ETU-24-0175', student_name: 'Nadia Gbaguidi', roll: 14,
    credits_missing: 20, credits_total: 30, lowest_ue: 8.00, lowest_ue_code: 'UE 3.4',
    absences: 1, absence_modules: 1, credits: true, floor: false, absence: false,
    previous_council: null, retained: false },
  { student: 'ETU-24-0188', student_name: 'Fabrice Ahodékon', roll: 17,
    credits_missing: 24, credits_total: 30, lowest_ue: 4.25, lowest_ue_code: 'UE 3.4',
    absences: 12, absence_modules: 5, credits: true, floor: true, absence: true,
    previous_council: null, retained: true },
  { student: 'ETU-24-0203', student_name: 'Yasmine Toko', roll: 21,
    credits_missing: 21, credits_total: 30, lowest_ue: 7.50, lowest_ue_code: 'UE 3.3',
    absences: 3, absence_modules: 2, credits: true, floor: false, absence: false,
    previous_council: null, retained: true },
  { student: 'ETU-23-0091', student_name: 'Serge Bocco', roll: 26,
    credits_missing: 12, credits_total: 30, lowest_ue: 5.00, lowest_ue_code: 'UE 3.4',
    absences: 2, absence_modules: 2, credits: false, floor: true, absence: false,
    previous_council: 'Janvier 2026 · contrat de remédiation', retained: true },
];

/**
 * `list_council_candidates(...)` — 🔴 le point d'entrée n'est pas tranché.
 *
 * Le décompte des critères est DÉRIVÉ des booléens de chaque ligne : deux
 * comptes du même ensemble divergeraient.
 */
export function councilCandidates(params = {}) {
  const base = {
    program_label: 'L2 Génie logiciel', term_label: 'Semestre 1 (impair)',
    enrolled: 96, session_date: '22 janvier 2027', official: false,
    criteria: CRITERIA.map((c) => ({ ...c, count: 0 })),
  };
  if (params.__empty) return { ...base, count: 0, retained: 0, items: [] };
  let rows = CANDIDATES.slice().sort((a, b) => a.roll - b.roll);
  if (params.criterion === 'retained') rows = rows.filter((r) => r.retained);
  else if (params.criterion) rows = rows.filter((r) => r[params.criterion]);
  return {
    ...base,
    criteria: CRITERIA.map((c) => ({ ...c, count: CANDIDATES.filter((r) => r[c.key]).length })),
    count: CANDIDATES.length,
    retained: CANDIDATES.filter((r) => r.retained).length,
    items: rows,
  };
}

/**
 * L'ordre du jour de la séance. `presence` est un CONSTAT à trois valeurs, et la
 * troisième — absent sans justification — est le SEUL effet automatique du
 * dispositif : elle est portée au jury de fin d'année.
 */
const AGENDA = [
  { name: 'CPS-2027-001', student: 'ETU-24-0188', student_name: 'Fabrice Ahodékon',
    convoked_on: '12 janvier', examined_at: '14 h 12', presence: 'absent_justifie',
    presence_label: 'Absent justifié', preconisations: 2,
    status: 'valide', status_label: 'Examiné' },
  { name: 'CPS-2027-002', student: 'ETU-24-0203', student_name: 'Yasmine Toko',
    convoked_on: '12 janvier', examined_at: '14 h 26', presence: 'present',
    presence_label: 'Présente', preconisations: 1,
    status: 'valide', status_label: 'Examinée' },
  { name: 'CPS-2027-003', student: 'ETU-23-0091', student_name: 'Serge Bocco',
    convoked_on: '12 janvier', examined_at: null, presence: 'present',
    presence_label: 'Présent', preconisations: 1,
    status: 'propose', status_label: 'En cours d’examen' },
  { name: 'CPS-2027-004', student: 'ETU-24-0147', student_name: 'Grâce Aïvodji',
    convoked_on: '12 janvier', examined_at: null, presence: 'absent',
    presence_label: 'Absente non justifiée', preconisations: 0,
    status: 'a_instruire', status_label: 'À examiner' },
  { name: 'CPS-2027-005', student: 'ETU-24-0112', student_name: 'Ange Sossou',
    convoked_on: '12 janvier', examined_at: null, presence: 'present',
    presence_label: 'Présent', preconisations: 0,
    status: 'a_instruire', status_label: 'À examiner' },
  { name: 'CPS-2027-006', student: 'ETU-24-0164', student_name: 'Rachid Ouédraogo',
    convoked_on: '14 janvier', examined_at: null, presence: 'present',
    presence_label: 'Présent', preconisations: 0,
    status: 'a_instruire', status_label: 'À examiner' },
];

/** Les constats portés au procès-verbal, par étudiant examiné. */
const FINDINGS = {
  'CPS-2027-003': {
    observations: 'L’étudiant expose des difficultés d’organisation entre le stage à temps partiel '
      + 'et les travaux pratiques. Le conseil constate une progression en développement logiciel.',
    rows: [
      { label: 'Crédits non acquis au semestre 1', value: '12 / 30', official: false,
        note: 'Sous le seuil de vingt — pas un critère constaté', flagged: false },
      { label: 'Unité la plus basse', value: '5,00', official: false,
        note: 'UE 3.4 Systèmes et réseaux — critère constaté', flagged: true },
      { label: 'Absences sur le semestre', value: '2 séances', official: true,
        note: 'Sous le premier seuil', flagged: false },
      { label: 'Conseil antérieur', value: 'Janvier 2026', official: true,
        note: 'Contrat de remédiation — constat : partiellement atteint', flagged: true },
    ],
  },
};

/**
 * `get_council_session(...)` — 🔴 non tranché.
 *
 * ⚠️ `can_close` et `close_blocked_reason` viennent du SERVEUR, jamais d'un calcul
 * de vue. « Un choix grisé qui explique pourquoi vaut mieux qu'un choix absent » —
 * mais la RAISON doit venir de qui refuse, sinon l'écran invente une règle.
 */
export function councilSession(params = {}) {
  const base = {
    name: 'CPS-2027-L2GL-01', date: '22 janvier 2027', opened_at: '14 h 05',
    program_label: 'L2 Génie logiciel', chair: 'S. Kouassi, directeur des études',
    convoked: 6, official: false,
    can_close: false,
    close_blocked_reason: 'Deux étudiants de l’ordre du jour n’ont pas été examinés. '
      + 'Une séance close laisse au jury un ordre du jour incomplet, sans dire qui n’a pas été vu.',
  };
  if (params.__empty) return { ...base, agenda: [], examined: 0, subject: null };
  const selected = params.item || 'CPS-2027-003';
  const subject = AGENDA.find((a) => a.name === selected) || null;
  return {
    ...base,
    agenda: AGENDA,
    examined: AGENDA.filter((a) => a.examined_at).length,
    subject: subject ? { ...subject, ...(FINDINGS[subject.name] || { observations: '', rows: [] }) } : null,
  };
}

/**
 * Les CINQ types de préconisation. Chacun a un propriétaire et une clôture — et
 * un seul exige un constat.
 *
 * ⚠️ `needs_finding` est ce qui distingue le contrat de remédiation des quatre
 * autres : sans son constat de fin de semestre, il n'est qu'une intention morte.
 * C'est le seul vrai risque du dispositif, et il est déclaré ici plutôt que
 * reconnu au libellé par l'écran.
 */
export const PRECONISATION_TYPES = [
  { key: 'avertissement', label: 'Avertissement solennel', owner: 'Directeur des études',
    closes: 'À la notification', needs_finding: false, in_file: true,
    note: 'Notifié, inscrit au dossier, porté au jury.' },
  { key: 'contrat', label: 'Contrat de remédiation', owner: 'Enseignant référent',
    closes: 'Au constat de fin de semestre', needs_finding: true, in_file: true,
    note: 'Objectifs et accompagnement pour le semestre pair, et un constat en fin de '
      + 'semestre : atteints, partiellement, non atteints.' },
  { key: 'reorientation', label: 'Recommandation de réorientation', owner: 'Directeur des études',
    closes: 'À la notification', needs_finding: false, in_file: false,
    note: 'À titre de conseil, sans caractère contraignant. N’ouvre aucune demande, '
      + 'ne pré-remplit aucun formulaire, ne déclenche aucune procédure.' },
  { key: 'signalement', label: 'Signalement au jury', owner: 'Directeur des études',
    closes: 'Au jury de fin d’année', needs_finding: false, in_file: true,
    note: 'Pour les cas les plus graves.' },
  { key: 'absences', label: 'Avertissement d’absences', owner: 'Directeur des études',
    closes: 'À la notification', needs_finding: false, in_file: true,
    note: 'Issu du premier seuil d’absence. Prononcé, jamais automatique.' },
];

const PRECONISATIONS = [
  { name: 'PRE-2027-004', kind: 'contrat', student_name: 'Serge Bocco', student: 'ETU-23-0091',
    rendered_on: '22 janvier', due_on: '30 juin', days_left: 26, owner: 'M. Dossou',
    body: 'Rattrapage des travaux pratiques de systèmes, tutorat hebdomadaire.',
    finding: null, status: 'incomplete', status_label: 'Constat manquant' },
  { name: 'PRE-2027-005', kind: 'contrat', student_name: 'Yasmine Toko', student: 'ETU-24-0203',
    rendered_on: '22 janvier', due_on: '30 juin', days_left: 26, owner: 'Mme Lawson',
    body: 'Objectifs de méthode de travail, accompagnement par le tutorat de filière.',
    finding: null, status: 'incomplete', status_label: 'Constat manquant' },
  { name: 'PRE-2027-001', kind: 'contrat', student_name: 'Fabrice Ahodékon', student: 'ETU-24-0188',
    rendered_on: '22 janvier', due_on: '30 juin', days_left: 26, owner: 'M. Dossou',
    body: 'Rattrapage des travaux pratiques et présence en cours magistral.',
    finding: { verdict: 'Partiellement atteints', posted_on: '2 juin', posted_by: 'M. Dossou',
      text: 'Les travaux pratiques ont été rattrapés ; la présence en cours magistral reste irrégulière.' },
    status: 'valide', status_label: 'Clos · partiellement atteint' },
  { name: 'PRE-2027-002', kind: 'avertissement', student_name: 'Fabrice Ahodékon', student: 'ETU-24-0188',
    rendered_on: '22 janvier', due_on: null, days_left: null, owner: 'Directeur des études',
    body: 'Notifié le 24 janvier, inscrit au dossier, porté au jury.',
    finding: null, status: 'valide', status_label: 'Notifié le 24 janvier' },
  { name: 'PRE-2027-006', kind: 'reorientation', student_name: 'Rachid Ouédraogo', student: 'ETU-24-0164',
    rendered_on: '22 janvier', due_on: null, days_left: null, owner: 'Directeur des études',
    body: 'À titre de conseil, sans caractère contraignant. Si l’étudiant souhaite se réorienter, '
      + 'il en fait la demande lui-même, dans les formes ordinaires.',
    finding: null, status: 'brouillon', status_label: 'Rendue le 22 janvier' },
  { name: 'PRE-2027-007', kind: 'signalement', student_name: 'Grâce Aïvodji', student: 'ETU-24-0147',
    rendered_on: '22 janvier', due_on: '28 juillet', days_left: 54, owner: 'Directeur des études',
    body: 'Absence non justifiée à la convocation du conseil, 16 séances manquées au semestre 1.',
    finding: null, status: 'propose', status_label: 'Ouvert jusqu’au jury' },
  { name: 'PRE-2026-031', kind: 'absences', student_name: 'Nadia Gbaguidi', student: 'ETU-24-0175',
    rendered_on: '4 janvier', due_on: null, days_left: null, owner: 'Directeur des études',
    body: 'Premier seuil franchi au semestre 1 — 13 séances sur 4 modules.',
    finding: null, status: 'valide', status_label: 'Notifié le 4 janvier' },
  { name: 'PRE-2026-030', kind: 'absences', student_name: 'Paul Zannou', student: 'ETU-24-0301',
    rendered_on: '3 décembre', due_on: null, days_left: null, owner: 'Directeur des études',
    body: 'Premier seuil franchi au semestre 1 — 15 séances sur 5 modules.',
    finding: null, status: 'valide', status_label: 'Notifié le 3 décembre' },
];

/**
 * `list_council_preconisations(...)` — 🔴 non tranché.
 *
 * ⚠️ LES CONTRATS SANS CONSTAT VIENNENT EN TÊTE, et c'est le seul ordonnancement
 * de cette lecture. Ce n'est pas un tri par gravité d'étudiant — c'est un tri par
 * ce qui MANQUE au dossier que le jury lira.
 */
export function councilPreconisations(params = {}) {
  const base = {
    jury_date: '28 juillet', days_to_jury: 54, program_label: 'L2 Génie logiciel',
    types: PRECONISATION_TYPES.map((t) => ({ ...t, count: 0 })),
    // ⚠️ Aucune date de transmission : le jury LIT, on ne lui envoie pas.
    transmission: 'affichage permanent',
  };
  if (params.__empty) return { ...base, count: 0, closed: 0, missing_findings: 0, items: [] };
  let rows = PRECONISATIONS;
  if (params.kind === 'missing') rows = rows.filter((r) => needsFinding(r) && !r.finding);
  else if (params.kind) rows = rows.filter((r) => r.kind === params.kind);
  const order = (r) => (needsFinding(r) && !r.finding ? 0 : 1);
  return {
    ...base,
    types: PRECONISATION_TYPES.map((t) => ({
      ...t, count: PRECONISATIONS.filter((r) => r.kind === t.key).length })),
    count: PRECONISATIONS.length,
    closed: PRECONISATIONS.filter((r) => r.status === 'valide').length,
    missing_findings: PRECONISATIONS.filter((r) => needsFinding(r) && !r.finding).length,
    items: rows.slice().sort((a, b) => order(a) - order(b)),
  };
}

/** Dérivé de la table des types, jamais lu au libellé de la préconisation. */
export function needsFinding(row) {
  const type = PRECONISATION_TYPES.find((t) => t.key === row.kind);
  return !!(type && type.needs_finding);
}

/**
 * Les deux seuils d'absence.
 *
 * ⚠️ FRANCHIR LE SECOND N'EFFACE PAS LE PREMIER. `first_pronounced` est porté par
 * chaque ligne du second seuil : quand il est faux, les DEUX actes restent
 * proposés. Une ligne du second seuil qui ne proposerait que la convocation
 * laisserait un avertissement jamais prononcé, sans que rien ne le dise.
 */
const THRESHOLD_ROWS = [
  { student: 'ETU-24-0188', student_name: 'Fabrice Ahodékon', program_label: 'L2 Génie logiciel',
    sessions: 12, modules: 5, last_absence: '19 décembre', level: 1,
    first_pronounced: false, first_pronounced_on: null, retained: false,
    status: 'incomplete', status_label: 'À prononcer' },
  { student: 'ETU-24-0112', student_name: 'Ange Sossou', program_label: 'L2 Génie logiciel',
    sessions: 11, modules: 3, last_absence: '16 décembre', level: 1,
    first_pronounced: false, first_pronounced_on: null, retained: false,
    status: 'incomplete', status_label: 'À prononcer' },
  { student: 'ETU-24-0175', student_name: 'Nadia Gbaguidi', program_label: 'L1 Math-Info',
    sessions: 13, modules: 4, last_absence: '20 décembre', level: 1,
    first_pronounced: true, first_pronounced_on: '4 janvier', retained: false,
    status: 'valide', status_label: 'Prononcé le 4 janvier' },
  { student: 'ETU-24-0129', student_name: 'Ibrahim Salifou', program_label: 'L1 Math-Info',
    sessions: 10, modules: 2, last_absence: '12 décembre', level: 1,
    first_pronounced: false, first_pronounced_on: null, retained: false,
    status: 'incomplete', status_label: 'À prononcer' },
  { student: 'ETU-24-0147', student_name: 'Grâce Aïvodji', program_label: 'L2 Génie logiciel',
    sessions: 16, modules: 7, last_absence: '5 janvier', level: 2,
    first_pronounced: true, first_pronounced_on: '12 novembre', retained: false,
    status: 'a_envisager', status_label: 'À envisager' },
  { student: 'ETU-24-0290', student_name: 'Josué Kpadonou', program_label: 'L3 Génie logiciel',
    sessions: 19, modules: 9, last_absence: '5 janvier', level: 2,
    first_pronounced: false, first_pronounced_on: null, retained: false,
    status: 'a_envisager', status_label: 'À envisager' },
  { student: 'ETU-23-0044', student_name: 'Aïcha Bello', program_label: 'M1 Systèmes d’information',
    sessions: 17, modules: 6, last_absence: '3 janvier', level: 2,
    first_pronounced: true, first_pronounced_on: '20 novembre', retained: true,
    status: 'valide', status_label: 'Retenue pour la séance' },
  { student: 'ETU-24-0301', student_name: 'Paul Zannou', program_label: 'L1 Math-Info',
    sessions: 15, modules: 5, last_absence: '4 janvier', level: 2,
    first_pronounced: true, first_pronounced_on: '3 décembre', retained: false,
    status: 'a_envisager', status_label: 'À envisager' },
];

/**
 * `list_absence_thresholds(...)` — 🔴 non tranché.
 *
 * ⚠️ Les actes proposés sont DÉRIVÉS de l'état de la ligne, jamais écrits ligne
 * par ligne : `acts` vaut ['avertissement'] au premier seuil non prononcé, et
 * ['avertissement', 'convocation'] au second quand le premier manque encore.
 */
export function absenceThresholds(params = {}) {
  const blocks = [
    { key: 'first', level: 1, threshold: 10, tone: 'warning',
      title: 'Premier seuil — dix séances ou plus',
      verb: 'Un avertissement d’absences à prononcer',
      note: 'Prononcé, il devient une préconisation et rejoint le dossier ; il sera '
        + 'transmis au jury. Rien ne se déclenche seul.' },
    { key: 'second', level: 2, threshold: 15, tone: 'error',
      title: 'Second seuil — quinze séances ou plus',
      verb: 'Une convocation devant le conseil pédagogique à envisager',
      note: 'Envisager, non convoquer : la décision de convoquer appartient au directeur '
        + 'des études. Franchir le second seuil n’efface pas le premier.' },
  ];
  if (params.__empty) return { blocks: blocks.map((b) => ({ ...b, count: 0, items: [] })), programs: 4 };
  return {
    programs: 4,
    computed_at: '5 janvier à 23 h 00',
    blocks: blocks.map((b) => {
      const items = THRESHOLD_ROWS.filter((r) => r.level === b.level).map((r) => ({
        ...r,
        acts: actsFor(r),
      }));
      return { ...b, count: items.length, items };
    }),
  };
}

/** Les actes proposés sur une ligne — dérivés, jamais écrits. */
export function actsFor(row) {
  const out = [];
  if (!row.first_pronounced) out.push('avertissement');
  if (row.level === 2 && !row.retained) out.push('convocation');
  if (row.retained) out.push('seance');
  if (row.first_pronounced && row.level === 1) out.push('preconisation');
  return out;
}
