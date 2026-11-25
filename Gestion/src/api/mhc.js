/**
 * MANDAT-14 (C4, étape 5, G-M1) — les inscriptions aux MHC, à statuer.
 *
 * 🟢 `module_grade.list_mhc_enrollments(academic_term, program, status, limit)` — lecture de l'EM, du GA et du DE
 * (clé `read:mhc`) : `{items: [{name, student, student_name, mhc_module, mhc_code, mhc_type, mhc_name, program,
 * program_label, academic_level, academic_level_label, validation_method, academic_term, status, is_validated,
 * validation_comment, validated_by, validated_by_name, validation_date, blocks_semester}], decisions, can_decide,
 * may_be_truncated}`. `decisions` est le vocabulaire du contrôleur ; `can_decide` dit si le lecteur porte l'acte.
 * Q18 : le décideur par son nom, la filière et le niveau par leur libellé.
 *
 * 🟢 L'acte : `module_grade.validate_mhc_enrollment(student, mhc_module, decision, comment)` — l'EM seul (clé
 * `decide:mhc`, VERDICT-MANDAT-14-PC1 Q5). Une décision se révise : l'acte reste offert sur toute ligne.
 */
import { call } from './client.js';

const MG = 'portal_app.api.academic.module_grade.';
export const listMhcEnrollments = (p) => call(MG + 'list_mhc_enrollments', p);
export const validateMhcEnrollment = (p) => call(MG + 'validate_mhc_enrollment', p);
