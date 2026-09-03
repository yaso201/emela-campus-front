# T5 — Points d'entrée à créer pour l'attribution des rôles

> Dérivé de la conception de l'écran 7 (lot 5). Douze points d'entrée, dont un
> qui décide de tous les autres. Les rôles existent depuis F3-V0 ; rien ne
> permet de les donner. Cette liste est ce que l'écran suppose, et rien de plus.
>
> **Décision d'autorité** : l'attribution relève de l'**administration
> technique**. Le risque administrateur n'est pas traitable au niveau
> applicatif — celui qui détient les accès système contournerait toute garde.
> Le journal reste comme **trace**, pas comme garde.

---

## 1. Cinq principes avant la liste

| Principe | Ce qu'il implique |
|---|---|
| **La matrice de rôles ne se réimplémente pas au front** | L'écran affiche « ce que ce rôle ouvre » et « ce cumul annule le cloisonnement ». S'il calcule ces phrases lui-même, il duplique la matrice et divergera d'elle au premier changement. C'est l'objet de `preview_grant_effect`. |
| **Fermé par défaut** | Un rôle cloisonné sans portée liée ne voit rien. Le serveur ne compense pas ce vide par une portée implicite : il le renvoie comme anomalie. |
| **La journalisation est serveur** | Un journal alimenté par le front n'est pas une preuve. L'écriture appartient aux points d'entrée d'écriture, dans la même transaction. |
| **Le refus du rôle technique est serveur** | L'écran ne l'offre pas ; le serveur doit le refuser quand même. Une interface n'est jamais une garde. |
| **L'accusé de cumul est une donnée, pas un clic** | La confirmation doit voyager jusqu'au serveur et y être stockée. Sinon elle n'aura existé que dans un navigateur. |

---

## 2. Lecture

### `list_role_grants`
- **Fait** — renvoie les personnes dotées d'au moins un rôle de gestion, avec profil, rôles, portée effective et origine de cette portée.
- **Prend** — `filter` facultatif : `anomalies` · `cumuls` · `role_technique` · `portee_non_armee` ; `search` facultatif.
- **Rend** — par personne : identité, adresse, profil, `roles[]`, `scope = { kind: "nature" | "liaison" | "annulee" | "nulle", program, reason }`, `granted_on`, `granted_by`.
- **Appelable par** — administration technique.
- **Note** — c'est `scope.kind` qui porte tout l'écran. Une simple liste de filières obligerait le front à deviner *pourquoi* elle est vide ou complète.

### `get_role_grant`
- **Fait** — le détail d'une personne.
- **Prend** — `person`.
- **Rend** — le même objet, plus les **liaisons dormantes** : une filière liée dont le cloisonnement est annulé par un cumul doit rester lisible, elle reprendra effet si le cumul cesse.

### `list_role_profiles`
- **Fait** — les six profils, chacun avec les rôles qu'il groupe.
- **Prend** — rien.
- **Rend** — `{ code, libelle, description, roles[], cloisonnable }`.
- **Note** — les six sont `Scolarité`, `Formation`, `Études`, `Direction des Études`, `Direction`, `Staff polyvalent`. Ce dernier groupe **quatre** rôles — gestionnaire académique, responsable de formation, directeur des études, Education Manager — et réunit donc la proposition et la validation d'une maquette. Le point d'entrée doit renvoyer cette composition telle quelle : c'est elle qui déclenche les avertissements.

### `list_assignable_roles`
- **Fait** — les rôles atomiques, avec ce que chacun ouvre et son comportement de portée.
- **Prend** — rien.
- **Rend** — `{ code, libelle, ouvre, portee: "globale" | "cloisonnee", assignable_a_une_personne }`.
- **Note** — le rôle technique figure dans la liste avec `assignable_a_une_personne: false` et sa raison. L'écran l'affiche **expliqué** plutôt que masqué : le masquer laisserait croire à un oubli, le griser inviterait à chercher comment le débloquer.

---

## 3. Le point d'entrée qui décide du reste

### `preview_grant_effect`
- **Fait** — simule une attribution sans l'appliquer, et renvoie ce qu'elle ouvrirait ainsi que les avertissements qu'elle déclenche.
- **Prend** — `person`, `roles[]` (ou `profile`), `program` facultatif.
- **Rend** —
  - `ouvre[]` : une phrase par rôle, **rédigée côté serveur** ;
  - `portee_resultante` : `{ kind, program, reason }` ;
  - `avertissements[]` : `{ code, message, exige_accuse }`, dont **cloisonnement annulé par cumul**, **proposition et validation de maquette réunies**, portée nulle, rôle technique refusé, cumul instruction / décision.
- **Appelé** — à chaque modification du panneau de dotation, avant l'enregistrement. La confirmation affichée reprend `message` tel quel.
- **Note** — le même point d'entrée sert à l'écran et au contrôle : le serveur peut vérifier, à l'attribution, que l'accusé reçu correspond aux avertissements qu'il aurait produits.

---

## 4. Écriture

Chacun écrit au journal **dans la même transaction**. Chacun est idempotent :
rejouer une attribution identique ne crée pas de doublon et ne produit pas de
seconde entrée au journal.

### `assign_role_profile`
- **Fait** — dote une personne d'un profil en une opération ; lie la portée si le profil est cloisonnable et qu'un programme est fourni.
- **Prend** — `person`, `profile`, `program` facultatif, `accuses[]`.
- **Rend** — l'état résultant, plus l'identifiant de l'entrée de journal.
- **Refuse** — si un avertissement `exige_accuse` n'a pas d'accusé correspondant. Le refus doit **nommer lequel manque**, pas renvoyer une erreur générique.

### `add_role` · `remove_role`
- **Fait** — ajoute ou retire un rôle atomique, hors profil.
- **Prend** — `person`, `role`, `accuses[]` à l'ajout ; `person`, `role`, `motif` au retrait.
- **Rend** — l'état résultant.
- **Note** — le retrait demande un motif, l'ajout non. Retirer un droit à quelqu'un qui l'exerçait est l'acte dont on demandera compte.
- **Refuse** — tout rôle marqué `assignable_a_une_personne: false`, même si l'écran l'a proposé.

### `set_role_scope` · `clear_role_scope`
- **Fait** — arme ou retire le cloisonnement en liant un rôle à une filière.
- **Prend** — `person`, `role`, `program`.
- **Rend** — la portée résultante, avec son `kind` — qui peut être `annulee` si un cumul la neutralise. **La liaison est enregistrée quand même** et reprendra effet si le cumul cesse.
- **Note** — une seule filière par liaison dans le modèle actuel. Prévoir la forme en liste dès maintenant coûte peu.

---

## 5. Contrôle et preuve

### `list_grant_anomalies`
- **Fait** — les dotations qui ne tiennent pas debout. **Calculées, jamais stockées.**
- **Rend** — liste typée : `portee_nulle`, `role_technique_humain`, `cumul_sans_accuse`.
- **Note** — le troisième type existera dès le premier jour : les rôles attribués à la main dans le Desk avant cet écran n'ont aucun accusé. Les afficher comme anomalies est la seule façon de les régulariser.

### `list_grant_journal`
- **Fait** — le journal des attributions, filtrable par personne.
- **Prend** — `person` facultatif, bornes de dates facultatives.
- **Rend** — par entrée : horodatage, auteur, personne visée, **rôles avant et après**, portée avant et après, avertissements acquittés, motif s'il y en a un.
- **Note** — « avant et après » plutôt que « rôle ajouté » : un an plus tard, la question est l'état, pas le geste.

---

## 6. Ce qui reste ouvert

| Réf. | Point | État |
|---|---|---|
| **L5-06** | Le profil « Staff polyvalent » réunit proposition et validation de maquette. Le maker-checker ne tient plus : sur les dossiers, l'exclusion par instructeur joue ; sur la maquette, elle n'a rien à quoi s'accrocher. | à porter au métier |
| **L5-02** | Charge horaire d'un enseignant sur une journée — signal « six heures ce jour » du planning. Le point d'entrée de conflits porte sur les collisions, pas sur les charges. | donnée absente |
| **L5-04** | La cause du statut hors cursus — quel conseil, quel motif, quelle date. Le statut est exposé, la cause pas toujours. Sans elle, l'écran parle à un exclu comme à un démissionnaire. | donnée absente |
