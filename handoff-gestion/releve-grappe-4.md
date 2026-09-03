# Relevé — grappe 4 · groupes et inscriptions

---

## 1. Les quatre pièces reversées, avant toute ligne

Appliquées d'abord, comme demandé — la grappe 4 aurait hérité des deux défauts.

| Pièce | Ce qui a changé |
|---|---|
| Point de montage | `main.js` monte sur `#gestion-app` |
| Chemin des polices | `/assets/portal_app/emela/fonts/inter/` — le chemin servi, partagé |
| Jeton de sécurité | `client.js` joint `X-Frappe-CSRF-Token` sur tout appel |
| Configuration de construction | le greffon qui émet `manifest.json`, avec `enforce: 'post'` |

**Et une cinquième, que personne n'avait signalée.** `index.html` — celui du développement — portait
encore `id="app"`. Le corriger côté production seulement aurait cassé `npm run dev` là où la
production marche : le même défaut, pris par l'autre bout. Un seul nom, aux deux endroits.

### 1.1 La section d'audit que ces défauts méritaient

Vous écrivez qu'aucun audit n'aurait pu trouver le point de montage : le code était correct, le
contrat était correct, seule leur **rencontre** ne l'était pas. C'est juste — et c'est exactement ce
qu'une section peut confronter maintenant que le contrat est connu. `audit.mjs` gagne **§7 bis ·
Contrat d'artefact**, qui vérifie quatre accords :

- le point de montage de `main.js` existe dans l'`index.html` de développement ;
- les polices visent un chemin **servi** (`/assets/…`), pas un chemin de développement ;
- la construction émet `manifest.json`, et porte `enforce: 'post'` — sans quoi le CSS en sort vide ;
- le point d'appel joint le jeton de sécurité.

⚠️ **Elle ne remplace pas le branchement** : le shell serveur n'est pas ici, et les deux défauts qui
ont attendu un navigateur l'ont attendu à bon droit. Mais un désaccord entre deux fichiers du dépôt se
lit hors ligne, et c'était le cas de trois des cinq.

---

## 2. Le mur des noms — ce que j'ai changé de méthode

Quatre-vingt-seize appels contre quatre cent trente-quatre fonctions, zéro correspondance exacte. Ma
légende disait « je n'ai pas vérifié » ; elle était honnête et inutile.

**Je n'ai pas demandé la liste : je suis allé la lire.** Le code serveur est monté, et
`@frappe.whitelist()` est cherchable. Pour cette grappe, chaque nom d'appel porte **le fichier et la
ligne** où je l'ai lu — c'est dans `api/groups.js`, en commentaire de chaque export.

**Cinq fonctions réelles, lues :**

| Fonction | Lue dans |
|---|---|
| `education.education.doctype.student_group.student_group.get_students` | `student_group.py:98` |
| `education.education.api.get_student_group_students` | `api.py:176` |
| `education.education.api.get_instructors` | `api.py:503` |
| `education.education.api.get_current_enrollment` | `api.py:473` |
| `emela_core.academic_core.api.enrollment.create_student_from_applicant` | `enrollment.py:57` |

**Et une distinction que j'aurais manquée sans lire.** Les outils de peuplement et de création de
groupes — `ProgramEnrollmentTool.get_students`, `.enroll_students`,
`StudentGroupCreationTool.create_student_groups` — sont décorés `@frappe.whitelist()` **mais sont des
méthodes de document**. Elles ne s'appellent pas par leur chemin : ce sont des documents-outils qu'on
remplit, puis dont on invoque une méthode. Écrites comme des fonctions libres, elles auraient produit
cinq chemins faux de plus. C'est noté en tête de `api/groups.js`.

### 2.1 Une signature qui n'aurait pas pardonné l'invention

`get_students(academic_year, group_based_on, academic_term=None, program=None, batch=None,
student_category=None, course=None)` — **les deux premiers sont obligatoires**. Un appel qui passe
seulement `program` lève côté serveur. L'écran passe les trois qu'il a.

⚠️ Et un détail qui change le traitement du vide : quand rien ne correspond, cette fonction fait un
`msgprint` **et** rend `[]`. Le front ne doit donc pas lire une liste vide comme une erreur — c'est un
état vide, avec sa propre phrase.

---

## 3. Ce qui manque, nommé

**`replay_enrollment_from_log(log_name)` existe et n'est pas exposée.**
`emela_core/academic_core/api/enrollment.py:830`. Elle fait exactement ce que l'écran de reprise
demande — rejouer une inscription partielle en réutilisant l'étudiant déjà créé, sans duplication —
et sa docstring dit pourquoi elle n'est pas décorée : « la garde de rôle vit chez l'appelant
(portal_app enrollment_mgmt) ».

**Je ne l'ai pas inventée en appel.** L'écran de reprise est produit, son bouton nomme le manque et
précise que rien n'a été rejoué. Ce qu'il faut : l'exposer avec sa garde, **ou** me donner le chemin de
l'appelant qui la porte déjà — les deux me vont, l'invention non.

Même situation pour `run_pedagogical_enrollment_for_student(student_name)` (ligne 769) — la reprise de
la seule partie pédagogique.

**Trois lectures de liste sans fonction métier.** Les groupes, les journaux à reprendre, les
orphelins : ce sont des listes de documents (`Student Group`, `Integration Log`), pas des points
d'entrée. Leurs noms courts ne prétendent à aucun chemin serveur, et le manifeste les porte comme
tels. Si une mécanique de liste générique existe, c'est elle qu'il faut me nommer.

**Ce qu'il me faut** : lire un `Integration Log` par son nom — étape, statut, motif — **sans rien
exécuter**. Nommé `get_enrollment_log` côté front. Ce n'est pas un confort : sans lui, un écran qui
veut montrer un rapport n'a d'autre choix que de **rejouer la cascade**, et c'est le défaut le plus
grave de cette grappe (§6.5).

**La filière n'a pas de source, et cet écran en a besoin.** Le lot 1 a tranché qu'elle est un *filtre
d'écran*, non un contexte : le bandeau n'en porte donc pas. Mais l'écran des groupes l'envoie à un
vrai point d'entrée comme paramètre `program`. La constante est un bouchon **nommé comme tel** dans
le code (`PROGRAM_A_TRANCHER`) — un nom de filière inventé envoyé à un appel réel est de la même
famille qu'un chemin inventé. Il me faut soit la liste des filières du lecteur, soit l'accord pour
poser un sélecteur de filière sur cet écran.

**Un groupe est-il annuel ou semestriel ?** L'écran ne transmet pas `academic_term` à
`get_students`, avec son motif : une inscription au programme est annuelle, et filtrer un objet annuel
par un semestre ne rendrait rien — donc `[]`, donc un vide crédible. Si un groupe peut être
semestriel, il faut me le dire : c'est un paramètre à ajouter, pas à essayer.

**Le badge d'accès n'a aucune trace côté serveur** — voir §4. L'écran le dit parce que rien d'autre ne
le dirait ; mais si un point d'entrée existe pour le signaler au service compétent, je le veux.

---

## 4. Les contraintes de la grappe, portées à l'écran

### T2 · L'inscription ne crée pas le badge

Un encart ambre **attaché au rapport**, pas une note de bas de page :

> L'inscription ne crée pas le badge d'accès. Nadia Gbaguidi est inscrite et dispose de ses cours,
> mais elle ne franchira aucun portique tant que le badge n'a pas été émis par le service compétent.

Et la raison d'être de la phrase est écrite avec elle : *ce n'est pas un défaut de cette cascade — le
badge n'en fait pas partie ; c'est écrit ici parce que rien d'autre ne le dirait, et qu'un étudiant
qu'on croit opérationnel se présente au cours.*

### Le refus disciplinaire · expliqué, pas affiché comme une erreur

Le cas est montré **à côté** du rapport ordinaire, pas à sa place : un gestionnaire doit reconnaître la
différence entre « la cascade s'est arrêtée » et « la règle l'a interdit ».

Le rapport nomme l'acte, la catégorie et les dates — « suspension du 12 au 26 février, reprise dès le
27 » — et **jamais les faits** : le motif de la sanction reste dans son dossier. Sous le rapport, une
phrase dit qu'il n'y a pas de défaut à corriger.

---

## 5. Les décisions de cet écran

**Un étudiant désactivé reste membre du groupe.** Il a produit des présences et des notes ; le masquer
ferait disparaître son historique. Il est affiché avec sa pastille, jamais retiré en silence — et
`get_student_group_students` porte justement `include_inactive` pour cela.

**Un effectif au-delà de la capacité est signalé, jamais refusé.** Le serveur l'accepte, et c'est
parfois voulu. Mais l'écran dit ce que le dépassement provoque : *c'est la cause la plus fréquente d'un
étudiant inscrit sans groupe* — avec le lien vers les orphelins. Un signal qui nomme sa conséquence
vaut mieux qu'un signal qui compte.

**Les orphelins sont deux natures dans une liste, chacune nommée.** Un étudiant sans groupe n'apparaît
à aucune feuille de présence ; un groupe sans enseignant n'a aucun titulaire de présence. Ni l'un ni
l'autre n'est une erreur — les deux sont des trous que personne ne voit sans cette liste.

---

## 6. Les défauts trouvés en revue, et ce qu'ils partagent

La plupart sont des classes déjà nommées dans les relevés précédents. Les avoir reproduites dans une
grappe neuve dit quelque chose : **une règle écrite ne se transporte pas toute seule d'un domaine à
l'autre** — et plusieurs de ces défauts ont été créés par le correctif du précédent.

**Le contrôle handler ↔ fixture était aveugle à toute la grappe 4.** Il lisait `F.<nom>` contre un seul
module de fixtures ; les handlers du second module — celui que cette grappe ajoute — n'étaient ni
appariés par l'expression, ni cherchés dans les exports. Le contrôle ajouté *parce qu'une réécriture
avait supprimé des fixtures* n’en couvrait qu’une partie — le dénominateur a grandi depuis, ce qui est
exactement pourquoi il ne s’écrit plus. Corrigé : les deux modules
sont importés, l'expression apparie `[A-Z].<nom>`, et les handlers du second module sont sondés.
**C'est la règle 5 — chercher partout — appliquée à un contrôle, pas à du code.**

**Un bouton primaire muet, sur l'écran qui dit que l'acte est impossible.** `BatchReport` rendait
« Reprendre les 2 en échec » dès qu'une ligne échouait, sans que la vue branche l'événement — et
l'onglet voisin explique que la reprise n'est pas exposée. Le composant gagne `retryable`, faux quand
aucun chemin n'existe : le bouton n'est pas rendu, jamais rendu puis inerte.

**L'onglet du rapport n'avait pas de branche d'état** : sur un vide, une erreur ou un refus, la zone
restait blanche — **et le signalement du badge disparaissait avec elle**, qui est la raison d'être de
cet onglet. Un `BlockState` a été ajouté, comme les deux autres onglets en portaient.

**Deux vocabulaires de pastille, dont un qui n'existait pas.** `WorkQueue` passe le `status` de chaque
objet **directement** à la pastille ; la file employait les mots de son propre contrat — `warn`, `err`,
`draft`, `ok`. Aucun n'est une clé de pastille : tous retombaient en gris neutre, et trois lignes de
groupe affichaient littéralement **« ok »**. Le défaut ne datait pas de cette grappe : il courait
depuis la grappe 1.

**Un seul vocabulaire désormais**, celui de la pastille, et le manifeste §1.3 le dit à la place de
l'ancienne énumération. L'audit le garde. Et le champ qui n'était pas une pastille a été **renommé** :
le résultat d'une cascade s'appelle `outcome`, non `status` — le nommer `status` le faisait ressembler
à une clé de ton, assez pour tromper un contrôle, donc assez pour tromper un lecteur.

**Deux sources pour le refus disciplinaire, avec deux formulations.** La fixture portait le cas, et la
vue en portait une seconde copie en dur — la règle 6, créée dans le tour même où je la citais. La vue
charge maintenant le refus depuis la fixture ; la copie est supprimée.

### 6.1 Ce que l'audit garde en plus

- **tout statut employé est une clé de pastille** — avec deux vocabulaires voisins exclus
  **nommément**, pas par tolérance : les lignes du contrat de rapport (`ok` / `ko`) et les étapes du
  fil de procédure (`done` / `now`). Ce qui n'est pas une pastille ne doit pas s'appeler `status` ;
- **aucune vue ne fabrique la VALEUR d'une clé de contexte** — les clés sont lues dans la composable,
  et le contrôle vérifie d'abord sa propre extraction ; il vise la valeur, non le nom, sinon il
  interdirait le mapping légitime vers un autre contrat (§6.3) ;
- **chaque handler pointe sur une fixture existante** — sur l'**union** des modules de fixtures, plus
  seulement le premier ;
- **chaque fixture exportée est éprouvée** — voir §6.9 « ce que l’audit garde », qui le décrit une fois. Cette section ne
  réénumère pas les gardes : deux listes du même ensemble divergeraient, et celle-ci avait déjà
  divergé.

### 6.2 Un défaut silencieux : deux valeurs sous un même nom

`academic_year` portait **deux valeurs différentes sous le même nom**. La composable envoie
l'identifiant (`AY-2026`) ; l'écran des groupes refabriquait la clé avec le **libellé** (`2026-2027`),
juste sous un commentaire qui dit « une vue ne fabrique pas ces clés ».

**Ce qui le rend pire qu'une erreur** : `student_group.get_students` rend `[]` quand rien ne
correspond. Au branchement, le panneau « Peupler depuis les inscriptions » aurait donc affiché
« Aucun étudiant éligible » — un état vide parfaitement crédible, avec sa phrase rassurante, **sur
l'écran qui écrit**. Personne ne l'aurait cherché.

Corrigé à l'époque en épandant `params.value` — correctif lui-même faux, voir §6.3. L'état actuel du
code est un **mapping explicite**. Et l'audit garde la classe, en lisant les clés dans la composable
plutôt qu'en les listant.

### 6.3 Le correctif en cachait un autre

**L'épandage était faux.** Le contexte porte `{ academic_year, term }` ; la signature de
`get_students` n'a **pas** de paramètre `term` — son optionnel s'appelle `academic_term`. Épandre
envoyait donc une clé hors signature : soit elle est filtrée et le semestre est perdu en silence, soit
c'est une erreur au branchement. **J'avais supprimé le symptôme — deux valeurs pour un nom — en
cachant la cause : deux vocabulaires de clés.**

Le mapping est explicite désormais, et **le semestre n'est pas transmis, avec son motif** :
`academic_term` filtrerait les *inscriptions au programme* par semestre, or une inscription au
programme est annuelle, comme le groupe et comme la répartition (lot 6). Passer un semestre à un objet
annuel ne rendrait rien — et rendrait `[]`, le même vide crédible que le défaut du §6.2, par l'autre
bout. **Si un groupe peut être semestriel, c'est une question ouverte** ; ce n'est pas un paramètre
qu'on ajoute pour voir.

### 6.4 Et mon contrôle d'audit était vacueux — vert pour une entrée absente

Ses deux expressions régulières avaient perdu leurs antislashs à l'écriture. Elles n'appariaient rien,
la liste des clés restait vide, la boucle ne tournait pas — et le contrôle imprimait **`ok`** avec le
détail « aucune clé de contexte trouvée » : **un aveu affiché comme un succès.** C'est la classe
corrigée deux tours plus tôt sur un autre contrôle, et le §7 listait ce résultat parmi les sorties de
ce qui a tourné, alors qu'il venait de ma reproduction en bac à sable — la règle 9, encore.

Deux corrections, et la seconde est de fond :

- **le contrôle vérifie d'abord sa propre extraction** et échoue si elle est vide : une réécriture de
  la composable ne peut plus le rendre muet ;
- **il vise la VALEUR, non le nom.** Sa première version interdisait d'écrire `academic_year:` — donc
  elle interdisait précisément le mapping juste du §6.3, et poussait vers l'épandage, c'est-à-dire vers
  le défaut. Elle exige maintenant que toute valeur envoyée sous une clé de contexte vienne de
  `params` : jamais d'un `.label`, jamais d'une constante.

Éprouvé dans les deux sens : le contrôle attrape `academic_year: year.value?.label` et laisse passer
`academic_term: params.value.term`.

### 6.5 Le plus grave de la grappe : l'écran rejouait l'acte qu'il devait lire

**L'onglet du rapport affichait une inscription en appelant
`create_student_from_applicant` — l'acte qui **crée** l'étudiant, son inscription au programme, son
inscription pédagogique, son compte, ses rattachements — **sur `onMounted`**, avec deux identifiants de
candidat de mon invention. Ouvrir `/groupes/inscriptions` aurait tenté de créer deux étudiants au
branchement.

**La cause est une phrase que j'avais déjà écrite, appliquée aux noms et pas aux verbes.** Le §3 pose
que « un nom de filière inventé envoyé à un appel réel est de la même famille qu'un chemin inventé ».
Un **identifiant de candidat** inventé envoyé à une cascade qui écrit est de la même famille encore —
et pire, parce que l'appel réussit.

**Un écran qui montre le résultat d'un acte doit LIRE cet acte, jamais le refaire.** Trois
conséquences :

- `get_enrollment_log` est ajouté comme **manque nommé** — le manifeste §6.3 « inscription administrative » le réclamait déjà, et ce
  défaut montre pourquoi il n'est pas un confort : sans lecture, l'écran n'a d'autre choix que de
  rejouer ;
- **les identifiants viennent d'une lecture de liste**, plus d'une constante : le journal montré est
  celui que la file des reprises désigne, et un clic sur une ligne montre le sien ;
- **le drapeau `__fail` est supprimé de la vue.** Il partait dans le corps de la requête au branchement
  — `client.js` n'en filtrait aucun. Le cas de refus est désormais **un journal comme un autre**, lu
  par son nom. Et le point d'appel retire les clés préfixées `__` avant l'envoi : un endroit à tenir,
  pas trente.

### 6.6 Et la file nommait des journaux que la lecture ignorait

En posant la lecture, j'ai écrit la table des journaux à côté de la file des reprises : la file en
nommait trois, la table en connaissait deux. **Deux des trois lignes cliquables menaient à
« introuvable »** — la classe « tout sujet liable doit être servable », pour la quatrième fois de ce
chantier, créée dans le tour qui corrigeait la précédente.

Une seule table désormais : **la file en est dérivée**, et l'acte d'écriture rend le journal de cette
même table — l'acte et sa lecture ne peuvent plus se contredire.

⚠️ Et le même écran montrait **deux fois le même rapport** quand on cliquait la ligne du journal
rejeté : le rapport en haut, la section « une inscription refusée, et pourquoi » en dessous, identique.
Le paragraphe explicatif décrivait alors aussi celui du haut, et la distinction que cet écran revendique
— le refus **à côté** du rapport, pas à sa place — s'effondrait. La section du bas disparaît quand son
sujet est déjà celui du haut : éprouvé sur les quatre clics possibles.

### 6.7 Un squelette perpétuel sur la bascule du vide

L'onglet du rapport rendait `reportState` **sans condition**, alors que `loadReport()` sort par avance
quand aucun journal n'est désigné. Or l'état d'une ressource jamais chargée reste « chargement », son
initial. Sur `?simulate=empty` — la file vide, donc aucun sujet, donc aucun appel — l'onglet restait
donc en **squelette indéfiniment**, sans issue : le bouton de reprise du bloc d'état retombait dans la
même sortie anticipée.

**Et le signalement du badge disparaissait avec lui** — la raison d'être déclarée de cet onglet, sur
l'une des trois bascules que le branchement impose de vérifier en premier. C'est la classe des §6.2 et §6.8 —
les deux valeurs sous un même nom, la sélection périmée : un état crédible qui est faux.

**« Pas encore de sujet » n'est pas « en cours de chargement ».** L'état affiché est désormais dérivé :
sans sujet, il suit la **file**, qui est ce qui nomme les sujets. Éprouvé sur les trois cas — file
peuplée, file vide, file en chargement — et le message du vide dit lequel des deux vides on lit.

⚠️ **Règle générale qui en sort** : un `load()` à sortie anticipée ne doit jamais voir son état rendu
sans garde. J'ai balayé les autres écrans : leurs zones sont gardées par un `v-if` sur le sujet —
`selected`, `teacherId`, `selectedUeId` — cet onglet était le seul à ne pas l'être.

### 6.8 Une sélection qui survivait au changement de contexte

Un journal choisi à la main restait affiché après un changement d'année. Le mécanisme du défaut mérite
d'être dit, parce qu'il est silencieux **par construction** : `shownLog` gardait l'ancien identifiant,
donc la valeur calculée ne changeait pas, donc **l'observateur ne se déclenchait pas**. Le rapport, son
sous-titre et l'encart du badge décrivaient un journal de l'année précédente pendant que la file
listait ceux de la nouvelle. Et au premier rechargement sur cet identifiant, la lecture aurait levé
« introuvable » : la classe du §6.6, par la porte du contexte.

Corrigé aux deux écrans — l'écran des groupes portait la même exposition, plus douce : un groupe dont
le nom existe encore dans la nouvelle année gardait ses membres, ses enseignants et ses éligibles de
l'année précédente, sans que rien ne le dise.
### 6.9 Ce que l'audit garde de ces deux tours

- **aucun acte d'écriture dans un cycle de vie** — le contrôle vise `onMounted`, `onBeforeMount` et les
  observateurs immédiats, **non le fichier entier** : sa première version aurait fait échouer l'audit
  sur un `@click` qui inscrit, c'est-à-dire sur l'usage que son propre commentaire autorise. Un
  contrôle qui interdit la correction pousse vers le défaut ; celui-là avait déjà été écrit deux fois
  ainsi ;
- **et les actes sont reconnus à leur MÉTHODE, pas à leur nom.** Trois versions fausses avant celle-ci,
  et chacune corrigeait la précédente en déplaçant la faute d'un cran : une liste manuscrite d'actes
  (**un** nom) ; une liste manuscrite de verbes d'écriture, où **onze actes réels échappaient** — dont
  `integrateSubmission` et `rejectSubmission`, la file de contrôle des notes, c'est-à-dire la grappe
  **suivante** ; puis l'inverse — tout ce qui n'est pas `get`/`list`/`check` — qui échoue enfin du bon
  côté mais **classait `openSession` parmi les actes d'écriture**, plus quatre auxiliaires de
  `client.js` qui ne sont pas des appels.

  **La cause commune aux trois : je jugeais le nom de la constante.** La vérité est dans la chaîne de
  méthode appelée — `get_students`, `validate_service_plan`, `whoami` — c'est elle qui dit si le
  serveur lit ou écrit, et elle ne dépend d'aucune convention de nommage locale. Un export sans
  `call()` n'est pas un acte.

  ⚠️ Et nommer une lecture « acte d'écriture » n'est pas du bruit tolérable : c'est une **étiquette
  fausse**, donc un contrôle qu'on discute puis qu'on désactive. Charger la session dans `onMounted`
  est le geste le plus normal qui soit ;
- **aucune vue ne passe un drapeau de mise au point**, et le point d'appel les retire avant l'envoi ;
- **chaque fixture exportée est éprouvée par l'audit** — `probes` était une liste manuscrite, la même
  classe que celle des actes d'écriture, corrigée trois fois ailleurs et laissée intacte ici.
  `enrollmentLog` y manquait : celle qui porte l'onglet du rapport, l'encart du badge et le cas de
  refus. Sa sonde passe une **clé réelle**, donc elle garde aussi contre le renommage de ce journal —
  sans quoi renommer la clé ne cassait rien à l'audit et l'écran affichait « aucune inscription à
  afficher », un état vide crédible.

  ⚠️ Le contrôle demande **éprouvée**, non *sondée* : sa première version exigeait une entrée dans
  `probes` et signalait donc cinq fixtures exercées par d'autres sections. Exiger un endroit précis
  plutôt qu'un usage réel, c'est encore un contrôle qui interdit le légitime — la troisième fois.

  Et il a trouvé trois exports réellement inéprouvés : des auxiliaires internes que rien hors du module
  n'appelait. Ils sont devenus internes — **un export inutilisé annonce une surface qui n'en est pas
  une** ;


---

## 7. Ce qui a tourné, et sous quel exécutant

**Ce qui a tourné** — un bac à sable JavaScript qui exécute réellement du code. Sorties :

- analyse syntaxique par `new Function` de tous les modules de `src/`, de tous les blocs
  `<script setup>` et du script d'audit : aucune erreur ;
- exécution des fixtures des deux modules — le script en imprime le compte, et vérifie désormais que
  **chacune est éprouvée** : six éligibles dont un désactivé, trois membres actifs sur quatre, un
  groupe au-delà de sa capacité (18 pour 16), trois reprises, trois orphelins ;
- le rapport d'inscription dérive bien 3 passées / 2 non abouties sur 5, et le badge est signalé ;
- le cas de refus ne nomme aucun fait — vérifié par recherche ;
- confrontation de la table du simulacre à l'**union** de ses deux modules de fixtures : aucune
  fixture absente, et **aucune fixture inéprouvée** — le script imprime les comptes, je ne les écris
  pas ici ;
- tout statut employé dans `src/` est une clé de pastille : aucun hors vocabulaire ;
- aucune vue ne fabrique la valeur d'une clé de contexte — et le contrôle a été éprouvé **dans les
  deux sens** : il attrape `academic_year: year.value?.label`, il laisse passer
  `academic_term: params.value.term` ;
- le classement des exports de `src/api/` par leur **méthode appelée** : soixante-et-un actes,
  quarante-quatre lectures, cinq exports sans appel écartés (les auxiliaires du point d'appel et
  l'objet de documentation). Le contrôle de cycle de vie a été éprouvé sur six formes : `onMounted`
  sur une ligne, multiligne, `onBeforeMount`, observateur immédiat sont signalés ; un `@click` et un
  `onMounted` sans acte passent ;
- le sens du test a été éprouvé : les onze actes qui échappaient à la version précédente sont tous
  surveillés, `openSession` et `academicContext` sont bien classés lectures, et une méthode inconnue
  tombe du côté surveillé ;
- le scénario du changement d'année a été simulé : sans remise à zéro, le journal montré n'existe pas
  dans la nouvelle année ; avec, il vient de la nouvelle file.

**Ce qui n'a pas tourné** — `npm run audit` (dont §7 bis et les contrôles ajoutés depuis),
`npm run dev`, le rendu, les trois bascules. Aucun `npm` de mon côté ; les limites de ce harnais sont
au §1.2 du relevé de la grappe 3 : il ne charge pas les modules ES, il retire les `import` et
réinjecte à la main.

**Ce que j'ai vérifié en lisant, pas en exécutant** — les cinq noms de fonctions et leurs signatures,
dans le code serveur monté. C'est une lecture ; elle vaut mieux qu'une invention, mais la
correspondance chemin ↔ exposition reste à confirmer au branchement.

⚠️ **Et une sonde fausse a failli me faire corriger un document juste.** En confrontant les comptes de
ce §7 aux fixtures, ma sonde a annoncé trois divergences — elle interrogeait `disabled` là où la
fixture porte `active`, et `capacity` là où elle porte `max_strength`. Les cinq comptes étaient exacts.
La règle 9 vaut donc dans les deux sens : **un verdict n'appartient qu'à ce qui a tourné, y compris
quand il accuse.** Une sonde se vérifie avant d'être crue — c'est ce que fait déjà le contrôle des clés
de contexte, et c'est ce que je n'avais pas fait ici.

**Ce qu'aucun des deux n'a vu** — les défauts du §6 ont été trouvés en **revue de code**, pas par un
exécutant. La plupart se lisent maintenant dans l'audit ; trois autres — le bouton muet, la branche
d'état manquante, le doublon de rapport — demandent un navigateur, comme les deux défauts du
branchement.

---

## 8. Ce qui reste de la grappe 4

Produit : **groupes et peuplement** (membres, enseignants, capacité, éligibles), **inscriptions**
(rapport ligne à ligne, reprises, orphelins).

Non produit, et pourquoi :

**La création d'un groupe et l'affectation d'un enseignant** passent par des méthodes de document dont
je n'ai pas encore lu le mécanisme d'appel — je préfère les livrer avec le bon appel qu'avec un chemin
inventé. Les boutons existent et disent qu'ils ne sont pas branchés.

**Le GESTE d'inscription administrative.** L'acte existe et est nommé
(`create_student_from_applicant`, §2), l'écran lit son journal, mais **aucun bouton ne le déclenche**.
Motif : il faut d'abord choisir un candidat approuvé, et cette liste vient de
`ProgramEnrollmentTool.get_students` — une **méthode de document**, pas une fonction libre. Je n'ai pas
lu comment on invoque une méthode de document ici, et inventer ce mécanisme est du même ordre
qu'inventer un chemin.

⚠️ **Conséquence à dire clairement** : le contrôle « aucun acte d'écriture dans un cycle de vie » ne
rencontre **aucun acte dans les vues produites** — il est donc vert sans avoir eu à juger. Il garde
désormais **tous** les actes d'écriture que `src/api/` exporte, dont ceux des grappes 5 et 6 : il jugera
dès que l'un d'eux apparaîtra dans un écran. Le script en imprime le compte ; je ne l'écris pas ici,
il changera à l'expédition suivante.

**Vue d'effectifs** : l'écran des groupes la porte par groupe. Une vue transversale — tous les groupes
d'une filière, tous leurs effectifs — attend de savoir si elle se lit d'un seul appel ou d'un par
groupe. Question ouverte.
