/**
 * Étapes 1 et 2 de la boucle · la CHARPENTE — calendrier académique et catalogue des filières (MANDAT-10, E3').
 *
 * La charpente n'est pas la maquette (`permissions.js`) : années, semestres, fériés, filières et niveaux portent
 * leurs propres clés — `write:calendar` et `write:charpente`, tenues par le Gestionnaire académique. Les parcours,
 * eux, relèvent de la maquette (`write:structure` : responsable de formation, Education Manager).
 *
 * ⏳ E3' — MAQUETTE. Les points d'entrée ci-dessous sont ceux que la maquette PROPOSE de créer dans
 * `portal_app/api/academic/structure.py` (module déjà dans la carte des signatures). Ils n'existent pas encore au
 * serveur : seul le simulacre les sert, et aucune release branchée ne les appelle avant la validation de la maquette
 * par la MOA (`VERDICT-MANDAT-10-PC1B.md`). Les lectures déjà existantes (`list_programs`) sont réutilisées.
 */
import { call } from './client.js';

const ST = 'portal_app.api.academic.structure.';

/* ─── Étape 1 · calendrier académique ─────────────────────────────────── */

/**
 * ⏳ E3' — `list_academic_calendar()` : les années (dates, état, courante, close), leurs semestres (dates, parité
 * dérivée du nom, jours ouvrés) et leurs fériés. UNE lecture pour l'écran : l'année, ses semestres et ses fériés ne
 * divergent pas s'ils viennent du même appel.
 */
export const listAcademicCalendar = () => call(ST + 'list_academic_calendar', {});

/** ⏳ E3' — `create_academic_year(values)` : `{ year_start_date, year_end_date }` ; le nom se dérive des dates. */
export const createAcademicYear = (values) => call(ST + 'create_academic_year', { values });

/**
 * ⏳ E3' — `create_academic_term(values)` : `{ academic_year, term_name, term_start_date, term_end_date }`.
 * La parité se lit dans le nom (`S<n>`, DC-CH-2) : un nom sans `S<n>` est REFUSÉ au serveur, jamais deviné.
 */
export const createAcademicTerm = ({ year, ...values }) =>
  call(ST + 'create_academic_term', { values: { ...values, academic_year: year } });

/** ⏳ E3' — `update_academic_term(name, values)` : les dates seules (le nom porte la parité, il ne change pas). */
export const updateAcademicTerm = (p) => call(ST + 'update_academic_term', p);

/**
 * ⚠️ `year` et non `academic_year` côté écran : ici l'année est l'OBJET édité (on ajoute un férié À l'année
 * 2027-2028), pas l'année de CONTEXTE que la coquille transmet. Le nom serveur est reposé ici, au point d'appel.
 */
/** ⏳ E3' — `add_holiday(academic_year, holiday_date, description)`. */
export const addHoliday = ({ year, ...p }) => call(ST + 'add_holiday', { ...p, academic_year: year });

/** ⏳ E3' — `remove_holiday(academic_year, holiday_date, reason)` : motif obligatoire, tracé. */
export const removeHoliday = ({ year, ...p }) => call(ST + 'remove_holiday', { ...p, academic_year: year });

/**
 * ⏳ E3' — `set_current_academic_year(academic_year, reason)` : RUN-06 à l'écran (Q1-bis b). Fail-closed : rien ne
 * fonctionne sans année courante ; la changer déplace tous les écrans. La MOA tranche si cet acte existe à l'écran
 * ou si seule la clôture d'année (N12) fait avancer l'année courante.
 */
export const setCurrentAcademicYear = ({ year, reason }) =>
  call(ST + 'set_current_academic_year', { academic_year: year, reason });

/* ─── Étape 2 · catalogue des filières ────────────────────────────────── */

/**
 * ⏳ E3' — `list_program_catalogue()` : TOUTES les filières, actives ou non, programmes de catalogue compris
 * (`custom_catalogue_only`), avec leur nombre de niveaux et de parcours. La lecture existante `list_programs` sert le
 * sélecteur de filière des autres écrans (filières actives) : elle n'est pas détournée.
 */
export const listProgramCatalogue = () => call(ST + 'list_program_catalogue', {});

/** ⏳ E3' — `get_program_charpente(program)` : identité, niveaux, parcours d'une filière, en une lecture. */
export const getProgramCharpente = (p) => call(ST + 'get_program_charpente', p);

/** ⏳ E3' — `create_program(values)`. */
export const createProgram = (values) => call(ST + 'create_program', { values });

/** ⏳ E3' — `update_program(name, values)`. */
export const updateProgram = (p) => call(ST + 'update_program', p);

/** ⏳ E3' — `create_academic_level(values)` : `{ program, level_code, level_name, level_order, max_semesters, max_duration_years }`. */
export const createAcademicLevel = (values) => call(ST + 'create_academic_level', { values });

/** ⏳ E3' — `create_parcours(values)` : `{ program, parcours_code, parcours_name, parcours_type, choice_count }`. */
export const createParcours = (values) => call(ST + 'create_parcours', { values });
