/**
 * MANDAT-14 (C7, D-RECHERCHE-PERSONNE-01) — chercher une personne : étudiants et personnel.
 *
 * 🟢 `people_search.search_people(query, kind='all', limit=20)`, garde du personnel de gestion (clé
 * `read:people`) ; un RF armé ne voit que les étudiants de SA filière (la portée est au serveur). Trois
 * caractères au moins, sinon le serveur refuse par une phrase. Réponse :
 * `{query, kind, students: [{student, student_name, person_id, program, program_label, academic_level,
 * academic_level_label, academic_status, enabled}], staff: [{user, full_name, roles}],
 * may_be_truncated: {students, staff}}`. Q18 : la filière et le niveau par leur libellé ; le courriel du
 * personnel reste affiché, il départage deux homonymes.
 */
import { call } from './client.js';

export const searchPeople = (p) =>
  call('portal_app.api.academic.people_search.search_people',
    { query: p && p.query, kind: (p && p.kind) || 'all', limit: p && p.limit });
