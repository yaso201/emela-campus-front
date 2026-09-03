/**
 * Grappe 7 · les dossiers — SIX PROCÉDURES, UN SEUL PATRON.
 *
 * ⚠️ TOUS LES NOMS SONT LUS dans `portal_app/api/academic/` : `academic_leave_request.py`,
 * `leave_return.py`, `reorientation.py`, `resignation.py`, `abandonment.py`,
 * `discipline.py`. Surfaces MINCES ; « la doctrine et les gardes vivent au service
 * et au CONTRÔLEUR ».
 *
 * ═══ LE PATRON, ET CE QU'IL VAUT ═══
 *
 * Les six procédures suivent la même suite d'actes, avec des verbes différents :
 *
 *     créer      create_*
 *     déposer    submit_* · deposit_* · issue_*_notice
 *     instruire  instruct_* · start_*_commission · convoke_*
 *     décider    decide_* · pronounce_* · register_*
 *     notifier   record_*_notification
 *     sortir     cancel_* · retract_* · refuse_* · dismiss_* · close_without_sanction
 *
 * C'est le patron du lot 3, et il tient : **instruction et décision sont deux
 * actes**, le motif est obligatoire à la décision, et la sortie sans décision
 * existe partout.
 *
 * ⚠️ MAIS DEUX PROCÉDURES DÉBORDENT LE PATRON, et c'est là que sont les écrans
 * difficiles :
 *
 *   — LE CONGÉ a un ARBITRAGE au-dessus de la décision (`arbitrate_coa_request`,
 *     rôle Director). Une décision peut donc être reprise par quelqu'un d'autre :
 *     l'écran doit montrer deux niveaux, non un seul.
 *
 *   — LA DISCIPLINE a un APPEL SUSPENSIF (`appeal_suspension` →
 *     `decide_suspension_appeal`), avec les jours déjà purgés et un plafond de
 *     non-aggravation. C'est la seule procédure où l'acte de décision est
 *     REJOUÉ par une autorité supérieure, sur un état modifié entre-temps.
 *
 * Un écran unique pour les six est donc juste pour le tronc et faux pour ces deux
 * dérivations — d'où un patron partagé et deux panneaux propres.
 */
import { call } from './client.js';

const COA = 'portal_app.api.academic.academic_leave_request.';
const RET = 'portal_app.api.academic.leave_return.';
const REO = 'portal_app.api.academic.reorientation.';
const RES = 'portal_app.api.academic.resignation.';
const ABD = 'portal_app.api.academic.abandonment.';
const DIS = 'portal_app.api.academic.discipline.';

/* ─── Congé académique ──────────────────────────────────────────────────── */

/** 🟢 `academic_leave_request.py:29` — `create_coa_request(student_id, reason, from_date, to_date, …)`. */
export const createCoaRequest = (p) => call(COA + 'create_coa_request', p);
/** 🟢 `:39` — `submit_coa_request(name)`. */
export const submitCoaRequest = (p) => call(COA + 'submit_coa_request', p);
/** 🟢 `:45` — `instruct_coa_request(name)`. INSTRUCTION, distincte de la décision. */
export const instructCoaRequest = (p) => call(COA + 'instruct_coa_request', p);
/** 🟢 `:51` — `decide_coa_request(name, decision, decision_reason)`. */
export const decideCoaRequest = (p) => call(COA + 'decide_coa_request', p);

/**
 * L'ARBITRAGE — au-dessus de la décision.
 * 🟢 `:57` — `arbitrate_coa_request(name, decision, arbitration_reason)`.
 *
 * ⚠️ C'est `arbitrate:leave`, réservé au Director, et c'est la seule procédure du
 * lot qui en porte un. L'écran doit donc montrer **deux niveaux de décision** : la
 * décision et son arbitrage éventuel. Les confondre laisserait croire qu'une
 * décision est définitive alors qu'elle est reprenable.
 */
export const arbitrateCoaRequest = (p) => call(COA + 'arbitrate_coa_request', p);

/** 🟢 `:65` — `cancel_coa_request(name)`. Sortie sans décision. */
export const cancelCoaRequest = (p) => call(COA + 'cancel_coa_request', p);
/** 🟢 `:71` — `reactivate_from_coa(name, decision_reason)`. */
export const reactivateFromCoa = (p) => call(COA + 'reactivate_from_coa', p);
/** 🟢 `:77` — `get_my_coa_requests(student_id)`. Vue de l'étudiant. */
export const getMyCoaRequests = (p) => call(COA + 'get_my_coa_requests', p);

/* ─── Retour de congé ───────────────────────────────────────────────────── */

export const createLeaveReturnRequest = (p) => call(RET + 'create_leave_return_request', p);
export const submitLeaveReturnRequest = (p) => call(RET + 'submit_leave_return_request', p);
export const instructLeaveReturnRequest = (p) => call(RET + 'instruct_leave_return_request', p);
export const decideLeaveReturnRequest = (p) => call(RET + 'decide_leave_return_request', p);
export const cancelLeaveReturnRequest = (p) => call(RET + 'cancel_leave_return_request', p);
/** 🟢 `leave_return.py:73` — `list_leave_return_requests(status, limit)`. */
export const listLeaveReturnRequests = (p) => call(RET + 'list_leave_return_requests', p);

/* ─── Réorientation ────────────────────────────────────────────────────── */

export const createReorientationRequest = (p) => call(REO + 'create_reorientation_request', p);
export const submitReorientationRequest = (p) => call(REO + 'submit_reorientation_request', p);

/**
 * L'instruction de la réorientation est une COMMISSION.
 * 🟢 `reorientation.py:38` — `start_reorientation_commission(name)`, puis
 * `add_commission_member(name, member_role, member_user)` — 🟢 `:44`.
 *
 * ⚠️ C'est la seule procédure du lot dont l'instruction est COLLÉGIALE. L'écran ne
 * peut donc pas montrer « instruit par X » : il montre une commission et ses
 * membres, comme le jury de délibération.
 */
export const startReorientationCommission = (p) => call(REO + 'start_reorientation_commission', p);
export const addCommissionMember = (p) => call(REO + 'add_commission_member', p);

/**
 * La reconnaissance de crédits.
 * 🟢 `:50` — `add_credit_recognition(name, source_label, credits_recognized, basis)`.
 *
 * ⚠️ `basis` est le fondement de la reconnaissance — un motif, pas un commentaire.
 * Une reconnaissance de crédits sans fondement ne se distingue pas d'une faveur.
 */
export const addCreditRecognition = (p) => call(REO + 'add_credit_recognition', p);

export const decideReorientation = (p) => call(REO + 'decide_reorientation', p);
export const recordReorientationNotification = (p) =>
  call(REO + 'record_reorientation_notification', p);
/** 🟢 `:75` — `list_reorientation_requests(status, limit)`. */
export const listReorientationRequests = (p) => call(REO + 'list_reorientation_requests', p);

/* ─── Démission volontaire ─────────────────────────────────────────────── */

export const createResignationRequest = (p) => call(RES + 'create_resignation_request', p);
/** 🟢 `resignation.py:35` — `deposit_resignation(name)`. */
export const depositResignation = (p) => call(RES + 'deposit_resignation', p);

/**
 * L'INFORMATION PRÉALABLE.
 * 🟢 `:41` — `record_resignation_information(name, info_channel)`.
 *
 * ⚠️ Un acte que les cinq autres procédures n'ont pas : avant d'enregistrer une
 * démission, l'établissement doit avoir INFORMÉ l'étudiant des conséquences, et le
 * canal est tracé. L'écran doit donc porter cet acte comme une étape, non comme une
 * case à cocher — c'est une obligation, pas une formalité.
 */
export const recordResignationInformation = (p) => call(RES + 'record_resignation_information', p);

/** 🟢 `:48` — `register_resignation(name)`. La décision, ici nommée « enregistrer ». */
export const registerResignation = (p) => call(RES + 'register_resignation', p);

/**
 * LA RÉTRACTATION.
 * 🟢 `:54` — `retract_resignation(name)`.
 *
 * ⚠️ Elle appartient à l'ÉTUDIANT, pas à l'administration — c'est la fenêtre de
 * rétractation du lot 4 (composant 12). L'écran de gestion la montre comme un fait
 * possible, il ne l'offre pas comme un bouton d'agent.
 */
export const retractResignation = (p) => call(RES + 'retract_resignation', p);

/** 🟢 `:60` — `refuse_resignation(name, refusal_reason)`. */
export const refuseResignation = (p) => call(RES + 'refuse_resignation', p);
/** 🟢 `:73` — `list_resignations_due(limit)`. */
export const listResignationsDue = (p) => call(RES + 'list_resignations_due', p);

/* ─── Constat d'abandon ────────────────────────────────────────────────── */

/**
 * Les candidats au constat.
 * 🟢 `abandonment.py:25` — `list_abandonment_candidates(academic_term, limit)`.
 *
 * ⚠️ Une LISTE DE CANDIDATS, pas une liste de constats. Le système propose ; il ne
 * constate pas. C'est le même patron que les candidats au conseil pédagogique du
 * lot 7 : figurer sur la liste n'emporte rien.
 */
export const listAbandonmentCandidates = (p) => call(ABD + 'list_abandonment_candidates', p);

/** 🟢 `:32` — `create_abandonment_finding(student_id, academic_term, ground_category, …)`. */
export const createAbandonmentFinding = (p) => call(ABD + 'create_abandonment_finding', p);

/**
 * LA MISE EN DEMEURE, et la réponse.
 * 🟢 `:41` — `issue_abandonment_notice(name)` · `:47` —
 * `record_abandonment_response(name, response_text)`.
 *
 * ⚠️ Deux actes que les autres procédures n'ont pas : avant de prononcer un
 * abandon, l'établissement met en demeure et enregistre la réponse — ou son
 * absence. **Un abandon prononcé sans mise en demeure serait une décision sans
 * contradictoire**, et l'écran doit rendre l'ordre visible.
 */
export const issueAbandonmentNotice = (p) => call(ABD + 'issue_abandonment_notice', p);
export const recordAbandonmentResponse = (p) => call(ABD + 'record_abandonment_response', p);

/** 🟢 `:54` — `pronounce_abandonment(name, pronounce_reason)`. */
export const pronounceAbandonment = (p) => call(ABD + 'pronounce_abandonment', p);
/** 🟢 `:61` — `dismiss_abandonment(name, dismiss_reason)`. La sortie SANS constat. */
export const dismissAbandonment = (p) => call(ABD + 'dismiss_abandonment', p);
/** 🟢 `:68` — `list_abandonment_findings(status, limit)`. */
export const listAbandonmentFindings = (p) => call(ABD + 'list_abandonment_findings', p);

/* ─── Discipline ───────────────────────────────────────────────────────── */

/** 🟢 `discipline.py:25` — `create_disciplinary_case(student_id, ground_category, ground_details)`. */
export const createDisciplinaryCase = (p) => call(DIS + 'create_disciplinary_case', p);

/**
 * LA CONVOCATION DU CONSEIL — deux dates, pas une.
 * 🟢 `:32` — `convoke_disciplinary_council(name, convocation_date, council_date)`.
 *
 * ⚠️ `convocation_date` et `council_date` sont distinctes, et c'est ce qui permet
 * de vérifier un délai. Les confondre effacerait la seule garantie procédurale de
 * cette étape.
 */
export const convokeDisciplinaryCouncil = (p) => call(DIS + 'convoke_disciplinary_council', p);

/** 🟢 `:39` — `pronounce_disciplinary_suspension(name, duration_weeks, pronounce_reason, …)`. */
export const pronounceDisciplinarySuspension = (p) =>
  call(DIS + 'pronounce_disciplinary_suspension', p);

/** 🟢 `:50` — `close_without_sanction(name, closure_reason)`. La sortie motivée. */
export const closeWithoutSanction = (p) => call(DIS + 'close_without_sanction', p);

/** 🟢 `:57` — `record_disciplinary_notification(name, notified_on)`. */
export const recordDisciplinaryNotification = (p) =>
  call(DIS + 'record_disciplinary_notification', p);

/**
 * L'APPEL — déposé par l'étudiant, SUSPENSIF.
 * 🟢 `:64` — `appeal_suspension(name, appeal_grounds)`.
 *
 * Le service rend `days_served_at_appeal` : les jours purgés au moment du dépôt.
 * C'est ce chiffre qui plafonne la reprise.
 */
export const appealSuspension = (p) => call(DIS + 'appeal_suspension', p);

/**
 * STATUER SUR L'APPEL — un seul geste, trois issues, et la reprise.
 * 🟢 `:71` — `decide_suspension_appeal(name, decision, appeal_reason, resume_start,
 * resume_days_remaining)`.
 *
 * La docstring serveur dit exactement ce que la maquette du lot 8 avait posé :
 *
 * > « le geste unique — statuer (Confirmée/Réformée/Infirmée) ET, si la sanction
 * >   survit, fixer la reprise (plafond = jours non encore purgés, gardes au
 * >   contrôleur) »
 *
 * ⚠️ **UN SEUL ACTE, PAS DEUX.** Statuer et fixer la reprise sont le même appel :
 * l'écran ne doit donc pas les présenter comme deux étapes, sinon il promet un état
 * intermédiaire — « appel statué, reprise à fixer » — qui n'existe pas.
 *
 * ⚠️ **LE PLAFOND DE NON-AGGRAVATION EST AU CONTRÔLEUR.** `resume_days_remaining`
 * ne peut pas dépasser les jours non encore purgés. L'écran affiche le plafond et
 * le calcul — « 7 purgés + 6 restants = 13 < 15 » — mais le refus qui fait autorité
 * est serveur. Un appel ne doit jamais aggraver.
 *
 * ⚠️ `resume_start` et `resume_days_remaining` sont FACULTATIFS à la signature :
 * ils n'ont d'objet que si la sanction survit. Sur une infirmation, il ne reste
 * rien à purger et les deux champs n'ont pas à être remplis — l'écran doit les
 * retirer, non les griser.
 *
 * Les champs rendus : `days_served_at_appeal`, `resume_start`,
 * `resume_days_remaining`, `resume_end`, `appeal_decision`.
 */
export const decideSuspensionAppeal = (p) => call(DIS + 'decide_suspension_appeal', p);

/**
 * LEVER une suspension.
 * 🟢 `:83` — `lift_suspension(name, lift_reason)`.
 *
 * ⚠️ Distincte de l'infirmation en appel : lever est un acte de grâce en cours
 * d'exécution, infirmer annule la sanction. L'écran ne doit pas les confondre —
 * l'une laisse la sanction au dossier, l'autre la retire.
 */
export const liftSuspension = (p) => call(DIS + 'lift_suspension', p);

/* ─── Ce que ce module NE porte PAS ────────────────────────────────────── */

/**
 * ⚠️ LES LECTURES VIVENT DANS `dossiers-read.js`, ET SEULEMENT LÀ.
 *
 * J'avais annoncé la séparation et laissé quatre lectures dans les DEUX modules —
 * `listActiveSuspensions`, `listSuspensionsNeedingReactivation`,
 * `getMyStatusCause`, `listAwaitingOtherDecider`. Et elles avaient déjà divergé :
 * l'une prenait un paramètre, l'autre non.
 *
 * C'est « deux listes du même ensemble divergeront » appliqué au module d'appel, et
 * je l'ai enfreint dans la grappe où je le cite deux fois. Annoncer une séparation
 * ne la fait pas.
 *
 * La raison de la séparation tient toujours : le contrôle d'audit « aucun acte
 * d'écriture dans un cycle de vie » surveille les noms d'actes, et un écran qui lit
 * doit pouvoir importer sa lecture sans importer trente actes à côté.
 */
