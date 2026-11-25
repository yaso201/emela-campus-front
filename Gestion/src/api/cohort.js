/**
 * MANDAT-14 (C5, étape 11, G-M2) — les résultats de semestre d'une cohorte, AVANT le jury.
 *
 * 🟢 `deliberation_mgmt.list_semester_results(academic_level, academic_term, academic_year)` — la lecture de l'état
 * (garde de lecture de la délibération) : `{program, program_label, academic_level, academic_level_label,
 * academic_term, academic_year, cohort_size, counts: {create, recompute, skip}, rows: [{student, student_name,
 * academic_level, academic_level_label, semester_result, total_ects_earned, total_ects_possible, cumulative_ects,
 * all_mhc_validated, semester_validated, jury_decision, deliberation, on_compute, skip_reason}],
 * deliberations: [{name, academic_term, status, deliberation_date}], can_compute}`. Même cohorte que le calcul (une
 * seule règle, `_cohort`). Q18 : la filière et le niveau par leur libellé.
 *
 * 🟢 L'acte : `deliberation_mgmt.compute_semester_results(academic_level, academic_term, academic_year)` — l'EM
 * (clé `deliberate`, VERDICT-MANDAT-11-PC1 Q5). Il rend les lignes calculées, dont `mhc_recognized_in_full` (DEC-363).
 */
import { call } from './client.js';

const DL = 'portal_app.api.academic.deliberation_mgmt.';
export const listSemesterResults = (p) => call(DL + 'list_semester_results', p);
export const computeSemesterResults = (p) => call(DL + 'compute_semester_results', p);
