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

/** 🟢 `groups.py:57` — `create_group(values)`. Le serveur attend un paramètre
 * `values` (dict) : envelopper les champs (M2 g4 — sans quoi `values` arrive
 * vide et le serveur lève « Student Group Name is required »). */
export const createGroup = (values) => call(GROUPS + 'create_group', { values });

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
 *
 * FORMES (M2 g4) : le contrat `batch_report` serveur (succeeded_count/failed_count/
 * succeeded[]/failed[]) → contrat du composant BatchReport ({total, ok, ko, lines}).
 * Chaque ligne préserve `student`/`student_name` et son motif d'échec.
 */
export const addStudentsToGroup = (p) =>
  call(GROUPS + 'add_students_to_group', p).then((d) => d && {
    total: d.total, ok: d.succeeded_count, ko: d.failed_count, retry_ids: d.retry_ids || [],
    lines: [
      // MANDAT-10 : le statut serveur (`added`, `already_member`) était affiché tel quel — il est traduit.
      ...(d.succeeded || []).map((l) => ({ id: l.student, label: l.student_name || l.student, status: 'ok',
        detail: l.status === 'already_member' ? 'Déjà membre.' : 'Ajouté au groupe.' })),
      ...(d.failed || []).map((l) => ({ id: l.student, label: l.student_name || l.student, status: 'ko', reason: l.message || l.reason })),
    ],
  });

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

/**
 * S-7 (MANDAT-12) — les enseignants qu'on peut affecter au groupe.
 * 🟢 `groups.list_assignable_instructors(group)` — garde GA (+SM).
 * Rend `{ group, instructors: [{ instructor, instructor_name, instructor_type,
 * assigned, service_match, has_service_line }] }` ; `service_match` vaut
 * « groupe », « promotion » ou null (aucune ligne de service validée).
 */
export const listAssignableInstructors = (p) => call(GROUPS + 'list_assignable_instructors', p);

/** 🟢 `groups.py:93` — `assign_instructor(group, instructor)`. */
export const assignGroupInstructor = (p) => call(GROUPS + 'assign_instructor', p);

/** 🟢 `groups.py:99` — `remove_instructor(group, instructor)`. */
export const removeGroupInstructor = (p) => call(GROUPS + 'remove_instructor', p);

/* ─── Inscriptions ───────────────────────────────────────────────────────── */

/**
 * L'inscription administrative depuis un candidat approuvé
 * (`emela_core.academic_core.api.enrollment.create_student_from_applicant`) N'EST
 * PLUS APPELÉE PAR CE FRONT — retirée par décision (VERDICT-MANDAT-10-PC1, Q3 ;
 * DEC-342) : la cascade appartient au flux d'admission, et sa surface n'entre pas
 * dans la carte des signatures de la gestion. Ce que la gestion porte, c'est la
 * REPRISE d'une cascade partielle (`replayEnrollment`) et la LECTURE de son journal.
 */

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

/* ─── FORMES (MANDAT-10, C-2 / C-3) : le journal serveur → ce que l'écran lit ── */

/** Le vocabulaire de `StatusPill` pour chaque état de journal (le libellé affiché reste l'état serveur). */
const LOG_PILL = {
  'Rejeté': 'renvoyee', 'En attente': 'incomplete', 'En reprise': 'propose',
  'Traité avec succès': 'valide', 'Transmis': 'propose', 'Clôturé': 'echue',
};
const LOG_OUTCOME = {
  'Rejeté': 'rejected', 'En attente': 'partial', 'En reprise': 'replaying', 'Traité avec succès': 'created',
};
const LOG_MESSAGE = {
  'En attente': 'L’étudiant est créé et inscrit administrativement. Les étapes non abouties se reprennent '
    + 'sans recréer le dossier.',
  'Rejeté': 'Aucune inscription administrative n’a été posée : la cascade s’est arrêtée avant son unité '
    + 'critique. La reprise relance la cascade depuis le candidat.',
  'En reprise': 'Une reprise a été lancée et n’a pas conclu : le journal attend la fin de la cascade.',
  'Traité avec succès': 'Toutes les étapes ont abouti.',
};

/** Une erreur de cascade « Préfixe: motif » → { label, reason }. */
function splitCascadeError(text) {
  const s = String(text || '');
  const i = s.indexOf(':');
  return i > 0 ? { label: s.slice(0, i).trim(), reason: s.slice(i + 1).trim() } : { label: 'Cascade', reason: s };
}

/**
 * Les ÉTAPES d'une inscription, DÉRIVÉES de son journal.
 *
 * Le serveur ne stocke pas d'étapes : un `Integration Log` porte un ÉTAT
 * (`status`), le motif (`error_message`) et, dans `pivots`, l'étudiant créé et
 * les erreurs CRITIQUES (Student, Program Enrollment — l'unité sans laquelle
 * l'étudiant n'est pas inscrit) et COMPLÉTABLES (inscription pédagogique, compte
 * utilisateur, modules, MHC, groupes — reprenables). L'écran reconstruit donc ce
 * qui s'est passé, et une étape jamais atteinte n'est pas une ligne : la cascade
 * fait un retour anticipé dès l'unité critique en échec.
 */
export function enrollmentLogToView(row) {
  if (!row) return null;
  const pivots = row.pivots || {};
  const critical = (pivots.critical_errors || []).map(splitCascadeError);
  const completable = (pivots.completable_errors || []).map(splitCascadeError);
  const lines = [];
  if (row.status === 'Rejeté' && !critical.length) {
    // Refus des contrôles d'entrée (email, C1…C6, période disciplinaire) : rien n'a été écrit.
    lines.push({ step: 'Contrôles d’entrée', status: 'ko', detail: row.error_message || 'Refusée par les contrôles.' });
  } else {
    const koStudent = critical.find((e) => e.label === 'Student');
    const koPE = critical.find((e) => e.label === 'Program Enrollment');
    lines.push(koStudent
      ? { step: 'Étudiant', status: 'ko', detail: koStudent.reason }
      : { step: 'Étudiant', status: 'ok', detail: pivots.student ? pivots.student + ' — dossier posé.' : 'Dossier posé.' });
    if (!koStudent) {
      lines.push(koPE
        ? { step: 'Inscription au programme', status: 'ko', detail: koPE.reason }
        : { step: 'Inscription au programme', status: 'ok', detail: pivots.program ? 'Filière ' + pivots.program + '.' : 'Inscription soumise.' });
    }
    if (!koStudent && !koPE) {
      const account = completable.find((e) => e.label === 'Compte utilisateur');
      const pedagogical = completable.filter((e) => e !== account);
      if (pedagogical.length) {
        pedagogical.forEach((e) => lines.push({
          step: e.label === 'Inscription pédagogique' ? e.label : 'Inscription pédagogique · ' + e.label,
          status: 'ko', detail: e.reason,
        }));
      } else lines.push({ step: 'Inscription pédagogique', status: 'ok', detail: 'Unités, modules et groupes rattachés.' });
      lines.push(account
        ? { step: 'Compte utilisateur', status: 'ko', detail: account.reason }
        : { step: 'Compte utilisateur', status: 'ok', detail: 'Identifiant de connexion posé.' });
    }
  }
  return {
    log_name: row.name,
    log_status: row.status,
    outcome: LOG_OUTCOME[row.status] || 'other',
    applicant: row.source_name,
    student: pivots.student || null,
    // Le journal ne porte pas le nom de la personne : l'identifiant d'étudiant, sinon celui du candidat, tient lieu.
    student_name: pivots.student || row.source_name,
    attempt_count: row.attempt_count || 0,
    last_attempt: row.timestamp || null,
    created: row.created || null,
    error_message: row.error_message || '',
    lines,
    partial_message: LOG_MESSAGE[row.status] || '',
    // ⚠️ T2 : l'inscription administrative ne crée PAS le badge d'accès — aucune étape de la cascade ne le fait.
    badge: { created: false },
  };
}

/** Une ligne de la file des reprises (forme serveur de `_failed_integration_rows`) → une ligne d'écran. */
export function failedEnrollmentToRow(r) {
  const pivots = r.pivots || {};
  const motive = String(r.error_message || 'Sans motif enregistré');
  return {
    id: r.name,
    title: pivots.student || r.source_name,
    subtitle: (motive.length > 140 ? motive.slice(0, 137) + '…' : motive)
      + (r.attempt_count ? ' · ' + r.attempt_count + ' tentative' + (r.attempt_count > 1 ? 's' : '') : ''),
    status: LOG_PILL[r.status] || 'brouillon',
    log_status: r.status,
    applicant: r.source_name,
    student: pivots.student || null,
  };
}

/**
 * La file des inscriptions à reprendre.
 * 🟢 `enrollment_mgmt.py:67` — `list_incomplete_enrollments(limit=50)`.
 *
 * ⚠️ Signature respectée (C-2) : le point d'entrée ne connaît que `limit` — la
 * file n'est pas contextuelle à l'année (un journal en échec attend, quelle que
 * soit l'année ouverte à l'écran). Le serveur rend une LISTE de journaux (même
 * construction que le guichet S-16) ; l'écran lit `{ count, items[] }`.
 */
export const listIncompleteEnrollments = (p = {}) =>
  call(ENROLL + 'list_incomplete_enrollments', { limit: p.limit || 50 })
    .then((rows) => ({ count: (rows || []).length, items: (rows || []).map(failedEnrollmentToRow) }));

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
export const getEnrollmentLog = (p) =>
  call(ENROLL + 'get_enrollment_log', { integration_log: p.integration_log }).then(enrollmentLogToView);
// 🟢 RF-G-01 : le MANQUE ACCORDÉ est construit — enrollment_mgmt.get_enrollment_log
// (integration_log). Garde de périmètre : seuls les journaux d'INSCRIPTION sont servis
// (417 rédigé sinon — cliqué C1).
// FORMES (C-3, MANDAT-10) : le paramètre est `integration_log` (un `log_name` partait dans le vide,
// V-LEARN-F3-14) et le journal serveur est traduit en étapes par `enrollmentLogToView`.
