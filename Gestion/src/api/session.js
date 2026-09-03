/**
 * Session et contexte académique — exposés par la coquille, consommés par les
 * composables. Deux points d'entrée, appelés une fois à l'ouverture.
 *
 * 🟢 Les deux chemins sont CONFRONTÉS et re-pointés par la table de
 * correspondance (F3-MAP) : get_session_context (session_context.py) et
 * chassis.get_academic_context. L'avertissement d'origine (« supposés,
 * non confrontés ») est levé — c'était les deux appels dont tout dépend.
 */
import { call } from './client.js';

/**
 * { person:{id,name,email}, roles[], scope, spaces, permissions } — README §1.1.
 * 🟢 Re-pointé par la table (F3-MAP) — session_context.py. Le serveur rend
 * l'identité STRUCTURÉE (arbitrage stabilisation §3.1) ; l'adaptateur de
 * recette est RETIRÉ — il aurait survécu à la correction qu'il attendait et
 * serait devenu une seconde vérité. Les initiales sont dérivées côté front
 * (useSession) : c'est de l'affichage, pas une donnée.
 */
export const openSession = () => call('portal_app.api.identity.session_context.get_session_context');

/**
 * { years[], terms[], current:{ year, term } } — voir README §1.2.
 * 🟢 Re-pointé par la table de correspondance (F3-MAP) — chassis.py.
 */
export const academicContext = () =>
  call('portal_app.api.academic.chassis.get_academic_context');
