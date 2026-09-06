/**
 * Grappe 8 · le conseil pédagogique.
 *
 * 🟢 LECTURES APPARIÉES (stabilisation §4) sur early_warning (CPS réel) ;
 * les ACTES restent MARQUÉS ROUGES par bloc — nommés au handoff, à trancher côté serveur.
 * L'avertissement d'origine (« La carte des surfaces (P-05b) ne porte
 * pas de conseil pédagogique : j'ai cherché `council`, `cps`, `preconisation`,
 * `absence_threshold` dans la surface d'appel — aucune correspondance. Les noms
 * ci-dessous sont formés par analogie et attendent confrontation ; ils sont tous
 * nommés dans `handoff-gestion/releve-grappes-8-11.md`.
 *
 * ⚠️ CE QUE LE DOMAINE EXIGE DU SERVEUR, et qui décide de la forme des écrans :
 *
 *   — les valeurs de janvier sont CALCULÉES, non arrêtées. Le serveur doit dire
 *     `official: false` sur chacune : sinon l'écran devrait deviner à quelle
 *     période la délibération a eu lieu, et il se tromperait un an sur deux ;
 *   — `can_close` et sa RAISON viennent du serveur. Un choix grisé qui explique
 *     pourquoi vaut mieux qu'un choix absent — mais la raison appartient à qui
 *     refuse, sinon l'interface invente une règle ;
 *   — les préconisations ne portent AUCUNE date de transmission au jury. Elles
 *     sont lues en permanence. Un horodatage d'envoi ferait croire à un
 *     instantané, et il en manquerait toujours une.
 */
import { call } from './client.js';

/* ─── Config de domaine (M3 g8) ────────────────────────────────────────────
 * Les cinq types de préconisation et leurs règles de clôture/constat viennent du
 * RÈGLEMENT (Art. 30-33), pas du serveur : le Select serveur `kind` ne porte que le
 * libellé. On les DÉCLARE ici (config, pas mock) pour que l'adaptateur des lectures
 * serveur reconstruise la même forme que l'écran attend. `label` = chaîne serveur
 * EXACTE (la clé de jointure avec `kind`). */
const COUNCIL_TYPES = [
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
/** Le Select serveur (Academic Preconisation.kind) — VOCABULAIRES §5, chaînes exactes. */
export const PRECONISATION_KINDS = [
  'Avertissement solennel', 'Contrat de remédiation', 'Recommandation de réorientation',
  'Signalement au jury', "Avertissement d'absences",
];
/** Le Select serveur (Academic Preconisation.finding) — au PLURIEL. */
export const CONTRACT_FINDINGS = ['Atteints', 'Partiellement atteints', 'Non atteints'];

/** L'apostrophe du Select serveur diffère (typo) de celle du libellé de config :
 *  la jointure se fait sur une forme normalisée (apostrophes unifiées). */
const norm = (s) => (s || '').replace(/[’']/g, "'");
function typeByLabel(kind) {
  return COUNCIL_TYPES.find((t) => norm(t.label) === norm(kind)) || null;
}

/** Adaptateur des préconisations : passe-plat sur la forme mock (déjà `items`),
 *  RECONSTRUIT depuis la LISTE serveur (early_warning.list_preconisations rend un
 *  tableau plat). Les champs que le serveur ne porte pas (student_name, l'objet
 *  `finding` détaillé, la date de jury) DÉGRADENT sans être inventés — S-18. */
function adaptPreconisations(r) {
  if (!Array.isArray(r)) return r || { types: [], items: [] };
  const rows = r.map((p) => {
    const t = typeByLabel(p.kind);
    return {
      name: p.name, kind: t ? t.key : p.kind,
      student: p.student, student_name: p.student_name || p.student,
      body: p.details || '', owner: p.owner_user || t?.owner || '—',
      rendered_on: p.rendered_on || '', due_on: p.due_on || null, days_left: p.days_left || null,
      status: p.status === 'Clôturée' ? 'valide' : 'propose',
      status_label: p.status,
      // Le serveur rend `finding` comme une CHAÎNE (le verdict). L'écran attend un
      // objet ; on le reconstruit partiellement (verdict seul — S-18 pour l'auteur).
      finding: p.finding ? { verdict: p.finding, posted_on: p.finding_on || '', posted_by: '', text: '' } : null,
    };
  });
  const needsF = (row) => !!(typeByLabel_key(row.kind)?.needs_finding);
  const order = (row) => (needsF(row) && !row.finding ? 0 : 1);
  return {
    // La date de jury (juillet) n'est pas un champ de cet endpoint — S-18.
    jury_date: '—', days_to_jury: null, program_label: '',
    types: COUNCIL_TYPES.map((t) => ({ ...t, count: rows.filter((x) => x.kind === t.key).length })),
    count: rows.length,
    closed: rows.filter((x) => x.status === 'valide').length,
    missing_findings: rows.filter((x) => needsF(x) && !x.finding).length,
    items: rows.slice().sort((a, b) => order(a) - order(b)),
  };
}
function typeByLabel_key(key) { return COUNCIL_TYPES.find((t) => t.key === key) || null; }

/** Adaptateur des seuils d'absence : passe-plat sur la forme mock (déjà `blocks`),
 *  RECONSTRUIT depuis {signals[]} serveur. `tier` → niveau ; les actes sont dérivés
 *  comme au simulacre. Champs non portés (program_label, modules, dernière absence,
 *  date de prononcé) DÉGRADENT — S-18. */
const ABSENCE_BLOCKS = [
  { key: 'first', level: 1, threshold: 10, tone: 'warning',
    title: 'Premier seuil — dix séances ou plus', verb: 'Un avertissement d’absences à prononcer',
    note: 'Prononcé, il devient une préconisation et rejoint le dossier ; il sera transmis au jury. '
      + 'Rien ne se déclenche seul.' },
  { key: 'second', level: 2, threshold: 15, tone: 'error',
    title: 'Second seuil — quinze séances ou plus',
    verb: 'Une convocation devant le conseil pédagogique à envisager',
    note: 'Envisager, non convoquer : la décision appartient au directeur des études. '
      + 'Franchir le second seuil n’efface pas le premier.' },
];
function actsFor(row) {
  const out = [];
  if (!row.first_pronounced) out.push('avertissement');
  if (row.level === 2 && !row.retained) out.push('convocation');
  return out;
}
function adaptAbsence(r) {
  if (!r || Array.isArray(r)) return { blocks: [], programs: 0 };
  if (r.blocks) return r; // forme mock
  const signals = r.signals || [];
  const toRow = (s) => ({
    student: s.student, student_name: s.student_name || s.student, program_label: '',
    sessions: s.unexcused_sessions, modules: null, last_absence: '',
    level: s.tier === 'convocation_a_envisager' ? 2 : 1,
    first_pronounced: !!s.already_warned, first_pronounced_on: '', retained: false,
    status: s.tier === 'convocation_a_envisager' ? 'a_envisager' : 'incomplete',
    status_label: s.tier === 'convocation_a_envisager' ? 'À envisager' : 'À prononcer',
  });
  return {
    programs: null, computed_at: '',
    blocks: ABSENCE_BLOCKS.map((b) => {
      const items = signals.map(toRow).filter((x) => x.level === b.level).map((x) => ({ ...x, acts: actsFor(x) }));
      return { ...b, count: items.length, items };
    }),
  };
}

/** Les trois critères du conseil (Art. 32) — DÉCLARÉS, comme au simulacre. */
const COUNCIL_CRITERIA = [
  { key: 'credits', label: '20 crédits', title: '20 crédits non acquis',
    rule: 'Vingt crédits ou plus non acquis sur trente.' },
  { key: 'floor', label: 'UE < 6', title: 'Unité sous 6/20',
    rule: 'Une unité d’enseignement sous 6/20.' },
  { key: 'absence', label: 'absences', title: 'Seuil d’absence',
    rule: 'Dix séances ou plus sur le semestre, toutes activités confondues.' },
];
/** Le serveur nomme ses critères par `kind` (retard_ects | ue_en_detresse |
 *  absences_seances) ; on les traduit aux clés d'écran. */
const CRIT_KIND = { retard_ects: 'credits', ue_en_detresse: 'floor', absences_seances: 'absence' };
/** Adaptateur candidats : passe-plat sur la forme mock (déjà `items`), RECONSTRUIT
 *  depuis {candidates[]} serveur (early_warning.list_cps_candidates). Les valeurs
 *  détaillées (crédits chiffrés, UE la plus basse, conseil antérieur) ne sont pas
 *  portées par cet endpoint — DÉGRADENT sans être inventées (S-18). */
function adaptCandidates(r) {
  if (!r || Array.isArray(r)) return { criteria: [], items: [] };
  if (r.items) return r; // forme mock
  const cand = r.candidates || [];
  const rows = cand.map((c) => {
    const keys = new Set((c.criteria || []).map((x) => CRIT_KIND[x.kind]).filter(Boolean));
    return {
      student: c.student, student_name: c.student_name || c.student,
      criteria_snapshot: c.criteria_snapshot || '',
      credits: keys.has('credits'), floor: keys.has('floor'), absence: keys.has('absence'),
      credits_missing: null, credits_total: 30, lowest_ue: null, lowest_ue_code: '',
      absences: null, absence_modules: null, previous_council: null, retained: false,
    };
  });
  return {
    program_label: '', term_label: '', enrolled: null, session_date: '', official: false,
    criteria: COUNCIL_CRITERIA.map((c) => ({ ...c, count: rows.filter((x) => x[c.key]).length })),
    count: rows.length, retained: 0, items: rows,
  };
}

/* ─── Lectures ─────────────────────────────────────────────────────────── */

/**
 * 🟢 Apparié — early_warning.list_cps_candidates (voir l'export).
 *
 * ⚠️ NI SCORE, NI RANG dans le retour attendu. Trois critères booléens, et l'ordre
 * du registre. Un champ de gravité transformerait la liste en classement, donc en
 * conclusion — or y figurer n'emporte rien.
 */
/** 🟢 Apparié (stabilisation §4) — early_warning.list_cps_candidates(academic_term).
 * Le contexte nomme `term` ce que la signature nomme `academic_term` : mappé ICI. */
export const listCouncilCandidates = (p) =>
  call('portal_app.api.academic.early_warning.list_cps_candidates',
    { academic_term: p && (p.term || p.academic_term) })
    .then(adaptCandidates);

/** 🟢 Apparié — early_warning.get_cps_session (l'ordre du jour, constats, présence). */
/** 🟢 Apparié (stabilisation §4) — get_cps_session(name). Sans `name`, l'écran
 * veut LA séance du terme : on la résout par list_cps_sessions (la plus
 * récente) puis on lit — deux appels, une seule vérité (celle du serveur). */
export const getCouncilSession = async (p) => {
  let name = p && (p.name || p.item);
  if (!name) {
    const sessions = await call('portal_app.api.academic.early_warning.list_cps_sessions',
      { academic_term: p && (p.term || p.academic_term) });
    const rows = (sessions && sessions.items) || sessions || [];
    if (!rows.length) return null;
    name = rows[0].name;
  }
  return call('portal_app.api.academic.early_warning.get_cps_session', { name });
};

/**
 * 🟢 Apparié — early_warning.list_preconisations.
 *
 * ⚠️ TOUS LES SEMESTRES DE L'ANNÉE, jamais le seul semestre courant : c'est ce qui
 * fait qu'une alerte de janvier éclaire la décision de juillet.
 */
/** 🟢 Apparié (stabilisation §4) — early_warning.list_preconisations. */
export const listCouncilPreconisations = (p) =>
  call('portal_app.api.academic.early_warning.list_preconisations',
    { academic_term: p && (p.term || p.academic_term), status: p && p.status })
    .then(adaptPreconisations);

/**
 * 🟢 Apparié — early_warning.list_absence_threshold_signals.
 *
 * ⚠️ Chaque ligne du second seuil doit porter `first_pronounced`. Sans lui, l'écran
 * ne peut pas savoir qu'un avertissement de premier seuil manque encore — et il
 * proposerait la seule convocation, laissant l'avertissement jamais prononcé.
 */
/** 🟢 Apparié (stabilisation §4) — early_warning.list_absence_threshold_signals. */
export const listAbsenceThresholds = (p) =>
  call('portal_app.api.academic.early_warning.list_absence_threshold_signals',
    { academic_term: p && (p.term || p.academic_term) })
    .then(adaptAbsence);

/* ─── Actes — traduits RF-G-01 (B1) ; le câblage des boutons reste RF-G-02 ─── */

/**
 * Les vocabulaires que la livraison n'avait « aucune source lue » EXISTENT depuis :
 * `kind` et `finding` sont des Select SERVEUR (VOCABULAIRES §5) — on les consomme,
 * on ne les réinvente pas. Le cycle serveur d'une séance est create → convoke → hold.
 * Gardes : EM (créer, examiner) · DE (préconiser, constater, tenir).
 */
/** 🟢 `create_cps_session(academic_term, session_date, prefill_candidates)` — EM.
 *  Arbitrage A1 (RF-G-01) : la RÉTENTION d'un candidat = son inclusion à la création
 *  (préremplissage calculé) ; il n'existe pas d'acte unitaire « retenir » au serveur.
 *  L'écran garde distincts les candidats PROPOSÉS par le signal et les cas RETENUS
 *  par l'humain (règle 1) — l'export retain_for_council est retiré en conséquence. */
export const prepareCouncilSession = (p) =>
  call('portal_app.api.academic.early_warning.create_cps_session', p);
/** 🟢 `update_cps_examined(name, examined[{student, criteria_snapshot, notes}])` — EM.
 *  Le serveur travaille en LOT (la liste des examinés de la séance), pas à l'unité. */
export const examineCouncilStudent = (p) =>
  call('portal_app.api.academic.early_warning.update_cps_examined', p);
/** 🟢 `add_preconisation(student, kind, academic_term, details, …)` — DE (pas EM :
 *  la garde serveur donne l'acte au directeur des études). `kind` ∈ Select serveur. */
export const addCouncilPreconisation = (p) =>
  call('portal_app.api.academic.early_warning.add_preconisation', p);
/** 🟢 `record_contract_finding(name, finding)` — DE. `finding` ∈ Select serveur
 *  (« Atteints · Partiellement atteints · Non atteints », au PLURIEL). */
export const postPreconisationFinding = (p) =>
  call('portal_app.api.academic.early_warning.record_contract_finding', p);
/** 🟢 `close_preconisation(name, closure_note)` — DEC-341 (M3 g8). Clôture MOTIVÉE
 *  par le DE (ou le propriétaire) ; un contrat ne se clôt qu'après son constat. */
export const closePreconisation = (p) =>
  call('portal_app.api.academic.early_warning.close_preconisation', p);
/** 🟢 `hold_cps_session(name, attendance?)` — DE. Arbitrage A2 : TENIR la séance EST
 *  l'acte terminal (aucun état « clôturée » distinct au serveur) ; le libellé reflète
 *  l'état serveur (« Tenue »), pas un état inventé. Rend les absences injustifiées. */
export const closeCouncilSession = (p) =>
  call('portal_app.api.academic.early_warning.hold_cps_session', p);

/**
 * 🟢 Prononcer un avertissement d'absences — traduit : l'acte serveur EST
 * `add_preconisation` avec `kind` imposé « Avertissement d'absences » (c'est le
 * `human_act` que rend le signal de seuil). Garde DE.
 *
 * ⚠️ PRONONCER, jamais déclencher. Franchir un seuil ne produit ni avertissement,
 * ni convocation, ni inscription au dossier : le système compte et affiche, l'acte
 * appartient à quelqu'un. (La question « l'avertissement subsiste-t-il après
 * justification tardive ? » reste MOA — VOCABULAIRES §4 ; aucun retrait n'existe.)
 */
export const pronounceAbsenceWarning = (p) =>
  call('portal_app.api.academic.early_warning.add_preconisation', {
    kind: "Avertissement d'absences",
    student: p && p.student,
    // l'écran parle en « term » ; la signature serveur dit academic_term —
    // l'adaptation est ICI, sinon le paramètre partirait dans le vide.
    academic_term: p && (p.academic_term || p.term),
    details: p && p.details,
  });
