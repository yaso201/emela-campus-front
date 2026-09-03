# Relevé — grappes 8 à 11 : les cinq pages restantes

Cinq pages déclarées, cinq pages produites. Et quatre domaines dont le serveur ne dit
presque rien.

---

## 1. Ce que la lecture a établi, avant d'écrire une ligne

**Trois des quatre domaines n'ont AUCUNE surface d'appel.** Ce n'est pas une lacune de
recherche : c'est le résultat de la recherche.

| Domaine | Ce que la surface porte | Statut |
|---|---|---|
| Conseil pédagogique | rien — cherché `council`, `cps`, `preconisation`, `absence_threshold` | 🔴 aucun chemin tranché |
| Documents | rien — cherché `document_request`, `transcript`, `attestation`, `verification_code` | 🔴 aucun chemin tranché |
| Clôture d'année | rien — cherché `close_year`, `year_closure`, `reopen` | 🔴 aucun chemin tranché |
| Diplomation | **onze fonctions annoncées existantes** (carte P-06, toutes ✅) | 🟡 chemin d'exposition inconnu |
| Attribution des rôles | douze points d'entrée **spécifiés, aucun construit** | 🔴 trou T5 |

⚠️ **Et la distinction 🔴 / 🟡 n'est pas décorative ici.** Un 🔴 dit « je ne sais pas si la
fonction existe » ; un 🟡 dit « elle existe, je ne sais pas où ». Les confondre ferait
chercher au back-end ce qu'il a déjà construit — la diplomation est entièrement bâtie, et
la présenter comme un manque coûterait un chantier inutile.

**Le vocabulaire réglementaire de la diplomation, lui, est lu et cité** : articles 45
(conditions), 46 (composition du jury), 49 (mention et félicitations), et la décision
`D-TEMPLATE-DIPLOME-01` qui diffère le rendu des parchemins. C'est le seul des quatre
domaines dont les règles ne sont pas déduites d'une maquette.

---

## 2. Les chemins, nommés — pour que le branchement soit mécanique

**Grappe 8 · conseil pédagogique** (`src/api/council.js`, tous 🔴)

Lectures : `list_council_candidates` · `get_council_session` ·
`list_council_preconisations` · `list_absence_thresholds`.

Actes : `prepare_council_session` · `retain_for_council` · `examine_council_student` ·
`add_council_preconisation` · `post_preconisation_finding` · `close_council_session` ·
`pronounce_absence_warning`.

**Grappe 9 · documents** (`src/api/documents.js`, tous 🔴)

`list_document_requests` · `get_document_request` · `emit_document` ·
`refuse_document_request`.

**Grappe 9 · clôture** (`src/api/closure.js`, tous 🔴)

`get_year_closure` · `close_academic_year` · `reopen_academic_year`.

**Grappe 10 · diplomation** (`src/api/graduation.js`, tous 🟡 — noms de la carte P-06,
portés nus)

`list_graduation_dossiers` · `get_graduation_dossier` · `create_graduation_dossier` ·
`attest_national_exam` · `present_eligibility` · `open_graduation_jury` ·
`decide_graduation` · `reopen_after_adjournment` · `award_felicitations` ·
`issue_graduation_document`.

**Grappe 11 · rôles** (`src/api/roles.js`, tous 🔴 — voir `T5-points-d-entree.md` pour les
signatures)

`list_role_grants` · `get_role_grant` · `list_role_profiles` · `list_assignable_roles` ·
`preview_grant_effect` · `assign_role_profile` · `add_role` · `remove_role` ·
`set_role_scope` · `clear_role_scope` · `list_grant_anomalies` · `list_grant_journal`.

---

## 3. Ce que chaque écran a exigé du serveur, et pourquoi

Ces exigences ne sont pas des préférences d'interface. Chacune existe parce que, sans
elle, l'écran devrait **deviner** — et une interface qui devine une règle métier divergera
d'elle sans que personne ne le voie.

### 3.1 Le conseil ne prononce rien, et cela se porte dans la donnée

**`official: false` sur chaque valeur de janvier.** La délibération est annuelle et se
tient en juillet : crédits et moyennes de janvier sont calculés, pas arrêtés. Si l'écran
devait déduire ce statut de la période, il se tromperait un an sur deux — et c'est aussi
l'argument qui justifie que le conseil ne décide rien : **on ne décide pas sur des
résultats non arrêtés.**

**Ni score, ni rang, ni gravité dans la liste des candidats.** Trois critères booléens, et
l'ordre du registre. Un champ de gravité rendrait le tri par gravité possible, donc
probable — et un classement d'étudiants se lit comme une conclusion. L'audit garde
maintenant l'absence de ce champ (§5.1) : c'est la **donnée** qui rend le tri possible, et
un écran suivant l'ajouterait sans y penser.

**`can_close` et sa RAISON viennent du serveur.** L'écran de séance porte le seul bouton
désactivé du dépôt (§3.2), et sa raison est reprise telle quelle. Une phrase écrite dans
la vue serait une seconde implémentation de la règle de clôture.

**`first_pronounced` sur chaque ligne du second seuil d'absence.** Sans lui, l'écran ne
peut pas savoir qu'un avertissement de premier seuil reste dû, et il ne proposerait que la
convocation. L'avertissement resterait alors dû **indéfiniment**, sans que rien ne le dise.

### 3.2 L'exception assumée : un bouton grisé, et un seul

Partout dans ce dépôt, une action indisponible **n'est pas rendue** (règle 3) : un bouton
grisé est une fuite d'information sur ce que d'autres peuvent faire.

⚠️ **« Clôturer la séance » y déroge, et il faut le dire ici pour qu'un relecteur ne le
supprime pas comme une violation.** L'indisponibilité ne vient pas d'un DROIT — le
président de séance a bien le droit de clore — mais d'un **état de la séance qu'il peut
lui-même changer** : deux étudiants de l'ordre du jour n'ont pas été examinés. Retirer le
bouton lui ferait chercher une action qu'il détient.

C'est la formulation du lot 7 prise au mot : « un choix grisé qui explique pourquoi vaut
mieux qu'un choix absent ». La règle 3 tient toujours pour les droits ; elle ne tranche
pas les états.

### 3.3 Les préconisations sont LUES, jamais envoyées

Le règlement impose que **toutes** les préconisations soient portées au jury. L'écran ne
porte donc **aucun bouton de transmission**, et la donnée **aucune date d'envoi** :
l'affichage est permanent.

⚠️ Un envoi horodaté aurait figé une liste à une date, et **il en aurait toujours manqué
une** — celle rendue après coup. L'audit garde maintenant l'absence de tout champ
d'envoi dans les préconisations.

**Et `needs_finding` vient de la table des types, jamais du libellé.** Un seul des cinq
types exige un constat : le contrat de remédiation. Sans son constat de fin de semestre,
il n'est **qu'une intention morte** — le jury lit « non constaté ». Il n'est donc pas une
case parmi d'autres : les contrats sans constat viennent en tête, et c'est le **seul**
ordonnancement de cet écran. Un tri par pièce absente, non par gravité d'étudiant.

### 3.4 Le catalogue de documents est restreint, et il dit pourquoi

`requestable: false` n'est **pas un droit manquant** : le diplôme et l'attestation de
réussite sont émis par la diplomation, à l'issue du cursus. Ils figurent au catalogue,
**expliqués et non masqués** — masquer laisserait croire à un oubli, griser inviterait à
chercher comment débloquer.

⚠️ **Et la conséquence porte sur le refus, pas sur l'affichage.** Une demande de diplôme
reçue dans cette file est **irrecevable**, non prématurée : elle ne se reformule pas, elle
se réadresse. Les deux catégories de refus ne sont pas deux nuances — « prématurée »
annonce à l'étudiant qu'il pourra reformuler, « irrecevable » annonce le contraire. Les
confondre laisse quelqu'un attendre indéfiniment, ou renoncer à tort.

**Aucun exemplaire.** Rien à compter, rien à retirer.

**Et le code de vérification NAÎT DE L'ÉMISSION.** Le serveur doit rendre
`verification_code: null` avant l'acte, et l'écran doit le **dire** plutôt que d'afficher
un champ vide — un champ vide se lit comme une donnée manquante, et un agent aurait pu
communiquer un code qui n'existe pas encore.

### 3.5 La clôture : deux panneaux, et la faute est symétrique

**Les anomalies** — ce qui aurait dû être réglé. Clore quand même est permis, et **exige un
motif**. **Les continuations** — ce qui survit à la clôture par conception. **Aucun motif.**

⚠️ Une liste unique aurait produit l'une des deux fautes, dans les deux sens : exiger un
motif pour une procédure disciplinaire qui court normalement, ou laisser clore **sans un
mot** sur trois dossiers sans décideur. D'où `requires_reason` porté par la ligne, et
`requires_reason` global **dérivé** des anomalies ouvertes — l'écran ne recompte pas la
règle.

**Et les catégories de motif viennent des anomalies ouvertes elles-mêmes**, non d'une
énumération inventée : le motif porte sur ce qui reste ouvert, et rien d'autre.

**La réouverture est une trace aussi lisible que la clôture.** Le motif de réouverture ne
s'efface pas à la nouvelle clôture — sans quoi une année deux fois close se lirait comme
une année close une seule fois.

### 3.6 La diplomation présente, le jury tranche

**Le bouton « Diplômé » reste offert sur un dossier NON éligible.** C'est l'indulgence que
l'article 45 donne au jury ; le motif devient alors obligatoire. Retirer le bouton aurait
retiré l'indulgence, et fait du jury un enregistreur.

**La mention est un dérivé imposé (Art. 49).** Bornes exactes, aucun arrondi, absente sous
10,00. Aucun champ ne la saisit : elle est calculée à côté de la moyenne dont elle dépend,
et l'audit l'éprouve **aux bornes et juste en dessous** (§5.5) — c'est là qu'un arrondi se
verrait, et nulle part ailleurs.

**L'attestation d'examens nationaux est un INPUT tracé.** Elle ne se déduit d'aucune note :
la condition dit qui l'a attestée et quand, ou dit qu'elle manque.

**Le constat est recalculé au moment de l'acte**, et l'écran le dit : le constat affiché
n'engage pas la décision du lendemain.

**Et aucun PDF.** Le rendu des parchemins est différé : l'acte au registre et le **numéro**
font foi. Un bouton « télécharger le diplôme » aurait promis ce qui n'existe pas.

### 3.7 Les rôles : l'écran dont le serveur n'existe pas

**`scope.kind` porte tout l'écran**, et ses quatre valeurs ne sont pas quatre nuances :
`nulle` **ferme tout** (la personne ne voit rien, et ne le sait probablement pas),
`annulee` **élargit tout** (un cumul neutralise la liaison). Leur ton diffère donc, et
« annulée » n'est pas une anomalie : c'est une liaison qui dort, **enregistrée**, et qui
reprendra effet si le cumul cesse.

⚠️ **LE PANNEAU DE DOTATION N'EST PAS PRODUIT, ET C'EST LA DÉCISION DE CET ÉCRAN.** Il
dépend entièrement de `preview_grant_effect` : les phrases « ce rôle ouvre… » et « ce cumul
annule le cloisonnement » sont **rédigées au serveur**. Les écrire dans la vue
dupliquerait la matrice des rôles, et l'écran divergerait d'elle au premier changement —
sans que personne ne s'en aperçoive, puisqu'il serait toujours plausible.

L'écran affiche donc la liste des avertissements **attendus**, marqués « accusé exigé »
quand ils le sont, et dit qu'il ne les fabrique pas. C'est moins qu'une maquette, et c'est
plus honnête qu'un panneau qui aurait l'air de marcher.

**Et l'accusé est une donnée, pas un clic** : la confirmation doit voyager jusqu'au serveur
et y être stockée, sinon elle n'aura existé que dans un navigateur.

---

## 4. Les défauts trouvés en revue

**4.1 — LE CONTRÔLE « CHAQUE FIXTURE EST ÉPROUVÉE » AURAIT REFUSÉ DU CODE JUSTE.**

Il vérifie que le nom de chaque fixture apparaît dans le script, préfixé du module qui
l'exporte : `\bfx[GPND]?\.<nom>\b`.

⚠️ **`[GPND]` est une liste manuscrite des suffixes d'alias** — G, P, N, D — c'est-à-dire
exactement la classe corrigée deux sections plus haut dans le même fichier, où la liste
des **modules** de fixtures a été remplacée par une lecture du dossier. Les deux grappes
ajoutent un sixième et un septième module, aliasés `fxC` et `fxZ` : leurs quinze fixtures
sont sondées, et le contrôle les aurait toutes déclarées **inéprouvées**.

**Quinze faux positifs, sur du code correct.** C'est le sens de panne que le relevé de la
grappe 7 nomme : « un contrôle qui ne passe pas au vert sur du code juste est aussi cassé
qu'un contrôle qui passe au vert sur du code faux ». Corrigé en `fx[A-Z]?` — le contrôle
voisin `probeOrphans` employait déjà cette forme, dans le même fichier.

**4.2 — LA MÊME RÈGLE ÉNONCÉE DEUX FOIS, DÉJÀ DIVERGENTE.**

Le premier seuil d'absence était intitulé « au-delà de dix séances » et sa légende disait
« dix séances ou plus ». Deux formulations du même seuil, et le jeu d'essai contenait une
ligne à **exactement dix séances** — donc conforme à l'une et non à l'autre.

⚠️ **C'est le contrôle ajouté cette grappe qui l'a attrapé**, en confrontant chaque ligne
au `threshold` déclaré de son bloc. Sans lui, l'écran aurait affiché une ligne « au-delà de
dix » à dix séances : indéfendable devant un étudiant, et invisible en relecture.

Corrigé en énonçant le seuil **une fois** — « dix séances ou plus » — et en dérivant le
contrôle du champ `threshold`, non d'une constante répétée.

**4.3 — J'AI FAILLI POSER UN ÉTAT QUI DIT AUTRE CHOSE QUE CE QU'IL REND.**

Le second seuil d'absence demande un ton **d'erreur** — plus grave que le premier, qui
reste ouvert. Aucune clé du vocabulaire de pastille ne portait ce sens ; `renvoyee` porte
le bon ton, et j'ai commencé à l'employer avec le libellé « À envisager ».

⚠️ **Le libellé aurait été juste à l'écran, et le code aurait menti.** C'est exactement le
défaut que l'audit garde ailleurs — un champ nommé `status` qui n'est pas un état de
pastille — pris par l'autre bout : un état de pastille employé pour ce qu'il ne dit pas.
Un relecteur aurait lu `status: 'renvoyee'` sur une ligne d'absence et cherché un renvoi
qui n'existe pas.

**Trois clés ajoutées au vocabulaire, et pas une de plus** : `a_envisager`, `non_eligible`,
`anomalie`. Chacune est un état d'objet métier qu'aucune clé existante ne dit sans mentir,
et la justification est écrite dans `StatusPill.vue`. Tout le reste réutilise le
vocabulaire avec un libellé explicite.

⚠️ **La grappe 6 avait tranché l'inverse** — `refuse` n'a pas été ajouté, le champ a été
renommé — et c'est cohérent : ce champ-là n'était pas un état d'objet. La règle n'est pas
« ne jamais ajouter » : c'est « n'ajouter que ce qui est un état, et le prouver ».

**4.4 — UNE ISSUE QUI ANNONÇAIT UN ÉCRAN NON PRODUIT, ALORS QU'IL VENAIT DE L'ÊTRE.**

L'écran A8 (« en attente d'un autre décideur ») portait, sous « Désigner un décideur », un
bandeau disant que l'écran d'attribution des rôles « appartient à la grappe 8 ». Il est
produit, et c'est la grappe 11.

Le lien mène désormais réellement à l'attribution, **avec le dossier en contexte** — sans
quoi la personne arrive sur une liste de six noms sans savoir pourquoi elle y est.

⚠️ **Et il ne pré-remplit rien.** L'écran d'attribution ne connaît pas le rôle décideur
qu'exige ce dossier : le deviner attribuerait le mauvais, et une attribution de rôle fausse
ne se répare pas par un rechargement. Le bandeau le dit en clair.

**4.5 — `roles.js` DISAIT SON STATUT EN PROSE, ET LE CONTRÔLE NE LIT PAS LA PROSE.**

Le module écrivait « AUCUN de ces points d'entrée n'existe aujourd'hui » — sans marqueur
🔴. Or le contrôle qui confronte `src/api/` au marquage du handoff est mécanique : il
cherche le caractère.

⚠️ Le défaut n'est pas cosmétique et le relevé de la grappe 7 le nomme : **c'est depuis
`src/api/` que le back-end câble**, et deux documents qui se contredisent sur le statut d'un
chemin valent moins qu'un seul, parce que le lecteur croit celui qu'il a sous les yeux. Le
marqueur est posé, et les douze chemins sont nommés dans `T5-points-d-entree.md`.

---

## 5. Ce que l'audit garde en plus

Six invariants, un par écran, tous **sur la donnée** — jamais sur le patron. C'est la
donnée qui rend un défaut possible ; un écran suivant le commettrait sans y penser.

**5.1 · La liste des candidats ne porte ni score ni rang, et suit l'ordre du registre.**
Aucun champ de gravité, et le décompte de chaque critère est dérivé de ses booléens. Le
contrôle exige de plus que le jeu d'essai contienne **un candidat à un seul critère avant
un candidat à trois** — sans ce cas, un tri par gravité passerait inaperçu.

**5.2 · Au second seuil, un premier seuil non prononcé propose encore ses deux actes.**
Éprouvé dans les deux sens : l'avertissement est proposé quand il reste dû, et **n'est pas
reproposé** quand il a été prononcé. Le contrôle exige aussi que le cas existe, et
qu'aucune ligne ne franchisse un seuil qu'elle n'atteint pas — c'est lui qui a attrapé le
§4.2.

**5.3 · Un seul type exige un constat, les manques viennent en tête, et rien ne s'envoie.**
Le contrôle balaie les clés des préconisations à la recherche de tout champ de
transmission (`transmit`, `sent`, `envoi`) : l'affichage permanent se garde par l'**absence**
de cette donnée, pas par une intention.

**5.4 · Le catalogue est restreint, et aucun code de vérification ne précède son émission.**
Dans les deux sens : une demande non émise ne porte pas de code, une demande émise en porte
un. Plus l'absence de tout champ d'exemplaire, et l'exigence qu'une demande non émettable
**dise pourquoi**.

**5.5 · Anomalies et continuations restent deux listes, et le motif se déduit des
premières.** Aucune continuation ne peut exiger de motif, toute anomalie ouverte porte un
lien vers sa liste, et le cas « clore avec motif » doit exister — sinon la branche ne
s'ouvre jamais.

**5.6 · La mention se dérive aux bornes exactes, et l'éligibilité ne décide rien.** Neuf
bornes éprouvées, dont **9,99 → aucune mention** et chaque valeur juste sous une borne. Plus
l'exigence qu'un dossier **non éligible et non décidé** existe : sans lui, la souveraineté
du jury n'est jamais montrée à l'œuvre.

**5.7 · Les quatre portées existent, chacune avec sa raison, et l'annulée garde sa
filière.** Perdre le programme sur `annulee` ferait de la réversibilité une promesse sans
donnée. Et tout avertissement acquitté au journal doit exister au vocabulaire des
avertissements.

---

## 6. Ce qui manque, nommé

**Le vocabulaire réglementaire des actes.** Aucun acte de ces quatre domaines n'est branché,
et ce n'est pas seulement parce que les chemins manquent : les **catégories de motif**
n'ont aucune source lue — les cinq types de préconisation sont déduits d'une maquette, les
verdicts de constat aussi, et les catégories de refus de document également. Inventer un
motif est pire qu'inventer un chemin : un chemin faux ne résout pas, **un motif faux
s'enregistre**.

**`preview_grant_effect`.** Le point d'entrée qui décide de tout l'écran des rôles. Sans
lui, pas de panneau de dotation — voir §3.7.

**L'espace étudiant des documents.** L'écran N6 du lot 7 est une surface **étudiante** : la
demande, la liste des demandes, le motif de refus lisible. Elle appartient au self-service,
non à cette application. La file de gestion (N7) porte les mêmes contraintes vues de
l'autre côté, et c'est elle qui est produite ici. **À confirmer : l'écran N6 me revient-il ?**

**Le canal de demande d'un diplômé hors délai.** Le lot 5 (écran 6, au terme des 365 jours)
donne une adresse et un téléphone, et dit qu'aucune surface ne permet la demande écrite.
Ce trou est **inchangé** : la file de documents de cette grappe ne le couvre pas, puisqu'elle
suppose un espace étudiant ouvert.

**Le détail des absences par module.** Affiché comme information (« 12 séances / 5 mod. »)
en N8 et N11. Cette répartition est-elle exposée telle quelle, ou faut-il la reconstituer
depuis les présences ? La question du lot 7 n'est pas tranchée.

**La justification après coup.** Un justificatif accepté fait repasser un étudiant sous le
seuil. L'écran affirme qu'un avertissement déjà prononcé **subsiste** et se retire par un
acte motivé du directeur des études. À confirmer au métier : c'est la seule affirmation de
ces écrans qui n'est adossée ni à une lecture, ni à une maquette.

---

## 7. Ce qui a tourné, et sous quel exécutant

**Ce que j'ai exécuté** — mon bac à sable JavaScript :

- analyse syntaxique des sept modules de fixtures, des quatre nouveaux modules d'appel, des
  huit nouveaux blocs `<script setup>` et de `audit.mjs` ;
- **les quinze fixtures des deux nouveaux modules**, toutes appelées, plus leurs deux
  dérivations (`needsFinding`, `actsFor`) et le dérivé de mention (`mentionOf`) ;
- **les six invariants du §5**, chacun éprouvé dans les deux sens : le défaut est signalé,
  et le jeu d'essai intact ne produit aucun faux positif ;
- **les bornes de mention**, aux neuf valeurs du §5.6 ;
- **les props passées aux composants** contre leur `defineProps` : aucune inventée dans les
  huit vues ;
- **les statuts employés** contre les clés de pastille, après l'ajout des trois du §4.3 ;
- **les noms de route** employés dans les huit vues contre `nav.js` ;
- **les chemins appelés** contre la table du simulacre : dix handlers pour dix lectures ;
- **les noms d'export** des seize modules d'appel : aucun partagé ;
- **le sens code → handoff** : les vingt-six chemins 🔴 des quatre modules marqués sont
  nommés au §2 de ce relevé et dans `T5-points-d-entree.md`.

**Ce qui n'a pas tourné** — `npm run audit` (aucun `npm` disponible : c'est la même réserve
qu'à chaque grappe, et elle vaut aussi pour les six contrôles ajoutés), `npm run dev`, et
les trois bascules `?simulate=denied|error|empty`.

**Ce qu'aucun des deux ne verra** :

⚠️ **Si le bouton grisé de la séance se lit comme une explication ou comme une panne.**
C'est l'enjeu de forme de cette grappe, et c'est le seul endroit du dépôt où l'on déroge à
la règle 3. Si un utilisateur le lit comme une panne, la dérogation ne valait rien et le
bouton doit disparaître.

⚠️ **Si les deux panneaux de la clôture se lisent comme deux listes ou comme une liste
coupée en deux.** Toute la conception de cet écran tient là : si un lecteur cherche un
motif pour une continuation, la séparation n'a pas été vue.

---

## 8. Ce qui reste

**Produit** : les quatre écrans du conseil pédagogique (candidats, séance, préconisations,
seuils d'absence), la file des documents avec son catalogue restreint, la clôture d'année
avec ses deux panneaux, la diplomation (conditions présentées, jury, mention dérivée,
émission au registre), l'attribution des rôles (portées, anomalies, journal,
avertissements attendus).

**Vingt-une pages déclarées, vingt-une produites.** Aucune entrée de navigation ne mène
plus à `PendingView` — et le composant reste, parce qu'il porte la distinction qui a
structuré ce chantier : **un écran absent, un écran vide et un écran refusé sont trois
choses différentes.**

**Non produit, et pourquoi** :

- **tous les actes**, faute de vocabulaire de motif lu (§6) ;
- **le panneau de dotation des rôles**, faute de `preview_grant_effect` (§3.7) ;
- **le panneau d'ajout d'une préconisation en séance** : même cause — les cinq types sont
  déduits d'une maquette, et leurs champs ne sont pas lus. La séance dit combien de
  préconisations portent sur l'étudiant, et renvoie à la liste de l'année ;
- **l'écran N6** (demande d'un relevé, côté étudiant) : self-service, à confirmer.
