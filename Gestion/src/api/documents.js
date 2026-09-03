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

/** 🔴 `get_document_request(name)` — la demande, ses vérifications, son aperçu. */
export const getDocumentRequest = (p) => call('get_document_request', p);

/**
 * 🔴 `emit_document(request)` — l'acte. Il produit le code de vérification, dépose
 * le document dans l'espace de l'étudiant, et trace date et agent.
 */
export const emitDocument = (p) => call('emit_document', p);

/**
 * 🔴 `refuse_document_request(request, category, detail)`.
 *
 * ⚠️ DEUX CATÉGORIES, et la distinction se voyage jusqu'au serveur : « prématurée »
 * dit à l'étudiant qu'il pourra reformuler, « irrecevable » dit que non. Les
 * confondre laisse quelqu'un attendre indéfiniment, ou renoncer à tort.
 */
export const refuseDocumentRequest = (p) => call('refuse_document_request', p);
