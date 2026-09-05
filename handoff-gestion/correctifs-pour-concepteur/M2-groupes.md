# M2 g4 — Groupes et inscriptions : ce qui est branché (pour le concepteur)

*Correctif M2, grappe 4. Le dépôt fait foi.*

## Branché et prouvé (3 actes)

- **Créer un groupe** → `create_group`. Nouveau **formulaire** (`GroupForm`) : nom,
  découpage (`Batch/Course/Activity`), capacité. Le formulaire **ne fabrique pas**
  les clés de contexte — la vue ajoute `program` et `academic_year`.
- **Peupler** → `add_students_to_group`. Les candidats éligibles portent désormais
  des **cases à cocher** ; le bouton envoie la sélection et affiche un **rapport de
  masse** (un déjà-membre compte réussi ; un inéligible échoue, motivé).
- **Retirer** (par membre actif) → `deactivate_students_in_group`. C'est une
  **désactivation** : le membre reste au groupe avec son numéro d'ordre (historique),
  jamais effacé — comme ton relevé l'exige.

## En attente d'une lecture serveur (⏸) — demandes M2

- **Affecter un enseignant** (`assign_instructor`) existe côté serveur, mais **aucune
  lecture ne rend la liste des enseignants assignables** à un groupe. Sans source, il
  n'y a pas d'identifiant à envoyer (envoyer un identifiant saisi serait un identifiant
  inventé). → **demande S-7** : une lecture scopée des enseignants assignables.
- **Inscrire depuis un candidat** (`create_student_from_applicant`) : aucun
  `Student Applicant` en base et **aucune lecture de la liste des candidats INS**.
  → **demande S-8**.
- `update_group`, `set_group_disabled`, `transfer_student`, `remove_instructor`,
  `run_pedagogical_enrollment`, `create_program_enrollment` : aucun bouton dessiné,
  aucune intention à ton relevé — laissés nus, à décider.

## Ce qui bloquait la création (réparé)

L'appel `create_group` envoyait les champs **à plat** ; le serveur attend un
paramètre `values` (dict). Sans cela : « Student Group Name is required ». Corrigé.
Si tu régénères, garde `create_group({ values: {…} })`.
