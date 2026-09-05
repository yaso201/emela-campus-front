# M2 g3 — Répartition : branchement des 6 actes (pour le concepteur)

*Correctif M2, grappe 3. Ce qui a changé dans l'interface de gestion, pourquoi,
et ce que tu dois reverser dans tes relevés. Le dépôt fait foi.*

## Ce qui est branché (6 actes sur 7)

Les six actes de répartition écrivent désormais vraiment au serveur, prouvés par
le clic depuis la release servie (`2f1ca11e8c7e`), effets relus en base :

| Acte | Écran | Ce que fait le bouton |
|---|---|---|
| Ajouter une ligne | RepartitionView | ouvre un **formulaire de ligne** (nouveau) → `upsert_service_line(values)` |
| Modifier | RepartitionView (sur une ligne **Brouillon**) | rouvre le même formulaire pré-rempli → `upsert_service_line(values, name)` |
| Proposer à la validation | RepartitionView | `propose_service_lines` → **rapport de masse** (une ligne sans enseignant échoue, motivée, rejouable) |
| Valider les N lignes | RepartitionValidationView (DE) | `validate_service_lines(names, derogation_reason?)` sur les lignes cochées |
| Renvoyer au responsable | RepartitionValidationView (DE) | `return_service_line(name, reason)` **par ligne** (le serveur ne connaît qu'un renvoi unitaire) |
| Reprendre l'année N-1 | RepartitionView (si `can_carry_over`) | `carry_over_service_lines(program, from, to)` — rapport de masse idempotent |

## Le formulaire de ligne — ce que j'ai dû décider (ton relevé ne le fixait pas)

Ton relevé (`releve-grappe-3.md:52`) nommait le bouton « Ajouter » comme non
branché, sans décrire le formulaire. Ses champs sont **exactement le contrat
serveur** `upsert_service_line` (allowed : `course, activity_type, hours,
instructor, student_group`) :
- **Module** : liste des modules lus du plan de la filière (aucun identifiant saisi).
- **Type d'activité** : Select `CM/TD/TP/PJ`.
- **Heures** : nombre.
- **Enseignant** : optionnel — la liste ne porte que les enseignants **déjà engagés**
  sur la filière (aucun identifiant inventé). L'enseignant est exigé à la
  **proposition**, pas à la création (garde serveur).
- **Groupe** : optionnel (promotion entière par défaut).

Si tu redessines cet écran : garde ces champs et ces sources. Un enseignant ou un
module saisi en texte libre partirait dans le vide.

## Un acte laissé nu, à décider

**Supprimer une ligne** (`delete_service_line`) n'a **aucun bouton** dans tes
relevés ni dans l'écran, et aucune intention documentée. Je ne l'ai pas dessiné
(on ne pose pas un acte destructif sans intention). À toi de dire si une ligne
Brouillon doit pouvoir se supprimer, et depuis où.

## Deux règles d'interface que j'ai posées (ce ne sont PAS des règles serveur)

- **Modifier** n'est offert que sur une ligne **Brouillon** — une ligne proposée
  ou validée ne se réédite plus depuis cet écran (cohérent avec le gel serveur).

## Ce qui bloquait tout, et qui est réparé (à savoir)

Avant ce lot, **aucun bouton d'acte ne se rendait sur la release**, et **aucune
année ne se résolvait** : le serveur rend les permissions en **liste** et le
contexte académique **à plat**, alors que l'interface les attendait autrement.
Deux adaptateurs (dans la couche d'appel) corrigent cela. C'est pourquoi tes
écrans paraissaient « vides » en branché.
