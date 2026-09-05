# M2 g2 — Structure : unités et cycle de maquette (pour le concepteur)

*Correctif M2, grappe 2. Le dépôt fait foi.*

## Branché et prouvé (5 actes)

- **Ajouter une unité** → `create_ue`. Nouveau **formulaire** (`UeForm`). Tes questions
  du relevé §3 ont leur réponse par le contrat serveur : le **code est saisi** (format
  imposé, ex. `LIS-S1-01`), l'**intitulé** est saisi, le **niveau** est **obligatoire**
  (choisi dans la liste des niveaux du programme, lue de l'arbre), les **ECTS** sont un
  **entier positif** et le total par semestre ne peut dépasser **30**.
- **Enregistrer** → `update_ue` (intitulé de l'unité sélectionnée).
- **Cycle de maquette** : **Proposer** (`propose_maquette`), **Valider** (`validate_maquette`,
  DE), **Renvoyer au brouillon** (`return_maquette_to_draft`, DE, **motif obligatoire**).
  Les boutons n'apparaissent qu'au bon état (Brouillon → propose ; Proposé → valider/renvoyer).

## Une décision d'interface (pas serveur)

Le **code d'unité est saisi** (pas dérivé) — c'est une décision consignée ici. S'il doit
être dérivé, dis-le.

## En attente d'une lecture serveur (⏸) — demande S-10

Le **rattachement des modules** (`attach_module_to_ue`/`detach_module_from_ue`) et la
**création/édition de module** supposent un **catalogue des modules disponibles** (par
filière ? par établissement ? — ta question du relevé §3). Aucune lecture ne le rend.
→ demande S-10.

## Deux choses réparées

- L'appel `create_ue` doit envelopper les champs dans `values` (comme `create_group`) —
  fait.
- L'arbre expose désormais les **niveaux** du programme (ils étaient rendus par le serveur
  mais l'interface les jetait) — nécessaires au formulaire.
