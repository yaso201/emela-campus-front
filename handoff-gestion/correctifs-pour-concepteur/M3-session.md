# M3 Phase 0 — Session et interface (pour le concepteur)

*Le cycle de session n'était dessiné nulle part dans tes relevés. Voici ce qui
existe désormais — le dépôt fait foi.*

## Déconnexion (AN-09)

Un bouton « Se déconnecter » vit dans la **zone d'identité** de la barre
supérieure, sur tous les écrans (`AppShell`). C'est un acte **serveur** :
`/api/method/logout` invalide la session Frappe, puis l'application recharge
`/gestion` — le serveur, ne voyant plus de session, renvoie à la connexion.
Le shell étant servi `Cache-Control: no-store`, le retour-arrière du navigateur
ne rend **aucun contenu** (prouvé).

## Infobulles (AN-10) — UN mécanisme

Une directive partagée `v-tip` (nouvelle, `src/directives/tip.js`) rend
l'infobulle au **survol et au focus clavier** (le `title` natif ne couvre pas le
focus — c'est pourquoi ce n'est pas un attribut). Zéro texte dupliqué :
- nav **repliée** (rail) : l'infobulle = le **libellé** de l'entrée (déjà dans nav.js) ;
- nav **dépliée** : l'infobulle = le **hint** (nouvelle clé `hint` sur chaque
  entrée de `nav.js` — 22 posés, une phrase chacun) ;
- icônes seules (notifications, déconnexion, avatar) : `v-tip` + `aria-label` ;
- `ActionBar` et `StatusPill` acceptent un `hint` optionnel (l'écran le passe
  depuis ses données ; le libellé visible n'est jamais recopié).

Si tu dessines un nouveau bouton d'icône : donne-lui un libellé, `v-tip` fait le reste.

## Redirection post-login (AN-08) — HORS de ce dépôt, remontée

L'invité sur `/gestion` est bien redirigé vers la connexion **avec** retour, et le
fragment (`#/route`) survit. Mais la page de login (côté serveur,
`portal_app/www/login.py:47-52`) n'autorise que `/app-emela*` comme cible de
retour : `/gestion` est écarté → l'utilisateur atterrit sur le cockpit. Le
correctif est **une ligne serveur** (ajouter `/gestion` à la liste blanche) —
demandé au couloir back (S-14). Rien à faire côté interface.
