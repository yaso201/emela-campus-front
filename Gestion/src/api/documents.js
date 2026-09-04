/**
 * Grappe 9 · les demandes de documents.
 *
 * 🟢 LECTURE DE FILE APPARIÉE (stabilisation §4) sur document_requests ;
 * le détail et les actes restent MARQUÉS ROUGES par bloc — nommés au handoff.
 * L'avertissement d'origine (« Cherché `document_request`, `transcript`,
 * `attestation`, `verification_code` dans la surface d'appel : aucune
 * correspondance. Les noms sont formés par analogie et nommés dans
 * `handoff-gestion/releve-grappes-8-11.md`.
 *
 * ⚠️ TROIS EXIGENCES QUI VIENNENT DE LA CONCEPTION, pas de l'écran :
 *
 *   — le CATALOGUE est restreint au sous-ensemble demandable, et il dit pourquoi
 *     un type n'en fait pas partie. Le diplôme et l'attestation de réussite sont
 *     émis par la diplomation : `requestable: false` n'est pas un droit manquant ;
 *   — AUCUN EXEMPLAIRE. Il n'y a rien à compter ni à retirer : un document porte
 *     un code de vérification publique et se télécharge autant de fois que
 *     nécessaire ;
 *   — le CODE NAÎT DE L'ÉMISSION. Le serveur doit rendre `verification_code: null`
 *     avant l'acte. Le pré-calculer le ferait lire comme une pièce du dossier, et
 *     un agent l'aurait communiqué avant qu'il n'existe.
 */
import { call } from './client.js';

/**
 * 🟢 Apparié — document_requests.list_document_requests(status).
 *
 * ⚠️ Le retour porte `issuable` ET `blocked_reason` par demande. C'est ce que
 * l'étudiant ne pouvait pas voir : l'état de délibération sur lequel repose
 * l'émission. Un `issuable` seul obligerait l'agent à chercher ailleurs pourquoi.
 */
/** 🟢 Apparié (stabilisation §4) — document_requests.list_document_requests(status). */
export const listDocumentRequests = (p) =>
  call('portal_app.api.academic.document_requests.list_document_requests',
    { status: p && p.status });

/** 🔴 M (RF-G-01 S-1, ACCEPTÉ pour BACK-G-01) — la lecture unitaire staff d'une
 *  demande n'existe pas au serveur (seules la liste et la vue étudiante existent).
 *  Clé nue conservée à dessein : le simulacre la sert, le branchement attendra
 *  la fonction. */
export const getDocumentRequest = (p) => call('get_document_request', p);

/**
 * 🟢 Traduit RF-G-01 : l'acte serveur est `fulfill_document_request(name)` — EM.
 * Rend {request, status: 'Émise', issued_document}. ⚠️ Arbitrage A3 : le code de
 * vérification NAÎT de l'émission et MANQUE au retour (S-3 accepté, BACK-G-01) —
 * l'écran affiche le code s'il est présent, sinon « code de vérification non
 * disponible », jamais un champ vide silencieux.
 */
export const emitDocument = (p) =>
  call('portal_app.api.academic.document_requests.fulfill_document_request', p);

/**
 * 🔴 V (RF-G-01, VOCABULAIRES §1 — EN ATTENTE MOA) : le serveur expose
 * `refuse_document_request(name, refusal_reason)` en TEXTE LIBRE ; les deux
 * catégories de la conception n'ont aucune source serveur. Tant que la MOA n'a
 * pas tranché, l'acte reste non branché avec son bandeau — aucune valeur posée.
 *
 * ⚠️ DEUX CATÉGORIES, et la distinction se voyage jusqu'au serveur : « prématurée »
 * dit à l'étudiant qu'il pourra reformuler, « irrecevable » dit que non. Les
 * confondre laisse quelqu'un attendre indéfiniment, ou renoncer à tort.
 */
export const refuseDocumentRequest = (p) => call('refuse_document_request', p);
