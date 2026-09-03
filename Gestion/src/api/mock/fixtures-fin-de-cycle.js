/**
 * Grappes 9 à 11 · fin de cycle — DOCUMENTS, CLÔTURE, DIPLOMATION, RÔLES.
 *
 * Quatre domaines dans un module, parce qu'ils partagent une même mécanique de
 * fin de parcours et non parce qu'ils se ressemblent. Ce qu'ils ont en commun :
 *
 *   — un ACTE terminal qui produit un objet opposable (un document émis, une
 *     année close, un diplôme au registre, une dotation de rôle) ;
 *   — et une réserve : chacun reste réversible ou continuable APRÈS son acte, et
 *     c'est ce que les écrans doivent dire.
 *
 * ⚠️ Les statuts portés ici sont le vocabulaire du SERVEUR ; les vues les
 * traduisent en pastilles avec un libellé explicite.
 */

/* ══════════════ GRAPPE 9 · DOCUMENTS ══════════════ */

/**
 * LE CATALOGUE EST RESTREINT AU SOUS-ENSEMBLE DEMANDABLE.
 *
 * ⚠️ `requestable: false` n'est pas un droit manquant : c'est un document qui
 * n'appartient PAS à cette file. Le diplôme et l'attestation de réussite sont
 * émis par la diplomation, à l'issue du cursus — les faire apparaître comme
 * demandables ici enverrait l'étudiant frapper à la mauvaise porte, et l'agent
 * refuserait une demande qu'il n'aurait jamais dû recevoir.
 *
 * Ils figurent donc dans le catalogue, EXPLIQUÉS et non masqués : masquer
 * laisserait croire à un oubli.
 */
const CATALOGUE = [
  { key: 'releve_s', label: 'Relevé de notes semestriel', requestable: true,
    condition: 'Le semestre doit être délibéré.',
    source: 'Scolarité' },
  { key: 'releve_a', label: 'Relevé de notes annuel', requestable: true,
    condition: 'Les deux semestres de l’année doivent être délibérés.',
    source: 'Scolarité' },
  { key: 'attestation_inscription', label: 'Attestation d’inscription', requestable: true,
    condition: 'Une inscription active sur l’année demandée.',
    source: 'Scolarité' },
  { key: 'certificat_scolarite', label: 'Certificat de scolarité', requestable: true,
    condition: 'Une inscription active sur l’année demandée.',
    source: 'Scolarité' },
  { key: 'diplome', label: 'Diplôme', requestable: false,
    condition: 'Émis par la diplomation, à l’issue du cursus — jamais sur demande ici.',
    source: 'Diplomation' },
  { key: 'attestation_reussite', label: 'Attestation de réussite', requestable: false,
    condition: 'Émise par la diplomation avec la décision du jury — jamais sur demande ici.',
    source: 'Diplomation' },
];

/**
 * ⚠️ AUCUN CHAMP D'EXEMPLAIRE. Il n'y a rien à compter, rien à retirer : un
 * document émis porte un CODE DE VÉRIFICATION PUBLIQUE et se télécharge autant de
 * fois que nécessaire.
 *
 * ⚠️ ET LE CODE NAÎT DE L'ÉMISSION. `verification_code` vaut `null` tant que le
 * document n'est pas émis — l'afficher avant l'acte promettrait un code qui
 * n'existe pas encore, et l'agent le lirait comme une pièce du dossier.
 */
const REQUESTS = [
  { name: 'DOC-2027-0188', student: 'ETU-24-0203', student_name: 'Yasmine Toko',
    program_label: 'L2 Génie logiciel', doc: 'releve_s', doc_label: 'Relevé semestriel S1',
    received_on: '14 mars à 09 h 12', purpose: 'Dossier de candidature',
    issuable: true, blocked_reason: null, verification_code: null,
    issued_on: null, issued_by: null, refused_on: null, refusal_reason: null,
    status: 'recue', status_label: 'À traiter',
    checks: [
      { label: 'Période demandée', value: 'Semestre 1' },
      { label: 'Délibération', value: 'Tenue le 12 février 2027' },
      { label: 'Crédits portés', value: '30' },
      { label: 'Note en contrôle', value: 'Aucune' },
    ],
    lines: [
      { code: 'UE 3.1', label: 'Développement logiciel', ects: 9, average: '13,25', outcome: 'Acquise' },
      { code: 'UE 3.2', label: 'Mathématiques appliquées', ects: 6, average: '11,00', outcome: 'Acquise' },
      { code: 'UE 3.3', label: 'Compétences transversales', ects: 3, average: '14,50', outcome: 'Acquise' },
      { code: 'UE 3.4', label: 'Systèmes et réseaux', ects: 9, average: '9,75', outcome: 'Compensée' },
      { code: 'UE 3.5', label: 'Anglais professionnel', ects: 3, average: '12,00', outcome: 'Acquise' },
    ] },
  { name: 'DOC-2027-0187', student: 'ETU-24-0112', student_name: 'Ange Sossou',
    program_label: 'L3 Génie logiciel', doc: 'releve_a', doc_label: 'Relevé annuel 2025-2026',
    received_on: '13 mars à 16 h 40', purpose: 'Employeur',
    issuable: true, blocked_reason: null, verification_code: null,
    issued_on: null, issued_by: null, refused_on: null, refusal_reason: null,
    status: 'recue', status_label: 'À traiter',
    checks: [
      { label: 'Période demandée', value: 'Année 2025-2026' },
      { label: 'Délibération', value: 'Tenue le 30 juillet 2026' },
      { label: 'Crédits portés', value: '60' },
      { label: 'Note en contrôle', value: 'Aucune' },
    ],
    lines: [] },
  { name: 'DOC-2027-0186', student: 'ETU-24-0189', student_name: 'Fabrice Ahodékon',
    program_label: 'L1 Math-Info', doc: 'releve_s', doc_label: 'Relevé semestriel S1',
    received_on: '12 mars à 11 h 02', purpose: 'Bourse',
    issuable: false,
    blocked_reason: 'Le semestre 1 de L1 Math-Info n’est pas délibéré : le jury est prévu le '
      + '28 juillet 2027. Un relevé engage l’établissement sur des notes définitives — '
      + 'celles-ci peuvent encore changer.',
    verification_code: null,
    issued_on: null, issued_by: null, refused_on: null, refusal_reason: null,
    status: 'incomplete', status_label: 'Semestre non délibéré',
    checks: [
      { label: 'Période demandée', value: 'Semestre 1' },
      { label: 'Délibération', value: 'Non tenue' },
      { label: 'Crédits portés', value: '—' },
      { label: 'Note en contrôle', value: '4 en attente' },
    ],
    lines: [] },
  { name: 'DOC-2027-0185', student: 'ETU-24-0147', student_name: 'Grâce Aïvodji',
    program_label: 'M1 Systèmes d’information', doc: 'releve_a', doc_label: 'Relevé annuel 2026-2027',
    received_on: '11 mars à 08 h 21', purpose: 'Dossier de candidature',
    issuable: false,
    blocked_reason: 'Un relevé annuel exige les deux semestres délibérés. Le semestre 1 l’est ; '
      + 'le semestre 2 le sera après le jury du 28 juillet 2027.',
    verification_code: null,
    issued_on: null, issued_by: null, refused_on: null, refusal_reason: null,
    status: 'incomplete', status_label: '1 semestre sur 2',
    checks: [
      { label: 'Période demandée', value: 'Année 2026-2027' },
      { label: 'Délibération', value: '1 semestre sur 2' },
      { label: 'Crédits portés', value: '30 sur 60' },
      { label: 'Note en contrôle', value: 'Aucune' },
    ],
    lines: [] },
  { name: 'DOC-2027-0184', student: 'ETU-23-0091', student_name: 'Serge Bocco',
    program_label: 'L2 Génie logiciel', doc: 'attestation_inscription',
    doc_label: 'Attestation d’inscription', received_on: '10 mars à 14 h 55', purpose: null,
    issuable: true, blocked_reason: null, verification_code: 'ATT-2C07-55BX',
    issued_on: '10 mars', issued_by: 'A. Kponou', refused_on: null, refusal_reason: null,
    status: 'valide', status_label: 'Émise le 10 mars',
    checks: [
      { label: 'Période demandée', value: 'Année 2026-2027' },
      { label: 'Inscription', value: 'Active' },
      { label: 'Crédits portés', value: '—' },
      { label: 'Note en contrôle', value: 'Sans objet' },
    ],
    lines: [] },
  { name: 'DOC-2026-0902', student: 'ETU-24-0164', student_name: 'Rachid Ouédraogo',
    program_label: 'L2 Génie logiciel', doc: 'releve_a', doc_label: 'Relevé annuel 2025-2026',
    received_on: '4 septembre à 10 h 08', purpose: null,
    issuable: false, blocked_reason: null, verification_code: null,
    issued_on: null, issued_by: null, refused_on: '5 septembre',
    refusal_reason: 'Demande prématurée — l’année 2025-2026 n’était pas complète à la demande. '
      + 'Vous pouvez la reformuler.',
    status: 'renvoyee', status_label: 'Refusée le 5 septembre',
    checks: [], lines: [] },
];

/**
 * LES DEUX CATÉGORIES DE REFUS, déclarées et non rédigées à la main.
 *
 * ⚠️ La distinction n'est pas cosmétique : « prématurée » dit à l'étudiant qu'il
 * pourra reformuler, « irrecevable » dit que non. Les confondre laisse quelqu'un
 * attendre indéfiniment, ou renoncer à tort.
 */
export const REFUSAL_CATEGORIES = [
  { key: 'prematuree', label: 'La demande est prématurée', reformulable: true,
    examples: 'Semestre non délibéré, année incomplète.' },
  { key: 'irrecevable', label: 'La demande est irrecevable', reformulable: false,
    examples: 'Période hors scolarité, document inexistant, document émis par un autre service.' },
];

/** `list_document_requests(...)` — 🔴 non tranché. */
export function documentRequests(params = {}) {
  const base = {
    catalogue: CATALOGUE,
    refusal_categories: REFUSAL_CATEGORIES,
    oldest: '9 mars',
  };
  if (params.__empty) return { ...base, count: 0, pending: 0, items: [] };
  let rows = REQUESTS;
  if (params.state === 'pending') rows = rows.filter((r) => r.status === 'recue' || r.status === 'incomplete');
  return {
    ...base,
    count: REQUESTS.length,
    pending: REQUESTS.filter((r) => r.status === 'recue' || r.status === 'incomplete').length,
    items: rows,
  };
}

/** `get_document_request(name)` — 🔴 non tranché. Un nom inconnu lève. */
export function documentRequest(params = {}) {
  if (params.__empty) return null;
  const row = REQUESTS.find((r) => r.name === params.name);
  if (!row) {
    throw Object.assign(new Error('Demande inconnue : ' + params.name), { code: 'NOT_FOUND' });
  }
  return { ...row, catalogue_entry: CATALOGUE.find((c) => c.key === row.doc) || null };
}

/* ══════════════ GRAPPE 9 · CLÔTURE D'ANNÉE ══════════════ */

/**
 * DEUX PANNEAUX SÉPARÉS, ET C'EST TOUTE LA CONCEPTION DE CET ÉCRAN.
 *
 *   — les ANOMALIES : ce qui aurait dû être réglé avant la clôture. Rien
 *     n'empêche de clore, mais clore avec une anomalie EXIGE UN MOTIF ;
 *   — les CONTINUATIONS : ce qui survit à la clôture PAR CONCEPTION. Ni anomalie,
 *     ni retard, et donc AUCUN MOTIF.
 *
 * ⚠️ Les mélanger produirait l'une des deux fautes symétriques : exiger un motif
 * pour une procédure disciplinaire qui court normalement, ou laisser clore sans un
 * mot sur trois dossiers sans décideur. `requires_reason` est porté par la donnée
 * pour que l'écran ne puisse pas se tromper de panneau.
 */
export function yearClosure(params = {}) {
  const anomalies = [
    { key: 'deliberations', label: 'Délibérations', ok: true, requires_reason: true,
      detail: '28 délibérations tenues sur 28. Aucun jury en attente.',
      status: 'valide', status_label: 'Complet', route: null },
    { key: 'grades', label: 'Notes en contrôle', ok: true, requires_reason: true,
      detail: 'Aucune note en attente de validation.',
      status: 'valide', status_label: 'Complet', route: 'grades' },
    { key: 'no_decider', label: '3 dossiers en attente d’un autre décideur', ok: false,
      requires_reason: true,
      detail: 'Instruits par la personne qui devait décider. Ils ne figurent dans aucune '
        + 'file ordinaire — cette ligne est le seul endroit où la clôture les rencontre.',
      status: 'anomalie', status_label: 'Anomalie', route: 'awaiting-decider' },
  ];
  const continuations = [
    { key: 'finding', label: '1 contrat de remédiation sans constat', requires_reason: false,
      detail: 'Un constat n’est pas une décision académique : il reste posable après la '
        + 'clôture. Le moment où il manquait vraiment était le jury.',
      status: 'propose', status_label: 'Continuation', route: 'council-preconisations' },
    { key: 'discipline', label: '2 procédures disciplinaires en cours', requires_reason: false,
      detail: 'Dont une suspendue par appel depuis le 4 août. Leurs effets courent selon '
        + 'leur propre calendrier, au-delà de la clôture.',
      status: 'propose', status_label: 'Continuation', route: 'dossiers' },
    { key: 'documents', label: '6 demandes de documents en attente', requires_reason: false,
      detail: 'Elles resteront traitables après la clôture — un relevé d’année close s’émet.',
      status: 'propose', status_label: 'Continuation', route: 'documents' },
  ];
  const base = {
    year_label: '2026-2027', opened_on: '1er juillet 2026', jury_on: '28 juillet 2027',
    students: 1842, next_year_label: '2027-2028', next_year_opened_on: '1er juillet 2027',
    produces: [
      { on: true, label: 'Les notes, résultats et décisions de l’année deviennent définitifs',
        detail: 'Plus aucune saisie, aucune modification, aucune délibération sur 2026-2027.' },
      { on: true, label: 'Les documents restent émettables',
        detail: 'Relevés et attestations d’une année close s’émettent normalement.' },
      { on: false, label: 'Les procédures disciplinaires en cours ne s’arrêtent pas',
        detail: 'Une suspension, un appel, une reprise continuent de courir selon leur propre calendrier.' },
      { on: false, label: 'Aucun étudiant n’est inscrit, réinscrit ni exclu par la clôture',
        detail: 'L’inscription en 2027-2028 est un acte distinct, déjà ouvert depuis le 1er juillet.' },
    ],
    previous: {
      year_label: '2025-2026', closed_on: '14 août 2026', closed_by: 'R. Dossou-Yovo, direction',
      reopened: true,
      journal: [
        { date: '3 oct. 2026', lead: 'Réouverture',
          text: 'par R. Dossou-Yovo — « Erreur de saisie sur la délibération de M1 SI : '
            + 'deux notes de rattrapage omises. »' },
        { date: '3 oct. 2026', lead: '',
          text: 'Délibération M1 SI rouverte, deux décisions modifiées' },
        { date: '9 oct. 2026', lead: 'Nouvelle clôture', text: 'par R. Dossou-Yovo' },
      ],
    },
  };
  if (params.__empty) {
    return { ...base, anomalies: [], continuations: [], open_anomalies: 0, requires_reason: false };
  }
  const open = anomalies.filter((a) => !a.ok);
  return {
    ...base,
    anomalies,
    continuations,
    open_anomalies: open.length,
    // ⚠️ DÉRIVÉ, jamais déclaré : le motif est exigé parce qu'une anomalie
    // subsiste. Un drapeau posé à la main divergerait de la liste qui le justifie.
    requires_reason: open.length > 0,
  };
}

/* ══════════════ GRAPPE 10 · DIPLOMATION ══════════════ */

/**
 * L'ÉLIGIBILITÉ EST PRÉSENTÉE, JAMAIS DÉCIDÉE (Art. 45).
 *
 * ⚠️ `eligible` est un CONSTAT calculé, et le jury reste souverain : il peut
 * attribuer le diplôme à un dossier non éligible par indulgence motivée. L'écran
 * ne doit donc jamais présenter `eligible: false` comme un refus — c'est une pièce
 * au dossier, pas une conclusion.
 *
 * ⚠️ ET LA MENTION EST UN DÉRIVÉ IMPOSÉ (Art. 49) : bornes exactes, aucun arrondi,
 * absente sous 10,00. Elle s'affiche, elle ne se saisit jamais. Elle est donc
 * calculée ici, à côté de la moyenne dont elle dépend.
 */
const MENTIONS = [
  { from: 16, label: 'Très bien' },
  { from: 14, label: 'Bien' },
  { from: 12, label: 'Assez bien' },
  { from: 10, label: 'Passable' },
];

/** La mention, dérivée de la moyenne. Aucun arrondi : la borne est stricte. */
export function mentionOf(average) {
  if (average == null || average < 10) return null;
  const hit = MENTIONS.find((m) => average >= m.from);
  return hit ? hit.label : null;
}

const DOSSIERS = [
  { name: 'DIP-2027-0041', student: 'ETU-22-0007', student_name: 'Aline Hounkpè',
    program_label: 'L3 Génie logiciel', average: 15.82,
    conditions: [
      { label: 'Crédits du cursus acquis', value: '180 / 180', met: true },
      { label: 'Certificat de licence (Art. 45.2)', value: 'Délivré le 3 juillet', met: true },
      { label: 'Examens nationaux', value: 'Attestés le 8 juillet par A. Kponou', met: true,
        note: 'Attestation tracée — un INPUT, jamais un calcul.' },
      { label: 'Situation financière', value: 'Soldée', met: true },
    ],
    eligible: true, decision: 'Diplômé', decided_on: '28 juillet', decided_by: 'Direction',
    decision_reason: null, felicitations: true,
    felicitations_note: 'Acte du jury (49.1). La condition calculable — moyenne ≥ 16 — est '
      + 'atteinte ; ce que le système ne sait pas, c’est le comportement en cursus.',
    documents: [
      { kind: 'Attestation de réussite', due: '15 jours', issued_on: '30 juillet',
        registry: 'ATR-2027-0041', code: 'ATR-9K21-7DMB' },
      { kind: 'Diplôme', due: '3 mois', issued_on: null, registry: null, code: null },
    ],
    status: 'valide', status_label: 'Diplômée' },
  { name: 'DIP-2027-0042', student: 'ETU-22-0019', student_name: 'Kossi Amoussou',
    program_label: 'L3 Génie logiciel', average: 11.40,
    conditions: [
      { label: 'Crédits du cursus acquis', value: '174 / 180', met: false,
        note: 'UE 5.4 non acquise, 6 crédits manquants.' },
      { label: 'Certificat de licence (Art. 45.2)', value: 'Non délivré', met: false },
      { label: 'Examens nationaux', value: 'Attestés le 8 juillet par A. Kponou', met: true },
      { label: 'Situation financière', value: 'Soldée', met: true },
    ],
    eligible: false, decision: 'Ajourné', decided_on: '28 juillet', decided_by: 'Direction',
    decision_reason: 'Six crédits manquants sur l’unité 5.4. Nouvelle présentation à la '
      + 'session de rattrapage de septembre.',
    felicitations: false, felicitations_note: null,
    documents: [], status: 'incomplete', status_label: 'Ajourné · nouvelle présentation' },
  { name: 'DIP-2027-0043', student: 'ETU-22-0033', student_name: 'Bénédicte Zinsou',
    program_label: 'M2 Systèmes d’information', average: 13.05,
    conditions: [
      { label: 'Crédits du cursus acquis', value: '120 / 120', met: true },
      { label: 'Certificat de master (Art. 45.2)', value: 'Délivré le 5 juillet', met: true },
      { label: 'Examens nationaux', value: 'Non attestés', met: false,
        note: 'L’attestation est un INPUT tracé : sans elle, la condition n’est pas remplie — '
          + 'et elle ne se déduit d’aucune note.' },
      { label: 'Situation financière', value: 'Soldée', met: true },
    ],
    eligible: false, decision: null, decided_on: null, decided_by: null,
    decision_reason: null, felicitations: false, felicitations_note: null,
    documents: [], status: 'non_eligible', status_label: 'Présenté non éligible' },
  { name: 'DIP-2027-0044', student: 'ETU-22-0058', student_name: 'Firmin Adjovi',
    program_label: 'L3 Génie logiciel', average: 12.60,
    conditions: [
      { label: 'Crédits du cursus acquis', value: '180 / 180', met: true },
      { label: 'Certificat de licence (Art. 45.2)', value: 'Délivré le 3 juillet', met: true },
      { label: 'Examens nationaux', value: 'Attestés le 8 juillet par A. Kponou', met: true },
      { label: 'Situation financière', value: 'Soldée', met: true },
    ],
    eligible: true, decision: null, decided_on: null, decided_by: null,
    decision_reason: null, felicitations: false, felicitations_note: null,
    documents: [], status: 'a_decider', status_label: 'Éligible · au jury' },
];

/**
 * `list_graduation_dossiers(...)` · `get_graduation_dossier(name)` — 🟡 les
 * fonctions sont annoncées existantes (carte P-06), leur chemin d'exposition non.
 *
 * ⚠️ LE JURY EST UNE COMPOSITION, pas un bouton (Art. 46) : une présidence, un
 * directeur des études, au moins un responsable de formation. `jury.complete` vient
 * du serveur — l'écran ne recompte pas une règle de quorum.
 */
export function graduationDossiers(params = {}) {
  const base = {
    program_label: 'Toutes filières', year_label: '2026-2027',
    jury: {
      name: 'JURY-DIP-2027', opened_on: '28 juillet 2027', complete: true,
      members: [
        { role: 'Présidence', person: 'R. Dossou-Yovo, direction' },
        { role: 'Directeur des études', person: 'S. Kouassi' },
        { role: 'Responsable de formation', person: 'M. Lawson — Génie logiciel' },
        { role: 'Responsable de formation', person: 'E. Gbaguidi — Systèmes d’information' },
      ],
      rule: 'Une présidence, un directeur des études, au moins un responsable de formation.',
    },
    outcomes: [
      { key: 'diplome', label: 'Diplômé', needs_reason: false,
        note: 'Sur un dossier non éligible, la décision reste possible : elle devient une '
          + 'indulgence, et le motif devient obligatoire.' },
      { key: 'ajourne', label: 'Ajourné', needs_reason: true,
        note: 'Motif et délai de nouvelle présentation.' },
      { key: 'non_attribue', label: 'Non attribué', needs_reason: true, note: 'Motif obligatoire.' },
    ],
  };
  if (params.__empty) return { ...base, count: 0, decided: 0, items: [] };
  let rows = DOSSIERS;
  if (params.state === 'pending') rows = rows.filter((r) => !r.decision);
  return {
    ...base,
    count: DOSSIERS.length,
    decided: DOSSIERS.filter((r) => r.decision).length,
    eligible: DOSSIERS.filter((r) => r.eligible).length,
    items: rows.map((r) => ({ ...r, mention: mentionOf(r.average) })),
  };
}

/** Un nom inconnu lève : jamais un dossier voisin. */
export function graduationDossier(params = {}) {
  if (params.__empty) return null;
  const row = DOSSIERS.find((r) => r.name === params.name);
  if (!row) {
    throw Object.assign(new Error('Dossier de diplomation inconnu : ' + params.name), { code: 'NOT_FOUND' });
  }
  return { ...row, mention: mentionOf(row.average) };
}

/* ══════════════ GRAPPE 11 · ATTRIBUTION DES RÔLES ══════════════ */

/**
 * `scope.kind` PORTE TOUT L'ÉCRAN (T5, note de `list_role_grants`).
 *
 * Quatre valeurs, et ce ne sont pas quatre nuances d'une même chose :
 *   — `nature`   : le rôle est global, il n'y a rien à cloisonner ;
 *   — `liaison`  : une filière est liée, le cloisonnement joue ;
 *   — `annulee`  : une filière est liée MAIS un cumul la neutralise. La liaison
 *                  reste enregistrée et reprendra effet si le cumul cesse ;
 *   — `nulle`    : rôle cloisonnable sans liaison — la personne NE VOIT RIEN,
 *                  et ne le sait probablement pas.
 *
 * ⚠️ Une simple liste de filières obligerait l'écran à deviner pourquoi elle est vide.
 * `reason` est rédigé au serveur : l'écran l'affiche tel quel plutôt que de
 * réimplémenter la matrice des rôles dans un navigateur.
 */
const GRANTS = [
  { person: 'PER-0007', name: 'Aïcha Kponou', email: 'a.kponou@lanem.bj',
    profile: 'Staff polyvalent',
    roles: ['Gestionnaire académique', 'Responsable de formation', 'Education Manager',
      'Directeur des Études'],
    scope: { kind: 'annulee', program: 'L2 Génie logiciel',
      reason: 'Les rôles Gestionnaire académique et Education Manager portent sur toutes les '
        + 'filières. Tant qu’elle les détient, la liaison à L2 Génie logiciel est sans effet — '
        + 'elle est enregistrée et reprendra si le cumul cesse.' },
    granted_on: '28 août 2026', granted_by: 'É. Gbaguidi',
    warnings: ['cumul_cloisonnement', 'proposition_validation'],
    status: 'incomplete', status_label: 'Cumul · cloisonnement annulé' },
  { person: 'PER-0012', name: 'Marie Lawson', email: 'm.lawson@lanem.bj',
    profile: 'Formation', roles: ['Responsable de formation'],
    scope: { kind: 'nulle', program: null,
      reason: 'Aucune filière liée. Le rôle est cloisonnable : sans liaison, elle ne voit rien — '
        + 'et rien ne le lui dit.' },
    granted_on: '28 août 2026', granted_by: 'É. Gbaguidi',
    warnings: ['portee_nulle'],
    status: 'anomalie', status_label: 'Portée nulle' },
  { person: 'PER-0003', name: 'Étienne Gbaguidi', email: 'e.gbaguidi@lanem.bj',
    profile: 'Direction des Études', roles: ['Directeur des Études'],
    scope: { kind: 'nature', program: null,
      reason: 'Rôle global par nature : il n’y a rien à cloisonner.' },
    granted_on: '2 juillet 2026', granted_by: 'Administration technique',
    warnings: [], status: 'valide', status_label: 'Conforme' },
  { person: 'PER-0001', name: 'Prudence Mensah', email: 'p.mensah@lanem.bj',
    profile: 'Direction', roles: ['Direction'],
    scope: { kind: 'nature', program: null,
      reason: 'Rôle global par nature : il n’y a rien à cloisonner.' },
    granted_on: '2 juillet 2026', granted_by: 'Administration technique',
    warnings: [], status: 'valide', status_label: 'Conforme' },
  { person: 'PER-0021', name: 'Sylvain Tossou', email: 's.tossou@lanem.bj',
    profile: 'Scolarité', roles: ['Gestionnaire académique', 'Intégration · rôle technique'],
    scope: { kind: 'nature', program: null,
      reason: 'Rôle global par nature : il n’y a rien à cloisonner.' },
    granted_on: '14 janvier 2027', granted_by: 'Administration technique',
    warnings: ['role_technique'],
    status: 'anomalie', status_label: 'Rôle technique sur un compte humain' },
  { person: 'PER-0044', name: 'Firmin Dossou', email: 'f.dossou@lanem.bj',
    profile: 'Formation', roles: ['Responsable de formation'],
    scope: { kind: 'liaison', program: 'L1 Math-Info',
      reason: 'Liaison armée : le cloisonnement joue, il ne voit que L1 Math-Info.' },
    granted_on: '4 septembre 2026', granted_by: 'É. Gbaguidi',
    warnings: [], status: 'valide', status_label: 'Conforme' },
];

/**
 * Les avertissements, RÉDIGÉS AU SERVEUR et acquittés par code.
 *
 * ⚠️ `exige_accuse` fait de la confirmation une DONNÉE, pas un clic : elle doit
 * voyager jusqu'au serveur et y être stockée, sinon elle n'aura existé que dans un
 * navigateur.
 */
export const GRANT_WARNINGS = {
  cumul_cloisonnement: {
    code: 'cumul_cloisonnement', exige_accuse: true,
    message: 'Ce cumul annule le cloisonnement. Les rôles portant sur toutes les filières '
      + 'neutralisent la liaison : la personne verra l’ensemble de l’établissement.' },
  proposition_validation: {
    code: 'proposition_validation', exige_accuse: true,
    message: 'Ce profil réunit la proposition et la validation d’une maquette. La même personne '
      + 'propose et valide : le maker-checker ne tient plus, et rien sur la maquette ne s’y '
      + 'accroche — contrairement aux dossiers, où l’exclusion par instructeur joue.' },
  portee_nulle: {
    code: 'portee_nulle', exige_accuse: false,
    message: 'Rôle cloisonnable sans filière liée : fermé par défaut. Le serveur ne compense pas '
      + 'ce vide par une portée implicite — il le renvoie comme anomalie.' },
  role_technique: {
    code: 'role_technique', exige_accuse: false,
    message: 'Rôle réservé aux comptes d’intégration. Il n’est pas attribuable à une personne, et '
      + 'le serveur le refuse même si une interface le proposait.' },
};

/** `list_role_grants(...)` — 🔴 aucun de ces points d'entrée n'existe (trou T5). */
export function roleGrants(params = {}) {
  // F3-FORMES : la FORME SERVEUR de list_role_holders — LISTE NUE de
  // porteurs {user, full_name, enabled, roles, decision_bearer_roles,
  // scope_report{origin, programs, note}, granted_on, granted_by}.
  // L'adaptateur (roles.js) reconstruit la forme écran.
  if (params.__empty) return [];
  const ORIGIN = { nature: 'par nature', liaison: 'par liaison',
    annulee: 'annulée par un cumul', nulle: 'nulle' };
  return GRANTS.map((g) => ({
    user: g.email, full_name: g.name, enabled: 1,
    roles: g.roles,
    decision_bearer_roles: g.roles.filter((r) =>
      ['Directeur des Études', 'Direction', 'Education Manager'].includes(r)),
    scope_report: {
      origin: ORIGIN[g.scope.kind] || g.scope.kind,
      programs: g.scope.program ? [g.scope.program] : null,
      note: g.scope.reason,
    },
    granted_on: '2026-08-28 14:12:00', granted_by: 'e.gbaguidi@lanem.bj',
  }));
}

/** Forme serveur de list_role_profiles (les gabarits applicables). */
export function roleProfiles() {
  return ['Scolarité', 'Formation', 'Études', 'Direction des Études',
    'Direction', 'Staff polyvalent'].map((p) => ({ profile: p }));
}

/**
 * `list_grant_anomalies()` — 🔴 trou T5. CALCULÉES, jamais stockées.
 *
 * ⚠️ Le troisième type existera dès le premier jour : les rôles attribués à la main
 * dans le Desk avant cet écran n'ont aucun accusé. Les afficher comme anomalies est
 * la seule façon de les régulariser.
 */
export function grantAnomalies(params = {}) {
  // F3-FORMES : la FORME SERVEUR — {count, holders_with_anomalies:[{user,
  // full_name, anomalies:[{type, message}]}], note}. Types RÉELS serveur.
  if (params.__empty) return { count: 0, holders_with_anomalies: [], note: '' };
  const flat = [
    { type: 'portee_nulle', user: 'm.lawson@lanem.bj', full_name: 'Marie Lawson',
      message: 'Responsable de formation sans filière liée depuis le 28 août 2026.' },
    { type: 'cumul_sans_accuse', user: 'a.kponou@lanem.bj', full_name: 'Aïcha Kponou',
      message: 'Cumul proposition / validation de maquette, sans accusé enregistré.' },
    { type: 'maker_checker_sans_accuse', user: 's.tossou@lanem.bj', full_name: 'Sylvain Tossou',
      message: 'Rôle d’intégration porté par un compte nominatif.' },
  ];
  const by = {};
  for (const a of flat) {
    by[a.user] = by[a.user] || { user: a.user, full_name: a.full_name, anomalies: [] };
    by[a.user].anomalies.push({ type: a.type, message: a.message });
  }
  return { count: flat.length, holders_with_anomalies: Object.values(by),
           note: 'Anomalies CALCULÉES, jamais stockées.' };
}

/**
 * `list_grant_journal(...)` — 🔴 trou T5.
 *
 * ⚠️ « AVANT ET APRÈS » plutôt que « rôle ajouté » : un an plus tard, la question
 * est l'état, pas le geste. Et le journal est une TRACE, jamais une garde — celui
 * qui détient les accès système contournerait toute garde applicative.
 */
export function grantJournal(params = {}) {
  // F3-FORMES : la FORME SERVEUR — liste NUE de get_assignment_journal :
  // {acted_on, acted_by, target_user, action, roles_before/after,
  // scopes_before/after, warnings_acknowledged, reason}.
  if (params.__empty) return [];
  return [
    { acted_on: '2026-08-28 14:12:00', acted_by: 'e.gbaguidi@lanem.bj',
      target_user: 'a.kponou@lanem.bj', action: 'add_role',
      roles_before: ['Gestionnaire académique', 'Responsable de formation (L2 GL)'],
      roles_after: ['Gestionnaire académique', 'Responsable de formation (L2 GL)', 'Education Manager'],
      scopes_before: ['L2 Génie logiciel'], scopes_after: ['L2 Génie logiciel'],
      warnings_acknowledged: ['cumul_cloisonnement'], reason: null },
    { acted_on: '2026-08-27 09:40:00', acted_by: 'e.gbaguidi@lanem.bj',
      target_user: 'j.yovo@lanem.bj', action: 'apply_profile',
      roles_before: [], roles_after: ['Responsable de formation'],
      scopes_before: [], scopes_after: [],
      warnings_acknowledged: [], reason: 'Prise de poste.' },
    { acted_on: '2026-08-26 16:05:00', acted_by: 'direction@lanem.bj',
      target_user: 's.tossou@lanem.bj', action: 'remove_role',
      roles_before: ['Education Manager', 'Directeur des Études'],
      roles_after: ['Education Manager'],
      scopes_before: [], scopes_after: [],
      warnings_acknowledged: [], reason: 'Fin de l’intérim.' },
  ];
}
