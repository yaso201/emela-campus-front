/**
 * Grappe 7 · les dossiers — SIX PROCÉDURES, UN SEUL PATRON.
 *
 * ⚠️ UNE SEULE DÉCLARATION DE PATRON, et les six procédures s'y rangent. Les
 * étapes, les actes et les sorties sont DÉRIVÉS de cette table : un écran qui
 * afficherait un fil de procédure écrit à la main pour chaque type divergerait du
 * jour où une procédure gagne une étape.
 *
 * Les verbes diffèrent — `submit`, `deposit`, `issue`, `pronounce`, `register` —
 * mais la suite est la même : créer, déposer, instruire, décider, notifier. Ce que
 * la table déclare, c'est le LIBELLÉ de chaque étape par procédure, pas la suite.
 */

/**
 * Le patron commun. `key` est l'étape ; `label` change par procédure parce que le
 * vocabulaire du règlement change, pas la mécanique.
 */
const STEPS = ['depot', 'instruction', 'decision', 'notification'];

/**
 * L'ACTEUR de chaque étape, par procédure.
 *
 * ⚠️ `ProcedureChain` attend `{ key, actor, label, date, status, isMine }` — je
 * n'avais fourni ni `actor` ni `date`, et j'avais nommé le champ d'état `state`
 * au lieu de `status`. Aucune erreur : les quatre étapes retombaient toutes sur
 * la branche « à venir » et rendaient en gris identique, sans étape courante.
 *
 * Le fil est le composant qui porte la thèse de cette grappe. Il s'affichait comme
 * quatre colonnes indistinctes.
 */
const ACTORS = {
  conge: { depot: 'Étudiant', instruction: 'Education manager',
           decision: 'Directeur des études', notification: 'Education manager' },
  retour: { depot: 'Étudiant', instruction: 'Education manager',
            decision: 'Education manager', notification: 'Education manager' },
  reorientation: { depot: 'Étudiant', instruction: 'Commission',
                   decision: 'Directeur des études', notification: 'Education manager' },
  demission: { depot: 'Étudiant', instruction: 'Education manager',
               decision: 'Education manager', notification: 'Education manager' },
  abandon: { depot: 'Education manager', instruction: 'Education manager',
             decision: 'Education manager', notification: 'Education manager' },
  discipline: { depot: 'Education manager', instruction: 'Education manager',
                decision: 'Directeur des études', notification: 'Education manager' },
};

/**
 * Les six procédures. Chacune déclare son vocabulaire d'étape, ses issues de
 * décision, et ce qu'elle ajoute au patron — jamais la suite elle-même.
 */
export const PROCEDURES = {
  conge: {
    label: 'Congé académique', code: 'CNG',
    steps: { depot: 'Demande déposée', instruction: 'Instruction',
             decision: 'Décision', notification: 'Notification' },
    outcomes: ['Accordé', 'Refusé'],
    // ⚠️ Le seul à porter un arbitrage AU-DESSUS de la décision.
    extra: { kind: 'arbitrage', label: 'Arbitrage', role: 'Direction',
             note: 'Une décision de congé peut être reprise par la direction. '
               + 'L’écran montre donc deux niveaux : la décision, et son arbitrage.' },
    decider: 'Directeur des études',
  },
  retour: {
    label: 'Retour de congé', code: 'RET',
    steps: { depot: 'Demande déposée', instruction: 'Instruction',
             decision: 'Décision', notification: 'Notification' },
    outcomes: ['Accordé', 'Refusé'],
    extra: null,
    decider: 'Education manager',
    // Le filtre par instructeur couvre CETTE procédure — voir l'écran sans décideur.
    instructor_filtered: true,
  },
  reorientation: {
    label: 'Réorientation', code: 'REO',
    steps: { depot: 'Demande déposée', instruction: 'Commission',
             decision: 'Décision', notification: 'Notification' },
    outcomes: ['Accordée', 'Refusée'],
    // ⚠️ Instruction COLLÉGIALE : l'écran montre une commission, pas un instructeur.
    extra: { kind: 'commission', label: 'Commission', role: 'Collégiale',
             note: 'La seule procédure dont l’instruction est collégiale. '
               + 'L’écran nomme les membres, comme le jury de délibération.' },
    decider: 'Directeur des études',
  },
  demission: {
    label: 'Démission volontaire', code: 'DEM',
    steps: { depot: 'Démission déposée', instruction: 'Information préalable',
             decision: 'Enregistrement', notification: 'Notification' },
    outcomes: ['Enregistrée', 'Refusée'],
    // ⚠️ L'information préalable EST l'instruction : une obligation, pas une case.
    extra: { kind: 'retractation', label: 'Rétractation', role: 'Étudiant',
             note: 'La rétractation appartient à l’étudiant. L’écran de gestion la '
               + 'montre comme un fait possible ; il ne l’offre pas comme un bouton.' },
    decider: 'Education manager',
  },
  abandon: {
    label: 'Constat d’abandon', code: 'ABD',
    steps: { depot: 'Constat ouvert', instruction: 'Mise en demeure',
             decision: 'Prononcé', notification: 'Notification' },
    outcomes: ['Prononcé', 'Écarté'],
    // ⚠️ La mise en demeure et la réponse SONT le contradictoire.
    extra: { kind: 'contradictoire', label: 'Réponse de l’étudiant', role: 'Étudiant',
             note: 'Un abandon prononcé sans mise en demeure serait une décision '
               + 'sans contradictoire. L’ordre est visible, et il ne se contourne pas.' },
    decider: 'Education manager',
    instructor_filtered: true,
  },
  discipline: {
    label: 'Procédure disciplinaire', code: 'DIS',
    steps: { depot: 'Dossier ouvert', instruction: 'Conseil convoqué',
             decision: 'Sanction prononcée', notification: 'Notification' },
    outcomes: ['Suspension', 'Classé sans sanction'],
    // ⚠️ L'APPEL est SUSPENSIF, et il rejoue la décision sur un état modifié.
    extra: { kind: 'appel', label: 'Appel', role: 'Direction',
             note: 'L’appel suspend les effets dès son dépôt. Statuer et fixer la '
               + 'reprise sont UN SEUL acte serveur — l’écran ne les sépare pas.' },
    decider: 'Directeur des études',
  },
};

/** Les étapes d'une procédure, dans l'ordre — dérivées, jamais écrites. */
export function stepsOf(kind) {
  const p = PROCEDURES[kind];
  if (!p) return [];
  return STEPS.map((key) => ({ key, label: p.steps[key], actor: (ACTORS[kind] || {})[key] || '' }));
}

/* ─── Les dossiers ─────────────────────────────────────────────────────── */

/**
 * ⚠️ Chaque dossier déclare l'étape ATTEINTE, et l'écran en dérive le fil. Un fil
 * écrit dossier par dossier divergerait de la table des procédures.
 */
const CASES = [
  { name: 'CNG-2027-014', kind: 'conge', student: 'ETU-24-0203',
    student_name: 'Yasmine Toko', reached: 'decision', status: 'Accordé',
    opened_on: '2027-03-02', ground: 'Motif personnel',
    instructed_by: 'E. Mensah', decided_by: 'S. Kouassi',
    decision_reason: 'Situation familiale documentée ; congé d’un an accordé, premier des deux autorisés.',
    step_dates: { depot: '2 mars', instruction: '9 mars', decision: '16 mars' },
    // Arbitrage EN COURS : la décision n'est pas définitive.
    arbitration: { status: 'En cours', requested_on: '2027-03-18',
                   requested_by: 'la famille', decided_by: null, reason: null } },
  { name: 'CNG-2027-021', kind: 'conge', student: 'ETU-24-0129',
    student_name: 'Ibrahim Salifou', reached: 'notification', status: 'Refusé',
    opened_on: '2027-02-14', ground: 'Motif économique',
    instructed_by: 'E. Mensah', decided_by: 'S. Kouassi',
    decision_reason: 'Le motif invoqué relève d’une aide financière, non d’une interruption d’études. Orienté vers le service social.',
    arbitration: null },
  { name: 'RET-2027-004', kind: 'retour', student: 'ETU-23-0088',
    student_name: 'Josué Kpadonou', reached: 'instruction', status: 'En instruction',
    opened_on: '2027-06-11', ground: 'Retour après congé 2026-2027',
    // ⚠️ Instruit par le SEUL titulaire du rôle décideur : ce dossier est celui
    // que l'écran « en attente d'un autre décideur » doit porter.
    instructed_by: 'E. Mensah', decided_by: null, decision_reason: null,
    sole_decider: true, waiting_days: 34, arbitration: null },
  { name: 'REO-2027-009', kind: 'reorientation', student: 'ETU-24-0164',
    student_name: 'Rachid Ouédraogo', reached: 'instruction', status: 'En commission',
    opened_on: '2027-03-14', ground: 'Vers L2 Informatique de gestion',
    instructed_by: null, decided_by: null, decision_reason: null,
    commission: [
      { member_role: 'Président', member_user: 'S. Kouassi' },
      { member_role: 'Membre', member_user: 'A. Hounsou' },
      { member_role: 'Membre', member_user: 'K. Bio' },
    ],
    credits: [
      { source_label: 'UE 3.1 Développement logiciel', credits_recognized: 9,
        basis: 'Programme identique dans la filière cible, même volume horaire.' },
      { source_label: 'UE 3.3 Compétences transversales', credits_recognized: 3,
        basis: 'Mutualisée entre les deux filières.' },
    ],
    arbitration: null },
  { name: 'DEM-2027-002', kind: 'demission', student: 'ETU-24-0210',
    student_name: 'Josué Kpadonou', reached: 'instruction', status: 'Information faite',
    opened_on: '2027-04-02', ground: 'Démission volontaire',
    instructed_by: 'E. Mensah', decided_by: null, decision_reason: null,
    information: { channel: 'Entretien en présence', recorded_on: '2027-04-04' },
    // La fenêtre de rétractation court : l'écran la montre, il ne l'actionne pas.
    retraction: { open: true, until: '2027-04-17' },
    // Contrat D-05 pour la fenêtre de rétractation. `remaining` serveur.
    retraction_deadline: {
      term: '2027-04-17', unit: 'jours', remaining: 9, opened_on: '2027-04-08',
      stages: [], will: [], can: [], at_term: 'expire_seule',
    },
    retraction_total_days: 15,
    arbitration: null },
  { name: 'ABD-2027-007', kind: 'abandon', student: 'ETU-24-0188',
    student_name: 'Fabrice Ahodékon', reached: 'instruction', status: 'Mise en demeure',
    opened_on: '2027-05-06', ground: 'Absence prolongée sans justificatif',
    instructed_by: 'E. Mensah', decided_by: null, decision_reason: null,
    notice: { issued_on: '2027-05-08', response: null, response_on: null },
    sole_decider: true, waiting_days: 6, arbitration: null },
  { name: 'ABD-2027-011', kind: 'abandon', student: 'ETU-24-0301',
    student_name: 'Paul Zannou', reached: 'decision', status: 'Écarté',
    opened_on: '2027-05-02', ground: 'Absence prolongée',
    instructed_by: 'E. Mensah', decided_by: 'E. Mensah',
    decision_reason: 'L’étudiant a répondu : hospitalisation documentée. Le constat est écarté, les absences seront justifiées.',
    notice: { issued_on: '2027-05-04', response: 'Certificat d’hospitalisation du 12 avril au 3 mai.',
              response_on: '2027-05-09' },
    arbitration: null },
  { name: 'DIS-2027-014', kind: 'discipline', student: 'ETU-24-0112',
    student_name: 'Ange Sossou', reached: 'notification', status: 'Suspension',
    opened_on: '2027-07-12', ground: 'Fraude à une épreuve',
    instructed_by: 'E. Mensah', decided_by: 'S. Kouassi',
    decision_reason: 'Fraude établie par deux surveillants et un rapport écrit. Suspension de quinze jours.',
    step_dates: { depot: '12 juil.', instruction: '18 juil.', decision: '28 juil.',
                  notification: '30 juil.' },
    council: { convocation_date: '2027-07-18', council_date: '2027-07-26', members: 3 },
    suspension: { duration_weeks: 2, days: 15, notified_on: '2027-07-30',
                  effective_from: '2027-07-30', effective_to: '2027-08-14' },
    // ⚠️ L'APPEL EST DÉPOSÉ, donc les effets sont SUSPENDUS.
    appeal: { appealed_on: '2027-08-04', appeal_grounds:
                'Absence d’antécédent, et la durée retenue ne tient pas compte du contexte de l’épreuve.',
              days_served_at_appeal: 7, appeal_decision: null,
              resume_start: null, resume_days_remaining: null, resume_end: null },
    /**
     * L'ÉCHÉANCE STRUCTURÉE (contrat D-05), telle que le serveur la rend.
     *
     * ⚠️ `remaining` VIENT DU SERVEUR — « une échéance de droit ne se calcule pas
     * au front : deux appareils mal réglés produiraient deux dates limites ». Ici
     * elle vaut les jours non encore purgés, qui sont aussi le plafond de reprise.
     *
     * ⚠️ `will` et `can` sont DEUX listes, jamais une : « ce qui se produira »
     * sans « ce qui reste possible » transforme une information en menace. Sur une
     * suspension sous appel, elles disent ce qui est ARRÊTÉ et ce qui a REPRIS.
     */
    deadline: {
      term: '2027-08-14', unit: 'jours', remaining: 8, opened_on: '2027-07-30',
      stages: [],
      will: ['Le décompte des jours de suspension reprendra à la date fixée',
             'La date de reprise sera notifiée à l’étudiant'],
      can: ['L’accès aux cours et à l’espace personnel, rouvert le 4 août',
            'La participation aux évaluations'],
      at_term: 'acte_necessaire',
    },
    arbitration: null },
  { name: 'DIS-2027-019', kind: 'discipline', student: 'ETU-24-0147',
    student_name: 'Grâce Aïvodji', reached: 'decision', status: 'Classé sans sanction',
    opened_on: '2027-06-20', ground: 'Trouble en séance',
    instructed_by: 'E. Mensah', decided_by: 'S. Kouassi',
    decision_reason: 'Les faits ne sont pas établis : les deux témoignages se contredisent sur l’auteur. Classé sans sanction.',
    step_dates: { depot: '20 juin', instruction: '26 juin', decision: '4 juil.' },
    council: { convocation_date: '2027-06-26', council_date: '2027-07-04', members: 3 },
    arbitration: null },
];

const STATUS_TONE = {
  'En instruction': 'propose', 'En commission': 'propose',
  'Mise en demeure': 'suspendue', 'Information faite': 'propose',
  Accordé: 'valide', 'Accordée': 'valide', Refusé: 'renvoyee', 'Refusée': 'renvoyee',
  Enregistrée: 'valide', Prononcé: 'renvoyee', 'Écarté': 'valide',
  Suspension: 'renvoyee', 'Classé sans sanction': 'valide',
};

/** L'étape atteinte, en index — dérive le fil sans le déclarer. */
function reachedIndex(c) { return STEPS.indexOf(c.reached); }

/** Ce que CE dossier porte de la dérivation possible de sa procédure. */
function extraApplies(c, p) {
  if (!p.extra) return false;
  switch (p.extra.kind) {
    case 'appel': return !!c.appeal;
    case 'arbitrage': return !!c.arbitration;
    case 'commission': return !!c.commission;
    case 'contradictoire': return !!c.notice;
    case 'retractation': return !!(c.information || c.retraction);
    default: return false;
  }
}

function enrich(c) {
  const p = PROCEDURES[c.kind];
  const at = reachedIndex(c);
  return {
    ...c,
    kind_label: p.label,
    decider_role: p.decider,
    outcomes: p.outcomes,
    extra: p.extra,
    /**
     * ⚠️ LA DÉRIVATION NE S'APPLIQUE QUE SI LE DOSSIER PORTE LA CHOSE.
     *
     * `PROCEDURES.discipline.extra` vaut toujours « appel » — c'est ce que la
     * PROCÉDURE peut porter, non ce que CE dossier porte. Un dossier classé sans
     * sanction n'a pas d'appel à statuer, et monter le panneau d'appel pour lui
     * plantait au premier clic.
     *
     * Le patron dit ce qui est possible ; le dossier dit ce qui est là.
     */
    extra_applies: extraApplies(c, p),
    status_tone: STATUS_TONE[c.status] || 'brouillon',
    /**
     * Le fil, à la forme du composant : `status`, pas `state`, et `actor` plus
     * `date` — lus dans `ProcedureChain`, non écrits de mémoire.
     *
     * ⚠️ `date` reste vide quand elle n'est pas connue : une date inventée sur une
     * étape franchie serait pire qu'une date absente.
     */
    chain: stepsOf(c.kind).map((s, i) => ({
      ...s,
      status: i < at ? 'done' : i === at ? 'now' : 'todo',
      date: (c.step_dates || {})[s.key] || '',
    })),
    // L'appel suspend : l'écran doit lire cet état, pas le déduire du statut.
    suspended_by_appeal: !!(c.appeal && !c.appeal.appeal_decision),
  };
}

export function dossiers(params = {}) {
  if (params.__empty) return { count: 0, items: [] };
  let rows = CASES;
  if (params.kind) rows = rows.filter((c) => c.kind === params.kind);
  if (params.status) rows = rows.filter((c) => c.status === params.status);
  if (Number(params.count_only)) return { count: rows.length };
  return { count: rows.length, items: rows.map(enrich) };
}

export function dossier(params = {}) {
  if (params.__empty) return null;
  const c = CASES.find((x) => x.name === params.name);
  // Un sujet inconnu n'est pas un dossier vide : c'est une erreur.
  if (!c) {
    throw Object.assign(new Error('Dossier introuvable : ' + params.name + '.'),
      { code: 'NOT_FOUND', status: 404 });
  }
  return enrich(c);
}

/**
 * LES SUSPENSIONS ACTIVES — et le décompte, qui vient du serveur.
 *
 * ⚠️ Aucun décompte de jours n'est calculé au front. Une suspension sous appel a
 * son décompte ARRÊTÉ, pas remis à zéro : `days_served_at_appeal` fait foi.
 */
export function activeSuspensions(params = {}) {
  if (params.__empty) return [];
  return CASES.filter((c) => c.kind === 'discipline' && c.suspension)
    .map((c) => ({
      name: c.name, student: c.student, student_name: c.student_name,
      days: c.suspension.days,
      effective_from: c.suspension.effective_from,
      effective_to: c.suspension.effective_to,
      // Suspendue par appel : ni active, ni échue.
      state: c.appeal && !c.appeal.appeal_decision ? 'Suspendue par appel' : 'Active',
      days_served: c.appeal ? c.appeal.days_served_at_appeal : null,
      days_remaining_cap: c.appeal
        ? c.suspension.days - c.appeal.days_served_at_appeal : null,
    }));
}

/**
 * LES SUSPENSIONS ÉCHUES DONT L'ACCÈS RESTE FERMÉ.
 *
 * ⚠️ Une suspension échue ne rouvre pas l'accès toute seule — dette du chantier
 * d'authentification, comme le badge de la grappe 4. Sans cette liste, un étudiant
 * reste fermé après le terme de sa sanction, et personne ne le sait.
 */
export function suspensionsNeedingReactivation(params = {}) {
  if (params.__empty) return [];
  return [
    { name: 'DIS-2026-031', student: 'ETU-23-0044', student_name: 'Aïcha Bello',
      effective_to: '2027-01-18', days_since_expiry: 22 },
    { name: 'DIS-2026-038', student: 'ETU-24-0077', student_name: 'Serge Dagba',
      effective_to: '2027-02-02', days_since_expiry: 7 },
  ];
}

/**
 * 🔴 LES DOSSIERS EN ATTENTE D'UN AUTRE DÉCIDEUR — forme supposée.
 *
 * ⚠️ Aucun point d'entrée ne la rend : cherché `awaiting`, `no_decider`,
 * `other_decider`, `instructed_by` dans toute la surface d'appel — rien.
 *
 * ⚠️ ET LE PÉRIMÈTRE EST CELUI DU FILTRE RÉEL, pas celui du besoin. Le filtre par
 * instructeur ne couvre que deux procédures — retour de congé et constat d'abandon.
 * La liste est donc DÉRIVÉE des dossiers marqués `instructor_filtered` au patron :
 * si le filtre s'étend, elle s'étend sans qu'on touche à ce fichier.
 */
export function awaitingOtherDecider(params = {}) {
  if (params.__empty) return { scope: [], items: [] };
  const covered = Object.entries(PROCEDURES)
    .filter(([, p]) => p.instructor_filtered).map(([k]) => k);
  const items = CASES.filter((c) => c.sole_decider && covered.includes(c.kind))
    .map((c) => ({
      name: c.name, kind: c.kind, kind_label: PROCEDURES[c.kind].label,
      student: c.student, student_name: c.student_name,
      instructed_by: c.instructed_by,
      decider_role: PROCEDURES[c.kind].decider,
      waiting_days: c.waiting_days,
    }));
  return {
    scope: covered,
    scope_label: covered.map((k) => PROCEDURES[k].label).join(' et '),
    items,
    roles_single_holder: 3,
    roles_total: 11,
    roles_decider_single_holder: 2,
  };
}

/** La cause d'un statut hors cursus — acte, catégorie, date. Jamais les faits. */
export function statusCause(params = {}) {
  if (params.__empty) return null;
  return {
    act: 'Congé académique accordé',
    category: 'Demande de l’étudiant — motif personnel',
    decided_on: '2026-09-03',
    decided_by: 'la direction des études',
    effective_from: '2026-09-15',
    effective_to: '2027-09-14',
    // ⚠️ Le champ des FAITS est ABSENT, jamais vide : ils restent au dossier.
    documented: true,
  };
}
