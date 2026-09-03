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
    { academic_term: p && (p.term || p.academic_term) });

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
    { academic_term: p && (p.term || p.academic_term), status: p && p.status });

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
    { academic_term: p && (p.term || p.academic_term) });

/* ─── Actes — déclarés, non branchés ───────────────────────────────────── */

/**
 * ⚠️ AUCUN DE CES ACTES N'EST BRANCHÉ, et les boutons le disent.
 *
 * La raison est la même qu'à la grappe 7 : chaque acte demande un vocabulaire
 * réglementaire dont je n'ai aucune source lue — les types de préconisation sont
 * déduits de la maquette, pas d'une énumération serveur. Inventer un motif est pire
 * qu'inventer un chemin : un chemin faux ne résout pas, un motif faux s'enregistre.
 */
export const prepareCouncilSession = (p) => call('prepare_council_session', p);
export const retainForCouncil = (p) => call('retain_for_council', p);
export const examineCouncilStudent = (p) => call('examine_council_student', p);
export const addCouncilPreconisation = (p) => call('add_council_preconisation', p);
export const postPreconisationFinding = (p) => call('post_preconisation_finding', p);
export const closeCouncilSession = (p) => call('close_council_session', p);

/**
 * 🔴 `pronounce_absence_warning(student, term)`.
 *
 * ⚠️ PRONONCER, jamais déclencher. Franchir un seuil ne produit ni avertissement,
 * ni convocation, ni inscription au dossier : le système compte et affiche, l'acte
 * appartient à quelqu'un.
 */
export const pronounceAbsenceWarning = (p) => call('pronounce_absence_warning', p);
