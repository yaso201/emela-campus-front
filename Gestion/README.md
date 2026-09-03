# emela — interface de gestion académique

Code de production des **seize** composants (les quinze du lot 4 + la grille temporelle, arbitrage
C-01 du lot 8) et des écrans, livrés par grappes.
Vue 3 (`<script setup>`) · Vite · Tailwind, jetons `ln-*`.

## 0. Lancer

    npm install
    npm run dev        # mode simulacre : aucun serveur requis

    VITE_API_MODE=live npm run dev    # branchement réel, même origine

Trois bascules d'URL font tomber tous les appels dans un état, pour voir les branches en vrai :
`?simulate=denied` · `?simulate=error` · `?simulate=empty`.

| | |
|---|---|
| Coquille | `src/App.vue` — session, contexte, navigation, refus expliqué |
| Navigation déclarée | `src/nav.js` — le routeur en dérive ; aucune route en dur dans une vue |
| Cinq états | `src/composables/useResource.js` — une seule branche pour toute l'application |
| Simulacre | `src/api/mock/` — disparaît au branchement, sans toucher aux vues |
| Manifeste des appels | `../handoff-gestion/manifeste-des-appels.md` |

⚠️ **Les polices ne sont pas dans ce dépôt.** Elles sont servies depuis le chemin partagé du serveur
`/assets/portal_app/emela/fonts/inter/Inter-{Regular,Medium,SemiBold,Bold}.woff2` — celui que
`src/assets/main.css` référence et que le self-service utilise déjà. **Pas `public/fonts/`** : ce
dossier du dépôt n'est pas servi, et le viser a produit quatre échecs de chargement au branchement.

---

## 1. Ce que ce dossier suppose de la coquille

L'application de gestion n'existe pas encore. Ce code est écrit pour qu'elle
puisse l'accueillir sans le retoucher. Voici, explicitement, ce qu'il attend.

### 1.1 Session

Une composable `useSession()` exposée par la coquille, rendant un objet réactif :

    {
      person:   { id, name, initials, email },
      roles:    ['Responsable de formation', 'Education Manager', ...],
      scope:    { kind: 'nature'|'liaison'|'annulee'|'nulle', program, reason },
      spaces:   { management: true, personal: true|false },
      can:      (action, subject) => boolean
    }

- `roles` est la liste des rôles atomiques, jamais un « profil » ni un « mode ».
  Aucun composant ne compare un rôle à une chaîne : ils appellent `can()`.
- `spaces.personal` commande l'affichage du bouton de bascule vers le
  self-service. C'est l'exposition D-01 du relevé — sans elle, le bouton
  s'affiche pour tout le monde et mène parfois nulle part.
- `can()` doit répondre localement, sans aller-retour serveur, à partir d'une
  matrice reçue à l'ouverture de session. Aucun composant ne réimplémente la
  matrice de rôles ; ils posent une question, ils ne la calculent pas.

### 1.2 Contexte académique

Une composable `useAcademicContext()` :

    { year, term, setYear(), setTerm(), years[], terms[] }

Persistée par la coquille (URL ou stockage local), héritée par toutes les vues,
et transmise au self-service lors de la bascule. Les composants la lisent ; ils
ne la stockent pas.

### 1.3 Navigation

Aucune route en dur dans les vues. `AppShell` reçoit sa navigation en
propriété — une liste de `{ key, label, icon, to, count }` — et émet
`navigate(key)`. La coquille décide ce que `to` signifie.

### 1.4 Erreurs

Les appels serveur rejettent avec une erreur portant :

    { code, message, details }

- `message` est rédigé côté serveur et affichable tel quel. Aucun composant
  ne fabrique de phrase à partir d'un code.
- `code === 'PERMISSION_DENIED'` déclenche `AccessDenied`, jamais `ErrorState`.
  Les `details` d'un refus portent `{ status, since, days_left, allowed[] }`.

### 1.5 Deux contrats de forme

Attendus de la vague serveur en cours (D-05, D-06 du relevé). Les composants
sont écrits contre eux.

**Échéance structurée** — consommée par `DeferredEffectBanner` et
`RetractionWindow` :

    {
      term:      '2026-10-05',        // date de terme
      unit:      'jours_ouvrables',   // 'jours' | 'jours_ouvrables'
      remaining: 9,                   // calculé SERVEUR, jamais au front
      opened_on: '2026-09-04',
      stages:    [90, 60, 30],        // paliers de prévenance, facultatif
      will:      ['...', '...'],      // ce qui se produira au terme
      can:       ['...', '...'],      // ce qui reste possible d'ici là
      at_term:   'expire_seule' | 'exige_un_acte'
    }

`remaining` n'est jamais recalculé au front : une échéance de droit ne se
calcule pas dans un navigateur mal réglé.

**Rapport de traitement en masse** — consommé par `BatchReport` :

    {
      total: 10, ok: 8, ko: 2,
      lines: [{ id, label, detail, status: 'ok'|'ko', reason, retry_action }]
    }

---

## 2. Conventions

| Règle | Mise en œuvre |
|---|---|
| Les composants ne parlent pas au serveur | Données en propriétés, actions en événements. Aucun `fetch`, aucun `call()` dans `components/`. |
| Les appels vivent dans `src/api/` | Un fichier par domaine, une fonction par point d'entrée, un seul `call()` en dessous. |
| Aucune route en dur | Les vues émettent ; la coquille route. |
| Les seize composants sont écrits une fois | `src/components/index.js` est la porte d'entrée. Aucun dix-septième. |
| Les états sont dans les composants | `vide`, `chargement`, `erreur`, `refus`, `succès partiel` sont des propriétés, pas des composants concurrents. |

### Sur `BlockState`

`components/internal/BlockState.vue` n'est pas un composant public : c'est la
mise en œuvre partagée des états des seize. Il n'est pas exporté par
`index.js` et aucune page ne l'importe directement. Le sortir en composant
public ferait exactement ce que le lot 4 interdit — deux façons d'afficher un
état vide.

### Sur le refus de droit

Ce n'est **pas** un état de composant. Il est porté une fois par la couche
d'appel : `useResource` alimente `denial`, et `App.vue` rend `AccessDenied` à la
place de la page. Une vue qui n'y pense pas l'affiche quand même — c'est tout
l'objet de la règle 5, qui n'a pas de propriétaire naturel.

### Sur la grille temporelle (16)

Elle naît d'un **troisième emploi** : planning des séances, registre des examens,
vue enseignant du self-service. Elle reçoit des items déjà placés et des
conflits déjà rédigés : elle ne calcule ni conflit ni chevauchement — c'est un
confort, pas une garde, et ce qui fait autorité reste la vérification du serveur
à l'enregistrement.

---

## 3. Ce que le code porte des décisions récentes

- **L'appel d'une sanction est suspensif.** La période disciplinaire a cinq
  états, pas trois : `a_venir`, `en_cours`, `suspendue` (appel déposé, en
  attente de la Direction), `reprise` (confirmée en appel, reprise fixée),
  `expiree`. Voir `DeferredEffectBanner`, propriété `state`.
- **Les travaux pratiques ne sont plus un type d'épreuve.** Le préavis de sept
  jours ouvrables ne concerne que les épreuves ; le registre des examens porte
  un `exam_type` : `ecrit` · `pratique` · `mixte` · `autre`.
- **L'attribution des rôles relève de l'administration technique.** Le journal
  reste, comme trace et non comme garde. `can('grant_role')` répondra faux pour
  la chaîne académique.
