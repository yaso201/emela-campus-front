# Relevé — grappe 2 (structure)

Même exercice : ce que la production a fait apparaître et que la conception ou le serveur n'avait pas
tranché. Le manque se dit, il ne se devine pas.

---

## 1. Le manque prévu, et sa forme

`get_ue_downstream_usage` était annoncé au relevé de la grappe 1 ; il est construit. Sa forme :

    { enrollments, grades, locked, locked_by }

**`locked` fait foi, pas le calcul du front.** L'écran affiche les deux comptes et obéit à `locked` —
il ne déduit pas le verrou de `enrollments > 0`. Si la règle change (un seuil, une exception pour une
unité jamais servie), elle change côté serveur, en un endroit. Un front qui recalcule est un front
qui divergera.

**`locked_by` sert la phrase, pas la décision.** Il dit *d'où* vient le verrou pour que l'écran
l'écrive. Facultatif : sans lui, la phrase perd en précision, l'écran ne casse pas.

---

## 2. Ce que le code a fait découvrir

**Le verrou par défaut est le verrou fermé.** L'usage aval est un appel distinct — attendre sa
réponse pour rendre l'écran le figerait sur un détail. Il fallait donc décider ce que vaut le champ
*pendant* l'attente, et en cas d'erreur. Réponse retenue : **verrouillé**. Mieux vaut refuser une
modification permise que d'en permettre une qui casse des rattachements de notes. L'écran le dit
plutôt que de le subir — le message d'erreur porte la raison du refus, pas seulement l'échec.

**Un renvoi au brouillon ne déverrouille rien.** Conséquence directe de A6 que la maquette
n'énonçait pas : le verrou vient de l'usage aval, pas de l'état de la maquette. L'étape de motif le
dit à celui qui renvoie — sans quoi il croirait rouvrir un code que des notes utilisent.

**`owner: null` est un cas légitime.** Une filière retirée dont le responsable est parti : la ligne
reste (elle a produit des inscriptions), le responsable manque. L'écran écrit « responsable non
renseigné » et garde la ligne, plutôt que de la masquer et de perdre l'historique de mutualisation.

**Le zéro de volume avait besoin d'être défendu à l'écran.** La légende du tableau des volumes porte
la réponse 1 du lot 6 : un volume à zéro n'est pas un manque, et c'est cette allocation qui fait foi
pour la couverture de la répartition. Sans cette phrase, quelqu'un « corrigera » un zéro.

---

## 3. Ce qui manque encore côté serveur

**La création d'une unité.** `create_ue` existe dans les points d'entrée ; le formulaire de création
n'est pas produit (le bouton « Ajouter une unité » est déclaré, inerte). Il me manque : les champs
obligatoires, et si le code est saisi ou dérivé.

**Le rattachement des modules.** `attach_module_to_ue` / `detach_module_from_ue` sont exposés, mais
rien ne dit **d'où viennent les modules disponibles** — un catalogue par filière ? par établissement ?
L'écran de rattachement en dépend entièrement.

**L'historique.** Le bouton est là, sans point d'entrée. Que porte l'historique d'une maquette : les
actes (proposé, validé, renvoyé) seuls, ou aussi les modifications de champs ?

**L'état de validation détaillé.** `get_maquette_validation_status` existe et n'est pas consommé :
je ne sais pas ce qu'il rend de plus que `maquette.state`. S'il porte les manques qui empêchent une
proposition (unité sans module, volume à zéro partout), c'est un écran de plus — utile.

**La portée de la maquette.** L'arbre est demandé avec `{ academic_year, term, program }`. Le
semestre est-il un filtre de l'arbre, ou l'arbre porte-t-il toujours l'année entière et le semestre
n'est qu'un repère de lecture ? Aujourd'hui je passe les deux et j'affiche ce qui vient.

---

## 4. Prochaine grappe

Grappe 3 — répartition de service. Les cinq écrans du lot 6 corrigé. Prévisible dès maintenant :

- **Le sur-couvert se calcule sur les heures**, pas sur les lignes (correction du lot 6) — l'écran a
  besoin du volume de maquette **par module et par type d'activité**, celui que `get_ue` rend déjà.
  Premier endroit où les deux grappes se rejoignent.
- **L'horodatage du réalisé** — l'un des neuf ajustements. Sans lui, un tableau qui sert de base de
  paie n'a pas de millésime.
- **La reconduction annuelle** — l'un des neuf. Sans elle, juillet est une re-saisie intégrale.
- **La ligne en brouillon sans enseignant** — l'un des neuf. C'est ce qui permet de poser la
  structure en juillet et de chercher les enseignants ensuite.

## Provisoires tracés — les actes non branchés

Cinq gestionnaires de l'écran de structure étaient **muets** : `save` — le CTA primaire « Enregistrer »
— et `openHistory` avaient un corps vide ou réduit à un commentaire ; `submitDraft` ne faisait que
refermer le panneau de motif, ce qui ressemble à un succès après qu'on a rempli un motif obligatoire ;
`act` avalait en silence toute clé d'`ActionBar` autre que `draft`.

Les cinq affichent maintenant un bandeau qui nomme l'acte et précise que rien n'a été enregistré.

⚠️ **C'était la cinquième fois que cette classe se rejouait**, et la règle était déjà écrite dans trois
vues : « un bouton muet est pire qu'un bouton absent : l'utilisateur croit avoir agi. » À chaque tour
j'avais corrigé le fichier qu'on me montrait sans balayer les autres.

Elle est maintenant **gardée par l'audit** : pour chaque événement lié à un nom dans un patron, le corps du gestionnaire
doit faire quelque chose — appeler `notBuilt` compte, un corps vide ou réduit à un commentaire ne compte
pas, et « ne faire que refermer » est signalé à part.

⚠️ Et le contrôle a d'abord affiché vert sur le cas même qui l'a motivé : mon extraction cherchait une
accolade fermante en **début de ligne**, or `function openHistory() {}` tient sur une seule ligne — le
motif sautait au prochain `\n}` du fichier et capturait un corps énorme, non vide. Corrigé par un
compteur d'accolades.

Les points d'entrée correspondants sont nommés au manifeste : `update_ue` (§3), `validate_ue` et le
retour au brouillon. Un provisoire non résorbé devient une convention.
