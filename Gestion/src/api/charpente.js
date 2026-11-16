/**
 * Étapes 1 et 2 de la boucle · la CHARPENTE — calendrier académique et catalogue des filières (MANDAT-10, E3').
 *
 * La charpente n'est pas la maquette (`permissions.js`) : années, semestres, fériés et filières portent leurs
 * propres clés — `write:calendar` et `write:charpente`, tenues par le Gestionnaire académique (garde serveur
 * `CHARPENTE_ROLES` = GA, SM). Les parcours relèvent de la maquette (`write:structure`).
 *
 * ⚠️ LES ÉCRITURES EXISTENT DÉJÀ au serveur (`portal_app/api/academic/structure.py`, dans la carte des signatures) :
 * années, semestres, filières, niveaux, parcours. Elles n'avaient pas d'écran. La maquette les appelle TELLES
 * QU'ELLES SONT. Ne manquent que :
 *   ⏳ E3' `get_academic_calendar()` — une lecture pour l'écran (années, dates, courante, close ; semestres, parité,
 *      jours ouvrés ; fériés), construite sur les aides existantes (année courante, clôture, parité, jours ouvrés) ;
 *   ⏳ E3' `add_holiday`, `remove_holiday` — les fériés d'une année ;
 *   ⏳ E3' `set_current_academic_year` — RUN-06 à l'écran, si la MOA le retient (Q1-bis b).
 * Ces quatre-là ne sont servis que par le simulacre : aucune release branchée ne les appelle avant la validation de
 * la maquette (`VERDICT-MANDAT-10-PC1B.md`).
 */
import { call } from './client.js';

const ST = 'portal_app.api.academic.structure.';

/* ─── Étape 1 · calendrier académique ─────────────────────────────────── */

/** ⏳ E3' — `get_academic_calendar()` : l'année, ses semestres et ses fériés viennent du MÊME appel. */
export const getAcademicCalendar = () => call(ST + 'get_academic_calendar', {});

/** Existant — `create_academic_year(academic_year_name, year_start_date, year_end_date)` [GA, SM]. */
export const createAcademicYear = (p) => call(ST + 'create_academic_year', {
  academic_year_name: p.academic_year_name, year_start_date: p.year_start_date, year_end_date: p.year_end_date,
});

/**
 * Existant — `create_academic_term(academic_year, term_name, term_start_date, term_end_date)` [GA, SM].
 *
 * ⚠️ `year` et non `academic_year` côté écran : l'année est ici l'OBJET édité (un semestre AJOUTÉ à 2027-2028), pas
 * l'année de CONTEXTE que la coquille transmet. Le nom serveur est reposé ici, au point d'appel.
 */
export const createAcademicTerm = (p) => call(ST + 'create_academic_term', {
  academic_year: p.year, term_name: p.term_name, term_start_date: p.term_start_date, term_end_date: p.term_end_date,
});

/** ⏳ E3' — `add_holiday(academic_year, holiday_date, description)`. */
export const addHoliday = (p) => call(ST + 'add_holiday', {
  academic_year: p.year, holiday_date: p.holiday_date, description: p.description,
});

/** ⏳ E3' — `remove_holiday(academic_year, holiday_date, reason)` : motif obligatoire, tracé. */
export const removeHoliday = (p) => call(ST + 'remove_holiday', {
  academic_year: p.year, holiday_date: p.holiday_date, reason: p.reason,
});

/**
 * ⏳ E3' — `set_current_academic_year(academic_year, reason)` : RUN-06 à l'écran (Q1-bis b). Fail-closed : rien ne
 * fonctionne sans année courante, et la changer déplace tous les écrans.
 */
export const setCurrentAcademicYear = (p) => call(ST + 'set_current_academic_year', {
  academic_year: p.year, reason: p.reason,
});

/* ─── Étape 2 · catalogue des filières ────────────────────────────────── */

/**
 * Existant — `list_programs(program_type, include_inactive)`. ⏳ E3' : ses champs de liste s'étendent
 * (`custom_catalogue_only`, `custom_nb_annees`, `custom_total_ects_required`) — ajout, aucun lecteur ne casse.
 */
export const listProgramCatalogue = () => call(ST + 'list_programs', { include_inactive: 1 });

/** Existant — `get_program(program)` : identité, niveaux, compteurs. ⏳ E3' : il rend aussi ses parcours. */
export const getProgramDetail = (p) => call(ST + 'get_program', { program: p.program });

/** Existant — `create_program(program_name, values)` [GA, SM]. */
export const createProgram = (p) => {
  const { program_name: programName, ...values } = p;
  return call(ST + 'create_program', { program_name: programName, values });
};

/** Existant — `update_program(name, values)` [GA, SM]. */
export const updateProgram = (p) => call(ST + 'update_program', { name: p.name, values: p.values });

/** Existant — `set_program_active(program, is_active)` [GA, SM]. */
export const setProgramActive = (p) => call(ST + 'set_program_active', { program: p.program, is_active: p.is_active });

/**
 * Existant — `create_academic_level(values)`. ⚠️ Sa garde serveur est celle de la MAQUETTE (RF, EM, PM, SM), non
 * celle de la charpente : la maquette propose de l'aligner sur `CHARPENTE_ROLES` (Q1-bis e).
 */
export const createAcademicLevel = (p) => call(ST + 'create_academic_level', { values: p });

/** Existant — `create_parcours(values)` [RF, EM, PM, SM — portée de filière]. */
export const createParcours = (p) => call(ST + 'create_parcours', { values: p });
