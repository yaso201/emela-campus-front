# Relevé — grappe 3, écrans N4 et N5 · et l'état du démarrage

---

## 1. Le démarrage : ce que je n'ai pas pu faire, et ce que mon audit avait manqué

**Je n'ai pas pu lancer l'application.** Aucun `npm` dans mon environnement. `npm install &&
npm run dev` reste à faire là où npm existe.

### 1.1 La première version de l'audit était fausse, et elle a menti

Elle ne parcourait que les `.vue` et trois fichiers de configuration — **jamais `src/api/**`**. Or
c'est précisément là que vivait le défaut le plus grave possible : `fixtures.js` **ne parsait plus**.
Un script de réécriture avait avalé la fermeture de l'objet `permissions` **et** celle de `session`,
et toute l'application était morte — pas seulement N4 et N5 : `fixtures.js` → `mock/index.js` →
`client.js` → tous les modules d'appel → tous les écrans des trois grappes.

Ce que j'ai publié ensuite était pire que l'erreur : **un tableau de six « aucun » sur la foi d'un
audit qui ne regardait pas où ça cassait.** Un audit qui ne dit pas son périmètre ne vaut rien, et un
relevé qui l'oublie affirme plus que l'audit ne gagne.

### 1.2 L'audit réécrit — et figé en script exécutable

Il n'est plus dans un message : il est dans le dépôt.

    npm run audit        # node scripts/audit.mjs

**Son contrat, dit exactement** : chaque vérification qui casse produit **une ligne ÉCHEC nommée**, et
le script **va jusqu'au bout** pour les nommer toutes — un passage doit donner la liste des défauts,
pas le premier d'entre eux. Il n'**interrompt** que sur trois cas où la suite n'aurait aucun sens : un
fichier qui ne parse pas, le simulacre qui ne se charge pas, le vocabulaire absent. La syntaxe passe
donc en premier. Code de sortie 1 dès qu'une vérification a échoué. Jamais de trace, y compris quand
le simulacre cesse de rendre la forme attendue (§1.12).

Ce qu'il garantit, sans recopier ici sa structure ni ses comptes — le script en est la source, et un
tableau qui la double a divergé dès la section suivante :

- **Syntaxe** — chaque module et chaque `<script setup>` de `src/`, **et ce script lui-même** : il vit
  hors de `src/`, et c'est le fichier le plus susceptible d'être cassé puisqu'il n'a jamais tourné.
- **Le simulacre s'évalue vraiment** (il est importé, pas lu), chacun de ses points d'entrée répond, et
  **chaque fixture que sa table nomme existe** — une fixture renommée casserait l'application au
  premier appel en laissant l'audit vert.
- **Toute ligne cliquable de l'arbre conduit quelque part** : une unité servable, ou un état vide
  assumé. Un identifiant inconnu **lève** au lieu de rendre un voisin.
- **Arbre, panneau d'unité et plan de répartition décrivent les mêmes unités et les mêmes modules.**
- **Vocabulaire des permissions** : aucune clé employée par un écran hors liste, l'export `DENIED` est
  bien là, aucune clé refusée hors liste, et la session s'accorde à la liste dans les deux sens (§2.3).
- **Invariants des bilans de charge** : somme des lignes = `own_hours` ; own + ailleurs = engagé ;
  validé + proposé = engagé.
- **Plan, signaux et bilan donnent le même engagé**, et tout sujet liable est servable.
- **Plan et couverture s'accordent** : heures réparties, manques, et les comptes d'en-tête.
- **Totaux et écarts de N5 se déduisent des lignes**, et `computed_at` est présent.
- **Patrons** : balises équilibrées, aucun élément non-void auto-fermant, tout nom de route déclaré.
- **Style** : jetons de couleur et classes de composant déclarés, ordre des `@import`.

État à ce jour : **toutes ces vérifications passent — exécutées, mais pas par ce script.**

**Par quoi, exactement.** Un bac à sable JavaScript qui exécute réellement du code : il a analysé
chaque fichier avec `new Function`, appelé les fonctions du simulacre et comparé les valeurs rendues.
Les six bilans tiennent leurs trois invariants, les trois écrans donnent le même engagé, les sept
modules s'accordent entre plan et couverture, les 182 h / 117 h de N5 se déduisent des neuf lignes, et
chacune des douze lignes de l'arbre conduit quelque part. Ce ne sont pas des conclusions de lecture :
ce sont des sorties de programme.

**Et voici ses limites, qui sont réelles.**

- Le bac à sable **ne charge pas les modules ES** : le harnais retire les `import` et réinjecte à la
  main ce que le fichier importait. `fixtures.js` a donc tourné, mais pas avec sa vraie résolution de
  `PERMISSIONS` — c'est le premier `npm run audit` qui l'éprouvera.
- `audit.mjs` a été **analysé, jamais exécuté comme programme**. Ses chemins de fichiers existent, sa
  syntaxe passe ; son import dynamique, ses appels `check()` et son code de sortie n'ont jamais
  tourné.
- Rien de ce qui relève du rendu, de Vue, du build Tailwind ou d'un navigateur n'a été touché.

⚠️ **`npm run audit` n'a donc jamais été lancé** — aucun `npm` de mon côté, comme au §1.1. Son premier
passage réel peut échouer sur son propre code. **À traiter comme du code neuf**, pas comme un contrôle
déjà vert.

**Ce que l'audit ne voit toujours pas**, et qu'un démarrage verra : le rendu, les erreurs d'exécution
des composables, l'enchaînement réel des cinq états, les trois bascules de simulation, et la
résolution des classes Tailwind au build.

### 1.3 Trois défauts corrigés

**`fixtures.js` ne parsait plus** — deux accolades manquantes, restituées. C'est la cause du défaut,
et elle mérite d'être nommée : un `indexOf('};')` cherché vers l'avant depuis une clé imbriquée
trouve la fermeture de l'objet **englobant**, pas celle de l'objet visé.

**`@import './buttons.css'` était placé après les directives `@tailwind`.** Un `@import` qui suit une
autre règle est du CSS invalide et `postcss-import` ne le traite pas de façon fiable — les trois
classes de bouton pouvaient disparaître du build sans erreur bruyante. L'import passe avant ; ses
règles vivent dans `@layer components`, donc c'est Tailwind qui décide de leur place dans la cascade.

**Quarante-sept éléments non-void étaient auto-fermés** (`<span />`, `<div />`), ce que la canonicité
du projet interdit. Corrigés — après un premier correctif qui a lui-même cassé vingt-trois balises
SVG, faute d'une frontière de mot : `<p` matchait `<path`, `<i` matchait `<input`. Réparé, vérifié,
et la leçon tient en une ligne — **un correctif en masse sur des noms de balises exige `(?![\w-])`.**

### 1.4 Un bilan de charge porte son sujet dans l'URL

Le défaut était grave et circulaire : `TeacherLoadView` lisait l'identité de son sujet **dans sa
propre réponse** (`load.value.teacher_id`), donc toujours nulle au montage, donc le simulacre rendait
toujours le même enseignant. Cliquer « Bilan de charge » sur M. Dossou affichait le nom, les 428 h et
la dérogation retenue de Pr. Ahouandjinou.

Sur l'écran dont les chiffres nourrissent la paie des vacataires, c'est le pire défaut possible — et
c'est exactement celui que j'avais nommé deux tours plus tôt : **un lien qui ressemble à un succès est
pire qu'un lien mort.**

Corrigé en quatre points :

- la route devient `/repartition/charge/:teacher?` — le sujet voyage dans l'URL, partageable et
  rechargeable ;
- `ServiceSignalsView` transmet `teacher_id` (ajouté aux signaux de norme), et les noms du panneau de
  charge de N1 deviennent des liens vers **leur** bilan ;
- `TeacherLoadView` lit `route.params.teacher`, jamais sa réponse. **Sans sujet, l'écran le dit** et
  renvoie vers les signaux, plutôt que d'afficher quelqu'un ;
- **les six sujets du panneau sont tous servables.** Le premier correctif n'en avait préparé que
  trois : la moitié des liens tombait sur un écran d'erreur, avec un message qui affirmait une panne
  d'agrégation pour un sujet simplement introuvable, et sans retour. La même faute que celle que je
  venais de corriger, un cran plus loin.

Le simulacre porte désormais **six** bilans. Les trois nouveaux — Hounkpatin, Lawson, Adjovi — sont
**sous la norme** et portent `derogation: null` : ce cas n'était couvert par aucune fixture, les trois
premières en portant toutes une. Les trois premiers éprouvent les trois phrases de dérogation
(motif retenu — autre filière / non motivée / motif rendu — sa filière).

Un sujet inconnu **lève toujours une erreur** plutôt que de rendre un autre enseignant — c'est le
silence qui serait dangereux. Mais l'erreur porte désormais **le message du serveur** (« Enseignant
introuvable », et non « Bilan indisponible » : deux causes, deux phrases), la mention de ce qui est
sauf, et **une sortie**.

**Une vérification d'audit en sort** : *tout sujet qu'un écran peut lier doit être servable par la
couche de données.* Six liables, six servables — vérifié pour le panneau de charge et pour les
signaux de norme.

**Et une distinction** : un écran d'erreur qui **est** la page doit offrir une sortie ; un panneau qui
vit à côté d'un contenu navigable (arbre, unité, couverture) n'en a pas besoin — la page reste
parcourable autour de lui. Les deux écrans pleins concernés (bilan, signaux) l'ont ; les trois
panneaux ne l'ont pas, délibérément.

### 1.5 Les trois pastilles de filtre comptaient deux unités différentes

« Tous les modules 7 · Incomplets 4 · Brouillons 13 » : les deux premières comptaient des modules, la
troisième des lignes — un ordre de grandeur d'écart, et un clic qui filtrait quand même des modules.
Les trois comptent maintenant des modules, et le libellé le dit. Le nombre de lignes en brouillon
reste au bouton de proposition, où il a un sens.

### 1.6 J'ai refait la faute que je venais de documenter

En corrigeant le bilan de charge, une tranche `indexOf` a de nouveau avalé plus que sa cible :
`serviceSignals` et `serviceProgress` ont disparu du fichier de fixtures. Restitués, avec une ancre
explicite cette fois.

La règle du §5 n'était donc pas assez forte. Elle devient : **une réécriture par tranche calculée est
interdite sur un fichier de plus d'une fonction.** On remplace une chaîne exacte, ou on réécrit le
fichier entier — jamais un intervalle trouvé par recherche.

### 1.7 Les nombres dérivés ne s'écrivent plus à la main

Quatre tours de suite, le même genre de défaut : un total qui ne s'accordait plus avec ses lignes,
un engagé écrit à trois endroits avec trois valeurs, un `own_hours` hérité d'un tour précédent et
jamais re-sommé. Corriger chaque nombre ne convergeait pas, parce que la cause n'était pas les
nombres.

**Cause : les fixtures déclaraient à la main ce qui se déduit.** Deux tours ont été nécessaires pour
le voir en entier — les enseignants d'abord, la couverture ensuite.

**Les enseignants.** Une table unique, et tout le reste calculé :

    own_hours     = somme des heures prévues de own_lines
    engaged_hours = own_hours + elsewhere_hours
    validated     = engaged - proposed
    gap           = done - planned      (N5)

**La couverture.** Même faute, un cran plus loin — et il a fallu **deux tours** pour la refermer.
D'abord le manque était écrit à côté des lignes et le panneau portait ses propres chiffres : MAT-118
comptait **60 h au plan et 42 h au panneau**. Je l'ai corrigé par une table `MAQUETTE`… qui était une
**seconde copie manuscrite** des volumes que `UES[].modules[].volumes` déclarait déjà vingt lignes
plus haut. Elles s'accordaient ce jour-là, rien ne l'imposait, et elles étaient déjà incomplètes l'une
par rapport à l'autre — TRA-110 et INF-201 n'existaient que d'un côté.

Désormais **plus aucune copie** : `expectedHours(module)` lit la maquette, la seule qui déclare les
volumes, et écarte les activités à zéro heure (réponse 1 du lot 6). Six choses en dérivent : le manque
de chaque module, le compte de lignes, le compte de modules, le compte de modules couverts, la
pastille « incomplets » et le panneau de couverture entier.

**Et l'écart de 18 h avait une cause de fond.** La ligne de MAT-118 sans enseignant — le provisoire
tracé à N1 — ne peut pas être enregistrée : ses heures **ne comptent donc pas comme réparties**. Mais
les taire ferait croire à un oubli. Elles sont rendues à part (`pending_hours`), et le survol de la
pastille les nomme : « dont 18 h posées sans enseignant, non encore enregistrables ».

**Et l'écart de 18 h avait une cause de fond.** La ligne de MAT-118 sans enseignant — le provisoire
tracé à N1 — ne peut pas être enregistrée : ses heures **ne comptent donc pas comme réparties**. Mais
les taire ferait croire à un oubli. Elles sont rendues à part (`pending_hours`), et le survol de la
pastille les nomme : « dont 18 h posées sans enseignant, non encore enregistrables ».

**Une phrase fausse en découlait.** La ligne de manque affirmait « aucune heure répartie », ce qui est
faux sur un module où 18 h le sont déjà — et c'est le genre de faux qui fait rouvrir une répartition
déjà faite. Elle distingue maintenant le manque total du manque partiel.

Les invariants tiennent désormais **par construction**, et l'audit ne fait que les confirmer.

Deux détails corrigés au passage :

- **« 1 filières »** — l'accord du pluriel est du contenu, pas du détail. Une fonction `plural()` dans
  la vue et dans les fixtures.
- **La zone masquée d'un enseignant sans charge ailleurs** n'a pas lieu d'être : l'écran écrit que
  l'engagé lui est entièrement visible, au lieu d'annoncer une zone vide. T6 éprouve ce cas.

### 1.8 Un repli silencieux qui rendait la mauvaise unité

`ueDetail` se terminait par `|| UES['UE-3.2']`, et `UES` ne portait pas d'entrée pour UE-3.3 — pourtant
cliquable dans l'arbre. Choisir « Compétences transversales » affichait donc **« Mathématiques
appliquées »** : mauvais code, mauvais crédits, mauvais modules, et trois filières partenaires
étrangères. `ueDownstreamUsage` avait le même repli, en pire : il rendait `locked: false`, donc il
annonçait **modifiable** une unité qu'il ne connaissait pas.

C'est mot pour mot le défaut du bilan de charge, corrigé deux tours plus tôt, et laissé en place à
vingt lignes de là. L'entrée UE-3.3 est ajoutée, et **les deux replis lèvent désormais `NOT_FOUND`** :
sur un verrou, le défaut doit être le refus, jamais l'autorisation.

**Pourquoi l'audit ne l'avait pas vu** : il sondait `ueDetail({ ue: 'UE-3.2' })`, un seul identifiant
— exactement celui que le repli rendait. Il sonde maintenant **chaque unité que l'arbre rend
cliquable**, et vérifie qu'un identifiant inconnu lève au lieu de rendre un voisin.

### 1.9 Une troisième copie manuscrite : l'arbre de structure

`TREE` était une seconde liste des mêmes unités et des mêmes modules que `UES`. Elles ont divergé
aussitôt que j'ai ajouté UE-3.3 : deux modules au panneau, **un seul dans l'arbre**. L'éditeur de
maquette montrait donc UN module à gauche et DEUX lignes à droite, sur la même unité, sur le même
écran — et c'est l'écran dont les volumes servent de source unique à toute la couverture de la
répartition.

L'arbre est maintenant **dérivé de `UES`** : unités, modules, crédits, état, mutualisation. Seul le
niveau 1 — les semestres, qui ne portent ni volume ni module — reste déclaré.

**Un chiffre a changé en conséquence, et c'est une bonne nouvelle.** Le total du programme était écrit
à 30 crédits ; la somme des unités déclarées en fait **27**. L'en-tête lit désormais
« 27 crédits déclarés sur 30 » — écrire 30 ferait croire le semestre complet, alors qu'il reste trois
crédits à placer. C'est la réponse 1 du lot 6 appliquée ici : montrer le reste disponible pendant la
saisie plutôt que de laisser découvrir le plafond à l'enregistrement.

**Pourquoi l'audit ne l'avait pas vu** : la vérification que je venais d'ajouter ne parcourait que le
niveau 2 — elle ne pouvait donc structurellement pas voir une divergence de modules. Elle compare
maintenant, par unité, les modules de l'arbre à ceux du panneau, plus les crédits et l'état ; puis les
deux ensembles complets ; puis les modules du plan de répartition contre la maquette.

### 1.10 Un `NOT_FOUND` posé sans adapter son appelant

Faire lever `ueDetail` était juste. Mais son seul appelant chargeait `{ ue: id }` pour **tout** nœud
sélectionné, et l'arbre rend douze lignes cliquables : un semestre, quatre unités, **sept modules**.
Seules les unités sont des sujets de `get_ue` — huit lignes sur douze conduisaient donc les deux
panneaux de droite dans leur état d'erreur, sur le geste le plus naturel d'un éditeur de maquette.
J'avais changé une mauvaise donnée silencieuse en une erreur au clic.

**Cause en une phrase** : l'écran passait l'identifiant du nœud cliqué à un point d'entrée qui n'accepte
que des identifiants d'unité.

**Une seule correction, dans la vue** — pas dans le point d'entrée, dont le refus est juste. L'écran
résout l'**unité porteuse** de la sélection : un module remonte d'un cran (son `parent` EST son
unité), un semestre ne porte aucune unité et le panneau reste sur son état vide. Un état vide est la
réponse juste à « rien à montrer ici » ; une erreur ne l'est pas.

Deux conséquences utiles : passer d'un module à l'autre dans la même unité **ne recharge rien** (on
observe l'unité porteuse, pas le nœud), et le module cliqué est **marqué** dans le tableau des volumes
— sans quoi le clic paraîtrait sans effet.

L'audit sonde désormais les **douze** lignes : chacune doit conduire à une unité servable ou à un état
vide assumé. Aucune ne doit conduire à une erreur.

### 1.11 Un commentaire attaché à la mauvaise déclaration

Le bloc « Lignes de service, PARESSEUSES » s'est retrouvé en double, dont une copie au-dessus d'une
déclaration qu'il ne décrivait pas. Dans un fichier où les commentaires portent le raisonnement, un
commentaire mal placé égare le lecteur suivant. Supprimé.

### 1.12 Le contrat du script, tenu au niveau du contrat

Trois fois de suite, le même défaut : le script lisait une propriété sans l'assurer, et mourait sur une
trace au lieu d'une ligne ÉCHEC nommée. Un import qui lève, une famille de signaux renommée, un
tableau que la fixture ne rend plus. À chaque fois j'ai gardé l'occurrence signalée ; à chaque fois la
suivante attendait deux sections plus loin.

**Cause** : le contrat « une ligne ÉCHEC, jamais une trace » était tenu occurrence par occurrence,
alors que chaque grappe touche `fixtures.js` et en ajoute une.

**Posé au niveau du contrat** : `say()` retient la section courante, et deux gardes de processus
convertissent **toute** exception non rattrapée — où qu'elle naisse, y compris dans une forme que je
n'ai pas prévue — en une ligne ÉCHEC qui **nomme sa section**, suivie du code 1. On perd la pile ; on
gagne un diagnostic lisible et un contrat qui n'a plus à anticiper la prochaine forme.

Les deux gardes d'import du §2 restent : ils nomment mieux leur cas que le filet général, et un
simulacre qui ne se charge pas mérite sa propre phrase.

**Et le diagnostic devait survivre à sa propre sortie.** `process.stdout.write` est asynchrone sur un
tube, et `process.exit()` ne l'attend pas : en TTY tout s'affichait, mais dans le passage qui compte —
`npm run audit > audit.log`, ou une CI — la ligne ÉCHEC pouvait être tronquée. Le code de sortie
survivait, le nom du défaut non : la même perte qu'une trace, une couche plus bas. Les sorties passent
par `writeSync`, ce qui supprime la course aux cinq endroits d'un coup.

⚠️ **Le filet ne nomme pas la cause, parce qu'il ne la connaît pas.** Il attrape aussi bien une forme
de fixture disparue qu'un fichier de configuration absent au §8, ou une faute dans le script lui-même.
Il nomme ce qu'il sait : le message de l'exception et la dernière section atteinte.

### 1.13 Le rail

`DENSE` n'avait pas grandi avec la grappe 3 : les cinq écrans de répartition et l'éditeur de maquette
y sont ajoutés. Le plus large — prévu contre réalisé, sept colonnes — perdait 208 px sans raison.
Cette liste doit grandir à chaque grappe ; c'est écrit dans `App.vue`.

### 1.14 Les polices

Le self-service **référence** `/fonts/inter/Inter-*.woff2` mais **ne les porte pas** — il n'y a aucun

⚠️ **SUPERSEDED par la correction du branchement** : `/fonts/inter/` n’existe pas sur le serveur. Le
chemin servi est `/assets/portal_app/emela/fonts/inter/` — voir le relevé de la grappe 1.
`.woff2` à copier. J'ai aligné le chemin de la feuille d'entrée sur le sien (DEC-149) pour que les
deux applications servent les mêmes fichiers dès qu'ils existeront. À récupérer à la source.

---

## 2. Le vocabulaire arrêté est appliqué — version 02

**Trente-deux clés** (VOCABULAIRE-PERMISSIONS-02), déclarées **une fois** dans `src/permissions.js`
avec le principe et les motifs de scission en commentaire. La matrice du simulacre est **dérivée** de
cette liste : elle ne déclare que les cinq clés que le lecteur simulé ne porte pas.

### 2.1 Deux corrections reportées côté interface

- `arbitrate:dossiers` **scindée** en `arbitrate:leave` et `decide:appeal` — la clé violait le
  principe qu'elle servait : deux actes, deux acteurs, deux clés ;
- `write:charpente` **nouvelle** — années, semestres et filières ne sont pas la maquette.

Aucune des deux ne change le vocabulaire **employé** par un écran : elles changent la liste canonique.
`arbitrate:dossiers` n'était employée nulle part — aucun écran de dossier n'est encore produit — et
`write:charpente` attend l'écran de charpente. Elles n'en sont pas moins à porter maintenant : une clé
absente de la liste au moment où l'écran arrive est une clé qu'on invente.

### 2.2 Trois corrections arrêtées au serveur, sans effet côté interface

- `close:year` rattachée au **Director**, non à la Direction — la clé elle-même est inchangée ;
- `present:graduation` gagne le gestionnaire académique ;
- les quatre `read:*` sont restreints aux gardes réelles.

Toutes trois sont des changements de **titulaires**, et rien dans `src/` n'exprime les titulaires —
`permissions.js` le dit à sa première ligne : « la liste canonique des clés, et rien d'autre : ni
titulaires, ni portées ». L'interface ne les porte donc pas, et **ne le peut pas** : les dire reportées
laisserait croire le contraire.

**Ce que la version 01 avait produit dans mes écrans**, corrigé aux tours précédents : `groups` passait
par `read:structure`, `graduation` aussi, et la validation de maquette par `validate:service`. Trois
boutons qui auraient disparu chez quelqu'un qui y avait droit.

### 2.3 Le filet matrice ↔ gardes, côté interface

Il est **permanent**, et l'audit le porte (§1.2 en donne la teneur — je ne la recopie pas ici, deux
listes du même ensemble divergeraient, et celle-ci a déjà dérivé une fois).

**Ce qui a des dents, et ce qui n'en a pas.** Deux contrôles de cette section peuvent encore échouer :

- **les clés employées par un écran** — un `can()` ou un `need:` qui invente un droit. C'est celui qui
  trouvera quelque chose le jour où une grappe nommera un droit de travers, comme la version 01 l'a
  fait trois fois dans mes propres écrans ;
- **la présence de l'export `DENIED`** — un refactor qui le retire ferait passer au vert un contrôle
  qui ne vérifie plus rien. Le cas est réel : cet export n'existe que pour l'audit.

Le reste de la section ne peut pas échouer, et il faut le dire plutôt que de laisser croire à un
filet :

- les contrôles qui confrontent la **session** au vocabulaire sont des tautologies — la matrice du
  simulacre étant dérivée de `PERMISSIONS`, les deux ensembles sont le même par construction ;
- **l'appartenance de `DENIED` au vocabulaire** ne peut pas échouer non plus : une clé morte fait lever
  `fixtures.js` au chargement du module, donc l'audit s'est déjà arrêté avant. Cette ligne reste parce
  qu'elle **nomme la règle là où on la cherche** — c'est la formulation lisible du garde-fou, pas un
  second garde. Les dents sont dans `fixtures.js` (§2.4).

C'est ce que la dérivation et le garde-fou ont acheté : une donnée unique et une exception au bon
endroit ne se vérifient pas, elles tiennent. Un contrôle qui ne peut plus échouer n'est pas un
contrôle mort — c'est une règle écrite là où elle se lit.

⚠️ **Ces tautologies ne reprendront PAS des dents au branchement**, contrairement à ce que j'ai écrit
au tour précédent. `audit.mjs` importe `fixtures.js` en dur et lira toujours le simulacre :
`VITE_API_MODE=live` est un drapeau d'exécution du navigateur, sans aucun effet sur un script hors
ligne. Confronter le vocabulaire à ce que rend réellement `whoami` est **un contrôle distinct, qui
n'existe pas** — il est porté au §5.

### 2.4 Le trou de `DENIED`, fermé

`DENIED` — les cinq clés que le lecteur simulé ne porte pas — était une liste de chaînes libres,
confrontée à rien.

Le mode de défaillance est celui qui **vient de se produire** : la version 02 a renommé une clé
(`arbitrate:dossiers` → `arbitrate:leave` + `decide:appeal`). Si une version 03 renomme `close:year`,
`DENIED` garde la chaîne morte, `!DENIED.has(k)` répond vrai pour la clé neuve, et le lecteur simulé
**gagne** un droit qu'il est censé ne pas avoir : l'entrée « Clôture » apparaît, sans erreur nulle
part. Un droit qui s'ouvre en silence est le pire cas de cette famille.

Fermé dans le code, pas seulement surveillé : `fixtures.js` vérifie `DENIED` contre le vocabulaire
**au chargement du module** et **lève** si une clé n'y est pas. Éprouvé en remplaçant `close:year` par
une chaîne morte — l'import échoue, avec le motif nommé.

**Deux conséquences, bornées toutes les deux.**

Un garde-fou doit tomber là où il protège : `client.js` importait le simulacre statiquement, donc cette
exception aurait fait tomber l'application **branchée** pour une faute dans des données qu'elle
n'utilise pas. Le simulacre est désormais chargé **à la demande**, dans la seule branche `isMock`.
Bénéfice second, non cherché : en mode branché, `mock/` sort du paquet servi — et c'est de la 3G.

Et l'audit importait ce module **sans filet**. Sur la défaillance même que ce garde-fou existe pour
attraper, le script mourait sur une trace au §2, avant le contrôle du §2 bis qui porte ce cas : le
contrôle que le §2.3 crédite de dents était inatteignable pour sa propre défaillance, et le contrat du
script — une ligne ÉCHEC nommée, puis code 1 — était rompu. L'import est maintenant gardé et routé par
`check()`. Le garde-fou du module tombe le premier ; le contrôle de l'audit en est la formulation
lisible.

⚠️ **Le filet ne vérifie pas les titulaires** — ils vivent au serveur. Côté interface, on ne peut
garantir que le vocabulaire ; ce qui est déjà ce qui manquait.

**Un mot sur `fixtures.js`.** Le lecteur simulé porte presque toutes les clés, pour que les écrans
produits soient atteignables. C'est délibéré et c'est écrit dans le fichier : ce n'est pas une
politique de droits, c'est un lecteur possible. Le prochain besoin est **deux personas** — celui qui
instruit et celui qui décide — sans quoi le filtre maker-checker ne s'éprouve pas à l'écran.

---

## 3. N4 — les trois signaux

**Les familles ne sont pas triées par gravité**, et c'est une décision. Aucune famille n'est plus
grave qu'une autre ; un tri le suggérerait. Elles arrivent dans l'ordre du serveur : maquette, norme,
planning.

**Aucun rouge, aucun « corriger ».** Les pastilles disent l'état de fait — « heures manquantes »,
« au-delà du volume », « choisi au planning » — jamais un jugement. La seule action est une
**consultation** : ouvrir la répartition, le bilan, la séance.

**Une famille vide le dit** plutôt que de disparaître. Savoir qu'il n'y a aucun contournement au
planning est une information ; une section absente ne dit rien.

**Le libellé de couverture a changé de forme.** La maquette disait « INF-204 · travaux pratiques —
aucune ligne ». La correction du lot 6 impose de parler heures : « 24 h prévues, aucune répartie ».
Le signal porte donc le volume attendu — sans lui, on ne sait pas ce qui manque.

---

## 4. N5 — prévu contre réalisé

**Le millésime est dans le sous-titre, contre les chiffres.** « 182 h prévues · 117 h réalisées ·
arrêté au 12 février ». Et si `computed_at_label` manque, le sous-titre écrit **« sans millésime —
chiffre non opposable »** plutôt que de taire l'absence. Sur une base de paie, un tableau sans date
ne doit pas avoir l'air d'un tableau daté.

**L'écart arrive signé du serveur, avec son propre drapeau.** `gap` est la valeur, `gap_flagged` dit
si elle mérite d'être remarquée. L'écran ne décide d'aucun seuil : un écart de −21 h en février est
normal si le projet démarre au semestre pair, et anormal si trois séances ont été annulées. Seul le
serveur sait lequel.

**L'écart n'a aucun ton d'alerte par défaut** — gris, poids normal. L'ambre n'apparaît que sur
`gap_flagged`. Un tableau qui met tous ses écarts en rouge en février n'apprend rien à personne.

**Les trois règles de comptage sont au-dessus du tableau, la quatrième dessous, les deux dernières
en encarts.** Chacune contre le total qu'elle affecte, comme le lot 6 l'exigeait : séances tenues
seules, durée réelle, mutualisé compté une fois, épreuves exclues avec leur chiffre.

---

## 5. Ce qui reste avant le branchement

**Les deux points d'entrée de N4 et N5 existent** — construits par la vague de répartition, sous
d'autres noms que ceux que j'avais supposés. Ils passent de 🔴 à 🟡 au manifeste (§5.5, §5.7) : la
fonction est là, son chemin d'exposition m'est inconnu. Rien à construire, un renommage à faire à
réception de la table de correspondance.

⚠️ **Ce qui reste dû malgré l'existence** : le point d'entrée du prévu / réalisé doit rendre
`computed_at`. Sur une base de rémunération, un tableau sans millésime n'est pas opposable — et cela ne
se voit pas dans un nom de chemin.

**Le démarrage, et l'audit lui-même.** `npm install`, puis `npm run audit` — **son premier passage
réel** —, puis `npm run dev` et les trois bascules. Le script n'a jamais été exécuté : le traiter
comme déjà vert serait exactement la faute du §1.1. Ce sont les seules vérifications qui manquent, et
aucune ne peut être remplacée par un harnais.

**Les `.woff2`.** À trouver hors du dépôt du self-service.

**Un contrôle qui n'existe pas : le vocabulaire contre `whoami` réel.** L'audit est hors ligne et lit
le simulacre ; il ne peut pas voir ce que le serveur rend. Confronter les trente-deux clés à la
matrice véritable demande un contrôle **au branchement**, et c'est celui qui aurait trouvé les cinq
écarts de la version 01. À écrire ; ne pas le confondre avec le filet du §2.3, qui ne garde que le
vocabulaire employé par les écrans.

**Trois provisoires à résorber** — tous tracés, aucun installé :
1. `status: 'incomplete'` sur une ligne de service sans enseignant (N1)
2. la motivation d'une dérogation portée localement (N2)
3. les actes non branchés qui affichent un bandeau au clic (N1, N3, N4, N5)

**Une leçon de méthode, pour la suite.** Une réécriture par tranche calculée a détruit ce qu'elle
devait corriger — dont deux fois le même fichier de fixtures, la seconde après que j'aie écrit la règle
l'interdisant. Et plusieurs fois, un défaut corrigé à un endroit est resté intact ailleurs : le repli
silencieux, la copie manuscrite, l'appelant non relu. Les règles qui en sortent, et que l'audit porte
désormais :

1. **La syntaxe passe avant tout.** Un fichier qui ne parse pas rend les autres résultats sans objet.
2. **Aucune réécriture par tranche calculée.** Chaîne exacte, ou fichier entier — sans exception,
   parce que l'exception a coûté deux fois.
3. **Un lien n'est corrigé que si sa cible existe pour tous ses sujets.**
4. **Un nombre dérivé ne s'écrit pas.** S'il se déduit, il se calcule — sinon il divergera, et dans
   ce domaine une divergence se lit comme une erreur de paie.
5. **Une règle établie se cherche partout, pas à l'endroit où le défaut a été signalé.** Sonder un
   seul identifiant, c'est sonder celui qui marche.
6. **Deux listes du même ensemble divergeront** — pas « peuvent » : trois fois de suite, la seconde
   copie a divergé dès le tour suivant sa création. La question n'est pas de les accorder, c'est de
   n'en garder qu'une.
7. **Durcir un point d'entrée oblige à relire ses appelants.** Faire lever une erreur où il y avait un
   repli déplace le défaut du silence vers l'écran : le refus est juste, mais il faut apprendre à
   l'appelant quel sujet il a le droit de demander.
8. **Un compte écrit à côté d'une liste deviendra faux.** Y compris dans ce relevé, qui a annoncé
   « cinq règles » au-dessus de sept et « quatre points d'entrée » pour deux. La règle 4 vaut aussi
   pour la prose : si le lecteur peut compter, ne comptez pas pour lui.

   ⚠️ **La distinction à tenir**, faute de quoi la règle devient une manie : un compte qui est le
   **résultat d'une mesure rapportée** se garde — « quarante exports appelables », « douze séances au
   jeu d'essai », « treize points whitelistés » : le lecteur ne les a pas sous les yeux, et le chiffre
   EST l'information. Un compte qui **numérote une liste imprimée juste en dessous** se retire — le
   lecteur compte mieux que moi, et la liste grandit sans que le titre suive. Un ensemble **clos par
   sa nature** se garde aussi : « deux statuts » quand le modèle a exactement deux champs, « trois
   issues » quand l'énumération en a trois.

   ⚠️ Troisième occurrence à la grappe 5, et **la pire des trois** : le titre « six défauts » est
   devenu faux parce que j'ai ajouté un septième défaut **dans l'édition qui précédait**, sans faire
   suivre le titre. Les deux premières fois, un compte hérité s'était périmé tout seul ; celle-là, je
   l'ai périmé moi-même, en écrivant la ligne qui le contredisait.
9. **Un verdict n'appartient qu'à ce qui a tourné.** « Tout passe » sous un tableau intitulé
   `npm run audit` attribue à ce script les résultats d'un autre. Nommer l'exécutant coûte six mots
   et évite au lecteur de croire un contrôle déjà passé. Et « un harnais équivalent » ne suffit pas :
   il faut dire **quel** exécutant, et sous quelles limites — sinon le lecteur ne peut pas savoir si
   c'est un programme ou un raisonnement.
10. **Une correction se classe par ce qu'elle change dans le code, pas par ce qu'elle change dans le
    texte qui l'ordonne.** J'ai rangé `close:year` parmi les corrections « reportées côté interface »
    alors que seul son titulaire changeait, et la clé est identique depuis la version 01. Le test est
    mécanique : si aucun fichier de `src/` ne diffère, rien n'a été reporté.
11. **Un accusé de réception n'est pas un report.** J'ai reconnu en conversation que deux points
    d'entrée existaient, et laissé 🔴 dans le manifeste — or ce marqueur porte une instruction :
    « ne le cherchez pas ». Un statut qui commande doit changer au moment où change ce qu'on sait,
    pas au moment où on aura tous les détails.

**Grappe 3 close.** Cinq écrans : répartir, valider, bilan de charge, signaux, prévu contre réalisé.
