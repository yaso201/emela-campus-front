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
