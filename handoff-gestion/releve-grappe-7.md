# Relevé — grappe 7 : les dossiers

Six procédures, un patron — et deux dérivations qui le débordent.

---

## 1. Ce que la lecture a établi

**Les six procédures suivent la même suite d'actes.** Ce n'était pas une hypothèse de conception :
c'est ce que les six surfaces montrent, avec des verbes différents pour la même mécanique.

| Étape | Verbes rencontrés |
|---|---|
| créer | `create_*` |
| déposer | `submit_*` · `deposit_*` · `issue_*_notice` |
| instruire | `instruct_*` · `start_*_commission` · `convoke_*` |
| décider | `decide_*` · `pronounce_*` · `register_*` |
| notifier | `record_*_notification` |
| sortir sans décider | `cancel_*` · `retract_*` · `refuse_*` · `dismiss_*` · `close_without_sanction` |

Le patron du lot 3 tient donc, confirmé par le code : **instruction et décision sont deux actes**, le
motif est obligatoire à la décision, et la sortie sans décision existe partout.

⚠️ **Mais deux procédures débordent le patron, et un écran unique serait faux pour elles.**

**Le congé porte un ARBITRAGE au-dessus de la décision** — `arbitrate_coa_request`, rôle Director. Une
décision de congé n'est donc pas définitive. C'est la seule procédure du lot qui en porte un, et
l'écran doit montrer **deux niveaux** : sinon un étudiant organise son année sur une décision
reprenable.

**La discipline porte un APPEL SUSPENSIF.** C'est la seule procédure où la décision est **rejouée par
une autorité supérieure, sur un état modifié entre-temps** — des jours déjà purgés.

---

## 2. Ce que le patron cache, et que la lecture a révélé

Quatre procédures portent un acte que les autres n'ont pas, et chacun est une **garantie**, pas une
formalité. Les traiter comme du remplissage de patron aurait produit un écran juste en apparence.

**La démission a une INFORMATION PRÉALABLE.** `record_resignation_information(name, info_channel)` :
avant d'enregistrer une démission, l'établissement doit avoir informé l'étudiant des conséquences, et
**le canal est tracé**. C'est ce qui distingue une démission éclairée d'une démission subie. Dans le
patron, cet acte occupe la place de l'instruction — et c'est juste : informer *est* l'instruction d'une
démission.

**L'abandon a un CONTRADICTOIRE en deux actes.** `issue_abandonment_notice` puis
`record_abandonment_response`. Un abandon prononcé sans mise en demeure serait une décision sans
contradictoire, et l'ordre ne se contourne pas.

**La réorientation a une INSTRUCTION COLLÉGIALE.** `start_reorientation_commission` +
`add_commission_member`. La seule du lot. L'écran ne peut donc pas afficher « instruit par X » : il
nomme une commission, comme le jury de délibération.

**Et la réorientation reconnaît des crédits AVEC LEUR FONDEMENT.**
`add_credit_recognition(name, source_label, credits_recognized, basis)`. `basis` n'est pas un
commentaire : **une reconnaissance de crédits sans fondement ne se distingue pas d'une faveur.**

---

## 3. Les décisions de cet écran

### 3.1 Le fil est dérivé du patron, jamais écrit par dossier

Le simulacre déclare **une seule table de procédures** : le libellé de chaque étape, les issues, et ce
que la procédure ajoute. Le fil de chaque dossier en est dérivé de son étape atteinte.

Un fil écrit dossier par dossier divergerait du jour où une procédure gagne une étape — règle 6,
appliquée au vocabulaire d'interface plutôt qu'aux données.

### 3.2 Le panneau de dérivation est monté par le patron, pas par une cascade

Cinq panneaux — appel, arbitrage, commission, contradictoire, rétractation — et le patron dit lequel
monter. Une cascade de `v-if` sur le type de procédure aurait mélangé la déclaration et l'affichage :
ajouter une procédure demanderait alors de toucher l'écran.

### 3.3 Sur une infirmation, les champs de reprise sont RETIRÉS, pas grisés

C'est la décision dont je suis le plus sûr, et elle vient de la signature :
`resume_start` et `resume_days_remaining` sont **facultatifs**, parce qu'ils n'ont d'objet que si la
sanction survit.

Un champ grisé laisse croire qu'il y a une valeur à y mettre. Sur une infirmation, il n'en reste
aucune — il ne reste rien à purger.

### 3.4 Le plafond est énoncé sur le champ, et le calcul sous la saisie

« Plafond 8 — 7 jours déjà purgés sur 15, les fixer à nouveau aggraverait la sanction. » Puis, sous la
saisie : « 7 purgés + 6 restants = 13 jours, contre 15 prononcés. Le plafond est respecté. »

Le refus fait autorité au serveur. **L'écran doit pouvoir montrer pourquoi** — sinon un refus ressemble
à une panne.

### 3.5 Statuer et fixer la reprise sont un seul panneau

La docstring serveur est explicite : « le geste unique — statuer ET, si la sanction survit, fixer la
reprise ». L'écran ne les sépare donc pas : il n'existe pas d'état « appel statué, reprise à fixer », et
le présenter en deux étapes promettrait un état qui n'existe pas.

### 3.6 « Aucune réponse » n'est pas une donnée manquante

Sur le contradictoire de l'abandon, l'absence de réponse **est le fait qui fonde le prononcé**. Un
écran qui la présenterait comme un champ à remplir inviterait à attendre indéfiniment. Elle se
constate ; elle ne se comble pas.

### 3.7 La rétractation est montrée, jamais offerte

Elle appartient à l'étudiant. L'écran de gestion la porte comme un fait — la fenêtre court, jusqu'à
telle date — et l'enregistrement de la démission reste **inerte** tant qu'elle est ouverte. Ce n'est
pas une garde d'interface inventée : c'est l'ordre des actes au serveur, rendu visible avant le clic
plutôt qu'au refus.

### 3.8 Le maker-checker est dit avant l'acte, pas au refus

Sur un dossier dont l'instructeur est le seul titulaire du rôle décideur, le panneau latéral l'écrit :
« celui qui a instruit ne peut pas décider ». Avec l'ancienneté d'attente et un lien vers la liste. Un
agent qui découvre l'interdit au clic croit à une panne.

---

## 4. Les défauts trouvés en revue

**4.1 — J'ai inventé les props de deux composants au lieu de les lire.** `DeferredEffectBanner` et
`RetractionWindow` : j'ai écrit `count`, `count-unit`, `title`, `message`, `stopped`, `resumed`,
`until`, `owner` — aucune n'existe.

⚠️ **Vue ne lève pas sur une prop inconnue** : elle atterrit dans les attributs et disparaît. Le
bandeau aurait rendu un cadre **vide**, sans erreur, et visuellement crédible. C'est exactement la
classe des chemins inventés — le nom est plausible, l'interface ne le connaît pas — appliquée aux
composants au lieu du serveur.

**Et la lecture a corrigé plus qu'un nom.** Les deux composants attendent le même **contrat structuré
D-05** — `{ term, unit, remaining, opened_on, stages[], will[], can[], at_term }` — dont le commentaire
dit : « `remaining` vient du SERVEUR. Une échéance de droit ne se calcule pas au front : deux appareils
mal réglés produiraient deux dates limites. » Mes props inventées auraient fait calculer le décompte
dans la vue.

Et `will` / `can` sont **deux listes, jamais une** : « ce qui se produira sans ce qui reste possible
transforme une information en menace ». Sur une suspension sous appel, elles disent ce qui est arrêté
et ce qui a repris — les titres sont surchargés pour cela.

**4.2 — Un calcul en double.** J'avais mis le plafond de reprise dans la vue **et** dans le panneau
d'appel. Deux calculs du même nombre : le bandeau aurait pu afficher un plafond qui cesse de s'accorder
avec le champ qu'il borne. Retiré de la vue — il vit là où il sert, à côté du champ.

**4.3 — BLOQUEUR : le panneau d'appel plantait sur un dossier disciplinaire sans appel.**
`extra` vient de `PROCEDURES[kind].extra`, qui vaut toujours « appel » pour la discipline. Mais c'est ce
que la **procédure peut porter**, non ce que **ce dossier porte** : un dossier classé sans sanction n'a
pas d'appel, et le panneau se montait quand même. Un clic sur `DIS-2027-019` levait
`Cannot read properties of undefined`.

**Le patron dit ce qui est possible ; le dossier dit ce qui est là.** Une dérivation `extra_applies`
sépare les deux, et l'écran dit pourquoi le panneau est absent — « aucun appel n'a été déposé, et un
dossier classé sans sanction n'en attend pas » — plutôt que de le retirer sans raison.

⚠️ Et mon patron déréférençait sans garde alors que mon script employait `?.` **partout**. Les deux
protections sont maintenant en place : le montage conditionné, et la garde dans le patron.

**4.4 — Le fil de procédure ne rendait rien de ce qu'il annonce.** `ProcedureChain` attend
`{ key, actor, label, date, status, isMine }`. J'émettais `{ key, label, state }` — champ nommé
`state`, sans acteur ni date.

Aucune erreur : `s.status` valait `undefined`, les cinq fonctions de ton retombaient toutes sur la
branche « à venir », et les quatre étapes rendaient en **gris identique** — sans étape courante, sans
`aria-current`, acteur vide et date à « — » partout.

⚠️ **C'est le composant qui porte la thèse de cette grappe**, et il s'affichait comme quatre colonnes
indistinctes. C'est le §4.1 reproduit un niveau plus bas : une interface écrite de mémoire au lieu
d'être lue.

⚠️ **Et le contrôle né du §4.1 ne pouvait pas le voir.** `steps` *est* une prop réelle : « toute prop
existe à son `defineProps` » passe. Il valide les **noms**, jamais la **forme** des objets transportés.
Un contrôle qui garde les noms ne garde pas les formes — c'est une classe de plus, et elle a son
contrôle au §5.

**4.5 — J'ai annoncé une séparation de modules sans la faire.** Quatre lectures restaient dans
`dossiers.js` **et** dans `dossiers-read.js`, et elles avaient déjà divergé : l'une prenait un
paramètre, l'autre non.

C'est « deux listes du même ensemble divergeront » appliqué au module d'appel — et je l'ai enfreint dans
la grappe où je le cite deux fois. **Annoncer une séparation ne la fait pas.**

**4.6 — Et une sonde de plus a accusé du code correct**, en comptant un déréférencement non gardé qui
n'existait que dans le commentaire documentant sa correction. Huitième fois, et **troisième fois
exactement sur ce motif** — une sonde qui cherche un texte dans du code doit exclure les commentaires,
ou dire qu'elle ne le fait pas. Le motif est stable : je vérifie plus vite que je ne rédige la
vérification.

**4.7 — Et le contrôle que j'ai ajouté pour fermer le §4.4 était VACUEUX — trois fois de suite.**

Il a fallu trois tours pour qu'il regarde vraiment quelque chose, et chaque défaut était de la même
famille : **le contrôle avait l'air de couvrir plus qu'il ne couvrait.**

1. **Il résolvait le fabricant par le nom de la prop** (`steps:`) alors que le fabricant construit sous
   la clé que la liaison désigne (`chain:`). Aucun sujet trouvé, vert sur quarante-trois patrons sans
   examiner un seul objet. Corrigé en **suivant la liaison**.
2. **Son garde « sans sujet » était global**, donc un contrat qui trouvait son fabricant masquait
   l'absence totale de couverture de l'autre. Cette version ne savait lire que **deux** contrats — le
   dépôt en compte treize, et `ActionBar.actions` était silencieusement non couvert, parce qu'il est
   construit en **littéral** et non par projection.
   Corrigé en rendant le garde **par contrat** et en reconnaissant les deux formes de fabricant.
3. **Son extraction de clés ne lisait que la première de chaque objet** (`(?:^|\{)`), puis, corrigée
   trop largement, elle attrapait `write:` à l'intérieur de `can('write:structure')` — une clé de
   permission prise pour une clé d'objet. Corrigé en neutralisant les chaînes d'abord.

⚠️ **C'est la classe que j'avais nommée au §6.4 de la grappe 4** — vert par absence — et je l'ai
réintroduite trois fois dans le contrôle même qui devait fermer un défaut. Le motif est constant : à
chaque tour, le contrôle passait vert **et je l'annonçais comme éprouvé**.

4. **Et la quatrième version a produit quatre-vingt-dix faux positifs.** Les noms de clés du dépôt sont
   génériques — `items`, `days`, `conflicts` — donc suivre la liaison par nom attribue à
   `TimeGrid.items` tous les `items:` du dépôt, y compris ceux des files de travail.

**J'ai alors retiré le contrôle.** La vérification de forme n'est pas atteignable par appariement de
noms, et le rendre sain demanderait de suivre le flot de données — hors de portée d'un audit écrit à
l'expression régulière. Le §5 dit ce qui l'a remplacé.

Quatre leçons, et la dernière est celle qui manquait :

- **un contrôle s'éprouve depuis le code commis**, jamais depuis une sonde réécrite ;
- **un contrôle sans sujet doit le dire**, et le dire **par sujet** ;
- **un contrôle s'éprouve aussi dans le sens des faux positifs** — un contrôle qui ne passe pas au vert
  sur du code juste est aussi cassé qu'un contrôle qui passe au vert sur du code faux ;
- **et un contrôle qu'on ne peut pas rendre sain se retire.** Quatre tours à le rapiécer valaient moins
  qu'un tour à reconnaître qu'il ne pouvait pas fonctionner. Le remplaçant vérifie moins et le dit —
  c'est la seule forme d'honnêteté qui reste à un garde-fou dont on a mesuré la portée.

---

**4.8 — Et l'écran A8 était servi par DEUX chaînes concurrentes, qui avaient déjà divergé.**

`listAwaitingOtherDecider` était exporté par `queues.js` **et** par `dossiers-read.js`, vers deux chemins
différents, servis par deux fixtures de formes **incompatibles** : l'une avec `id` / `instructed_role` /
`sole_holder`, l'autre avec `name` / `kind_label` / `decider_role` — et `kind` portant une clé d'un côté
contre un libellé de l'autre. Une vue écrite contre l'une cassait sur l'autre.

La chaîne de `queues.js` portait en plus un **chemin inventé sans marqueur** :
`emela_core.academic_core.api.queues.awaiting_other_decider`, alors que le §6 de ce même relevé écrit
« cherché `awaiting`, `no_decider`, `other_decider` dans toute la surface — aucune correspondance ». Un
lecteur back qui aurait cherché `awaiting` aurait trouvé les deux et cru à un point d'entrée existant.

C'est **« deux listes du même ensemble divergeront — pas *peuvent* »**, la règle que ce relevé cite deux
fois, non gardée à l'endroit où elle a mordu.

⚠️ **Et le contrôle qui devait la garder n'existait pas** : le §7 affirmait « aucun doublon d'export
entre le module d'actes et le module de lectures » sur la foi d'une sonde jetable — vrai de cette paire,
jamais exécuté par le script, et **borné à ce que je venais de corriger**. Le doublon vivait entre
`queues.js` et `dossiers-read.js`, une paire que rien ne balayait.

**Un contrôle né d'un défaut doit garder la CLASSE du défaut, pas son instance** — sinon il certifie
exactement le cas qui ne peut plus se produire. Le contrôle est maintenant dans le script, sur tous les
modules d'appel, et éprouvé en réintroduisant le doublon.

**4.9 — Et la suppression a cassé l'audit, que j'ai déclaré vert.**

En retirant la fixture `awaitingOtherDecider` de `fixtures.js`, je n'ai pas retiré **sa sonde**.
`fx.awaitingOtherDecider.items` levait un `TypeError`, la section des sondes échouait, et le code de
sortie de l'audit basculait à 1.

⚠️ Ma vérification de fin de tour n'avait exécuté que **le bloc modifié** plus la passe de syntaxe. La
syntaxe était verte ; le défaut n'existait qu'à l'exécution, et seule la section des sondes le montrait.

**Une suppression a des dépendants ailleurs : re-lancer la section touchée ne suffit pas.** C'est
exactement la leçon du §4.8 — garder la classe, pas l'instance — appliquée à la vérification elle-même.

⚠️ **ET J'AI ÉCRIT DEUX JUSTIFICATIONS FAUSSES POUR LE CONTRÔLE QUE J'AJOUTAIS.**

La première : « l'audit s'arrêtait avant les autres contrôles ». **Inféré, et faux.** `check()`
incrémente un compteur et rend un booléen ; l'appel de cette section ne teste pas ce retour ; les seuls
`process.exit` du script sont ailleurs. L'audit continuait.

La seconde, écrite pour remplacer la première : « le diagnostic était un `TypeError` opaque, ce contrôle
le nomme ». **Faux aussi** — la boucle des sondes pousse `name + ' → ' + e.message` dans `dead`, donc le
nom de la sonde était déjà en tête du message. Il suffisait de lire la ligne au-dessus de celle que je
corrigeais.

C'est la **règle 9 appliquée au récit du défaut** : un verdict n'appartient qu'à ce qui a tourné — y
compris quand il porte sur la gravité de son propre défaut, et y compris quand on vient de rétracter le
précédent. Deux fois de suite, j'ai justifié un contrôle par une conséquence que je n'avais pas
vérifiée.

⚠️ **Ce qui le justifie réellement**, et c'est une garantie distincte : `probeOrphans` couvre un cas que
la boucle des sondes ne peut **pas** voir — une sonde qui appelle une fixture supprimée **sans lever**.
`() => fx.foo?.items?.length` rend `undefined`, la boucle ne capture rien, et rien ne signale que la
fixture n'existe plus. Éprouvé : une sonde gardée par `?.` sur une fixture absente est invisible à la
boucle et signalée par ce contrôle.

⚠️ Et il s'indexe sur les `fx*.<nom>` du **corps** de la sonde, non sur son libellé — sans quoi un
libellé descriptif serait signalé à tort, et une sonde appelant deux fixtures ne serait couverte que
pour la première. Éprouvé dans les deux sens.

**4.10 — Et mon correctif du §4.8 a corrigé l'instance en laissant la classe.**

Un verdict avait nommé **un** chemin inventé sans marqueur dans `queues.js`. J'ai supprimé cette
ligne-là et laissé **ses deux sœurs dans le même fichier**, plus deux dans `session.js` — soit les
quatre points d'entrée dont dépend tout le châssis : session, contexte, « À traiter », pastilles.

Le manifeste les marquait 🔴 depuis la grappe 1 ; `src/api/` les présentait sans réserve. **C'est
depuis `src/api/` que le back-end câble** : deux documents qui se contredisent sur le statut d'un
chemin valent moins qu'un seul, parce que le lecteur croit celui qu'il a sous les yeux.

⚠️ **Dans le fichier même où j'écris que corriger l'instance ne suffit pas.** Le §4.8 formule la règle,
et le correctif qui en découle la viole trois lignes plus loin.

Les quatre chemins portent maintenant leur 🔴, en en-tête de module et sur chaque export. Et la classe
est fermée par un contrôle qui confronte les chemins de `src/api/` au marquage du manifeste — mécanique,
puisque le manifeste porte déjà la liste, et valable pour les grappes à venir.

⚠️ **Ce contrôle a d'abord signalé trois chemins de plus, et les trois étaient des faux positifs de ma
propre extraction** — pour deux raisons différentes.

Elle moissonnait les identifiants de **blocs entiers**. Elle accusait donc `get_structure_tree` et
`update_ue`, qui sont les **exemples de la légende** définissant le marqueur — et qui y sont donnés 🟡,
non 🔴. Et elle accusait `get_deliberation_dashboard`, dont la section ne porte **aucun** 🔴 : il est
🟢 confirmé, et la moisson l'avait ramassé depuis un bloc voisin.

Un contrôle qui moissonne large accuse la documentation de ses propres exemples. La convention du
manifeste est **par ligne** ; le contrôle la suit maintenant, et les trois faux positifs sont partis.

⚠️ **Donc ce contrôle n'a trouvé aucun chemin réel au-delà des quatre déjà nommés.** J'avais écrit
« trois de plus » puis « deux étaient des faux positifs », ce qui laissait conclure qu'il en restait un
de vrai. Il n'y en avait pas. Sa valeur est démontrée par ses **épreuves** — retrait des marqueurs de
`queues.js`, puis de `session.js`, puis manifeste absent — non par une prise.

## 5. Ce que l'audit garde en plus

- **toute prop passée à un composant existe à son `defineProps`** — né du §4.1, et il ferme une classe
  que rien ne voyait : Vue ne lève pas, l'écran rend un cadre vide. Éprouvé sur une prop inventée, une
  prop réelle en camel, la même en kebab, une directive et une classe. Tous les composants du dépôt lus ;

- **toute prop de tableau porte un contrat lisible ET conforme à ce que le composant lit** — et ce
  n'est pas le contrôle que j'avais d'abord annoncé.

⚠️ **J'ai voulu vérifier la FORME des objets passés dans une prop de tableau. Ce n'est pas atteignable
ici, et il a fallu quatre versions pour l'admettre.**

Pour vérifier une forme, il faut attribuer un fabricant à un contrat. Le seul lien statique est la
liaison — `:items="gridItems"` → `gridItems`. Mais **les noms de clés du dépôt sont génériques** :
`items`, `days`, `conflicts`, `queueItems`. `TimeGrid.items` et `WorkQueue.items` se lient tous deux à
`items`, et chaque fixture qui expose un `items:` devient un fabricant candidat. La quatrième version a
produit **quatre-vingt-dix faux positifs** — dont « `title` n'est pas au contrat de TimeGrid.items » sur
une file de travail, qui est juste.

Un appariement par nom est donc faux dans les deux sens, et le rendre sain demanderait de suivre le flot
de données. **J'ai retiré le contrôle plutôt que de le laisser mentir.**

À sa place, ce qui *est* vérifiable sainement : **toute prop `type: Array` porte un contrat lisible, et
conforme à ce que le composant lit**. Un contrat écrit se relit avant d'être alimenté ; un contrat absent
se devine — et c'est exactement ce
qui a produit le défaut du fil (§4.4), où j'avais écrit la forme de mémoire parce que rien ne
m'obligeait à la lire.

⚠️ **Et le contrôle a immédiatement trouvé cinq props sans contrat lisible** : `AppShell.navGroups`,
`AppShell.bottomItems`, `TreeEditor.nodes`, `TreeEditor.addActions`, `WorkQueue.items`. Les cinq sont
maintenant documentées.

⚠️ **Et une sixième s'est ajoutée au tour suivant** : `TimeGrid.legend`, que j'avais mise dans la liste
d'EXCLUSION du contrôle sur la foi de son nom, sans lire le composant — qui déstructure `l.label` et
`l.color`. Un vrai contrat d'objet, exclu avec une justification fausse, et construit à la main dans
deux vues indépendantes : une dérive de `color` aurait rendu les pastilles de légende invisibles.

**Une liste d'exclusion est un endroit où un contrôle cesse de regarder.** Elle se vérifie au moins
aussi soigneusement que ce qu'il regarde — et c'est le seul endroit qu'aucun des tours de revue n'avait
examiné.

⚠️ **ET DEUX DES CINQ CONTRATS QUE J'AVAIS ÉCRITS ÉTAIENT FAUX.** Le contrôle ne vérifiait que la
PRÉSENCE d'un commentaire, jamais sa VÉRITÉ : il est donc passé au vert sur `TreeEditor.nodes`, faux
sur six clés de huit — `key` au lieu de `id`, `depth` au lieu de `level`, et quatre clés jamais lues.
Le commentaire du composant, **deux lignes au-dessus**, disait « node.level porte la profondeur ».

**Un contrat faux est pire qu'un contrat absent** : il se lit avec confiance. Qui l'aurait suivi aurait
obtenu un arbre plat, sans surlignage de sélection, sans caret — le composant aurait cessé d'être un
arbre. Et `WorkQueue.items` omettait `done`, l'état « traitée ».

Je les avais écrits **de mémoire**, dans la session même dont les §4.4 et §4.7 diagnostiquent cette
habitude.

⚠️ **Le contrôle compare maintenant le contrat aux déréférencements du composant lui-même** — les
`x.clé` sur sa variable d'itération. C'est **local à un fichier**, sans appariement de noms : donc sans
aucun des quatre-vingt-dix faux positifs qui ont fait retirer la vérification de forme. Ce que je
croyais inatteignable ne l'était que dans un sens — l'attribution fabricant → contrat. La comparaison
contrat → composant, elle, était à portée.

⚠️ **Et il a fallu un tour de plus pour que la comparaison descende dans les groupes imbriqués.** Un
contrat qui déclare `activities: [{ … }]` a une seconde boucle, et ce niveau n'était comparé pour
**aucun** des treize contrats. `CoveragePanel.activities` omettait donc `pending_hours` — le champ qui
porte les heures posées sans enseignant, dont le relevé de la grappe 3 dit que « les taire ferait croire
à un oubli ». Qui aurait lu ce contrat n'aurait jamais affiché cette phrase.

Deux défauts d'extraction en sont sortis, tous deux invisibles autrement : la notation `lines[]` que je
ne reconnaissais pas, et un extracteur de contrat en ligne qui **tronquait à la première accolade** —
donc un groupe imbriqué n'était jamais intact.

Éprouvé dans les deux sens et aux deux niveaux : un contrat externe faux signale toutes les clés que le
composant lit et que le contrat omet ; retirer `pending_hours` du groupe imbriqué le signale nommément ;
retirer `done` de `WorkQueue` le signale ; et le dépôt intact ne produit aucun faux positif.

Les trois exclusions restantes sont vérifiées **dans le code** et non sur leur nom :
`BlockState.skeletonWidths` et `DenseTable.skeletonWidths` portent des nombres, `AccessDenied.allowed`
et `AppShell.roles` des chaînes — cette dernière est jointe par `.join(' · ')`, ce qui le prouve.
Treize props de tableau portent une forme d'objet ; treize sont documentées.

⚠️ **Le contrôle dit aussi ce qu'il NE fait pas.** Un contrôle qui laisserait croire qu'il vérifie les
formes serait pire que son absence : c'est la classe « vert par absence », et je l'ai réintroduite trois
fois de suite en essayant de la fermer.

⚠️ **Et le contrôle « chaque fixture est éprouvée » a signalé six fixtures de cette grappe hors des
sondes** — troisième grappe de suite où il attrape un défaut postérieur à son écriture. C'est le seul
contrôle du script dont l'utilité se soit vérifiée trois fois.

---

## 6. Ce qui manque, nommé

**La file transversale des dossiers.** Les lectures serveur sont **par procédure** : cinq points
d'entrée, chacun avec ses filtres et sa forme. Or un Education Manager ne pense pas « je vais traiter
mes réorientations » : il traite ce qui attend.

⚠️ **Et la bonne forme n'est pas un sixième point d'entrée.** Il aurait sa propre construction de
ligne, qui divergerait des cinq autres. `work_queue` porte déjà le domaine `dossiers` : il suffit
qu'il rende, pour ce domaine, la ligne dont l'écran a besoin. **Une seule construction, celle qui
alimente déjà « À traiter ».** C'est la règle 6 appliquée au contrat, comme au §2.1 de la grappe 6 — et
c'est la seconde fois qu'elle donne la même réponse : étendre le point d'entrée existant, jamais en
ajouter un parallèle.

**Les dossiers en attente d'un autre décideur.** L'écran A8 du lot 8. Cherché `awaiting`,
`no_decider`, `other_decider`, `instructed_by` dans toute la surface d'appel — **aucune
correspondance**. Le manque n'a pas bougé depuis le lot 8, et le périmètre non plus : le filtre par
instructeur ne couvre que deux procédures. L'écran le dit dans un second bandeau plutôt que de
promettre une exhaustivité qu'il n'a pas.

⚠️ **Une seule issue** — « désigner un décideur ». « Reprendre l'instruction » reste retirée : le
dossier disciplinaire ne porte **aucune estampille d'instructeur**, seul le rôle instruit. Une issue
qui échouerait ne se propose pas.

---

## 7. Ce qui a tourné, et sous quel exécutant

**Ce que j'ai exécuté** — mon bac à sable JavaScript :

- analyse syntaxique des modules de `src/` et des blocs `<script setup>`, plus `audit.mjs` ;
- **props passées contre `defineProps`** de tous les composants du dépôt — aucune inventée ;
- le contrôle des props éprouvé sur cinq formes : prop inventée signalée, prop réelle en camel et en
  kebab acceptées, directive et classe ignorées ;
- **le patron des six procédures**, et le fil dérivé de chacune : les étapes se déduisent de la table,
  et les états du fil de l'étape atteinte ;
- **les fixtures éprouvées** : cinq modules dérivés du dossier, tous leurs exports appelables sondés,
  toutes les sondes répondent ;
- imports morts, appels de vue sans handler, balises et cellules imbriquées ;
- **le fil rendu**, dossier par dossier : les quatre états, les acteurs et les dates réelles ;
- **le contrôle des contrats de prop-tableau**, depuis le bloc extrait du script commis : treize
  contrats documentés, aucun manquant, vérifiés aux **deux niveaux** — externe et imbriqué. Éprouvé
  dans les deux sens : un contrat retiré est signalé, un contrat faux aussi, et le dépôt intact ne
  produit aucun faux positif.
  ⚠️ **Ce qu'il garantit** : le contrat est lisible, et conforme à ce que le composant **lit**.
  ⚠️ **Ce qu'il ne garantit pas** : la forme des objets **fabriqués** côté producteur — c'est cette
  vérification-là qui a été retirée, et le §5 dit pourquoi ;
- **la dérivation applicable** sur les neuf dossiers : « appel · non portée » sur le dossier classé
  sans sanction, qui plantait avant ;
- **les cinquante sondes exécutées toutes**, et non la seule touchée : chacune répond, aucune n'appelle
  une fixture supprimée — contrôle indexé sur le **corps** de la sonde et éprouvé sur le cas qu'une
  sonde gardée par `?.` rend invisible —, et aucune fixture n'est inéprouvée ;
- **tout chemin 🔴 du manifeste porte son marqueur dans `src/api/`** — les chemins 🔴 du manifeste, dont
  ceux que `src/api/` appelle, éprouvé en retirant les marqueurs de `queues.js` puis de `session.js`, et
  sur l'absence du manifeste. ⚠️ Aucune prise réelle : sa valeur vient des épreuves (§4.10) ;
- **aucun nom d'export partagé entre deux modules d'appel** — 160 exports sur douze modules.
  ⚠️ **Ce contrôle n'existait pas dans le script** : je l'avais vérifié par une sonde jetable et porté
  ici comme « aucun doublon d'export entre le module d'actes et le module de lectures ». Vrai de cette
  paire, jamais exécuté, et borné à ce que je venais de corriger. Voir §4.8.

**Ce qui n'a pas tourné** — `npm run audit` avec les contrôles ajoutés depuis son premier passage réel,
`npm run dev`, les trois bascules.

**Ce qu'aucun des deux ne verra** — si les cinq panneaux de dérivation se lisent comme des variantes
d'un même écran ou comme cinq écrans différents. C'est l'enjeu de forme de cette grappe : le patron
doit se sentir, sinon j'ai fait six écrans en croyant en faire un.

---

## 8. Ce qui reste de la grappe 7

**Produit** : la file des six procédures, le fil dérivé, l'identité, le motif de décision, les cinq
panneaux de dérivation, et l'écran « en attente d'un autre décideur ».

**Non produit, et pourquoi :**

**Les actes.** Aucun n'est branché — les boutons le disent. Les points d'entrée sont lus et nommés,
mais chaque acte demande un formulaire dont le vocabulaire n'a pas de source lue : les catégories de
motif de chaque procédure (`ground_category`, `decision`, `new_academic_status`). Les inventer serait
inventer un vocabulaire réglementaire, ce qui est pire qu'inventer un chemin — un chemin faux ne
résout pas, un motif faux s'enregistre.

**La liste des suspensions échues dont l'accès reste fermé.** `list_suspensions_needing_moodle_reactivation`
existe et a sa fixture, pas son écran. **Elle mérite mieux qu'un onglet** : sans elle, un étudiant
reste fermé après le terme de sa sanction et personne ne le sait — dette du chantier
d'authentification, comme le badge d'accès de la grappe 4. À trancher : écran propre, ou entrée dans la
file « À traiter » ?

**La vue de l'étudiant.** `get_my_coa_requests`, `get_my_disciplinary_cases`,
`get_my_resignation_requests`, `get_my_reorientation_requests`, `get_my_leave_return_requests` et
`get_my_status_cause` sont tous lus et nommés — six lectures pour l'espace personnel. Elles portent les
écrans 4-bis et A5 du lot 8, et **elles appartiennent au self-service**, non à cette application.
À confirmer : est-ce que ces écrans-là me reviennent ?
