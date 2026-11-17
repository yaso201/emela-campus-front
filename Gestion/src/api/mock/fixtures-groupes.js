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
  // FORMES (MANDAT-10) : la forme serveur est `{student, student_name, program, academic_level, eligible_via}`
  // (own | shared) — le champ `active` n'existait qu'ici, et chaque candidat s'affichait « Désactivé » en branché.
  const P = 'L2 Génie logiciel';
  return [
    { student: 'ETU-24-0188', student_name: 'Fabrice Ahodékon', program: P, academic_level: 'GL-L2', eligible_via: 'own' },
    { student: 'ETU-24-0147', student_name: 'Grâce Aïvodji', program: P, academic_level: 'GL-L2', eligible_via: 'own' },
    { student: 'ETU-23-0091', student_name: 'Serge Bocco', program: P, academic_level: 'GL-L2', eligible_via: 'own' },
    { student: 'ETU-24-0203', student_name: 'Yasmine Toko', program: P, academic_level: 'GL-L2', eligible_via: 'own' },
    { student: 'ETU-24-0164', student_name: 'Rachid Ouédraogo', program: P, academic_level: 'GL-L2', eligible_via: 'own' },
    // Tronc commun : un étudiant d'une filière qui partage l'unité, éligible aux groupes Cohorte.
    { student: 'ETU-24-0112', student_name: 'Ange Sossou', program: 'L2 Réseaux', academic_level: 'RS-L2', eligible_via: 'shared' },
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
  // FORMES (MANDAT-10) : le libellé serveur est `student_group_name` (GROUP_LIST_FIELDS) — `group_name`
  // n'existait qu'ici, et la file des groupes s'affichait sans titres en branché.
  { name: 'SG-L2GL-A', student_group_name:'L2 Génie logiciel — Groupe A', group_based_on: 'Batch',
    custom_group_type: 'Groupe de TD', program: 'L2 Génie logiciel', max_strength: 30, disabled: 0 },
  { name: 'SG-L2GL-B', student_group_name:'L2 Génie logiciel — Groupe B', group_based_on: 'Batch',
    custom_group_type: 'Groupe de TD', program: 'L2 Génie logiciel', max_strength: 30, disabled: 0 },
  { name: 'SG-L2GL-PROMO', student_group_name:'L2 Génie logiciel — Promotion', group_based_on: 'Batch',
    custom_group_type: 'Cohorte', program: 'L2 Génie logiciel', max_strength: 0, disabled: 0 },
  { name: 'SG-L2GL-RES', student_group_name:'RES-102 — travaux pratiques', group_based_on: 'Course',
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
    .map((g) => ({ name: g.name, student_group_name: g.student_group_name,
                   custom_group_type: g.custom_group_type }));
}

/**
 * LA REPRISE — `enrollment_mgmt.replay_enrollment(integration_log)`.
 *
 * Forme serveur : le RÉSULTAT de la cascade (`create_student_from_applicant`),
 * pas un journal. L'écran ne lit pas ce résultat : il RELIT le journal, qui fait
 * foi. Ici la reprise réussit et la TABLE des journaux en porte l'effet (le
 * journal passe « Traité avec succès » et quitte la file) : l'acte et sa lecture
 * ne peuvent pas se contredire. Ce point d'entrée ÉCRIT ; aucun écran ne l'appelle
 * au chargement d'une page.
 */
export function enrollmentReport(params = {}) {
  if (params.__empty) return null;
  const log = enrollmentLog(params);
  const student = log.pivots.student || 'ETU-27-0999';
  Object.assign(log, {
    status: 'Traité avec succès', attempt_count: (log.attempt_count || 0) + 1, error_message: '',
    replay_reference: 'REPLAY-' + log.name, timestamp: '2027-03-15 10:02:00',
    pivots: { ...log.pivots, student, critical_errors: [], completable_errors: [] },
  });
  return {
    status: 'created', student, program_enrollment: 'PE-' + student.slice(-4),
    pedagogical: { ues_enrolled: 7, courses_enrolled: 14, mhc_enrolled: 1, groups_added: 1, errors: [] },
    fee_sync: { status: 'handled_by_student_hook' }, user: log.pivots.applicant_name + '@test.invalid',
    critical_errors: [], completable_errors: [],
  };
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
/*
 * FORMES (MANDAT-10, C-2 / C-3) : la table porte la FORME SERVEUR de
 * `enrollment_mgmt.get_enrollment_log` — un `Integration Log` : état, motif,
 * tentatives, et dans `pivots` l'étudiant créé et les erreurs critiques /
 * complétables de la cascade (`_finalize_enrollment_log`, emela_core). Les
 * ÉTAPES que l'écran affiche en sont dérivées par l'adaptateur
 * `enrollmentLogToView` (api/groups.js) — le serveur ne stocke pas d'étapes.
 */
const LOGS = {
  'LOG-2027-0440': {
    name: 'LOG-2027-0440', source_doctype: 'Student Applicant', source_name: 'CAND-2027-0087',
    status: 'En attente', attempt_count: 1,
    error_message: 'Compte utilisateur: L’adresse est déjà portée par un autre compte — identifiant de '
      + 'connexion non posé.; Groupe GRP-GL-L2-B: Cannot enroll more than 30 students for this student group.',
    replay_reference: null, last_actor: 'ga@campus.invalid',
    timestamp: '2027-03-14 09:12:00', created: '2027-03-14 09:12:00',
    pivots: {
      applicant_name: 'CAND-2027-0087', person_id: 'PERS-00087', program: 'L2 Génie logiciel', student: 'ETU-27-0311',
      critical_errors: [],
      completable_errors: [
        'Compte utilisateur: L’adresse est déjà portée par un autre compte — identifiant de connexion non posé.',
        'Groupe GRP-GL-L2-B: Cannot enroll more than 30 students for this student group.',
      ],
    },
  },
  // Le refus : les contrôles d'entrée ont arrêté la cascade avant toute écriture (pas d'étudiant, pas d'erreur
  // critique — un motif). Il se lit par son nom, comme les autres.
  'LOG-2027-0438': {
    name: 'LOG-2027-0438', source_doctype: 'Student Applicant', source_name: 'CAND-2027-0088',
    status: 'Rejeté', attempt_count: 1,
    error_message: 'C4 : période disciplinaire active (suspension du 12 au 26 février) — aucune inscription '
      + 'pendant la période. Reprise dès le 27.',
    replay_reference: null, last_actor: 'ga@campus.invalid',
    timestamp: '2027-03-12 16:40:00', created: '2027-03-12 16:40:00',
    pivots: { applicant_name: 'CAND-2027-0088', person_id: 'PERS-00088', program: 'L2 Génie logiciel',
      critical_errors: [], completable_errors: [] },
  },
  'LOG-2027-0431': {
    name: 'LOG-2027-0431', source_doctype: 'Student Applicant', source_name: 'CAND-2027-0081',
    status: 'En attente', attempt_count: 1,
    error_message: 'Inscription pédagogique: Maquette non validée pour cette filière — aucune unité à rattacher.',
    replay_reference: null, last_actor: 'ga@campus.invalid',
    timestamp: '2027-03-08 11:05:00', created: '2027-03-08 11:05:00',
    pivots: {
      applicant_name: 'CAND-2027-0081', person_id: 'PERS-00081', program: 'M1 Systèmes d’information', student: 'ETU-27-0304',
      critical_errors: [],
      completable_errors: ['Inscription pédagogique: Maquette non validée pour cette filière — aucune unité à rattacher.'],
    },
  },
};

/** Lecture d'un journal par son nom (`integration_log`). Un nom inconnu lève : jamais un voisin. */
export function enrollmentLog(params = {}) {
  if (params.__empty) return null;
  const log = LOGS[params.integration_log];
  if (!log) {
    throw Object.assign(new Error('Journal d’inscription introuvable : ' + (params.integration_log || '—') + '.'),
      { code: 'NOT_FOUND', status: 404 });
  }
  return log;
}

/**
 * Les inscriptions à reprendre — DÉRIVÉES de la table des journaux, dans la
 * FORME SERVEUR de `list_incomplete_enrollments(limit)` : une LISTE de journaux
 * « Rejeté », « En attente » ou « En reprise » (`_failed_integration_rows`), les
 * plus récents d'abord. Un journal réussi n'y figure pas. L'adaptateur
 * `failedEnrollmentToRow` (api/groups.js) en fait les lignes de l'écran.
 */
export function enrollmentReplayQueue(params = {}) {
  if (params.__empty) return [];
  return Object.values(LOGS)
    .filter((l) => ['Rejeté', 'En attente', 'En reprise'].includes(l.status))
    .sort((a, b) => (a.created < b.created ? 1 : -1))
    .slice(0, Number(params.limit) || 50)
    .map((l) => ({ ...l, object_type: 'student_enrollment', creation: l.created }));
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
