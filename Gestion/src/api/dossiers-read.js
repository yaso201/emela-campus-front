/**
 * Grappe 7 · les LECTURES de dossiers.
 *
 * ⚠️ Séparé de `dossiers.js`, qui porte les ACTES. La raison n'est pas cosmétique :
 * le contrôle d'audit « aucun acte d'écriture dans un cycle de vie » surveille les
 * noms d'actes, et un écran qui lit doit pouvoir importer sa lecture sans importer
 * trente actes d'écriture à côté. Un module d'appel qui mêle les deux invite au
 * défaut le plus grave de la grappe 4 — un écran qui rejoue l'acte qu'il devait lire.
 *
 * ⚠️ ET LES LECTURES DE CETTE GRAPPE SONT ÉCLATÉES PAR PROCÉDURE côté serveur :
 * `list_reorientation_requests`, `list_abandonment_findings`, `list_resignations_due`,
 * `list_leave_return_requests`, `list_active_suspensions`. Il n'existe **aucune
 * lecture transversale** — voir le manque nommé ci-dessous.
 */
import { call } from './client.js';

/**
 * 🔴 MANQUE NOMMÉ — la file transversale des dossiers.
 *
 * L'écran des dossiers montre les six procédures dans une seule file, parce que
 * c'est ainsi qu'un Education Manager travaille : il ne pense pas « je vais traiter
 * mes réorientations », il traite ce qui attend.
 *
 * Or les lectures serveur sont **par procédure** : cinq points d'entrée, chacun avec
 * ses filtres et sa forme. Composer la file au front demanderait cinq appels, puis
 * un tri inventé — et la file de travail du châssis (`work_queue`) existe justement
 * pour ne pas faire cela.
 *
 * Deux formes possibles, et la seconde est meilleure :
 *
 *   — un sixième point d'entrée qui réunit les cinq. Il aurait sa propre
 *     construction de ligne, qui divergerait des cinq autres — règle 6 ;
 *   — **`work_queue` porte déjà le domaine `dossiers`.** Il suffit qu'il rende, pour
 *     ce domaine, la ligne dont l'écran a besoin. Une seule construction, celle qui
 *     alimente déjà « À traiter ».
 *
 * En attendant, cette lecture existe pour que l'écran soit jugeable, et elle rend la
 * forme que `work_queue` devrait rendre — enrichie du fil et de la dérivation.
 */
/**
 * 🟢 COMBLÉ (stabilisation §4) — par la forme que ce module réclamait : le
 * serveur rend la file transversale SUR les providers de la file de travail
 * (une seule construction), enrichie de kind/kind_label (S3), student_name et
 * du FIL dérivé des faits (done/now, dates jamais inventées).
 * ⚠️ CONTRAT PARTIEL documenté : status_tone/outcomes/extra/ground restent
 * absents (v-if côté écran → dégradé propre) — le détail RICHE par procédure
 * reste à mandater (voir rapport de stabilisation).
 */
export const listDossiers = (p) => call('portal_app.api.academic.dossiers_read.list_dossiers', p);

/** 🔴 M (RF-G-01 S-2, ACCEPTÉ pour BACK-G-01) — le détail transversal n'existe pas
 *  au serveur (list_dossiers, lui, est construit et branché). Clé nue conservée :
 *  le simulacre la sert, le branchement attendra la fonction. */
export const getDossier = (p) => call('get_dossier', p);

/* ─── Lectures RÉELLES, par procédure ──────────────────────────────────── */

const DIS = 'portal_app.api.academic.discipline.';

/** 🟢 `discipline.py:89` — `list_active_suspensions()`. */
export const listActiveSuspensions = () => call(DIS + 'list_active_suspensions');

/**
 * 🟢 `discipline.py:95` — `list_suspensions_needing_moodle_reactivation()`.
 *
 * ⚠️ Une suspension échue ne rouvre pas l'accès toute seule. Sans cette liste, un
 * étudiant reste fermé après le terme de sa sanction et personne ne le sait — dette
 * du chantier d'authentification, comme le badge d'accès de la grappe 4.
 */
export const listSuspensionsNeedingReactivation = () =>
  call(DIS + 'list_suspensions_needing_moodle_reactivation');

/** 🟢 `status_cause.py:18` — la cause d'un statut hors cursus. */
export const getMyStatusCause = (p) =>
  call('portal_app.api.academic.status_cause.get_my_status_cause', p);

/**
 * 🟢 Re-pointé par la table (F3-MAP) — chassis.list_stalled_dossiers (l'écran existe).
 *
 * L'écran A8 du lot 8. Cherché `awaiting`, `no_decider`, `other_decider`,
 * `instructed_by` dans toute la surface d'appel : aucune correspondance.
 *
 * ⚠️ Le périmètre est celui du FILTRE RÉEL, pas celui du besoin — deux procédures,
 * retour de congé et constat d'abandon. Ailleurs, le dossier reste dans la file de
 * son instructeur, qui découvre l'interdit au moment de décider. L'écran le dit
 * plutôt que de promettre une exhaustivité qu'il n'a pas.
 */
export const listAwaitingOtherDecider = (p) => call('portal_app.api.academic.chassis.list_stalled_dossiers', p);
