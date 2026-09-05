# M2 g11 — Administration des rôles : le panneau de dotation (pour le concepteur)

*Correctif M2, grappe 11. Le dépôt fait foi.*

## Ce qui est produit : GrantPanel

Ton relevé §3.7 disait, à juste titre, que le panneau de dotation ne devait PAS
être dessiné tant que `preview_grant_effect` n'existait pas — pour ne pas
réécrire la matrice des rôles dans le navigateur. **Ce point d'entrée existe
désormais** (`role_administration.simulate_assignment`), avec les cinq écritures.
Le panneau est donc produit, **strictement selon ton relevé** :

- La **simulation d'abord** : dès qu'on choisit une personne, un changement et
  une valeur, `simulate_assignment` est appelé et le panneau affiche ce que le
  changement **ouvre** et **retire** — ces phrases (`opens`, `warnings`) sont
  **rédigées au serveur** et reprises telles quelles. Le front n'en écrit aucune.
- L'**accusé est une donnée** : chaque avertissement `W-*` doit être coché
  (acquitté) avant que le bouton d'acte s'active ; les codes acquittés sont
  **transmis à l'acte** (`acknowledged_warnings`) et le serveur les recalcule et
  les exige EXACTEMENT. Un accusé qui n'aurait vécu que dans le navigateur est
  refusé par le serveur.
- Le **retrait est motivé** : retirer un rôle ou une portée exige un motif
  **libre et obligatoire** (DEC-339) — le bouton reste inerte sans lui.

## Ce que j'ai retiré

Le bandeau rouge « Aucun de ces points d'entrée n'existe encore » est **retiré** :
il est devenu faux (la surface `role_administration` existe et les six actes sont
branchés et prouvés en base — journal `Role Assignment Log`).

## Une règle d'interface (PAS une règle serveur)

Le panneau ne propose « Modifier/retirer » une portée que sur les filières
réellement liées à la personne (lues du serveur) ; sous un cumul qui annule le
cloisonnement, une liaison est **dormante** et le serveur la signale comme telle.

## Ce qui bloquait la lecture, et qui est réparé

`list_role_profiles` rend un **objet** `{sod_rule, profiles:[…]}` (ton simulacre
rendait un tableau). L'interface traitait la réponse comme un tableau et
**échouait en silence** — la liste des personnes restait vide en branché. Corrigé
dans la couche d'appel. Si tu régénères le simulacre, rends la **forme serveur**
(l'objet), pas un tableau.
