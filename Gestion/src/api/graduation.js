/**
 * Grappe 10 · la diplomation.
 *
 * 🟢 CHEMIN TROUVÉ (stabilisation §4) : portal_app.api.academic.graduation —
 * la liste est appariée ; les actes gardent le nom de la carte, à préfixer
 * au branchement de leur écran. Constat d'origine : Ces onze fonctions sont annoncées existantes
 * par la carte des surfaces (P-06, toutes ✅) ; leur chemin d'exposition ne m'est
 * pas connu. Je porte donc les NOMS EXACTS de la carte, non préfixés — comme les
 * points d'entrée T5 — parce que c'est le nom que la table de correspondance devra
 * apparier, pas un chemin de mon invention.
 *
 * ⚠️ AUCUN MARQUEUR ROUGE ICI, et la distinction compte : un rouge dit « je ne sais pas si la
 * fonction existe », un 🟡 dit « elle existe, je ne sais pas où ». Les confondre
 * ferait chercher au back-end ce qu'il a déjà construit.
 *
 * ⚠️ QUATRE RÈGLES DU DOMAINE, toutes trahissables par un écran :
 *
 *   — L'ÉLIGIBILITÉ EST PRÉSENTÉE, JAMAIS DÉCIDÉE (Art. 45). Le jury reste
 *     souverain : il peut attribuer sur un dossier non éligible, par indulgence
 *     motivée. `eligible: false` est une pièce au dossier, pas un refus ;
 *   — LA MENTION EST UN DÉRIVÉ IMPOSÉ (Art. 49) : bornes exactes, aucun arrondi,
 *     absente sous 10,00. L'écran l'affiche, il ne la saisit jamais ;
 *   — L'ATTESTATION D'EXAMENS NATIONAUX EST UN INPUT TRACÉ, jamais un calcul. Elle
 *     ne se déduit d'aucune note : sans elle, la condition n'est pas remplie ;
 *   — LE CONSTAT EST RECALCULÉ AU MOMENT DE L'ACTE. Un constat affiché la veille
 *     n'engage pas la décision du lendemain.
 *
 * ⚠️ ET LE RENDU DES PARCHEMINS EST DIFFÉRÉ (`D-TEMPLATE-DIPLOME-01`) : l'acte au
 * registre et le NUMÉRO font foi. L'écran d'émission montre le numéro et le code de
 * vérification — pas un PDF. Promettre un document téléchargeable serait promettre
 * ce qui n'existe pas.
 */
import { call } from './client.js';

// RF-G-01 — les neuf actes portaient des clés nues (🟡 carte P-06) : le module
// serveur `graduation.py` existe avec LES MÊMES NOMS, gardés (EM|GA instruire,
// Direction décider/émettre) et Selects serveur : decision ∈ {Diplômé, Ajourné,
// Non-attribué}, doc_type ∈ {attestation_reussite, diplome}, sièges Art. 46.
// Cliqués C1 : create 200 (GRAD-2026-00001) ; present/decide/issue → 417 rédigés
// (Art. 45-47) tant que le moteur n'a pas de Semester Results (S-6).
const GR = 'portal_app.api.academic.graduation.';

/* ─── Lectures ─────────────────────────────────────────────────────────── */

/** 🟡 `list_graduation_dossiers(...)` — staff. La file, le jury, les issues. */
/** 🟢 Apparié (stabilisation §4) — MÊME NOM au serveur (graduation.py). */
export const listGraduationDossiers = (p) =>
  call('portal_app.api.academic.graduation.list_graduation_dossiers',
    { status: p && p.status });

/** 🟡 `get_graduation_dossier(name)` — les conditions, le constat, les documents. */
export const getGraduationDossier = (p) => call(GR + 'get_graduation_dossier', p);

/* ─── Instruction ──────────────────────────────────────────────────────── */

/** 🟡 `create_graduation_dossier(student)` — EM · GA. */
export const createGraduationDossier = (p) => call(GR + 'create_graduation_dossier', p);

/** 🟡 `attest_national_exam(dossier, ...)` — un INPUT tracé, jamais un calcul. */
export const attestNationalExam = (p) => call(GR + 'attest_national_exam', p);

/** 🟡 `present_eligibility(dossier)` — EM. Présenter n'est pas décider (Art. 45). */
export const presentEligibility = (p) => call(GR + 'present_eligibility', p);

/* ─── Jury et décision ─────────────────────────────────────────────────── */

/**
 * 🟡 `open_graduation_jury(...)` — DIR. Composition Art. 46 : une présidence, un
 * directeur des études, au moins un responsable de formation.
 *
 * ⚠️ Le quorum est vérifié au SERVEUR. Un écran qui le recompterait dupliquerait la
 * règle et divergerait d'elle au premier amendement du règlement.
 */
export const openGraduationJury = (p) => call(GR + 'open_graduation_jury', p);

/**
 * 🟡 `decide_graduation(dossier, decision, reason?, delay?)` — DIR, souverain.
 *
 * Trois issues : Diplômé (indulgence motivée si non éligible) · Ajourné (motif et
 * délai) · Non attribué (motif). Le constat est RECALCULÉ au moment de l'acte.
 */
export const decideGraduation = (p) => call(GR + 'decide_graduation', p);

/** 🟡 `reopen_after_adjournment(dossier)` — la nouvelle présentation. */
export const reopenAfterAdjournment = (p) => call(GR + 'reopen_after_adjournment', p);

/**
 * 🟡 `award_felicitations(dossier)` — DIR. Un ACTE (49.1), jamais un calcul.
 *
 * ⚠️ Le système affiche la condition calculable — la moyenne — et DIT ce qu'il ne
 * sait pas. Présenter les félicitations comme un seuil atteint ferait du jury un
 * enregistreur.
 */
export const awardFelicitations = (p) => call(GR + 'award_felicitations', p);

/**
 * 🟡 `issue_graduation_document(dossier, kind)` — DIR.
 *
 * Attestation sous 15 jours, PUIS diplôme sous 3 mois. Le numéro au registre n'est
 * jamais réattribué.
 */
export const issueGraduationDocument = (p) => call(GR + 'issue_graduation_document', p);
