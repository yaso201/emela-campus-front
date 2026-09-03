# Relevé — grappe 1 (châssis) et seizième composant

Ce que la production a fait apparaître, et que la conception ou le serveur n'avait pas tranché.
Même exercice qu'à chaque lot : ce qui manque se dit, il ne se devine pas.

---

## 1. Ce qui manque côté serveur

**La matrice de permissions, et son vocabulaire.** `whoami` doit rendre `permissions` résolues, pas
seulement `roles` — sinon chaque écran réimplémente la matrice, et la règle 3 (l'action n'est pas
rendue) devient trente décisions locales au lieu d'une.

✅ **Arrêté : VOCABULAIRE-PERMISSIONS-02**, trente-deux clés, déclarées côté interface dans
`src/permissions.js`. Ce n'est plus mon vocabulaire : il est dérivé des **gardes serveur**, qui font
foi. La version 01, dérivée de la matrice des rôles, portait cinq écarts — dont `arbitrate:dossiers`,
qui couvrait deux actes aux acteurs distincts et violait donc le principe qu'elle servait.

L'audit porte le filet matrice↔gardes côté interface : aucune clé employée hors du vocabulaire, aucune
clé de session hors du vocabulaire, et **aucune clé du vocabulaire absente de la session** — sans ce
dernier, une clé oubliée masquerait silencieusement l'écran qui en dépend.

**Les deux points d'entrée de file.** `queues.work_queue` et `queues.work_queue_counts` n'existent
pas ; « À traiter » les suppose. La file est multi-domaines : c'est le serveur qui doit réunir, sinon
le front fait six appels et compose un ordre qui n'a pas de sens.

**`academic_context`.** Années, semestres, courant, et la phrase de contexte. Aujourd'hui déduit de
rien.

**La cible de la bascule.** `spaces.personal` dit qu'un espace personnel existe ; rien ne dit **où
il est**. J'ai écrit `/espace-personnel?year=…&term=…`. Si l'URL réelle diffère, elle doit venir de
la session — pas d'une constante dans une coquille.

**Le tri de la file.** « Le plus ancien d'abord » est mon choix par défaut. Un ordre métier existe
peut-être (échéance réglementaire avant ancienneté). À trancher côté serveur : le front ne doit pas
inventer une priorité.

---

## 2. Ce que le code a fait découvrir de la conception

**Le rail n'est pas une propriété d'écran, c'est une propriété de largeur.** Les maquettes montraient
le rail sur les écrans denses. En code, le déclencheur juste est `écran dense ET fenêtre < 1440` :
sur un grand écran, réduire la navigation ne gagne rien et coûte la lisibilité. Le châssis le fait
ainsi ; à confirmer.

**« À traiter » n'a pas d'objet à lui.** L'écran oriente, il n'agit pas. Son panneau de droite ne peut
donc rien montrer d'utile avant que la grappe du domaine existe. Je l'ai écrit tel quel — un panneau
qui dit « l'écran qui traite cet objet est livré avec sa grappe » — plutôt que de simuler un aperçu
qui mentirait sur ce qui est prêt.

**Trois choses distinctes, une seule apparence dans les maquettes** : un écran vide, un écran refusé,
un écran **non encore produit**. Le troisième n'existait pas dans la conception (il est propre à une
livraison par grappes). Il a maintenant sa page, qui le dit.

**Le refus de droit n'est pas un état de composant.** Les maquettes le dessinaient dans l'écran ; en
code, le mettre dans chaque composant reviendrait à seize façons de refuser. Il est porté **une fois**
par `useResource` (qui alimente `denial`) et par la coquille (qui rend le refus expliqué à la place
de la page). C'est la lecture stricte de la règle 5 : *elle n'a pas de propriétaire naturel, donc la
couche d'appel la porte.*

---

## 3. Le seizième composant — ce qu'il a fallu décider

**La grille reçoit des items placés.** `{ day, start, end }` en heures décimales, et rien d'autre.
Elle ne convertit pas, ne découpe pas, ne détecte pas les chevauchements. Deux raisons : le réalisé de
service se compte en **durée réelle** (donc le serveur sait déjà découper), et un conflit est une
phrase rédigée serveur, jamais une déduction de navigateur.

**Les demi-heures.** Le placement arrondit à l'heure (`grid-row` entier). Une séance de 8 h 30 à
10 h existe-t-elle ? Si oui, il faut une granularité — quart d'heure, probablement — et la grille
doit la recevoir, pas la deviner. **Question ouverte.**

**La variante « journée » est déclarée, pas éprouvée.** Elle sert le registre des examens et la vue
enseignant ; aucun des deux n'est produit. Elle tiendra ou elle changera à la grappe 5.

**Le refus n'y est pas** (cf. §2). Ses quatre autres états sont des branches, visibles à l'atelier.

---

## 4. Ce que je n'ai pas pu faire ici

**Installer les dépendances et lancer le serveur de développement.** L'application est complète comme
source — `package.json`, `vite.config.js`, `index.html`, coquille, routeur, simulacre — mais
`npm install && npm run dev` reste à faire là où npm existe. Ce qui tourne en mode simulacre :
l'ouverture de session, le contexte, « À traiter » avec ses cinq états, la navigation dérivée, le
refus expliqué, et l'atelier de la grille temporelle.

**Les polices.** Elles sont servies depuis le **chemin partagé du serveur**
`/assets/portal_app/emela/fonts/inter/Inter-{Regular,Medium,SemiBold,Bold}.woff2` — c'est ce que
référence `src/assets/main.css`, et c'est le chemin que le self-service utilise déjà. Les fichiers sont
à déposer là, pour que les deux applications servent **les mêmes fichiers**.

⚠️ **Ce relevé disait `public/fonts/`, et c'était faux** — un dossier du dépôt, non un chemin servi.
C'est ce que visait la feuille d'entrée avant le branchement, et cela a produit **quatre échecs de
chargement** avec repli sur la police système. La correction a été reversée dans `main.css` et jamais
dans ce document : un lecteur qui suivait ce § redéposait les fichiers là où rien ne les sert.

---

## 5. Provisoire tracé — le bouton de recherche

`AppShell` rend un bouton de recherche dans sa barre supérieure — « Rechercher un étudiant, une UE, un
groupe… » — sur **tous** les écrans. Il signale par `emit('search')`, et `App.vue` le recevait dans un
`noop()` **au corps vide** : l'utilisateur cliquait le champ le plus visible du produit, et rien ne se
produisait.

Il affiche maintenant un bandeau qui le dit. Aucun point d'entrée ne sert une recherche transversale ;
c'est un manque à nommer, pas un écran à bâcler.

⚠️ **Il a fallu élargir le contrôle d'audit aux événements de composant pour le voir.** Borné à
`@click`, il ne voyait ni ce bouton — `AppShell` ne signale pas par `@click` — ni trois des cinq
gestionnaires de l'écran de structure corrigés au tour précédent : `@add`, `@act`, `@submit`. Les
composants **interactifs** ne communiquent avec leurs vues que par événements ; un contrôle qui n'en lit
qu'un ne garde rien.

C'était le **dernier corps vide du dépôt**, et le contrôle est maintenant éprouvé sur quatre formes :
`@click`, événement de composant, « ne fait que refermer », et fonction fléchée.

---

## 6. Prochaine grappe

Grappe 2 — structure : éditeur de maquette et validation. Le composant existe (`TreeEditor`), les
patrons sont ceux du lot 2 amendé au lot 8 (verrou par usage aval, responsables des filières
partenaires nommés). Il me manquera, prévisiblement : les deux comptes d'usage aval d'une unité —
l'un des neuf ajustements tracés.
