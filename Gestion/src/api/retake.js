/**
 * MANDAT-14 (C6, étape 11, G-M3) — la note de rattrapage.
 *
 * 🟢 `module_grade.list_retake_candidates(course, academic_term, student_group, limit)` — l'EM (clé `control:grades`,
 * garde `RETAKE_ROLES`) : `{course, course_name, academic_term, rows: [{ue_result, student, student_name, program,
 * program_label, course_ue, ue_name, module_average, original_grade, retake_posted, ue_average, ue_validated,
 * eligible, blocked_reason}], eligible_count, may_be_truncated}`. `blocked_reason` est LA phrase de la garde de la
 * saisie (une seule règle, `_retake_blocked`) : jury clos, note déjà posée, UE validée, module validé, UE sous le
 * plancher. Q18 : la filière et l'UE par leur libellé, le module par son nom.
 *
 * 🟢 L'acte : `module_grade.record_retake_grade(ue_result, course, retake_grade)` (MANDAT-11).
 */
import { call } from './client.js';

const MG = 'portal_app.api.academic.module_grade.';
export const listRetakeCandidates = (p) => call(MG + 'list_retake_candidates', p);
export const recordRetakeGrade = (p) => call(MG + 'record_retake_grade', p);
