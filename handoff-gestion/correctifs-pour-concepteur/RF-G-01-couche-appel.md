# RF-G-01 — couche d'appel (`src/api/client.js`)
**Quoi** : extraction de la phrase serveur sur réponse d'erreur (`serverText()` : `message` → `_server_messages` → `exception` après « Class: »), branchée dans le throw de `call()`. Le mapping 403→PERMISSION_DENIED existait déjà.
**Pourquoi** : constaté au navigateur (rejeu 7 rôles) — un refus Frappe ne porte pas de champ `message`, l'écran de refus titrait « Erreur serveur » au lieu de la phrase rédigée serveur (règle 5). Preuve après correction : « L'attribution des rôles relève de l'administration technique (décision MOA T5). » s'affiche.
**Diff** : + fonction `serverText(payload)` ; `new Error(serverText(payload) || 'Erreur serveur')`.
