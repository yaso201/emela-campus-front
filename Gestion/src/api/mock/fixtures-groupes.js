/**
 * Fixtures de la grappe 4 — groupes et inscriptions.
 *
 * Les formes rendues sont celles des VRAIES fonctions, lues dans le code : le
 * simulacre ne doit pas inventer une forme plus commode que celle du serveur.
 *
 * ⚠️ Les pastilles emploient le vocabulaire de `StatusPill` — `incomplete`,
 * `renvoyee`, `valide`, `brouillon`, `suspendue` — et NON celui de la file de
 * travail (`warn`, `err`, `ok`). Les deux se ressemblent et ne se recouvrent
 * pas : un statut hors vocabulaire retombe en gris neutre et affiche sa propre
 * clé, donc une inscription REJETÉE se lisait « err » en gris.
 */

/**
 * `groups.list_group_candidates(group)` — les étudiants qu'on peut ajouter.
 *
 * ⚠️ « Éligibilité TC = source unique, indépendante des System Defaults vendor »
 * — c'est la fonction serveur qui tranche. La première version dérivait
 * l'éligibilité d'une liste d'inscriptions au programme : elle aurait divergé de
 * la règle dès le premier cas de tronc commun.
 */
export function groupCandidates(params = {}) {
  if (params.__empty) return [];
  return [
    { student: 'ETU-24-0188', student_name: 'Fabrice Ahodékon', program_enrollment: 'PE-0188', active: 1 },
    { student: 'ETU-24-0147', student_name: 'Grâce Aïvodji', program_enrollment: 'PE-0147', active: 1 },
    { student: 'ETU-23-0091', student_name: 'Serge Bocco', program_enrollment: 'PE-0091', active: 1 },
    { student: 'ETU-24-0203', student_name: 'Yasmine Toko', program_enrollment: 'PE-0203', active: 1 },
    { student: 'ETU-24-0164', student_name: 'Rachid Ouédraogo', program_enrollment: 'PE-0164', active: 1 },
    // ⚠️ `active: 0` vient de `Student.enabled` — un étudiant désactivé reste
    // éligible au groupe côté serveur. L'écran le montre, il ne le cache pas.
    { student: 'ETU-24-0112', student_name: 'Ange Sossou', program_enrollment: 'PE-0112', active: 0 },
  ];
}

/**
 * `groups.list_groups(program, academic_year, …)` — les groupes de la filière.
 *
 * ⚠️ UNE SEULE TABLE, et `get_group` la relit : les deux points d'entrée ne
 * peuvent donc pas se contredire sur la capacité ou le nom d'un groupe.
 * `active_count` est SOMMÉ sur les membres, jamais déclaré à côté d'eux.
 */
const GROUPS = [
  { name: 'SG-L2GL-A', group_name: 'L2 Génie logiciel — Groupe A', group_based_on: 'Batch',
    custom_group_type: 'Groupe de TD', program: 'L2 Génie logiciel', max_strength: 30, disabled: 0 },
  { name: 'SG-L2GL-B', group_name: 'L2 Génie logiciel — Groupe B', group_based_on: 'Batch',
    custom_group_type: 'Groupe de TD', program: 'L2 Génie logiciel', max_strength: 30, disabled: 0 },
  { name: 'SG-L2GL-PROMO', group_name: 'L2 Génie logiciel — Promotion', group_based_on: 'Batch',
    custom_group_type: 'Cohorte', program: 'L2 Génie logiciel', max_strength: 0, disabled: 0 },
  { name: 'SG-L2GL-RES', group_name: 'RES-102 — travaux pratiques', group_based_on: 'Course',
    custom_group_type: 'Groupe de TP', program: 'L2 Génie logiciel', max_strength: 16, disabled: 0 },
];

/** Les membres, par groupe. Un membre inactif RESTE au groupe, avec son rang. */
const MEMBERS = {
  'SG-L2GL-A': [
    { student: 'ETU-24-0188', student_name: 'Fabrice Ahodékon', group_roll_number: 1, active: 1 },
    { student: 'ETU-24-0147', student_name: 'Grâce Aïvodji', group_roll_number: 2, active: 1 },
    { student: 'ETU-23-0091', student_name: 'Serge Bocco', group_roll_number: 3, active: 1 },
    // ⚠️ Désactivé, non supprimé : l'écran dit « retirer du groupe », pas « effacer ».
    { student: 'ETU-24-0112', student_name: 'Ange Sossou', group_roll_number: 4, active: 0 },
  ],
  // ⚠️ DIX-HUIT membres pour une capacité de SEIZE. Ce groupe existe pour
  // éprouver une branche d'écran réelle — le dépassement de capacité —, et il
  // faut donc que l'effectif la produise vraiment. Une réécriture précédente
  // avait ramené ce groupe à deux membres : l'invariant tenait toujours, la
  // branche ne s'ouvrait plus. Un jeu d'essai cohérent n'est pas un jeu d'essai
  // suffisant. Généré parce qu'écrire dix-huit lignes invite à en perdre une.
  'SG-L2GL-RES': Array.from({ length: 18 }, (_, i) => ({
    student: 'ETU-24-' + String(300 + i),
    student_name: 'Étudiant ' + (i + 1) + ' — groupe de TP',
    group_roll_number: i + 1,
    active: 1,
  })),
  'SG-L2GL-B': Array.from({ length: 26 }, (_, i) => ({
    student: 'ETU-24-' + String(400 + i),
    student_name: 'Étudiant ' + (i + 1) + ' — groupe B',
    group_roll_number: i + 1,
    active: 1,
  })),
  /**
   * La cohorte de promotion — sans capacité (`max_strength: 0`) : l'écran ne doit
   * pas afficher « 44 sur 0 », ni en déduire un dépassement.
   *
   * ⚠️ Les huit premiers sont les étudiants NOMMÉS du reste du jeu d'essai. Sans
   * eux, l'écran de composition d'épreuve aurait montré « Étudiant 1 — promotion »
   * là où la liste des candidats montre « Fabrice Ahodékon », et « déjà inscrit »
   * n'aurait jamais été vrai. Un jeu d'essai dont les listes ne se recoupent pas
   * ferme les branches qui dépendent du recoupement.
   */
  'SG-L2GL-PROMO': [
    { student: 'ETU-24-0188', student_name: 'Fabrice Ahodékon', group_roll_number: 1, active: 1 },
    { student: 'ETU-24-0147', student_name: 'Grâce Aïvodji', group_roll_number: 2, active: 1 },
    { student: 'ETU-23-0091', student_name: 'Serge Bocco', group_roll_number: 3, active: 1 },
    { student: 'ETU-24-0203', student_name: 'Yasmine Toko', group_roll_number: 4, active: 1 },
    { student: 'ETU-24-0164', student_name: 'Rachid Ouédraogo', group_roll_number: 5, active: 1 },
    { student: 'ETU-24-0112', student_name: 'Ange Sossou', group_roll_number: 6, active: 1 },
    { student: 'ETU-24-0175', student_name: 'Nadia Gbaguidi', group_roll_number: 7, active: 1 },
    { student: 'ETU-24-0129', student_name: 'Ibrahim Salifou', group_roll_number: 8, active: 1 },
    ...Array.from({ length: 36 }, (_, i) => ({
      student: 'ETU-24-' + String(500 + i),
      student_name: 'Étudiant ' + (i + 9) + ' — promotion',
      group_roll_number: i + 9,
      active: 1,
    })),
  ],
};

/** Les enseignants du groupe — portés par `get_group`, sans appel séparé. */
const INSTRUCTORS = {
  'SG-L2GL-A': [
    { instructor: 'HR-0142', instructor_name: 'Pr. Léonard Hounkpatin' },
    { instructor: 'HR-0155', instructor_name: 'M. Firmin Dossou' },
  ],
  'SG-L2GL-RES': [{ instructor: 'HR-0161', instructor_name: 'M. Cyrille Adjovi' }],
};

const membersOf = (name) => MEMBERS[name] || [];
const activeCount = (name) => membersOf(name).filter((s) => s.active).length;

export function groups(params = {}) {
  if (params.__empty) return [];
  const rows = Number(params.include_disabled) ? GROUPS : GROUPS.filter((g) => !g.disabled);
  // Dérivé, comme le fait `_active_counts` au serveur.
  return rows.map((g) => ({ ...g, active_count: activeCount(g.name) }));
}

/**
 * `groups.get_group(name, count_only=0)` — le groupe AVEC ses membres et ses
 * enseignants, en UN appel.
 *
 * ⚠️ La première version en faisait trois : le groupe, ses étudiants, ses
 * enseignants. Règle 6 appliquée au contrat — trois lectures du même ensemble
 * divergeraient, et l'effectif d'en-tête aurait cessé de s'accorder avec la liste
 * en dessous.
 *
 * ⚠️ `count_only=1` rend le seul effectif, SOUS LES MÊMES GARDES : c'est le
 * décompte-avant-chargement, offert par le serveur sur ce point d'entrée même.
 */
export function group(params = {}) {
  if (params.__empty) return null;
  const meta = GROUPS.find((g) => g.name === params.name);
  // Un sujet inconnu n'est pas un groupe vide : c'est une erreur.
  if (!meta) {
    throw Object.assign(new Error('Groupe introuvable : ' + params.name + '.'),
      { code: 'NOT_FOUND', status: 404 });
  }
  const all = membersOf(meta.name);
  const instructors = INSTRUCTORS[meta.name] || [];
  if (Number(params.count_only)) {
    return { name: meta.name, active_count: activeCount(meta.name),
             instructors_count: instructors.length };
  }
  return {
    ...meta,
    students: Number(params.include_inactive) ? all : all.filter((s) => s.active),
    instructors,
    active_count: activeCount(meta.name),
    instructors_count: instructors.length,
  };
}

/**
 * LA VUE D'EFFECTIFS — `groups.get_cohort_overview(program, academic_year, …)`.
 *
 * Un seul appel, effectifs par TYPE de groupe, tronc commun compris. Les totaux
 * sont sommés sur les mêmes groupes que `list_groups` — jamais déclarés.
 */
export function cohortOverview(params = {}) {
  if (params.__empty) return { program: params.program, groups: [], totals_by_type: {} };
  const rows = groups(params);
  const totals = {};
  for (const g of rows) {
    const t = g.custom_group_type || 'Sans type';
    totals[t] = (totals[t] || 0) + g.active_count;
  }
  return {
    program: params.program || 'L2 Génie logiciel',
    academic_year: params.academic_year || 'AY-2026',
    groups: rows,
    totals_by_type: totals,
  };
}

/** `groups.get_student_groups(student)` — les groupes d'un étudiant. */
export function studentGroupsOf(params = {}) {
  if (params.__empty) return [];
  return GROUPS.filter((g) => membersOf(g.name).some((s) => s.student === params.student))
    .map((g) => ({ name: g.name, group_name: g.group_name,
                   custom_group_type: g.custom_group_type }));
}

/**
 * L'ACTE d'inscription — `create_student_from_applicant`.
 *
 * ⚠️ Il rend le journal qu'il vient de produire, DEPUIS LA TABLE des journaux :
 * l'acte et sa lecture ne peuvent donc pas se contredire. Ce point d'entrée
 * ÉCRIT ; aucun écran ne l'appelle au chargement d'une page — c'est le défaut qui
 * a fait naître `get_enrollment_log`.
 */
export function enrollmentReport(params = {}) {
  if (params.__empty) return null;
  return enrollmentLog({ log_name: params.__log || 'LOG-2027-0440' });
}

/** `api.get_current_enrollment` — l'inscription courante d'un étudiant. */
export function currentEnrollment(params = {}) {
  if (params.__empty) return null;
  return {
    name: 'PE-0311', program: 'L2 Génie logiciel', academic_year: '2026-2027',
    student: params.student || 'ETU-27-0311', enrollment_date: '2027-03-14',
  };
}

/**
 * ═══ LES JOURNAUX D'INSCRIPTION : UNE SEULE TABLE ═══
 *
 * La file des reprises était écrite à côté des journaux, et les deux ont divergé
 * aussitôt : la file nommait trois journaux, la lecture n'en connaissait que
 * deux. Deux des trois lignes cliquables menaient à « introuvable » — la classe
 * « tout sujet liable doit être servable », pour la quatrième fois.
 *
 * Ici, une table unique. La file en est DÉRIVÉE, donc elle ne peut plus nommer un
 * journal qui n'existe pas.
 *
 * ⚠️ Le cas de refus n'est PAS derrière un drapeau de mise au point : la première
 * version le tirait d'un `__fail`, qui partait dans le corps de la requête au
 * branchement et ne correspondait à rien côté serveur. Un refus est un journal
 * comme un autre : il se lit par son nom.
 */
const LOGS = {
  'LOG-2027-0440': {
    log_name: 'LOG-2027-0440', outcome: 'partial', log_status: 'En attente', logged_on: '14 mars',
    applicant: 'CAND-2027-0087', student_name: 'Nadia Gbaguidi', student: 'ETU-27-0311',
    summary: 'Partielle · compte et groupe non posés',
    partial_message: 'L’étudiante est créée et inscrite. Deux étapes n’ont pas abouti — elles sont '
      + 'reprenables sans recréer le dossier.',
    lines: [
      { step: 'Étudiant', status: 'ok', detail: 'ETU-27-0311 créée.' },
      { step: 'Inscription au programme', status: 'ok', detail: 'L2 Génie logiciel · 2026-2027.' },
      { step: 'Inscription pédagogique', status: 'ok', detail: '14 unités, 6 modules rattachés.' },
      { step: 'Compte utilisateur', status: 'ko',
        detail: 'Adresse déjà portée par un autre compte — identifiant de connexion non posé.' },
      { step: 'Rattachement aux groupes', status: 'ko',
        detail: 'Groupe B au complet (30 / 30) — rattachement non effectué.' },
    ],
    // ⚠️ T2 : l'inscription administrative ne crée PAS le badge d'accès.
    badge: { created: false },
  },
  'LOG-2027-0438': {
    log_name: 'LOG-2027-0438', outcome: 'rejected', log_status: 'Rejeté', logged_on: '12 mars',
    applicant: 'CAND-2027-0088', student_name: 'Ibrahim Salifou',
    summary: 'Rejetée · période disciplinaire active',
    partial_message: 'Aucune inscription n’a été créée. Le contrôle a arrêté la cascade avant toute '
      + 'écriture — rien n’est à défaire, et rien n’est à reprendre tant que la période court.',
    lines: [
      { step: 'Contrôle des doublons', status: 'ok', detail: 'Aucun étudiant existant pour cette pièce d’identité.' },
      { step: 'Période disciplinaire', status: 'ko',
        detail: 'Suspension du 12 au 26 février — aucune inscription pendant la période. Reprise dès le 27.' },
    ],
  },
  'LOG-2027-0431': {
    log_name: 'LOG-2027-0431', outcome: 'partial', log_status: 'En attente', logged_on: '8 mars',
    applicant: 'CAND-2027-0081', student_name: 'Aïcha Bello', student: 'ETU-27-0304',
    summary: 'Partielle · inscription pédagogique',
    partial_message: 'L’étudiante est créée et inscrite au programme. L’inscription pédagogique n’a '
      + 'pas abouti — elle est reprenable sans recréer le dossier.',
    lines: [
      { step: 'Étudiant', status: 'ok', detail: 'ETU-27-0304 créée.' },
      { step: 'Inscription au programme', status: 'ok', detail: 'M1 Systèmes d’information · 2026-2027.' },
      { step: 'Inscription pédagogique', status: 'ko',
        detail: 'Maquette non validée pour cette filière — aucune unité à rattacher.' },
      { step: 'Compte utilisateur', status: 'ok', detail: 'Identifiant de connexion posé.' },
      { step: 'Rattachement aux groupes', status: 'ok', detail: 'Promotion M1 SI.' },
    ],
    badge: { created: false },
  },
};

/** Lecture d'un journal par son nom. Un nom inconnu lève : jamais un voisin. */
export function enrollmentLog(params = {}) {
  if (params.__empty) return null;
  const log = LOGS[params.log_name];
  if (!log) {
    throw Object.assign(new Error('Ce journal d’inscription est introuvable.'),
      { code: 'NOT_FOUND', status: 404 });
  }
  return log;
}

/**
 * Les inscriptions à reprendre — DÉRIVÉES de la table des journaux.
 *
 * Un journal réussi n'y figure pas : la file ne porte que ce qui reste à
 * reprendre. Les pastilles emploient le vocabulaire de `StatusPill`.
 */
export function enrollmentReplayQueue(params = {}) {
  if (params.__empty) return { items: [] };
  const items = Object.values(LOGS)
    .filter((l) => l.outcome !== 'created')
    .map((l) => ({
      id: l.log_name,
      title: l.student_name,
      subtitle: l.summary + ' · ' + l.logged_on,
      status: l.outcome === 'rejected' ? 'renvoyee' : 'incomplete',
      log_status: l.log_status,
    }));
  return { count: items.length, items };
}

/**
 * Les orphelins — étudiants sans rattachement de groupe, ou groupes sans
 * enseignant. Deux natures dans une seule liste, chacune nommée.
 */
export function moodleOrphans(params = {}) {
  if (params.__empty) return { families: [] };
  return {
    families: [
      {
        key: 'students', title: 'Étudiants inscrits sans groupe',
        description: 'Inscription au programme valide, aucun rattachement de groupe. Ils n’apparaissent à aucune feuille de présence.',
        items: [
          { id: 'ETU-27-0311', subject: 'Nadia Gbaguidi', detail: 'Groupe B au complet lors de l’inscription',
            status: 'suspendue', status_label: 'Sans groupe' },
          { id: 'ETU-27-0298', subject: 'Paul Zannou', detail: 'Inscrit le 2 mars, aucun rattachement',
            status: 'suspendue', status_label: 'Sans groupe' },
        ],
      },
      {
        key: 'groups', title: 'Groupes sans enseignant',
        description: 'Le groupe existe et porte des étudiants, aucun enseignant ne lui est affecté.',
        items: [
          { id: 'SG-L2GL-RES', subject: 'RES-102 — travaux pratiques', detail: '18 étudiants, aucun enseignant affecté',
            status: 'suspendue', status_label: 'Sans enseignant' },
        ],
      },
    ],
  };
}
