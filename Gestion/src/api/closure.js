/**
 * Grappe 9 · la clôture d'année.
 *
 * 🟢 LECTURE APPARIÉE (stabilisation §4) sur year_closure.get_year_status ;
 * les ACTES restent MARQUÉS ROUGES par bloc — nommés au handoff.
 * L'avertissement d'origine (« Cherché `close_year`, `year_closure`,
 * `reopen` dans la surface d'appel : aucune correspondance. Nommés dans
 * `handoff-gestion/releve-grappes-8-11.md`.
 *
 * ⚠️ `close:year` appartient au **Director**, non à la Direction — deux rôles de
 * nom voisin, confondus par la version 01 du vocabulaire des permissions.
 *
 * ⚠️ CE QUE LE SERVEUR DOIT SÉPARER, et que l'écran ne peut pas séparer seul :
 *
 *   — les ANOMALIES : ce qui aurait dû être réglé. Clore quand même est permis, et
 *     EXIGE un motif ;
 *   — les CONTINUATIONS : ce qui survit à la clôture par conception. Aucun motif.
 *
 * Une seule liste obligerait l'écran à trier au libellé, et il se tromperait dans
 * les deux sens : un motif exigé pour une procédure disciplinaire qui court
 * normalement, ou une clôture sans un mot sur trois dossiers sans décideur. D'où
 * `requires_reason` porté par la ligne.
 */
import { call } from './client.js';

/** 🟢 Apparié — year_closure.get_year_status(academic_year). */
/** 🟢 Apparié (stabilisation §4) — year_closure.get_year_status(academic_year). */
export const getYearClosure = (p) =>
  call('portal_app.api.academic.year_closure.get_year_status',
    { academic_year: p && p.academic_year });

/**
 * 🔴 `close_academic_year(academic_year, reason)`.
 *
 * ⚠️ Le motif est exigé PAR LE SERVEUR quand une anomalie subsiste, et il reste
 * lisible avec l'acte. L'interface le demande d'abord ; c'est le serveur qui refuse.
 */
export const closeAcademicYear = (p) => call('close_academic_year', p);

/**
 * 🔴 `reopen_academic_year(academic_year, reason)`.
 *
 * ⚠️ Le motif de réouverture NE S'EFFACE PAS à la nouvelle clôture : il est lisible
 * par tous ceux qui consultent l'année. La trace de la réouverture doit être aussi
 * lisible que celle de la clôture — sans quoi une année deux fois close se lit comme
 * une année close une fois.
 */
export const reopenAcademicYear = (p) => call('reopen_academic_year', p);
