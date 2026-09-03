# Relevé — grappe 5 : planning et examens

Ce que la production a fait apparaître, et ce que la lecture du code serveur a corrigé au-delà de la
grappe demandée.

---

## 1. Ce que j'ai changé de méthode, et ce que ça a trouvé

Le mandat disait : « n'inventez plus de nom, demandez la liste des fonctions exposées ». J'ai fait
mieux et pire à la fois — je suis allé **lire les modules**, ce qui a donné les noms justes, mais m'a
aussi montré ce qu'une liste de noms n'aurait pas montré.

**Une liste de noms aurait donné les noms. Elle n'aurait pas donné les SURFACES.**

C'est la découverte principale, et elle déborde la grappe 5 : `portal_app/api/academic/` contient des
surfaces MINCES — treize points pour les groupes, onze pour le planning, sept pour les examens,
trente-deux pour la structure — dont chaque docstring dit où vivent les gardes. La grappe 4 appelait
`education.education.api.get_student_group_students` : une **vraie fonction**, du vendor, hors de ces
surfaces. Elle marche, et elle marche **sous les gardes de personne** — ni scope par filière, ni garde
de rôle.

D'où une quatrième classe de faux chemin, ajoutée au manifeste :

| Classe | Exemple rencontré |
|---|---|
| nom inventé | `…api.planning.week_sessions` (grappe 1) |
| nom nu, sans module | `list_programs`, `get_ue` (grappe 2) |
| nom presque juste | `detach_module_to_ue` au lieu de `detach_module_from_ue` |
| **bon nom, mauvais niveau** | `education.*` au lieu de `portal_app.api.academic.groups.*` |

La troisième mérite un mot : **une préposition**. `to` au lieu de `from`. C'est la classe des
soixante-huit homonymes du branchement — assez juste pour se relire sans alerter, assez faux pour ne
pas résoudre. Détacher un module d'une unité aurait échoué en silence.

---

## 2. Ce que la relecture a corrigé hors de la grappe 5

Je n'avais pas prévu de rouvrir les grappes 2 et 4. La lecture des modules l'a imposé.

**Grappe 2 — tous les chemins étaient nus.** `list_programs`, `get_ue`, `propose_maquette` : les
fonctions existent dans `academic/structure.py`, préfixées `portal_app.api.academic.structure.`. Sans
le module, l'appel ne résout pas — même faute qu'un nom inventé, avec l'illusion d'avoir vérifié.
Et en relisant pour préfixer, j'ai trouvé le nom faux (`detach_module_to_ue`) et deux fonctions que je
ne connaissais pas : `get_module`, `get_ue_shared_programs`, `list_structure_options`.

**Grappe 4 — trois appels là où il en faut un.** `get_group(name)` rend le groupe **avec** ses membres
et ses enseignants. Ma version appelait trois points d'entrée séparés : règle 6 appliquée au contrat,
trois lectures du même ensemble divergeraient, et l'effectif d'en-tête aurait cessé de s'accorder avec
la liste en dessous. Le serveur donne les trois ensemble, et `active_count` y est **sommé** sur
`students`.

**Grappe 4 — la reprise était exposée.** `enrollment_mgmt.replay_enrollment(integration_log)`. La
docstring de la fonction interne disait vrai — « la garde de rôle vit chez l'appelant (portal_app
enrollment_mgmt) » — et cet appelant est whitelisté. Je n'avais pas cherché du bon côté. Le bouton est
branché.

**Grappe 4 — la vue d'effectifs existait.** `get_cohort_overview(program, academic_year,
academic_term)`, effectifs par type, tronc commun compris. Un seul appel, comme annoncé.

**Grappe 4 — les orphelins étaient plus larges que leur source.** Le point d'entrée réel,
`list_moodle_orphans`, ne connaît que les orphelins de la plateforme d'apprentissage. L'écran en
affichait deux natures ; la seconde — un étudiant sans groupe — n'a **aucune source lue**. Elle
redevient un manque nommé plutôt qu'un affichage adossé à rien.

**Grappe 1 — l'atelier interrogeait un contrat fantôme.** `…api.planning.week_sessions` n'existe pas.
L'atelier lit maintenant le **même** point d'entrée que l'écran de planning : un atelier qui interroge
un contrat différent de l'écran ne prouve rien sur l'écran.

**Le bouchon de filière est retiré partout.** Il portait un nom de filière écrit en dur, envoyé à un
vrai point d'entrée — de la même famille qu'un chemin inventé. La source est double, comme vous l'avez
dit : la portée du lecteur (`scope.program`) quand elle est fixée, `list_structure_options()` sinon.
`useProgramScope` porte les deux, et le sélecteur affiche un **libellé** quand la portée est
verrouillée — jamais un sélecteur grisé, ce qui serait la règle 3 prise à l'envers : offrir des choix
que le serveur refusera en fail-closed.

---

## 3. Les contraintes de la grappe, et où elles vivent

Aucune n'est portée par une convention d'écran. Toutes ont une assise dans le modèle.

### 3.1 L'enseignant est proposé PAR TYPE D'ACTIVITÉ, provenance visible

`create_schedule` appelle `suggested_instructor_for(course, group,
activity_type=custom_session_type)` quand aucun enseignant n'est fourni, et rend `instructor_source`.
La séance de travaux dirigés reçoit l'enseignant des travaux dirigés.

**Et la provenance est DÉRIVÉE, jamais stockée.** `get_schedule` la recalcule à chaque lecture via
`service_source_for_session()` — « même après remplacement : toujours vraie ». L'écran n'a donc rien à
déduire, rien à mémoriser, et rien ne peut se désynchroniser.

⚠️ **Trois issues, et la troisième n'est pas la deuxième :**

| Valeur | Ce que l'écran dit |
|---|---|
| `répartition` | « proposé par la répartition » |
| `choisi` | « choisi au planning », avec le nom de celui que la ligne nommait |
| `null` | « aucune ligne de service — personne n'a été contourné » |

C'est une décision de cet écran, et elle compte : confondre les deux dernières **accuse un
planificateur d'un écart qui n'existe pas**. Une séance sans ligne de service n'est pas un
contournement, c'est un manque de répartition — et l'écran le dit dans ces mots.

### 3.2 Une séance annulée reste publiée

Ce n'est pas une convention : `custom_status` et `custom_planning_status` sont **deux champs
indépendants**, et `set_schedule_status` ne touche que le premier. Annuler ne dépublie pas.

L'écran porte donc **deux pastilles**, jamais une — « Séance : Annulé » et « Publication : Publié » —
et un encart qui dit pourquoi : retirer la séance de l'emploi du temps des étudiants effacerait la
trace de l'annulation.

Sur la grille, l'annulation prime dans le **ton** — c'est ce qu'on doit voir d'un coup d'œil — mais le
panneau écrit les deux en clair. Le ton résume ; il ne remplace pas.

### 3.3 Inscrire n'est pas convoquer

Les sept points d'`exam_mgmt` composent la liste des candidats. La convocation naît de la
**publication**. L'écran l'écrit sous chaque épreuve non publiée : « la liste se compose avant
publication — inscrire ne convoque personne ».

### 3.4 Les travaux pratiques sont hors types d'épreuve

Un TP se publie comme un cours, sans préavis. Le préavis ne concerne que les épreuves, il vaut pour
**les quatre types** — écrit, pratique, mixte, autre : le type est une information au registre, pas un
régime — et il **mord par séance**, pas par lot.

Et `list_tp_requalification_candidates` existe : lecture seule, geste de runbook. « Le système
présente les INDICES » — il ne requalifie rien seul, et l'écran ne suggère pas qu'il le ferait.

---

## 4. Les décisions de cet écran

**Le vide de la grille a deux causes, et le serveur ne les distingue pas.** Le scope par filière est
« fail-closed SILENCIEUX en liste : rend `[]` sans erreur ». Une semaine hors périmètre se lit donc
exactement comme une semaine vide. Le message d'état nomme les deux — sinon un responsable de
formation croit sa semaine vide alors qu'il regarde la filière d'un autre. C'est le vide crédible,
troisième occurrence.

**La dérogation commande le champ de motif, pas le bouton.** `publish:planning` et
`derogate:planning` sont deux clés parce que l'acteur change au milieu du geste : un gestionnaire
académique publie, seul le directeur des études déroge. L'écran rend donc le bouton de publication à
qui publie, et le champ de motif à qui déroge — avec, pour l'autre, la phrase qui dit à qui demander.

**Le rapport de publication vient du serveur, l'écran ne le fabrique pas.** `retry_ids` ne contient
que les rejouables ; le bouton de reprise ne propose donc pas de tout réessayer. Un introuvable
restera introuvable, et le dire coûte moins qu'un utilisateur qui clique trois fois.

---

## 5. Les défauts trouvés en revue, et ce qu'ils partagent

Tous trouvés en **relisant mon propre code**, pas par un exécutant.

**5.1 — Un jeu d'essai cohérent n'est pas un jeu d'essai suffisant.** Deux fois dans cette grappe.

En réécrivant les fixtures de groupes autour d'une table unique, le groupe au-delà de sa capacité est
passé de dix-huit membres pour seize à **deux membres pour seize**. Les invariants tenaient toujours —
l'effectif s'accordait parfaitement — mais **la branche « au-delà de la capacité » ne s'ouvrait
plus**. L'écran passait pour correct sans l'avoir montré.

Puis, en écrivant les fixtures de planning : toutes les séances en brouillon étaient des cours et des
TP. La publication passait donc **entièrement**, et la branche du préavis — celle qui porte tout
l'intérêt du rapport de masse — ne s'ouvrait jamais. Une épreuve en brouillon a été ajoutée.

C'est une classe distincte de la règle 4 : un nombre dérivé qui se calcule reste juste, mais **un cas
qui disparaît d'un jeu d'essai ne se signale pas**. D'où les contrôles d'audit du §6.

**5.2 — Le point d'entrée le plus important n'était pas dans le simulacre.** Les fixtures étaient
listées à la main dans `audit.mjs` : la grappe 4 avait mis les siennes dans un second module, la
grappe 5 en ajoute un troisième, et rien n'aurait signalé son absence. **La liste vient maintenant du
dossier** — quatrième fois que la règle 6 mord dans ce fichier, et cette fois la cause est retirée,
pas corrigée.

**5.3 — Un `const` de haut niveau qui lisait une table déclarée plus bas.** Déjà rencontré à la
grappe 3, réapparu ici : `SERVICE_GROUPS` évalué au chargement du module, appelant `teacherEngaged()`.
Rendu paresseux. Le §2 de l'audit — importer le module pour de vrai plutôt que le lire — est ce qui
l'attrape.

**5.4 — Une collision de noms de haut niveau dans l'audit lui-même.** `declared` déclaré deux fois,
et le script ne parsait plus. Trouvé en le faisant parser, ce qui est le premier contrôle qu'il
applique aux autres fichiers — et qu'il ne s'appliquait pas à lui-même avant que je le lance.

**5.5 — Un `div` ouvert sans être fermé**, dans l'en-tête des groupes, en insérant le sélecteur de
filière. Trouvé par le contrôle de balises. Sans lui, l'écran se serait rendu de travers.

**5.6 — Ma sonde de vérification était fausse, quatre fois.** Une fois en cherchant `week_sessions`
dans un fichier où le seul résidu était le **commentaire qui documente sa suppression** ; une fois en
cherchant `readdirSync` dans les vingt premières lignes d'un fichier où l'import est à la ligne 27 ;
deux fois en évaluant les arguments d'une sonde — `('INF-204', 'TD')` lu comme un **opérateur
virgule**, donc un seul argument passé, donc `null` rendu, donc « sonde muette » sur deux fonctions
parfaitement justes.

Les quatre ont crié au défaut sur du code correct. C'est la règle 9 dans le sens qui gêne : **un
verdict n'appartient qu'à ce qui a tourné, y compris quand il accuse** — et une sonde se vérifie avant
d'être crue. La correction, les deux dernières fois, a été d'évaluer l'expression de la sonde **telle
qu'écrite** dans son environnement, au lieu de la découper à l'expression régulière. Une sonde qui
réinterprète ce qu'elle lit finit par mesurer sa propre réinterprétation.

**5.7 — Et mes renommages ont laissé quinze fixtures hors des sondes.** En réécrivant les fixtures de
groupes contre la surface réelle, j'ai renommé six exports — et la grappe 5 en ajoutait onze. Le
contrôle « chaque fixture est éprouvée », ajouté à la grappe 4 précisément pour cette classe, les a
tous signalés. C'est la première fois qu'un contrôle écrit à une grappe attrape un défaut de la
suivante — la seule preuve qui compte qu'il servait à quelque chose.

**5.8 — Et j'ai périmé un compte moi-même, dans l'édition qui précède.** Le titre de ce §5 annonçait
« six défauts » ; en ajoutant le 5.7 ci-dessus, je l'ai rendu faux sans faire suivre le titre. C'est la
troisième occurrence de la règle 8, et la pire : les deux premières étaient des comptes hérités qui se
sont périmés tout seuls, celle-là je l'ai écrite.

La règle gagne donc la distinction qui lui manquait : un compte **résultat d'une mesure** se garde —
« quarante exports », « douze séances » : le lecteur ne les a pas sous les yeux et le chiffre EST
l'information. Un compte qui **numérote une liste imprimée juste en dessous** se retire. Un ensemble
**clos par nature** se garde — « deux statuts » quand le modèle a exactement deux champs.

⚠️ Et le balayage a trouvé un quatrième cas, dans le relevé de la grappe 3 : « les quatre points
d'entrée de N2 et N3 » pour deux — un compte **déjà signalé comme faux** dans un relevé postérieur, et
jamais corrigé **à sa source**. Nommer un défaut ne le corrige pas là où il vit.

---

## 6. Ce que l'audit garde en plus

Les contrôles neufs, tous nés des défauts ci-dessus.

- **les deux statuts sont indépendants, et les cas le prouvent** — l'audit exige que le jeu d'essai
  contienne une séance annulée ET publiée, une modifiée, et un brouillon. C'est le contrôle qui
  attrape la classe du §5.1 : un cas qui disparaît d'un jeu d'essai ne se signale pas de lui-même ;

- **les trois provenances sont représentées** — `répartition`, `choisi`, et `null`. Sans le troisième
  cas dans les fixtures, la distinction que l'écran revendique n'est jamais montrée ;

- **la provenance se recalcule et suit le remplacement** — l'audit la recalcule pour chaque séance et
  vérifie qu'un remplacement bascule bien vers « choisi ». C'est la garantie qu'elle est dérivée et
  non stockée ;

- **le préavis mord par séance, et pas sur les TP** — au moins une séance retenue, au moins une
  publiée, aucun TP retenu, `retry_ids` sans non-rejouable, et `ok + ko = total` ;

- **le sommaire de module se déduit, et tait les types sans allocation** — `heures_totales` égale la
  somme des types, chaque reste-à-planifier se déduit de ses deux termes, et aucun type à zéro
  n'apparaît ;

- **tout chemin appelé par une vue a un handler** — et le contrôle porte sur ce qu'une vue **appelle**,
  non sur ce qu'un module d'appel **déclare**. La distinction est le cœur du sujet : les modules de
  `src/api/` sont le manifeste, ils nomment quarante-deux points d'entrée réels qu'aucun écran ne
  consomme encore. Exiger un handler pour chacun ferait échouer l'audit sur des déclarations légitimes
  — et ce serait la **quatrième fois** que j'écris un contrôle qui interdit le juste.

⚠️ **Cette quatrième fois n'a pas eu lieu, et c'est le seul progrès de méthode que je revendique
ici** : j'ai écrit le contrôle sur « appelé », pas sur « déclaré », en me souvenant des trois
précédents. Les trois autres — l'acte d'écriture, la fixture éprouvée, la clé de contexte — avaient
tous dû être corrigés après coup.

---

## 7. Ce qui a tourné, et sous quel exécutant

**Ce que j'ai exécuté** — un bac à sable JavaScript, dans mon environnement. Il charge les modules en
retirant leurs `import` et en réinjectant les dépendances à la main :

- analyse syntaxique des modules et de chaque bloc `<script setup>`, plus `audit.mjs` lui-même ;
- équilibre des balises de tous les patrons ;
- **imports morts** : chaque symbole importé d'un module d'appel existe-t-il ;
- **appels sans handler** : chaque chemin qu'une vue appelle a-t-il un handler ;
- **fixtures éprouvées** : les trois modules dérivés du dossier, quarante exports appelables, chacun
  atteint par une sonde ou une section — et les trente-huit sondes évaluées telles qu'écrites ;
- les invariants de groupes — liste, détail et vue de cohortes s'accordent sur chaque effectif, et le
  groupe au-delà de sa capacité l'est vraiment (dix-huit pour seize) ;
- les contrôles de planning du §6, sur les douze séances du jeu d'essai ;
- la publication : trois séances publiées, une épreuve retenue par le préavis, aucun TP retenu,
  `retry_ids` réduit au rejouable, et la dérogation qui laisse tout passer ;
- les conflits sur les trois axes, dont un enseignant cross-filière marqué hors périmètre.

**Ce qui n'a pas tourné** — `npm run audit` avec ses contrôles neufs, `npm install`,
`npm run dev`, les trois bascules. Le script d'audit **est passé à son premier passage réel** chez
vous, mais les sections ajoutées depuis n'ont jamais été exécutées **par lui** : elles ont été
reproduites dans mon bac à sable, ce qui n'est pas la même chose. Traitez-les comme du code neuf.

**Ce qu'aucun des deux ne verra** — le rendu, les demi-heures à l'écran, la lisibilité de deux
pastilles côte à côte, et la question que seule une vraie grille tranchera : est-ce que
`step: 0.5` sur dix heures produit une grille lisible en 1280 px, ou faut-il un pas visuel plus large
que le pas réel.

---

## 8. Ce qui reste de la grappe 5

**Produit** : l'écran de planning — grille de la semaine, détail d'une séance avec ses deux statuts et
sa provenance, publication en masse avec rapport et dérogation, liste des épreuves.

**Non produit, et pourquoi :**

**La création et la modification d'une séance.** Les points d'entrée sont lus et nommés
(`create_schedule`, `update_schedule`, `set_schedule_status`), mais le formulaire de séance demande
plus qu'un contrat : la liste des salles, celle des créneaux valides, et la vue de conflits appelée
**pendant** la saisie. Les boutons existent et disent qu'ils ne sont pas branchés.

**La grille de requalification des TP.** Lecture seule, geste de runbook : elle a sa fixture et son
point d'entrée, pas son écran. Elle appartient plutôt à un outil d'administration qu'au planning
courant — à trancher.

**Les écrans d'examen.** `exam_mgmt` est entièrement nommé ; l'écran de planning n'en montre que la
liste. Composer la liste des candidats, la peupler depuis un groupe, la publier : c'est un écran
complet, et il mérite d'être demandé plutôt que deviné — notamment parce que « inscrire n'est pas
convoquer » y sera la phrase centrale.

**Un manque nommé, et il est net** : `get_schedule` doit rendre **l'enseignant que la répartition
proposait**, à côté de la provenance. Aujourd'hui `instructor_service_source` dit qu'il y a eu
contournement, pas QUI a été contourné — et l'écran porte une table de correspondance en dur, marquée
comme pis-aller. Elle divergera de la répartition dès la première modification de ligne : règle 6,
deux listes du même ensemble. C'est le seul provisoire que cette grappe ajoute, et il est tracé pour
être retiré.
