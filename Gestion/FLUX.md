# FLUX — comment on travaille sur l'interface de gestion

**Le dépôt fait foi.** Ce dossier (`Campus/Fronts/Gestion/`, dépôt `emela-campus-front`)
est le seul état de référence des sources. Les archives du concepteur ne sont plus l'état
du code : ce sont des **propositions**, qu'on applique ICI, par diff, jamais par
remplacement du dossier.

**Disposition** : `Gestion/` = l'application ; `../handoff-gestion/` = les relevés du
concepteur, posés côte à côte comme dans ses livraisons — **le harnais d'audit les lit**
(deux contrôles de contrat n'ont pas de sujet sans eux).

## Modifier, construire, déployer

```sh
npm ci                       # une fois — dépendances verrouillées (package-lock.json)
npm run dev                  # travailler en simulacre, aucun serveur requis
npm run audit                # AVANT tout build : le harnais de gardes (audit.mjs)

npm run build -- --outDir dist-mock                     # paquet simulacre
VITE_API_MODE=live npm run build -- --outDir dist-live  # paquet branché serveur
```

Déployer (en natif, depuis `Campus/Backs/` — jamais depuis un montage) :

```sh
bench --site campus-dev execute portal_app.gestion_release.deploy \
    --kwargs '{"dist_path": "/chemin/absolu/vers/dist-live"}'
```

Le pipeline refuse ou accepte avec motifs rédigés (`CONTRAT-ARTEFACT-GESTION.md` au
corpus). Chaque déploiement crée une release immutable `releases/<sha256[:12]>` ;
`releases/` n'est **jamais versionnée** (côté Backs, exclue du dépôt).

## Revenir en arrière

```sh
bench --site campus-dev execute portal_app.gestion_release.rollback   # un geste
bench --site campus-dev execute portal_app.gestion_release.status     # où on en est
```

Purge des releases en excès (>5) : **à la main, jamais la courante** (RUN-08).

## ⚠️ Les deux gestes préalables — sinon les écrans s'affichent vides

1. **Désigner l'année académique courante** (RUN-06 — fail-closed : sans année
   désignée, rien ne se charge).
2. **Poser le calendrier des jours fériés** (RUN-01 — `academic_holiday_list`).

## ⚠️ Le reversement au concepteur — obligatoire, à chaque correction

Le concepteur n'a **ni compilateur ni accès au dépôt**. Toute correction faite ici doit
lui être **reversée** (dossiers `pieces-a-reverser-*` du corpus), sinon sa livraison
suivante l'écrasera. C'est déjà arrivé : une archive est parvenue **sans le greffon du
manifeste** (`contratManifest` de `vite.config.js`), corrigé quinze jours plus tôt.
À réception d'une archive : la traiter en proposition — diff contre ce dépôt, appliquer
ce qui est retenu, ne jamais laisser l'archive écraser `vite.config.js`, `main.js`
(montage `#gestion-app`), `main.css` (polices partagées), `client.js` (jeton CSRF).
