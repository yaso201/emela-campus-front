# Relevé — grappe 3 (répartition de service, écran N1)

Le domaine le plus proche du financier. Ce qui suit est ce que la production a fait apparaître, et ce
qui reste à trancher avant les quatre écrans suivants.

---

## 1. Ce que la correction du lot 6 a changé dans le code

**La couverture n'est pas un compte de lignes, c'est un rapport d'heures.** Elle vit donc dans un
appel dédié (`get_service_coverage`) qui rend, par module et par type d'activité, le couple
`{ covered_hours, expected_hours }`. Le front ne somme rien : il lit le rapport et choisit un ton.

Cela avait une conséquence que je n'avais pas vue en maquette : **le manque et le dépassement ne sont
pas symétriques**. Un manque se rend dans `get_service_plan` (comme `uncovered`, pour apparaître en
ligne absente dans le tableau) ; un dépassement se rend dans `get_service_coverage` (comme un rapport,
pour se lire en pastille). Deux appels parce que ce sont deux lectures — pas parce que la donnée est
double.

**Le zéro de maquette doit être exclu au serveur, dans les deux appels.** Si l'exclusion se fait au
front, elle se fera à deux endroits, et un jour à un seul.

---

## 2. Ce que le code a fait découvrir

**La ligne sans enseignant n'a pas d'état.** Elle n'est ni brouillon (le modèle la refuse) ni absente
(le responsable l'a saisie). Je lui ai donné `status: 'incomplete'` et la mention « pas encore
enregistrée » à l'écran. C'est honnête mais provisoire : dès que l'ajustement est livré, cette valeur
disparaît et la ligne devient un vrai brouillon. **À ne pas laisser s'installer.**

**Le total « engagé » manque à la ligne sans enseignant, et c'est correct.** Un `—` plutôt qu'un
zéro : zéro voudrait dire « cet enseignant n'a aucune charge », alors qu'il n'y a pas d'enseignant.

**`over_norm_note` devait être rédigée serveur.** J'avais d'abord écrit la phrase de dépassement dans
la vue. Mauvais endroit : la norme est une règle, et la formulation d'une règle doit vivre là où vit
la règle. L'écran affiche ce qu'il reçoit.

**Un module sans aucune ligne appartient quand même au plan.** INF-207 n'a pas une seule ligne de
service : il figure au tableau avec ses deux activités en manque. Un module absent du tableau serait
un module oublié — et c'est le seul cas où le manque ne se lit pas à côté de lignes existantes. Le
compte de l'en-tête, celui de la pastille de filtre et celui du panneau de couverture **doivent
s'accorder** : dans un domaine qui touche à la paie, trois totaux qui se contredisent sur un même
écran suffisent à perdre la confiance.

**Un écran non produit doit être déclaré, pas seulement lié.** Le lien vers le bilan de charge
tombait dans la redirection fourre-tout : l'utilisateur atterrissait dans « À traiter » sans un mot,
ce qui est pire qu'un lien mort puisque cela ressemble à un succès. `nav.js` gagne un drapeau
`hidden` — la route est déclarée, l'entrée de barre ne l'est pas, et l'écran non produit dit qu'il ne
l'est pas.

**Un acte non branché doit le dire au clic.** Trois boutons de cet écran ne sont pas branchés
(ajouter, proposer, reconduire). Ils affichent désormais un bandeau qui le nomme et précise que rien
n'a été enregistré. Un bouton muet est pire qu'un bouton absent : l'utilisateur croit avoir agi.

---

## 3. Ce qui manque côté serveur

**Une seizième permission : `write:service`.** Écrire une répartition, la valider et écrire une
maquette sont trois droits distincts — la liste de la grappe 1 n'en portait que deux. Le premier jet
de cet écran empruntait `write:structure`, ce qui aurait privé de tout bouton un responsable de
formation pouvant répartir sans toucher à la maquette. Clé ajoutée au relevé de la grappe 1.

**Les deux appels de cette grappe.** `get_service_plan` et `get_service_coverage` sont 🔴 supposés,
avec les formes du manifeste §5.

**`get_service_coverage` dépend de la grappe 2.** `expected_hours` est le volume de maquette exposé
par `get_ue`. C'est le premier endroit où deux grappes se rejoignent — et cela valide l'ordre de
production.

**Le nombre de groupes attendus.** La couverture en heures suffit au dépassement, mais pas à tout :
une ligne sans groupe vaut la promotion entière. Deux lignes de TD sans groupe pour 36 h de maquette
sont couvertes en heures — sont-elles un partage ou un doublon ? Le lot 6 a répondu « le système ne
tranche pas », et l'écran ne tranche donc pas. Mais si un jour un signal doit le dire, il faudra
`expected_groups`.

**La reconduction.** Le bouton « Reprendre 2025-2026 » est rendu quand `can_carry_over` est vrai —
c'est-à-dire jamais aujourd'hui. Sans elle, juillet est une re-saisie intégrale.

---

## 4. Écrans N2 et N3 — ce que la production a décidé

### N2 — valider les répartitions

**Une dérogation à la fois.** Le panneau de motif ne traite qu'une dérogation, la première non
motivée. Traiter deux dépassements dans le même panneau reviendrait à demander un motif générique —
c'est-à-dire pas de motif.

**Une ligne sous dérogation non motivée n'est pas cochable.** Pas grisée, pas barrée : sa case n'est
pas rendue, remplacée par un tiret. Ce n'est pas un refus, c'est l'ordre des choses — le motif se
pose d'abord. Le bouton de validation en masse reste inerte tant qu'une dérogation attend son motif.

**Écarter une dérogation n'existe pas.** Le bouton secondaire du panneau s'appelle « Renvoyer
plutôt… » et **ouvre le renvoi** — il ne débloque rien. Un « Annuler » qui libère la validation
contredirait la note affichée deux lignes au-dessus. Quelqu'un qui refuse de motiver un dépassement
veut renvoyer la proposition, pas la valider sans motif : l'échappatoire dit ce qu'elle fait.

**Motiver a un effet visible.** La motivation lève `needs_reason` sur les lignes du module, la
pastille passe de « Motif exigé » à « Dérogation motivée », les cases redeviennent cochables et le
bouton de validation se libère. Sans cela, motiver et refuser étaient indistinguables à l'écran, et
la promesse de la légende — « reste validable après motivation » — restait inatteignable. Porté
localement en attendant le serveur ; le rechargement d'une proposition remet le compteur à zéro.

**Le panneau de dérogation n'est pas modal.** Il est rendu en ligne sous un tableau vivant :
`ReasonStep` gagne une prop `modal` (vraie par défaut) pour ne pas annoncer aux outils d'assistance
que ce tableau est inerte. Le renvoi, lui, reste modal derrière son voile.

**`needs_reason` à la ligne, `motivated` à la dérogation.** Les deux : la ligne doit savoir si elle
est cochable, la dérogation si elle est traitée. Un seul champ obligerait l'écran à croiser les deux
listes à chaque rendu.

### N3 — bilan de charge

**Le drapeau `reason_withheld` est né de l'arbitrage.** Un champ absent, jamais un champ vide : bien.
Mais l'absence seule est ambiguë — elle pourrait signifier « pas de motif » ou « motif retenu », et
l'écran doit **dire** lequel. D'où le drapeau : le champ reste absent, et le drapeau dit pourquoi.
Sans lui, l'écran mentirait par omission dans les deux sens.

**`elsewhere_*` sont des agrégats, pas des lignes masquées.** Le détail hors filière n'est pas rendu
du tout — pas rendu puis caché au front. Un détail envoyé puis masqué ne vaut rien : il suffit
d'ouvrir la réponse pour le lire.

**Le millésime est dans le libellé du total, pas en note de bas de page.** « Réalisé au 12 février » :
le chiffre et sa date ne se séparent pas. Sur une base de paie, un total daté ailleurs est un total
sans date.

**L'état vide du bilan a dû être écrit.** Un bilan partiel serait pire qu'aucun bilan : le message
d'échec le dit, plutôt que d'afficher une somme incomplète qui aurait l'air d'une somme.

**La phrase de la dérogation branche sur `motivated`.** Trois cas, trois phrases : motivée avec son
motif, motivée sans (motif retenu), non motivée. Le premier jet affirmait « dérogation motivée » sans
regarder le champ — une dérogation non motivée aurait produit une phrase affirmant le contraire, avec
deux valeurs manquantes dedans.

---

## 4-bis. Le simulacre n'est pas une politique de droits

`validate:service` était à `false` dans la session simulée : l'écran N2 était donc **inatteignable
dans le seul mode qui tourne**. Le drapeau passe à `true`.

Cela mérite d'être dit clairement : `fixtures.js` décrit **un lecteur possible**, pas la matrice de
droits de l'établissement. La matrice vient du serveur. Le simulacre doit ouvrir tout ce qui est
produit — sinon la règle 3 masque des écrans qu'on croit avoir livrés, et personne ne s'en aperçoit.
À mesure que les grappes avancent, il faudra probablement **deux personas simulés** : celui qui
instruit et celui qui décide. C'est aussi la seule façon d'éprouver le filtre maker-checker à l'écran.

---

## 5. Ce qui manque encore

**Les points d'entrée de N2 et N3** sont 🔴 supposés (manifeste §5.3 et §5.4).

**Le lecteur de `get_teacher_load`.** Le serveur doit savoir **qui lit** pour décider si `reason` est
rendu. Aujourd'hui je ne passe que `{ academic_year, teacher, program }` — la qualité du lecteur
vient de la session, mais il faut confirmer que le point d'entrée s'en sert et non d'un paramètre que
l'appelant pourrait forger.

**Les trois actes de N2 ne sont pas branchés, et l'écran le dit.** Valider, renvoyer, motiver affichent
un bandeau qui nomme l'acte et précise que rien n'a été enregistré. ⚠️ Le CTA principal — « Valider les
23 lignes » — était un **corps vide** : aucun retour au clic, alors que `RepartitionView` portait déjà
`notBuilt()` pour ce motif exact. Un bouton muet est pire qu'un bouton absent.

**La persistance de la motivation.** N2 porte l'effet localement : `validate_service_plan` devra
accepter `{ module, teacher, reason, detail }` et rendre la proposition à jour, pour que l'effet
survive au rechargement. Tant qu'il n'existe pas, la motivation disparaît au changement de
proposition — c'est écrit dans le code, à ne pas laisser s'installer.

**Un second persona simulé.** Voir §4-bis : sans lui, le filtre maker-checker ne s'éprouve pas.

**La liste des enseignants à charger.** N3 s'ouvre sur un enseignant ; rien ne dit comment on le
choisit. Depuis N1 le lien existe, mais l'écran atteint directement n'a pas de sélecteur.

**N4 et N5 restent à produire**, avec la reconduction. Pour N5, l'horodatage est déjà spécifié et
consommé par N3 — les deux écrans liront le même champ.

---

## 6. Prochaine expédition

N2 (valider) puis N3 (bilan de charge) — **produits**. N4 (les trois signaux) et N5 (prévu contre
réalisé) restent.

Pour N4, la contrainte du lot 6 tient : aucun de ces signaux ne bloque quoi que ce soit, donc l'écran
évite tout vocabulaire d'erreur — pas de rouge, pas de « corriger ». Trois listes, un compte, une
action de consultation.

Pour N5, chaque règle de comptage s'écrit à côté du total qu'elle affecte : séances tenues seules,
mutualisé compté une fois, épreuves exclues avec leur chiffre.
