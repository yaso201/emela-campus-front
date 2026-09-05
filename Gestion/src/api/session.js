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
/**
 * FORMES (M2-AN-03) — le serveur rend `permissions` en LISTE de clés
 * (`resolve_permissions` → `list[str]`, permission_matrix.py:88), l'écran les
 * interroge en DICT (`can(k)` = `permissions[k] === true`, useSession). Sans
 * cette adaptation, AUCUNE action ne se rend en branché — c'est la cause de
 * M0-AN-02 (boutons d'en-tête d'ExamView absents sur la release). L'adaptateur
 * accepte les deux formes (liste serveur · dict de compatibilité).
 */
function adaptSession(s) {
  if (!s) return s;
  const p = s.permissions;
  const permissions = Array.isArray(p)
    ? Object.fromEntries(p.map((k) => [k, true]))
    : (p || {});
  return { ...s, permissions };
}
export const openSession = () =>
  call('portal_app.api.identity.session_context.get_session_context').then(adaptSession);

/**
 * { years[], terms[], current:{ year, term } } — voir README §1.2.
 * 🟢 Re-pointé par la table de correspondance (F3-MAP) — chassis.py.
 *
 * FORMES (M2-AN-04) — le serveur rend `years[{name, is_current}]`,
 * `terms[{name, term_name, parity}]` et l'année/semestre courants À PLAT
 * (`current_academic_year` / `current_term`) ; l'écran attend `id`/`label` et
 * un objet `current:{year, term}`. Sans cette adaptation, `useAcademicContext`
 * ne résout AUCUNE année en branché (yearId nul) → tous les écrans qui passent
 * `academic_year` reviennent vides. L'adaptateur accepte les deux formes.
 */
function adaptContext(c) {
  if (!c) return c;
  // Déjà en forme d'écran (simulacre) : ne rien retoucher.
  if (c.current && typeof c.current === 'object') return c;
  const years = (c.years || []).map((y) =>
    y.id ? y : { id: y.name, label: y.name, current: !!y.is_current, closed: !!y.closed });
  const terms = (c.terms || []).map((t) =>
    t.id ? t : { id: t.name, label: t.term_name || t.name, parity: t.parity,
      academic_year: t.academic_year });
  return {
    ...c, years, terms,
    current: { year: c.current_academic_year || null, term: c.current_term || null },
    note: c.note || c.context_phrase || '',
  };
}
export const academicContext = () =>
  call('portal_app.api.academic.chassis.get_academic_context').then(adaptContext);

/**
 * AN-09 (M3) — fermer la session AU SERVEUR. `logout` est le point d'entrée
 * cœur de Frappe (guest-safe) : la session est invalidée côté serveur, pas
 * seulement oubliée par le navigateur.
 */
export const closeSession = () => call('logout');
