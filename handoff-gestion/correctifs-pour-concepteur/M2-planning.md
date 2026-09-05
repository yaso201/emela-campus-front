# M2 g5 — Planning : annulation motivée et dérogation (pour le concepteur)

*Correctif M2, grappe 5. Le dépôt fait foi.*

## Branché et prouvé

- **Annuler la séance** → `set_schedule_status(name, 'Annulé', reason)`. Une **étape
  de motif** (ReasonStep) s'ouvre : le motif est **exigé à l'écran**. ⚠️ C'est une
  **règle d'interface**, PAS une règle serveur — côté serveur le motif est facultatif
  (tracé en Comment). L'annulation **ne dépublie pas** : la séance reste visible,
  marquée annulée (deux statuts indépendants).
- **Publier la semaine** → `publish_schedules` (déjà câblé) ; la **dérogation** au
  préavis est désormais un vrai champ `override_reason`, réservé au **directeur des
  études**, appliqué aux séances rejouables (`retry_ids`) du rapport de masse.

## En attente d'une lecture serveur (⏸) — demande S-9

- **Modifier / créer une séance** (`update_schedule`, `create_schedule`) et
  **affecter un enseignant** (`assign_instructor`) supposent la **liste des salles**
  et des **créneaux valides**, appelés PENDANT la saisie (comme tu l'écris). Aucune
  lecture serveur ne les rend. → demande S-9 : lectures salles + créneaux + conflits.

## Défaut relevé (hors des 2 actes)

`PlanningView` fige la semaine au **14-18 septembre** (reliquat du simulacre) : la
grille montre toujours cette semaine quel que soit le contexte. La navigation de
semaine reste à faire — signalée, non corrigée dans ce lot.
