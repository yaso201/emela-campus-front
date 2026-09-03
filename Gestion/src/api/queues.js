/**
 * Files de travail — « À traiter » (grappe 1) et les files de décision.
 *
 * ⚠ R-02 : une file de DÉCISION arrive déjà filtrée de l'instructeur ; le
 * front ne filtre rien. Le périmètre du filtre serveur est aujourd'hui limité
 * à deux procédures (retour de congé, constat d'abandon) — l'écran « en attente
 * d'un autre décideur » le dit plutôt que de promettre une exhaustivité qu'il
 * n'a pas.
 *
 * 🟢 Les chemins de ce module sont CONFRONTÉS et re-pointés par la table de
 * correspondance (F3-MAP) : chassis.get_work_queue, get_work_queue_counts,
 * list_stalled_dossiers. L'avertissement d'origine (« supposés, non
 * confrontés » — les deux documents se contredisaient) est levé.
 */
import { call } from './client.js';

/**
 * Tout ce qui attend un geste de cette personne, tous domaines confondus.
 * 🟢 Re-pointé par la table de correspondance (F3-MAP) — chassis.py.
 */
export const listWorkQueue = (params) =>
  call('portal_app.api.academic.chassis.get_work_queue', params);

/**
 * Le compte par domaine — sert les pastilles de navigation.
 * 🟢 Re-pointé par la table de correspondance (F3-MAP) — chassis.py.
 */
export const workQueueCounts = (params) =>
  call('portal_app.api.academic.chassis.get_work_queue_counts', params);
