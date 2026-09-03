# Revue de cohérence — la conception et le code s'emboîtent-ils ?

> Relecture croisée des lots 1 à 5 et du code produit. Six défauts corrigés,
> **trois écarts de fond signalés** — dont un qui appelle une décision.

---

## 1. Ce qui manquait au code pour tenir debout

Corrigé dans ce passage.

| # | Défaut | Correction |
|---|---|---|
| 1 | **La configuration Tailwind n'était pas livrée.** Le code emploie `rounded-md-ln`, `text-body-sm`, `shadow-card` — des jetons qui n'existent que dans la configuration du self-service. Sans elle, rien ne compile. | `gestion-app/tailwind.config.js`, repris à l'identique. Il ne doit pas diverger du self-service. |
| 2 | **Aucune feuille d'entrée.** Les valeurs arbitraires (`shadow-[1px_0_0_var(--ln-gray-200)]` des colonnes ancrées, le liseré du fil de procédure, le squelette) référencent `var(--ln-*)`, qui vit dans `tokens.css`. L'ordre d'import n'était écrit nulle part. | `src/assets/main.css` : jetons **avant** Tailwind, et les quatre `@font-face` d'Inter auto-hébergée — la contrainte « aucun appel réseau externe » n'était portée par aucun fichier. |
| 3 | `DenseTable` exportait `stuck` depuis un `<script setup>` — interdit par Vue. | Sorti dans `tableClasses.js`. Le commentaire qui renvoyait encore « ci-dessous » est corrigé. |
| 4 | `AccessDenied` utilisait `h-6.5`, absente de l'échelle Tailwind. | `min-h-[26px]`. |
| 5 | Le badge « vous » du fil de procédure pouvait recouvrir le nom de l'acteur sur une étape étroite. | `pr-14` sur l'étape concernée. |
| 6 | `ObjectPanel` avait pour message vide « choisissez dans l'arbre » — la maquette fuyait dans un composant générique. | Message neutre. |

---

## 2. Trois écarts entre l'inventaire et les écrans

L'inventaire dit : **aucun seizième composant**, et si un écran semble en exiger
un, cela se signale. Voici les trois cas.

### 2.1 Le calendrier de planning — un seizième composant, et je le signale

L'écran 4 emploie une grille hebdomadaire à séances positionnées. Ce n'est ni un
tableau dense (les lignes ne sont pas des enregistrements, ce sont des heures),
ni une file, ni une liste. **Aucun des quinze ne le couvre**, et je ne peux pas
l'y faire entrer honnêtement.

Deux issues, une décision à prendre :

- **l'ajouter comme seizième** — « grille temporelle », avec ses variantes
  (semaine, jour) et ses états (vide, chargement, conflit signalé) ;
- **ou le déclarer hors inventaire** comme composition propre au domaine
  planning, au même titre qu'une page.

Je penche pour le seizième : le registre des examens et la vue enseignant du
self-service en auront besoin aussi. Trois emplois, c'est un composant.

### 2.2 Les trois registres de conflit — un amendement, pas un composant

La détection de conflits affiche un blocage, un signal et une confirmation. Le
troisième registre manquait : `StateBanner` n'avait ni variante **succès** ni
forme compacte. **Amendé** (composant 10), sans en créer un nouveau — un
bandeau d'état reste un bandeau d'état quelle que soit sa couleur.

### 2.3 Ce qui n'est pas un composant et ne doit pas le devenir

Blocs de dossier, chronologies, listes de pièces, cartes de profil, journal
d'attribution, barres de volume, filtres en pastilles, sélecteurs segmentés :
tout cela est du **contenu de page** posé dans un `ObjectPanel` ou dans la zone
de travail, avec des classes utilitaires. Les promouvoir en composants
donnerait quinze composants de plus, chacun utilisé une fois. La règle tient :
un composant naît d'un **troisième** emploi, pas du premier.

---

## 3. Ce que le code porte fidèlement

Vérifié ligne à ligne contre les lots.

- **Règle 1** — `DenseTable` ne pré-remplit aucune décision : proposition et
  décision sont deux colonnes, deux slots.
- **Règle 2** — `ReasonStep` garde le bouton inerte tant que motif et précision
  manquent, et porte les groupes de motifs qui font tenir « compléter » et
  « reprendre » dans l'acte unique de renvoi.
- **Règle 3** — `ActionBar` **disparaît** quand aucun acte n'est disponible ; elle
  ne grise pas. `WorkQueue` documente que les listes de décision arrivent déjà
  filtrées de l'instructeur.
- **Règle 4** — `DeferredEffectBanner` porte les cinq états de période, appel
  suspensif compris, et `at_term` dit s'il faut un acte au terme.
- **Règle 5** — `AccessDenied` est monté sur `PERMISSION_DENIED`, jamais
  `ErrorState`, et nomme ce qui reste permis.
- **Densité** — hauteurs 36 / 44 / 52, chiffres tabulaires, colonne d'identité
  ancrée, aucune zébrure.
- **Réseau** — aucun composant n'appelle le serveur ; un seul `call()`.

---

## 4. Ce qui reste à décider

| Réf. | Question | Pour qui |
|---|---|---|
| **C-01** | La grille temporelle devient-elle le seizième composant ? | vous |
| **L5-06** | Le profil « Staff polyvalent » réunit proposition et validation de maquette. | métier |
| **L5-02 · L5-04** | Charge horaire par jour · cause du statut hors cursus. | vague serveur |
