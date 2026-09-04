/**
 * Grappe 4 · groupes et inscriptions — RÉÉCRIT contre la surface réelle.
 *
 * ⚠️ CORRECTION DE FOND. La première version visait les fonctions du vendor
 * `education.*` et des MÉTHODES DE DOCUMENT, faute d'avoir trouvé mieux. Elle
 * passait à côté de `portal_app.api.academic.groups` : une surface MINCE de
 * treize points d'entrée whitelistés, dont la docstring dit ce que les fonctions
 * vendor ne disent pas —
 *
 *     « Gardes : lecture = staff (RF/PM scopés filière) · écriture = GA (+SM).
 *       Éligibilité TC = source unique, cross-filière restreint aux groupes
 *       Cohorte. »
 *
 * Trois conséquences que le vendor ne donnait pas : le SCOPE est appliqué au
 * serveur (un responsable de formation ne voit que sa filière, fail-closed),
 * l'éligibilité a une SOURCE UNIQUE, et les écritures sont gardées par rôle.
 * J'appelais des fonctions correctes au mauvais NIVEAU — sous les gardes de
 * personne.
 *
 * La leçon du mur des noms se prolonge : chercher le NOM ne suffit pas, il faut
 * chercher la SURFACE. Une fonction vendor et son enveloppe métier portent
 * souvent le même verbe et pas les mêmes gardes.
 */
import { call } from './client.js';

const GROUPS = 'portal_app.api.academic.groups.';
const ENROLL = 'portal_app.api.academic.enrollment_mgmt.';

/* ─── Groupes · lecture ──────────────────────────────────────────────────── */

/**
 * Les groupes d'une filière.
 * 🟢 `portal_app/api/academic/groups.py:20` —
 * `list_groups(program, academic_year, academic_term, group_type, include_disabled)`.
 *
 * ⚠️ Remplace le bouchon `list_student_groups` de la première version : ce
 * n'était pas une lecture de liste générique, c'est un point d'entrée métier.
 */
export const listGroups = (p) => call(GROUPS + 'list_groups', p);

/**
 * Un groupe, avec SES MEMBRES ET SES ENSEIGNANTS.
 * 🟢 `groups.py:33` — `get_group(name, count_only=0)`.
 *
 * Rend `{ …, students[], instructors[], active_count, instructors_count }`.
 *
 * ⚠️ UN SEUL APPEL là où la première version en faisait trois — le groupe, ses
 * étudiants, ses enseignants. C'est la règle 6 appliquée au contrat : trois
 * lectures du même ensemble divergeraient, et l'écran aurait affiché un effectif
 * d'en-tête qui ne s'accorde pas avec la liste en dessous. Le serveur donne les
 * deux ensemble, et `active_count` est sommé sur `students` — pas déclaré à côté.
 *
 * ⚠️ `count_only=1` rend le seul effectif SOUS LES MÊMES GARDES : c'est le
 * décompte-avant-chargement du châssis, offert par le serveur.
 */
export const getGroup = (p) => call(GROUPS + 'get_group', p);

/**
 * Les groupes d'un étudiant.
 * 🟢 `groups.py:39` — `get_student_groups(student)`.
 */
export const getStudentGroups = (p) => call(GROUPS + 'get_student_groups', p);

/**
 * Les étudiants qu'on peut ajouter à ce groupe.
 * 🟢 `groups.py:45` — `list_group_candidates(group)`.
 *
 * ⚠️ « Éligibilité TC = source unique, indépendante des System Defaults vendor »
 * — c'est la fonction qui tranche, pas l'écran. La première version dérivait
 * l'éligibilité d'une liste d'inscriptions au programme : elle aurait divergé de
 * la règle serveur dès le premier cas de tronc commun.
 */
export const listGroupCandidates = (p) => call(GROUPS + 'list_group_candidates', p);

/**
 * LA VUE D'EFFECTIFS — un seul appel, comme annoncé.
 * 🟢 `groups.py:51` — `get_cohort_overview(program, academic_year, academic_term)`.
 *
 * Rend `{ program, academic_year, groups[], totals_by_type{} }` : les effectifs
 * par TYPE de groupe, tronc commun compris. Le bouchon de la grappe 4 est retiré.
 */
export const getCohortOverview = (p) => call(GROUPS + 'get_cohort_overview', p);

/* ─── Groupes · écriture [GA (+SM)] ──────────────────────────────────────── */

/** 🟢 `groups.py:57` — `create_group(values)`. */
export const createGroup = (p) => call(GROUPS + 'create_group', p);

/** 🟢 `groups.py:63` — `update_group(name, values)`. */
export const updateGroup = (p) => call(GROUPS + 'update_group', p);

/** 🟢 `groups.py:69` — `set_group_disabled(name, disabled)`. */
export const setGroupDisabled = (p) => call(GROUPS + 'set_group_disabled', p);

/**
 * Peuplement manuel.
 * 🟢 `groups.py:75` — `add_students_to_group(group, students)`.
 *
 * ⚠️ Rend un rapport ligne à ligne : c'est un acte de masse, et le succès
 * partiel y est un cas courant, pas une exception.
 */
export const addStudentsToGroup = (p) => call(GROUPS + 'add_students_to_group', p);

/**
 * 🟢 `groups.py:81` — `deactivate_students_in_group(group, students)`.
 *
 * ⚠️ DÉSACTIVER, non supprimer : un membre inactif reste au groupe avec son
 * numéro d'ordre. L'écran doit donc dire « retirer du groupe » et non « effacer ».
 */
export const deactivateStudentsInGroup = (p) =>
  call(GROUPS + 'deactivate_students_in_group', p);

/** 🟢 `groups.py:87` — `transfer_student(from_group, to_group, student)`. */
export const transferStudent = (p) => call(GROUPS + 'transfer_student', p);

/** 🟢 `groups.py:93` — `assign_instructor(group, instructor)`. */
export const assignGroupInstructor = (p) => call(GROUPS + 'assign_instructor', p);

/** 🟢 `groups.py:99` — `remove_instructor(group, instructor)`. */
export const removeGroupInstructor = (p) => call(GROUPS + 'remove_instructor', p);

/* ─── Inscriptions ───────────────────────────────────────────────────────── */

/**
 * L'inscription administrative, depuis un candidat approuvé.
 * 🟢 `emela_core/academic_core/api/enrollment.py:57` —
 * `create_student_from_applicant`.
 *
 * ⚠️ ACTE D'ÉCRITURE, EN CASCADE : étudiant, inscription au programme,
 * inscription pédagogique, compte, rattachements. Il ne se déclenche QUE depuis
 * un geste — jamais un cycle de vie. Un identifiant inventé envoyé ici est pire
 * qu'un chemin inventé : l'appel réussit.
 */
export const enrollFromApplicant = (p) =>
  call('emela_core.academic_core.api.enrollment.create_student_from_applicant', p);

/**
 * LA REPRISE — l'appelant existe, et c'est lui qui porte la garde.
 * 🟢 `portal_app/api/academic/enrollment_mgmt.py:61` —
 * `replay_enrollment(integration_log)`.
 *
 * La fonction interne `replay_enrollment_from_log` n'est pas exposée, et sa
 * docstring disait vrai : « la garde de rôle vit chez l'appelant (portal_app
 * enrollment_mgmt) ». Cet appelant est whitelisté — je n'avais pas cherché du bon
 * côté. Le bouchon est retiré.
 *
 * ⚠️ ACTE D'ÉCRITURE lui aussi : il rejoue la cascade. L'étudiant déjà créé pour
 * ce candidat est RÉUTILISÉ — aucune duplication —, mais l'appel écrit.
 */
export const replayEnrollment = (p) => call(ENROLL + 'replay_enrollment', p);

/**
 * La file des inscriptions à reprendre.
 * 🟢 `enrollment_mgmt.py:67` — `list_incomplete_enrollments(limit=50)`.
 *
 * Remplace le bouchon `list_enrollment_replays`.
 */
export const listIncompleteEnrollments = (p) =>
  call(ENROLL + 'list_incomplete_enrollments', p);

/**
 * Les orphelins de la plateforme d'apprentissage.
 * 🟢 `enrollment_mgmt.py:43` — `list_moodle_orphans(limit=50)`.
 *
 * ⚠️ Remplace le bouchon `list_enrollment_orphans`, et RESTREINT sa portée : le
 * point d'entrée réel ne connaît que les orphelins de la plateforme. L'écran
 * montrait deux natures dans une liste ; la seconde — un étudiant sans groupe —
 * n'a pas de source lue. Elle redevient un manque nommé plutôt qu'un affichage
 * adossé à rien.
 */
export const listMoodleOrphans = (p) => call(ENROLL + 'list_moodle_orphans', p);

/** 🟢 `enrollment_mgmt.py:55` — `run_pedagogical_enrollment(student)`. ÉCRITURE. */
export const runPedagogicalEnrollment = (p) =>
  call(ENROLL + 'run_pedagogical_enrollment', p);

/** 🟢 `enrollment_mgmt.py:19` — `create_program_enrollment(...)`. ÉCRITURE. */
export const createProgramEnrollment = (p) =>
  call(ENROLL + 'create_program_enrollment', p);

/* ─── Ce qui manque, nommé ───────────────────────────────────────────────── */

/**
 * 🔴 MANQUE ACCORDÉ — la LECTURE du journal d'une inscription.
 *
 * Accordé et entrant dans la vague de correction, avec sa garde. C'est la
 * démonstration du défaut le plus grave de la grappe 4 : faute de lecture,
 * l'écran affichait le rapport en REJOUANT la cascade.
 *
 * Ce qu'il faut : lire un `Integration Log` par son nom — étapes, statut, motif —
 * sans rien exécuter.
 */
export const getEnrollmentLog = (p) => call(ENROLL + 'get_enrollment_log', p);
// 🟢 RF-G-01 : le MANQUE ACCORDÉ est construit — enrollment_mgmt.get_enrollment_log
// (integration_log). Garde de périmètre : seuls les journaux d'INSCRIPTION sont servis
// (417 rédigé sinon — cliqué C1).
