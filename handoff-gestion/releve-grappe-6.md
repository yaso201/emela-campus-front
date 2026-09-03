# Relevé — grappe 6 : notes, délibération, examens

L'écran le plus difficile du système, et ce que la lecture du code a rendu plus simple que prévu.

---

## 1. Ce qui existait déjà, et que je n'aurais pas trouvé sans lire

Ce que la conception réclamait comme des ajouts et qui était **déjà là**, avec les mêmes mots.

**Le croisement notes ↔ assiduité.** L'amendement A7 du lot 8 demandait qu'un zéro d'évaluation et un
zéro d'absence ne se lisent pas de la même façon. `list_submissions_for_control(include_attendance=1)`
le fait, et sa docstring porte la phrase de la maquette :

> « au contrôle, un zéro d'évaluation ne se lit pas comme un zéro d'absence (Art. 12.3) »

Elle ajoute une précision que je n'avais pas : « mêmes rôles, aucune donnée nouvelle : un croisement ».
C'est ce qui justifie qu'il tienne sur le même point d'entrée et la même garde.

**L'historique du conseil pédagogique.** L'ajout que le lot 8 appelait « le plus important » existe
sous le nom `cps_history`, et sa docstring dit exactement ce que la maquette revendiquait :

> « Le jury voit tout (Art. 32.4) : les préconisations du CPS (avec le constat du contrat) et
> l'absence NON justifiée à une convocation (32.5) — des INFORMATIONS présentées au jury, jamais des
> décisions (32.3). »

Et il porte `finding` — le constat du contrat de remédiation — plus `closed_on`. Le cas « contrat sans
constat », que le lot 7 avait fait passer des anomalies aux continuations, se lit donc dans les
données : `finding` est nul, et le jury le lit tel quel.

**L'historique est lu sur TOUS les semestres de l'année**, pas sur le semestre délibéré. C'est ce qui
fait que l'alerte de janvier éclaire la décision de juillet — et c'était une décision serveur, pas une
demande de la conception.

---

## 2. Ce que la lecture a appris, et qui change les écrans

### 2.1 Le tableau de jury ne liste que les décisions déjà instruites

`get_deliberation_dashboard` itère `doc.decisions`. Un jury de quatre-vingt-seize étudiants dont onze
sont décidés en reçoit **onze**.

La maquette du lot 8 montrait les quatre-vingt-seize, avec onze décisions prises. Elle avait raison sur
l'usage : le tableau sert à décider ce qui reste, non à contempler ce qui est fait. Mais le point
d'entrée ne le permet pas.

Deux façons de s'en sortir, et j'ai choisi la seconde :

- **composer la liste au front**, depuis les inscriptions et les résultats de semestre. C'est la
  règle 6 par la porte de derrière : une seconde liste du même ensemble, qui divergerait du jury dès
  la première décision instruite ;
- **nommer le manque**, poser un point d'entrée unique pour lui, et **le dire à l'écran**. Un encart
  ambre annonce « quatre décisions instruites sur huit — les autres sont affichés depuis une lecture
  qui n'existe pas encore côté serveur ».

⚠️ Et la forme demandée est un **drapeau**, non un second point d'entrée :
`get_deliberation_dashboard(name, include_pending=1)`. Un drapeau garde une seule construction de
ligne au serveur ; deux points d'entrée en auraient deux, et elles divergeraient à la première
évolution. C'est la règle 6 appliquée au contrat plutôt qu'aux données — et c'est la première fois que
je la formule dans ce sens.

### 2.2 Une condition du maker-checker est invérifiable au front

La clôture exige trois choses : (a) ne pas être le créateur, (b) être directeur des études ou
direction, (c) un jury enregistré. La première demande de savoir qui a instruit — et le savoir ne
suffirait pas, puisque c'est le serveur qui doit trancher.

L'écran affiche donc le bouton selon `close:deliberation` et laisse le serveur refuser. Et il l'écrit
avant l'acte, dans la boîte de clôture : **« si le serveur refuse, ce n'est pas une erreur : c'est le
maker-checker qui fonctionne »**. Sans cette phrase, un directeur des études qui a instruit lui-même
lirait le refus comme une panne.

### 2.3 La dérogation d'assiduité se joue en deux moments

Le flag est posé à l'instruction, le motif est exigé **à la clôture**. `add_decision` accepte le champ,
mais l'avoir saisi tôt ne dispense pas de la vérification au moment de clore.

La boîte de clôture nomme donc les passages en dépassement et réclame le motif là — pas à
l'instruction. Et elle porte la phrase du règlement : « le jury reste souverain (Art. 31.2) : le
dépassement ne refuse pas le passage, il refuse un passage sans motif ».

### 2.4 L'échéance de saisie a deux règles, et l'écran doit dire laquelle s'applique

`set_module_deadline` pose une échéance explicite par composante, « prioritaire sur dernière séance ».
Donc une échéance absente n'est pas une absence d'échéance : elle retombe sur la dernière séance
planifiée du module. Un enseignant qui l'ignore croit avoir le temps.

---

## 3. Les décisions de cet écran

### 3.1 La synthèse est le défaut, et c'est une mesure

Le lot 2 l'avait tranché, le lot 8 l'avait perdu puis rétabli. Avec le bloc de décision épinglé,
quatorze colonnes forcent un défilement horizontal sur quatre-vingt-seize lignes.

La synthèse porte donc, par semestre : moyenne, crédits acquis sur possibles, et **les unités non
acquises nommées par leur code**. Le jury voit lesquelles, pas combien. Un clic ouvre le panneau
latéral ; **pas de survol** — sur un tableau de cette densité, il déclencherait sans intention.

### 3.2 Deux blocs épinglés, et ce qui éclaire la décision ne la quitte pas

L'identité à gauche, `conseil · proposition · décision` à droite. Les unités défilent entre les deux.
C'est la formulation du lot 8, et elle tient parce que la synthèse la rend possible.

### 3.3 Le panneau d'unité porte la RAISON, pas seulement la note

C'est la décision dont je suis le moins sûr et celle qui me paraît la plus utile.

Un étudiant peut avoir onze de moyenne au semestre et ne pas le valider, parce qu'une unité est sous
le plancher de six — **et le plancher empêche la compensation**. Sans explication, la décision de
redoublement passe pour arbitraire, et c'est exactement ce que le jury ne peut pas se permettre.

Le panneau d'une unité sous plancher dit donc :

> « La moyenne est sous le plancher de 6/20. Le plancher EMPÊCHE la compensation : cette unité ne peut
> pas être rattrapée par la moyenne du semestre, même si celle-ci atteint 10. C'est la règle qui fait
> qu'un étudiant au-dessus de la moyenne peut ne pas valider. »

⚠️ **Cette règle est mon interprétation du modèle**, pas une docstring lue : `has_floor_violation`
existe et `is_compensated` existe, mais aucune fonction lue n'énonce leur interaction. Le simulacre
l'implémente ainsi, l'audit le vérifie, et je le signale comme à confirmer — voir §7.

### 3.4 « Compensée » n'est pas « acquise », et trois tons le disent

Vert pour acquise, ambre pour compensée, rouge pour non acquise, et un fond rouge pour la violation de
plancher. Confondre compensée et acquise ferait disparaître l'information dont le jury a besoin : une
unité compensée a été rattrapée par les autres, elle n'a pas été réussie.

### 3.5 Une préconisation sans constat n'est pas en échec

Elle est **non constatée**, et la pastille le dit dans ces mots : « Contrat · non constaté », en ambre,
jamais en rouge. Le panneau ajoute que le propriétaire peut encore poser le constat, et que le jury le
lit tel quel. C'est la correction du lot 7 — le contrat sans constat est une continuation, pas une
anomalie — portée jusqu'au tableau du jury.

### 3.6 « Aucune préconisation » se rend discret

C'est le cas majoritaire. Un vide qui inquiète sur la ligne de deux étudiants sur trois rendrait la
colonne illisible : le texte est en gris, sans pastille, sans lien.

### 3.7 « Inscrire n'est pas convoquer » est écrit à trois endroits

Une seule mention se lit une fois et s'oublie. L'écran d'épreuve le porte dans le bandeau, dans
l'encart sous l'épreuve — **avec deux phrases différentes selon l'état de publication** — et dans la
légende de la liste, qui dit ce qu'un retrait fait et ne fait pas.

Et le bouton s'appelle **« Publier l'épreuve »**, jamais « Convoquer ». L'acte a un nom, ses effets en
ont un autre. Nommer le bouton par son effet promettrait que la convocation est l'acte.

---

## 4. Les défauts trouvés en revue

**4.1 — J'ai enfreint la règle 6 dans l'écran où je l'énonce.** L'écran de composition d'épreuve
écrivait les huit étudiants du groupe **à la main, dans la vue**, alors que `groups.get_group(name)`
rend déjà les membres. Deux listes du même ensemble, qui auraient divergé au premier changement de
groupe. Corrigé en lisant le vrai point d'entrée — et une fixture a été **supprimée** au passage : elle
dupliquait la même chose côté données. Une fixture de moins est une divergence de moins.

**4.2 — Le groupe de promotion ne recoupait pas les candidats.** Il portait quarante-quatre étudiants
générés (« Étudiant 1 — promotion ») ; la liste des candidats portait les huit étudiants nommés.
Résultat : « déjà inscrit » n'aurait **jamais** été vrai, et la branche du peuplement partiel ne se
serait pas ouverte. Les huit premiers membres de la promotion sont maintenant les étudiants nommés.

C'est la troisième occurrence de la même cause — après le groupe au-delà de sa capacité ramené à deux
membres, et les séances à publier toutes exemptes de préavis. La formulation tient : **un jeu d'essai
cohérent n'est pas un jeu d'essai suffisant**. Ici, deux jeux d'essai chacun cohérent ne se recoupaient
pas, ce qui est une variante : la cohérence interne d'une table ne dit rien de sa cohérence avec les
autres.

**4.3 — Six fixtures de cette grappe étaient hors des sondes de l'audit.** Le contrôle « chaque fixture
est éprouvée », écrit à la grappe 4, les a signalées. C'est la deuxième grappe de suite où il attrape
un défaut postérieur à son écriture.

**4.4 — Une cellule de tableau dans une cellule de tableau, dans l'écran le plus difficile.**
L'onglet de synthèse — celui qui s'ouvre par défaut — enveloppait les deux cellules de chaque semestre
dans un `<td class="contents">`. Une cellule n'est admise que comme enfant de `<tr>` ; le compilateur
Vue ne fait pas respecter les modèles de contenu HTML, donc le DOM contenait littéralement un `<td>`
dans un `<td>`.

⚠️ **La conséquence n'était pas cosmétique.** L'alignement des trois colonnes épinglées dépendait de
`display:contents` honoré sur une imbrication invalide. Non honoré, le corps comptait sept fentes
contre neuf à l'en-tête, et `conseil · proposition · décision` se décalait de **deux colonnes** —
c'est-à-dire que la garantie sur laquelle cet écran est entièrement construit tombait. Plus un modèle
d'accessibilité rompu : une cellule contenant des cellules, sans position de ligne ni de colonne.

Le construit juste est `<template v-for>`, qui ne génère aucun élément — et **il était déjà employé
deux lignes plus haut** dans le même patron. Je ne l'ai pas appliqué là où il fallait.

⚠️ **Et mon contrôle de balises l'a laissé passer, par construction.** Il vérifie l'ÉQUILIBRE, jamais
la LÉGALITÉ de l'imbrication : `td` pousse, `td` pousse, `</td>` dépile — tout apparie. Un contrôle
neuf le ferme, éprouvé sur cinq formes (le défaut, le correctif, des cellules normales, un `th` dans
un `td`, un tableau imbriqué).

**4.5 — Et les deux sous-colonnes de chaque semestre n'avaient aucun en-tête.** Le `<thead>` ne
comptait qu'une ligne : `Semestre 1` en `colspan=2`, `Semestre 2` en `colspan=2`. Sur l'onglet par
défaut, le jury voyait donc deux colonnes **sans nom** — l'une portant « 10,85 / 33-36 », l'autre
« UE 3.1 UE 3.2 ». Seule la légende sous le tableau les nommait.

C'est une régression sur la maquette validée du lot 8, qui portait **deux** lignes d'en-tête. Et c'est
prononcé précisément là où ça coûte le plus : sur le tableau que ce relevé appelle lui-même le plus
dense du système, une colonne de codes d'unité sans intitulé annule l'effort de « le jury voit
lesquelles, pas combien ».

Rétabli, avec `rowspan=2` sur l'identité, l'année et les trois colonnes épinglées. La hauteur des
cellules d'en-tête devient **explicite** (30 px), parce que la seconde ligne se colle à `top: 30px` :
une hauteur laissée au contenu ferait glisser la seconde ligne sous la première au défilement.

**4.6 — Un accent grave non échappé** dans un littéral, qui a fait échouer l'écriture du manifeste.
Trouvé par l'échec lui-même — mais il mérite d'être noté : c'est la classe des défauts que seule
l'exécution révèle, et mon environnement l'exécute.

**4.7 — Ma sonde a compté un résidu dans un commentaire.** En vérifiant le retrait de
`class="contents"`, j'ai compté les occurrences sans exclure les commentaires — le seul restant étant
celui qui **documente le défaut corrigé**. Cinquième fois qu'une sonde accuse du code correct, et la
seconde fois exactement sur ce motif. Une sonde qui cherche un texte doit ignorer ce qui n'est pas du
code, ou dire qu'elle ne le fait pas.

**4.8 — J'ai réintroduit une clé de pastille hors vocabulaire, deux grappes après l'avoir fermée.**
`refuse` n'existe pas au `MAP` de `StatusPill` — le ton rouge s'appelle `renvoyee`. Trois sites : l'absence
non justifiée à la convocation, l'avertissement solennel et le signalement, et la soumission rejetée.

⚠️ **Le défaut était SILENCIEUX**, et c'est ce qui le rend pire que celui de la grappe 4. Là-bas, trois
lignes affichaient littéralement « ok » — visible. Ici le libellé était surchargé partout, donc rien ne
fuyait : **seule la couleur était fausse**. L'absence non justifiée à la convocation — que ce relevé
appelle lui-même « le seul effet automatique de la séance » — s'affichait en gris, dans la même colonne
et à côté du gris « Aucune préconisation ». Dans la colonne que le mandat appelle l'ajout le plus
important du système, le signal le plus grave perdait tout poids visuel.

**4.9 — Et le contrôle d'audit EXISTAIT : il était trop étroit.** C'est la découverte du tour, et elle
vaut plus que la correction. Le contrôle « tout statut employé est une clé de pastille », écrit à la
grappe 4, ne lisait que deux formes : `status: 'x'` en propriété d'objet, et
`:status="cond ? 'a' : 'b'"`. `refuse` est passé par trois formes qu'il ne voyait pas — l'attribut
statique `status="refuse"`, le `return` d'une fonction de ton, et une table de tons.

**Un contrôle plus étroit que la faute qu'il garde laisse passer la faute**, et il donne en plus
l'assurance de l'avoir gardée. C'est une classe distincte du contrôle vacueux (§6.4 de la grappe 4,
vert pour une entrée absente) et du contrôle trop strict : celui-là est vert à bon droit sur ce qu'il
regarde, et aveugle sur le reste.

⚠️ **Et mon premier élargissement a produit douze faux positifs — quatrième fois qu'un contrôle de ce
script interdit le légitime.** Il balayait tous les littéraux d'une fonction de ton et d'une table de
tons, donc il attrapait `includes('solennel')` (un argument), les tons de `TimeGrid` (un **troisième
vocabulaire**, déclaré dans son propre composant), et les statuts de ligne d'un rapport de masse (du
vocabulaire serveur, dans les fixtures).

La correction n'était pas d'allonger la liste des exclusions — c'était de **restreindre l'extraction à
ce qui atteint vraiment une pastille** : d'une fonction de ton, seuls les `return`, et seulement si son
résultat est lié à `:status` ; d'une table de tons, seulement si son nom approche un `status` ; et les
fixtures hors périmètre. Éprouvé dans les deux sens : les cinq formes du défaut sont signalées, un ton
de grille et un argument de fonction passent, zéro faux positif sur tous les patrons de `src/`.

**4.10 — Le bloc épinglé posait deux fois la même propriété, et l'arbitrage ne m'appartenait pas.**
Les quatre aides de position portaient chacune `bg-white` et `z-[2]` ; combinées à un `headCell`
chargé de `bg-ln-gray-50` et `z-[3]`, elles produisaient deux utilitaires de même spécificité sur la
même propriété. **L'arbitrage revient alors à l'ordre d'émission de Tailwind, jamais à l'ordre du
tableau.**

Les deux issues étaient fausses, et aucune n'était choisie :

- si `bg-white` gagnait, la ligne d'en-tête était **bicolore** — quatre cellules blanches contre trois
  en gris, sur l'onglet qui s'ouvre par défaut ;
- si `z-[2]` gagnait, les cellules d'en-tête épinglées égalaient celles du corps, et à égalité le plus
  tard dans le DOM peint au-dessus : **les lignes recouvraient l'en-tête au défilement.**

Et sur les cellules de corps, le `bg-white` inconditionnel **effaçait le survol et la sélection** — sur
les trois colonnes que cet écran existe pour garder sous les yeux. La maquette du lot 8 portait les
trois règles (`gestion/lot8.css`) : en-tête épinglé en `--g-50` à `z-index: 4`, plus `tr:hover td.cpc`
et `tr.sel td.cpc`. Le portage les avait perdues.

**4.11 — Et ma première correction a reproduit le défaut d'un cran.** J'avais séparé la géométrie du
fond, en laissant `z-[3]` sur `headTop` et `z-[4]` sur `headPin` — deux aides d'empilement sur la même
cellule, c'est-à-dire exactement ce que je venais de retirer.

**Séparer les responsabilités ne suffit pas : il faut qu'une seule aide décide de chaque propriété.**
C'est la formulation qui manquait, et elle est maintenant un contrôle d'audit — éprouvé sur les deux
défauts et sur le correctif.

**4.12 — Et deux sondes de plus ont accusé du code correct** : l'une comptant `class="contents"` sans
exclure les commentaires, l'autre cherchant le discriminant de la forme 5 avec une expression fausse.
Sixième et septième fois. Le motif est stable et vaut d'être nommé : **je vérifie plus vite que je ne
rédige la vérification**, et une sonde écrite à la hâte accuse le code qu'elle devrait innocenter.

---

## 5. Ce que l'audit garde en plus

Les contrôles neufs, tous nés de ce que la lecture a appris ou de ce que la revue a trouvé.

- **crédits, validation et unités non acquises se déduisent des unités** — c'est la seule page du
  système où une divergence se lit comme une décision arbitraire. Un jury qui voit « 33/36 » à côté
  d'unités qui n'en donnent que 30 ne peut plus faire confiance à l'écran, et il a raison ;

- **le plancher empêche la compensation, et les DEUX cas existent** — une unité sous plancher non
  compensée, et une unité compensable qui l'est. Sans le second, la règle n'est jamais montrée à
  l'œuvre ;

- **les quatre formes d'historique de conseil sont représentées** — contrat avec constat, contrat sans
  constat, absence non justifiée, aucune préconisation. C'est le contrôle qui empêche la classe du
  §4.2 : un cas qui disparaît du jeu d'essai ferme sa branche sans rien signaler ;

- **l'historique croise les deux semestres** — sinon l'alerte de janvier ne remonterait pas au jury de
  juillet, et l'ajout central du lot 8 serait décoratif ;

- **le dashboard ne rend que les décisions instruites** — le simulacre doit RESPECTER la forme du
  serveur. Un jeu d'essai qui rendrait tout le monde masquerait le manque du §2.1, et l'écran
  passerait pour complet ;

- **le croisement notes / assiduité produit ses deux lectures** — un zéro avec absences massives, un
  zéro sans absence, une note manquante, et `lines` absent sans le drapeau ;

- **les deux états d'épreuve existent, publiée et brouillon** — sinon l'écran ne montre jamais les
  deux phrases, et « inscrire n'est pas convoquer » reste une affirmation ;

- **le groupe source recoupe les candidats inscrits** — le contrôle né du §4.2 ;

- **aucun `td`/`th` descendant d'un `td`/`th`** — né du §4.4, et il ferme une classe que le contrôle de
  balises ne pouvait pas voir : celui-là vérifie l'équilibre, celui-ci la légalité de l'imbrication ;

- **le contrôle des clés de pastille est ÉLARGI, non ajouté** — §4.9. Il lit maintenant cinq formes au
  lieu de deux, et son extraction est restreinte à ce qui atteint vraiment une pastille ;

- **dans un `:class` d'aides nommées, une propriété n'a qu'une source** — né des §4.10 et §4.11. Deux
  utilitaires de même spécificité sur la même propriété laissent l'arbitrage à l'ordre d'émission de
  Tailwind : le résultat peut être juste et n'a jamais été choisi. C'est la classe de défaut la plus
  silencieuse rencontrée jusqu'ici — elle ne casse rien, elle décide à ma place.

---

## 6. Ce qui a tourné, et sous quel exécutant

**Ce que j'ai exécuté** — mon bac à sable JavaScript, qui charge les modules en retirant leurs `import`
et en réinjectant les dépendances :

- analyse syntaxique des soixante-trois modules et blocs `<script setup>`, plus `audit.mjs` ;
- équilibre des balises de tous les patrons ;
- imports morts, et appels de vue sans handler ;
- les invariants du tableau de jury : crédits, validation et unités non acquises déduits des unités,
  sur huit étudiants et deux semestres — aucune divergence ;
- le plancher contre la compensation : cinq unités sous plancher, aucune compensée ; neuf compensées
  ailleurs ;
- les quatre formes d'historique, et les deux semestres croisés ;
- le dashboard restreint aux instruites ;
- le croisement notes / assiduité, avec ses deux lectures du même zéro ;
- les deux états d'épreuve, et le recoupement du groupe source ;
- **aucune cellule de tableau imbriquée** dans tous les patrons de `src/`, et le contrôle éprouvé sur cinq
  formes — le défaut, le correctif, des cellules normales, un `th` dans un `td`, un tableau imbriqué ;
- **toute clé de pastille au vocabulaire**, avec le contrôle élargi éprouvé dans les deux sens : les
  cinq formes du défaut signalées, un ton de grille et un argument de fonction laissés passer, zéro
  faux positif ;
- les fentes du tableau de jury, comptées à l'en-tête et au corps : 1+2+2+1+3 = 9 des deux côtés ;
- **une propriété, une source** dans chaque `:class` d'aides nommées — éprouvé sur les deux défauts du
  bloc épinglé et sur le correctif, aucune collision restante.

**Ce qui n'a pas tourné** — `npm run audit` avec les contrôles ajoutés depuis son premier passage réel,
`npm run dev`, les trois bascules. Les contrôles ont été reproduits dans mon bac à sable, ce qui n'est
pas la même chose.

**Ce qu'aucun des deux ne verra, et c'est le plus important sur cet écran** — si le bloc épinglé tient
vraiment. Trois colonnes fixes à droite valent 502 px, l'identité 172 : il reste environ 600 px pour la
synthèse, qui en demande 392 (deux fois 92 + deux fois 104). Sur le papier c'est suffisant ; sur un
écran réel, avec les pastilles du conseil qui retournent à la ligne et la seconde ligne d'en-tête qui se
colle sous la première, je ne peux pas l'affirmer. **C'est la question à trancher devant le rendu**, et
elle décide si la synthèse doit perdre une colonne.

⚠️ Et le §4.4 dit pourquoi cette question compte : l'alignement du bloc épinglé était déjà cassé sans
que rien ne le signale. Un audit statique peut compter des fentes ; il ne peut pas voir deux colonnes
qui glissent.

---

## 7. Ce qui reste, et ce qui est à confirmer

**Le manque du §2.1 est le seul qui empêche l'écran de servir.** Sans les étudiants non décidés, le
tableau du jury liste ce qui est fait.

**Une règle à confirmer, et elle n'est pas mineure** : l'interaction du plancher et de la compensation.
`has_floor_violation` et `is_compensated` existent tous deux au contrat ; aucune fonction lue n'énonce
que le premier interdit le second. Le simulacre l'implémente ainsi, l'audit le vérifie, et le panneau
d'unité l'explique à l'utilisateur — **si la règle réelle diffère, l'écran mentira avec assurance.**
C'est le genre de règle qu'il faut lire dans le moteur de calcul, pas dans une surface d'appel.

**Non produit :**

- **l'instruction d'une décision.** Les points d'entrée sont nommés (`add_decision`,
  `apply_jury_ue_decision`), mais le formulaire demande de choisir une décision, un nouveau statut
  académique et un motif — et le vocabulaire de ces trois champs n'a pas de source lue. Les boutons
  disent qu'ils ne sont pas branchés ;
- **la validation d'une moyenne de module.** `validate_module_average(course, student_group, decisions)`
  accepte des ajustements ligne à ligne ; la forme de `decisions` n'est pas lue ;
- **la création d'une délibération et l'enregistrement du jury.** Écran d'ouverture, distinct du
  tableau — et il appartient plutôt à un début de campagne qu'à la séance elle-même ;
- **la liste des moyennes ajustées** a son point d'entrée et sa fixture, pas son écran. Elle tiendrait
  dans un onglet du contrôle des notes, à trancher.
