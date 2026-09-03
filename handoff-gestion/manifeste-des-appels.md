# Manifeste des appels — interface de gestion

Ce document dit, écran par écran, **quels points d'entrée sont consommés, avec quels paramètres, et
ce qui est attendu en retour**. Il est la seule source du branchement : personne ne devrait avoir à
lire une vue pour le deviner.

Tenu à jour à chaque grappe. Ce qui n'y figure pas n'est pas appelé.

---

## ⚠️ Statut des chemins

**Aucun chemin de ce document n'est VÉRIFIÉ, sauf mention contraire.** Je ne dispose pas de la liste
réelle : je les ai formés par analogie avec l'arborescence de `emela_core`. Chaque entrée porte donc
une mention explicite :

| Mention | Sens |
|---|---|
| 🔴 **non vérifié** | Le chemin est de mon invention, et **l'existence de la fonction n'est pas tranchée** — je n'ai pas lu le code serveur. Ce n'est ni « à construire », ni « introuvable » : c'est un nom en attente de confrontation. |
| 🟡 **cible existante** | La fonction est **annoncée existante** — par la vague qui l'a construite, ou vue dans le code — mais son chemin d'exposition m'est inconnu. |
| 🟢 **confirmé** | Chemin vérifié dans le code. |

À ce jour : **aucune entrée n'est verte.** Une confrontation générale est en cours — le manifeste
entier contre les 218 chemins réels — et la table de correspondance la résoudra. D'ici là, **c'est le
nom du point d'entrée qui compte, pas son chemin** : c'est lui que le front appelle, donc lui que la
table doit apparier.

| 🟡 | **non relu** — nom hérité d'une grappe antérieure, pas revérifié depuis |

⚠️ Le 🔴 a d'abord porté l'instruction « ne le cherchez pas ». Elle était fausse : deux entrées la
portaient alors que les fonctions existaient, sous d'autres noms (§5.5, §5.7). Un marqueur qui
commande une action doit dire ce qu'on sait, non ce qu'on suppose — il a été redéfini, pas annoté.

Les appels hérités de `src/api/*.js` (structure, notes, planning, rôles, dossiers) utilisent des noms
courts non préfixés — `get_structure_tree`, `update_ue`. Ceux-là viennent des points d'entrée T5 et
sont 🟡 cible existante : la fonction existe, son exposition reste à confirmer.

---

## 0 bis. Quatre classes de faux chemin, toutes rencontrées

Elles se ressemblent à la relecture et pas au branchement.

**Le nom inventé.** `emela_core.academic_core.api.planning.week_sessions` — écrit à la grappe 1, avant
que le mur des noms ne soit connu. Aucune fonction de ce nom.

**Le nom nu.** `list_programs`, `get_ue`, `propose_maquette` — la grappe 2. Les fonctions EXISTENT,
les verbes étaient justes, le module manquait. L'appel ne résout pas davantage.

**Le nom presque juste.** `detach_module_to_ue` là où la fonction s'appelle `detach_module_from_ue`.
Une préposition. C'est la classe des soixante-huit homonymes du branchement : assez juste pour se
relire sans alerter, assez faux pour ne pas résoudre.

**Le bon nom au mauvais NIVEAU** — la plus insidieuse. La grappe 4 appelait
`education.education.api.get_student_group_students`, une vraie fonction du vendor. Mais
`portal_app.api.academic.groups` offre la même lecture **sous les gardes de rôle et le scope par
filière**. J'appelais juste, sous les gardes de personne. Chercher le nom ne suffit pas : il faut
chercher la SURFACE.

---

## 0. Règles de forme, valables partout

**Un seul point d'appel.** `src/api/client.js` → `call(method, params)`. Les vues passent par les
modules de domaine de `src/api/`, jamais par `call`.

**Deux paramètres implicites.** Toute requête d'un écran de gestion porte le contexte académique :

    { academic_year: 'AY-2026', term: 'T-1' }

Il vient de `useAcademicContext().params` ; aucune vue ne le fabrique. Un point d'entrée qui n'en a
pas besoin l'ignore ; il ne doit pas échouer pour autant.

**Une erreur porte trois champs.** `{ code, message, details }`. `message` est rédigé serveur et
affiché tel quel — aucun écran ne fabrique de phrase à partir d'un code.

**Un refus est un code, pas un état HTTP interprété.** `code === 'PERMISSION_DENIED'` (403) déclenche
le refus expliqué, porté **une fois** par `useResource` + la coquille. `details` attendus :
`{ status, since, days_left, allowed[], missing_channel? }`.

**Le décompte avant chargement.** Une liste paginée rend `count` (le total annoncé) séparément de
`items` : en 3G, c'est la différence entre patienter et croire à une panne.

**Le succès partiel se rédige serveur.** Un traitement en masse rend
`{ total, ok, ko, lines[], partial_message }` ; `partial_message` est affiché tel quel.

**Aucun décompte de délai n'est calculé au front.** Une échéance porte son `remaining` serveur.

---

## 1. Grappe 1 — châssis

### 1.1 Ouverture de session

| | |
|---|---|
| **Point d'entrée** | `emela_core.identity.api.session.whoami` — 🔴 non vérifié |
| **Appelé par** | `composables/useSession.js`, une fois au démarrage |
| **Paramètres** | aucun |

Retour attendu :

    {
      person:      { id, name, initials, email },
      roles:       ['Gestionnaire académique', 'Education Manager'],
      scope:       { kind: 'nature'|'liaison'|'annulee'|'nulle', program, reason },
      spaces:      { management: true, personal: true|false },
      permissions: { 'read:planning': true, 'publish:planning': true, ... }
    }

⚠️ `permissions` est **la matrice résolue**, pas la liste des rôles : `can()` répond localement,
sans aller-retour, et aucun composant ne compare un rôle à une chaîne. Les clés sont des couples
`verbe:objet` — la liste consommée par la grappe 1 figure au relevé (§ manques).

⚠️ `spaces.personal` commande la bascule vers l'espace personnel. Sans elle, le bouton s'affiche
pour tout le monde et mène parfois nulle part.

### 1.2 Contexte académique

| | |
|---|---|
| **Point d'entrée** | `emela_core.academic_core.api.context.academic_context` — 🔴 non vérifié |
| **Appelé par** | `composables/useAcademicContext.js`, une fois au démarrage |
| **Paramètres** | aucun |

    {
      years:   [{ id, label, current }],
      terms:   [{ id, label, parity: 'impair'|'pair' }],
      current: { year, term },
      note:    'phrase de contexte, rédigée serveur, facultative'
    }

`note` s'affiche à droite du bandeau. Elle est facultative ; vide, la place se referme.

### 1.3 « À traiter »

| | |
|---|---|
| **Point d'entrée** | `emela_core.academic_core.api.queues.work_queue` — 🔴 non vérifié |
| **Appelé par** | `views/WorkQueueView.vue` |
| **Paramètres** | `{ academic_year, term, domain: null \| 'grades' \| 'documents' \| 'planning' \| 'council' \| 'dossiers' \| 'structure' }` |

    {
      count: 6,                       // annoncé AVANT les items
      total: 6,
      items: [{
        id, domain, title, subtitle,
        status,                        // clé de pastille — voir ci-dessous
        statusLabel, due, overdue: true|false
      }]
    }

⚠️ **`status` EST UNE CLÉ DE PASTILLE, pas un vocabulaire de file.** `WorkQueue` passe cette valeur
directement au composant de pastille : une file qui emploierait ses propres mots (`draft`, `proposed`,
`ok`, `warn`, `err`) verrait **toutes ses pastilles retomber en gris neutre**, le ton perdu, et la clé
affichée telle quelle là où `statusLabel` manque. Les valeurs attendues sont donc celles de la
pastille : `brouillon` · `propose` · `valide` · `recue` · `incomplete` · `integree` · `renvoyee` ·
`publiee` · `modifiee` · `annulee` · `a_instruire` · `a_decider` · `suspendue` · `echue`.

⚠️ **`statusLabel` reste la phrase**, et elle prime sur le libellé par défaut de la clé. Les deux,
parce que la pastille a besoin d'un ton et l'humain d'un mot — mais un seul vocabulaire pour le ton.

⚠️ **La file arrive déjà filtrée de l'instructeur** pour les procédures que le filtre couvre (R-02).
Le front ne filtre rien. Périmètre actuel du filtre : retour de congé, constat d'abandon — l'extension
est l'un des neuf ajustements tracés.

⚠️ `status` est une valeur d'énumération, `statusLabel` la phrase affichée. Les deux, parce que la
pastille a besoin d'un ton et l'humain d'un mot.

### 1.4 Pastilles de navigation

| | |
|---|---|
| **Point d'entrée** | `emela_core.academic_core.api.queues.work_queue_counts` — 🔴 non vérifié |
| **Appelé par** | `App.vue`, une fois au démarrage |
| **Paramètres** | `{ academic_year, term }` |

    { total: 6, by_domain: { grades: 2, documents: 2, ... }, overdue: 2 }

Un échec de cet appel **ne bloque aucun écran** : les pastilles tombent, l'application vit.

### 1.5 En attente d'un autre décideur (écran A8, livré grappe 7)

| | |
|---|---|
| **Point d'entrée** | `list_awaiting_other_decider` — 🔴 non vérifié |
| **Paramètres** | `{ academic_year }` |

    {
      scope: ['retour', 'abandon'],                    // clés de procédure, le périmètre RÉEL
      scope_label: 'Retour de congé et Constat d’abandon',
      items: [{ name, kind, kind_label, student, student_name,
                instructed_by, decider_role, waiting_days }],
      roles_single_holder, roles_total, roles_decider_single_holder
    }

⚠️ `scope` est consommé par l'écran pour **dire ce qu'il ne couvre pas**. S'il n'est pas rendu,
l'écran promet une exhaustivité qu'il n'a pas.

⚠️ **CETTE ENTRÉE A DOCUMENTÉ UN CHEMIN SUPPRIMÉ PENDANT DEUX TOURS.** Elle donnait
`emela_core.academic_core.api.queues.awaiting_other_decider` et la forme
`{ id, instructed_role, sole_holder }` — l'écran A8 était servi par **deux chaînes concurrentes** qui
avaient déjà divergé, et j'ai supprimé la mauvaise du code sans corriger ce document.

Le sens code → manifeste avait été corrigé ; le sens **manifeste → code** ne l'avait pas été. C'est le
plus grave des deux, puisque c'est depuis ce document que le back-end câble : un lecteur y aurait
construit un point d'entrée que rien n'appelle, et pas celui dont l'écran dépend.

La forme ci-dessus est celle de la chaîne **survivante**, relue dans la fixture : `name` et non `id`,
`kind_label` en plus de `kind`, `student_name` en plus de `student`, ni `instructed_role` ni
`sole_holder`. Et `scope` porte des **clés de procédure**, pas des libellés — `scope_label` porte les
libellés.

---

## 2. Atelier du seizième composant

| | |
|---|---|
| **Point d'entrée** | `planning_mgmt.list_schedules` — 🟢 voir §7.1 |
| **Appelé par** | `views/AtelierView.vue`, et par l'écran de planning |

⚠️ **CORRIGÉ.** L'atelier appelait `emela_core.academic_core.api.planning.week_sessions` — un chemin
de mon invention, écrit à la grappe 1 avant que le mur des noms ne soit connu. Il lit maintenant le
**même** point d'entrée que l'écran de planning : un atelier qui interroge un contrat différent de
l'écran ne prouve rien sur l'écran.

⚠️ La grille reçoit `hours: { from, to, step: 0.5 }` — les demi-heures sont réelles et validées au
serveur. Elle ne les devine pas.

---

## 4. Grappe 2 — structure

### 4.1 Arbre de maquette

| | |
|---|---|
| **Point d'entrée** | `get_structure_tree` — 🟡 cible existante |
| **Appelé par** | `views/StructureView.vue` |
| **Paramètres** | `{ academic_year, term, program }` |

    {
      nodes: [{ id, level: 1|2|3, parent, code, label,
                metric,          // crédits, affiché à droite du nœud
                status,          // état de l'unité — pastille
                shared }],       // nombre de filières partenaires, si mutualisée
      program_label: 'L2 Génie logiciel',
      ects: 30,
      maquette: { state: 'brouillon'|'propose'|'valide',
                  validated_on, proposed_by, proposed_on }
    }

⚠️ `nodes` est **une liste aplatie**, `level` portant la profondeur et `parent` la paternité. C'est
ce qui permettra le défilement virtuel sans changer le contrat.

⚠️ **Le serveur ne rend pas `children`.** L'écran le dérive de `parent` : la paternité suffit à
savoir qui a une descendance, et l'ajouter au contrat obligerait le serveur à tenir une information
redondante. C'est le seul calcul de forme que le front s'autorise sur cet arbre — il ne porte aucune
règle métier.

### 4.2 Détail d'une unité

| | |
|---|---|
| **Point d'entrée** | `get_ue` — 🟡 cible existante |
| **Paramètres** | `{ ue }` |

    {
      id, code, label, ects, status,
      modules:  [{ id, code, label, volumes: { cm, td, tp, pj } }],
      partners: [{ id, program, owner, email, since, active }]
    }

⚠️ `partners[].owner` est l'amendement A6 : le responsable de formation de chaque filière partenaire
est **nommé**, parce qu'une modification de volume ou de code le concerne. `owner: null` est un cas
légitime (filière retirée, ancien responsable parti) et l'écran l'écrit — il ne masque pas la ligne.

⚠️ Un `volumes` à zéro n'est **pas** un manque : le type d'activité n'est pas prévu. C'est cette
allocation qui fait foi pour la couverture de la répartition (réponse 1 du lot 6).

### 4.3 Usage aval d'une unité

| | |
|---|---|
| **Point d'entrée** | `get_ue_downstream_usage` — 🔴 non vérifié, **l'un des neuf ajustements tracés** |
| **Paramètres** | `{ ue }` |

    { enrollments: 96, grades: 384, locked: true, locked_by: 'enrollments'|'grades'|null }

⚠️ Amendement A6 du lot 8 : **ce n'est pas la validation qui fige le code d'une unité, c'est le
premier usage aval.** Une seule inscription suffit à verrouiller ; les deux comptes sont demandés
pour que l'écran dise **d'où vient** le verrou.

⚠️ **`locked` fait foi, pas le calcul du front.** L'écran ne déduit pas le verrou de
`enrollments > 0` : il affiche les comptes et obéit à `locked`. Si la règle change (un seuil, une
exception), elle change côté serveur, en un endroit.

⚠️ **Appel distinct, et champ verrouillé par défaut.** Attendre cette réponse pour rendre l'écran
le figerait sur un détail. Le champ de code est donc verrouillé tant que la réponse manque, et se
libère à l'arrivée — y compris **en cas d'erreur** : mieux vaut refuser une modification permise que
d'en permettre une qui casse des rattachements de notes.

### 4.4 Actes de la maquette

| Acte | Point d'entrée | Statut |
|---|---|---|
| Modifier une unité | `update_ue` | 🟡 cible existante |
| Proposer à la validation | `propose_maquette` | 🟡 cible existante |
| Valider | `validate_maquette` | 🟡 cible existante |
| Renvoyer au brouillon | `return_maquette_to_draft` | 🟡 cible existante |

⚠️ Le renvoi au brouillon passe par l'étape de motif (composant 9) : `{ reason, detail }` obligatoires.
Un seul acte serveur ; la catégorie oriente le travail, elle ne change pas la nature du renvoi.

⚠️ **Un renvoi au brouillon ne déverrouille aucun code.** Le verrou vient de l'usage aval, pas de
l'état de la maquette — l'étape de motif le dit à celui qui renvoie.

---

## 5. Grappe 3 — répartition de service

**Règle du domaine :** une heure vaut une heure, aucune conversion. Et la couverture d'un module se
calcule **sur les heures** contre le volume de la maquette, jamais sur le nombre de lignes.

### 5.1 Lignes de service d'une filière

| | |
|---|---|
| **Point d'entrée** | `get_service_plan` — 🔴 non vérifié |
| **Appelé par** | `views/RepartitionView.vue` |
| **Paramètres** | `{ academic_year, program }` |

    {
      count, module_count, covered_modules, norm_hours: 400,
      state: 'brouillon'|'propose'|'valide',
      year_label, program_label,
      can_carry_over, previous_year_label,
      groups: [{ id, code, label, ects, shared,
        modules: [{ id, code, label,
          over_norm_note,                    // phrase rédigée serveur, facultative
          lines: [{ id, activity: 'cm'|'td'|'tp'|'pj',
                    teacher,                 // null = ligne pas encore enregistrable
                    group, hours, engaged, status, over_norm }],
          uncovered: [{ activity, expected }] // heures prévues, aucune répartie
        }]
      }],
      teachers: [{ id, name, engaged }]
    }

⚠️ **`groups` est groupé par unité puis par module, pas à plat.** C'est l'axe de l'écran : un module
se partage, donc le manque doit se lire comme une **ligne absente** — d'où `uncovered`, rendu par le
serveur ligne par ligne plutôt que déduit d'un compte.

⚠️ **`uncovered` ne contient jamais un type à zéro heure de maquette.** Zéro heure prévue n'est pas
« non couvert » (réponse 1 du lot 6) : c'est au serveur de l'exclure, sinon chaque écran refera le
filtre à sa manière.

⚠️ **`teacher: null`** est la ligne en brouillon sans enseignant — l'un des neuf ajustements. Tant
qu'il n'est pas livré, l'écran affiche « à attribuer — pas encore enregistrée » : l'intention est
bonne (poser la structure en juillet), la ligne ne passe pas encore le modèle.

⚠️ **`engaged` est le total toutes filières**, validé + proposé. Le détail hors de la filière du
lecteur n'est pas communiqué — mais le total, lui, est complet : c'est lui qui dit si l'on peut
encore charger un enseignant.

⚠️ **`over_norm_note` est rédigée serveur.** L'écran ne fabrique pas la phrase de dépassement : la
norme est une règle, et sa formulation doit vivre là où vit la règle.

### 5.2 Couverture par module

| | |
|---|---|
| **Point d'entrée** | `get_service_coverage` — 🔴 non vérifié |
| **Paramètres** | `{ academic_year, program }` |

    {
      modules: [{ id, code, label,
        activities: [{ activity, covered_hours, expected_hours }] }]
    }

⚠️ **C'est ici que vit la correction du lot 6.** `expected_hours` vient du volume de maquette
(expédition 4.2 de la grappe 2), `covered_hours` de la somme des lignes. Le sur-couvert est
`covered > expected` — **en heures**. Deux lignes de 18 h et 12 h pour 24 h prévues font 6 h au-delà,
pas « deux lignes en trop » : sans cette forme, l'écran signalerait comme anomalie ce que le modèle
déclare être la règle.

⚠️ **Une activité à `expected_hours: 0` ne doit pas figurer** dans `activities`. C'est la même règle
qu'en 5.1, appliquée à l'autre appel.

⚠️ Le front ne calcule que le **ton** de la pastille à partir du couple reçu. Il ne somme rien, il ne
déduit aucun seuil.

⚠️ **`pending_hours` par activité** — heures posées sur une ligne **sans enseignant**. Elles ne
comptent pas dans `covered_hours` (le modèle exige l'enseignant, la ligne n'est pas enregistrable),
mais elles sont rendues : les taire ferait croire à un oubli, les compter ferait croire à une
couverture qui n'existe pas. Ce champ disparaîtra avec le provisoire correspondant — l'enseignant
obligatoire à la proposition, pas à la création.

⚠️ **`uncovered` porte `assigned`** en plus de `expected` (§5.1) : sans lui, l'écran ne peut pas
distinguer « aucune heure répartie » de « 18 h sur 36 », et la première phrase appliquée au second cas
fait rouvrir une répartition déjà faite.

⚠️ **`covered_modules`, `module_count` et `count` de `get_service_plan` doivent se déduire** des mêmes
lignes que `get_service_coverage`. Trois totaux qui se contredisent sur un même écran suffisent à
perdre la confiance, et ce domaine touche à la paie.

### 5.3 Validation d'une répartition (écran N2)

| | |
|---|---|
| **Points d'entrée** | `list_service_proposals`, `get_service_proposal` — 🔴 non vérifiés |
| **Paramètres** | `{ academic_year }` / `{ proposal }` |

    // list_service_proposals — forme de file (même contrat que work_queue)
    { count, items: [{ id, title, subtitle, status, statusLabel }] }

    // get_service_proposal
    {
      program_label, line_count, total_hours, proposed_on, proposed_by,
      derogations: [{ module_id, teacher, engaged, norm_hours,
                      hours_elsewhere, line_count, motivated }],
      lines: [{ id, module_id, module_code, module_label, activity,
                teacher, hours, engaged, over_norm, needs_reason, state_label }]
    }

⚠️ **`derogations` est groupé par module ET par enseignant**, pas par ligne : un seul motif couvre
toutes les lignes du même module pour le même enseignant. C'est ce qui permet de demander le motif
**à la ligne qui franchit la norme** plutôt qu'à l'envoi — le motif porte sur un fait précis, pas sur
une proposition entière.

⚠️ **`needs_reason` est porté par la ligne, `motivated` par la dérogation.** Les deux, parce que la
ligne doit savoir si elle est cochable et la dérogation si elle est traitée.

⚠️ Le renvoi passe par `return_service_plan` avec `{ reason, detail }`. **Renvoyer et rejeter sont le
même acte serveur** : deux catégories de motif, jamais deux boutons.

⚠️ **ET L'ACTE DE VALIDATION LUI-MÊME MANQUAIT À CETTE SECTION.**

| | |
|---|---|
| **Point d'entrée** | `validate_service_plan` — 🔴 non vérifié · non simulé |
| **Paramètres** | `{ module, teacher, reason, detail }` |
| **Retour attendu** | la proposition à jour — pour que l'effet survive au rechargement |

Cette section est titrée « Validation d'une répartition » et ne nommait que les deux **lectures** et le
**renvoi**. Un lecteur qui câblait depuis ici construisait tout sauf la validation — l'acte qui donne
son titre à l'écran.

⚠️ Il porte le **motif de dérogation**, d'où `{ module, teacher }` — un seul motif couvre les lignes
d'un module pour un enseignant, comme le dit la note de `derogations` plus haut. Tant que ce point
d'entrée n'existe pas, l'écran porte la motivation **localement** — elle disparaît au changement de
proposition, et c'est un provisoire tracé.

### 5.4 Bilan de charge d'un enseignant (écran N3)

| | |
|---|---|
| **Point d'entrée** | `get_teacher_load` — 🔴 non vérifié |
| **Paramètres** | `{ academic_year, teacher, program? }` |

    {
      teacher_id, teacher_name, quality, discipline, year_label, program_label,
      norm_hours: 400,
      validated_hours, proposed_hours, engaged_hours, done_hours,
      computed_at, computed_at_label,          // horodatage du réalisé
      own_hours, elsewhere_hours, elsewhere_programs, elsewhere_lines,
      derogation: { motivated, motivated_on, motivated_by,
                    reason?,                   // PRÉSENT ou ABSENT, jamais vide
                    reason_withheld? },        // vrai = existe et retenu
      own_lines: [{ id, module_code, module_label, activity, group,
                    planned, done, status, shared_count }],
      by_activity: [{ activity, hours }]
    }

⚠️ **Un champ ABSENT, jamais un champ vide.** Le motif d'une dérogation née d'une **autre** filière
n'est pas rendu : `reason` est omis et `reason_withheld: true` dit qu'il existe et qu'il est retenu.
Le motif d'une dérogation née de **sa** filière est rendu dans `reason`, sans drapeau.

⚠️ **Le drapeau est indispensable.** Sans lui, l'absence de `reason` ne se distinguerait pas d'une
dérogation non motivée — et l'écran mentirait par omission dans les deux sens. C'est aussi ce qui
permet à l'écran de **dire** que le motif ne lui est pas communiqué : l'omettre en silence ferait
croire qu'il n'y en a pas.

⚠️ **`elsewhere_*` sont des agrégats, jamais des lignes.** Le détail hors de la filière du lecteur
n'est pas rendu du tout — pas rendu puis masqué. Une zone masquée annoncée vaut mieux qu'un total
inexpliqué ; un détail envoyé puis caché ne vaut rien.

⚠️ **`computed_at` est obligatoire** — l'un des neuf ajustements. `done_hours` sert de base à la
rémunération des vacataires : sans millésime, le chiffre n'est pas opposable.

⚠️ **Les épreuves ne figurent pas dans `by_activity`** : la surveillance est réputée incluse dans
l'heure d'enseignement. L'écran le dit sous le graphique.

### 5.5 Les trois signaux (écran N4)

| | |
|---|---|
| **Point d'entrée** | `list_service_signals` — 🟡 cible existante, sous un autre nom (table de correspondance attendue). C’est ce nom que le front appelle. |
| **Paramètres** | `{ academic_year, program? }` |

    {
      program_count,
      families: [{ key, title, description,
        items: [{ id, subject, detail, status, status_label,
                  route, action_label }] }]
    }

⚠️ **L'ordre des familles est celui du serveur** — maquette, norme, planning — et n'est **jamais**
un tri par gravité : aucune famille n'est plus grave qu'une autre, et un tri le suggérerait.

⚠️ **`description` est rédigée serveur.** Elle dit ce que la famille détecte ; c'est une règle, donc
elle vit avec la règle.

⚠️ **Une famille vide reste dans `families`**, avec `items: []`. L'écran écrit « aucun signal de cette
nature » : savoir qu'il n'y a aucun contournement au planning est une information, une section
absente ne dit rien.

⚠️ **`detail` parle en heures** pour la couverture : « 24 h prévues, aucune répartie », pas « aucune
ligne ». C'est la correction du lot 6 appliquée au libellé — sans le volume attendu, on ne sait pas
ce qui manque.

⚠️ **Le périmètre suit le lecteur, et c'est le serveur qui filtre** (arbitrage du lot 6) : un
responsable de formation voit **sa filière** pour la couverture et le contournement, mais voit le
**dépassement de norme des enseignants qu'il emploie** — le dépassement concerne un enseignant, pas
une filière.

⚠️ `route` est un **nom de route déclarée** dans `nav.js`, pas un chemin. Un chemin en dur rendu par
le serveur tomberait dans la redirection fourre-tout au premier renommage.

### 5.6 Les actes d'écriture de la répartition — appelés, non documentés, non simulés

⚠️ **QUATRE CHEMINS QUE LE CODE APPELLE ET QUE CE DOCUMENT NE NOMMAIT PAS.**

Trouvés par le contrôle bidirectionnel ajouté à la grappe 7, non par une relecture. Ils étaient 🔴 dans
`service.js` — donc annoncés supposés — mais nommés nulle part au handoff, et **sans handler dans le
simulacre** : les appeler en mode simulacre lève « point d'entrée non simulé ».

| Point d'entrée | Appelé par | Statut |
|---|---|---|
| `create_service_line` | `service.js` → `createServiceLine` | 🔴 non vérifié · non simulé |
| `update_service_line` | `service.js` → `updateServiceLine` | 🔴 non vérifié · non simulé |
| `delete_service_line` | `service.js` → `deleteServiceLine` | 🔴 non vérifié · non simulé |
| `propose_service_plan` | `service.js` → `proposeServicePlan` | 🔴 non vérifié · non simulé |

⚠️ **Ce n'est pas grave à l'écran, et c'est grave au handoff.** Les trois boutons de l'écran N1
(ajouter, proposer, reconduire) ne sont pas branchés — ils affichent un bandeau qui le dit, plutôt que
d'appeler ces chemins. Donc rien ne casse. Mais un lecteur back qui câble depuis ce document ne
construit aucun de ces quatre actes, alors que le front les nomme déjà.

Formes attendues, à confirmer avec la surface réelle :

    create_service_line  { academic_year, program, module, activity, teacher, group, hours }
    update_service_line  { name, ...champs modifiés }
    delete_service_line  { name }
    propose_service_plan { academic_year, program }        → { count, partial_message? }

⚠️ **`propose_service_plan` porte la règle de l'enseignant obligatoire** : l'un des neuf ajustements
demande que l'enseignant soit exigé **à la proposition**, non à la création — c'est ce qui permet de
poser la structure en juillet et de chercher les enseignants ensuite. Une ligne sans enseignant doit
donc être enregistrable, et bloquer la proposition.

### 5.7 Prévu contre réalisé (écran N5)

| | |
|---|---|
| **Point d'entrée** | `get_service_progress` — 🟡 cible existante, sous un autre nom (table de correspondance attendue). C’est ce nom que le front appelle. |
| **Paramètres** | `{ academic_year, program }` |

    {
      program_label, line_count,
      planned_hours, done_hours, exam_hours,
      computed_at, computed_at_label,          // OBLIGATOIRES
      lines: [{ id, module_code, module_label, activity, group, teacher,
                planned, done,
                gap,                           // SIGNÉ, calculé serveur
                gap_flagged,                   // vrai = mérite d'être remarqué
                progress_tone,                 // 'short' | absent
                shared_count, sessions_note }]
    }

⚠️ **`computed_at` est obligatoire** — l'un des neuf ajustements. `done_hours` sert de base à la
rémunération des vacataires. Si le champ manque, l'écran écrit « sans millésime — chiffre non
opposable » : un tableau sans date ne doit pas avoir l'air d'un tableau daté.

⚠️ **`gap` arrive signé du serveur** et n'est jamais recalculé. **`gap_flagged` est un champ
distinct** parce qu'un écart de −21 h en février est normal si le projet démarre au semestre pair et
anormal si trois séances ont été annulées — seul le serveur sait lequel. Sans ce champ, l'écran
inventerait un seuil.

⚠️ **Le réalisé compte la durée RÉELLE des séances tenues**, jamais une durée standard par type
d'activité (réponse 3 du lot 6). C'est le serveur qui somme ; l'écran ne convertit pas une séance en
heures.

⚠️ **`sessions_note` est rédigée serveur** — « 7 tenues · 1 annulée », « 8 tenues — comptées une
fois ». Le détail des séances n'est pas rendu ligne à ligne : la phrase suffit et évite un second
appel.

⚠️ **`exam_hours` est rendu séparément et n'entre dans aucun total** : les épreuves ne comptent pas
au service réalisé, la surveillance étant réputée incluse dans l'heure d'enseignement. Le chiffre est
affiché **pour qu'on sache qu'il a été écarté volontairement**.

### 5.8 À venir dans cette grappe

| Acte | Point d'entrée | Statut |
|---|---|---|
| Reconduction annuelle | `carry_over_service_plan` | 🔴 — l'un des neuf ajustements |

⚠️ `get_service_progress` doit rendre **`computed_at`** : c'est l'horodatage du réalisé, l'un des
neuf ajustements. Sur une donnée qui sert de base à la rémunération des vacataires, un tableau sans
millésime est intenable.

⚠️ Le réalisé se compte en **durée réelle** des séances tenues, jamais en durée standard par type
d'activité (réponse 3 du lot 6). C'est le serveur qui somme.

---

## 6. Grappe 4 — groupes et inscriptions

⚠️ **CETTE SECTION EST RÉÉCRITE.** La première version visait le vendor `education.*` et des méthodes
de document. Elle passait à côté de `portal_app/api/academic/groups.py` : une surface MINCE de treize
points whitelistés, dont la docstring dit ce que le vendor ne dit pas —

> « Gardes : lecture = staff (RF/PM scopés filière) · écriture = GA (+SM). Éligibilité TC = source
> unique, cross-filière restreint aux groupes Cohorte. »

Trois conséquences absentes du vendor : le **scope** est appliqué au serveur en fail-closed,
l'éligibilité a une **source unique**, les écritures sont **gardées par rôle**.

### 6.1 Groupes — lecture

| Point d'entrée | Signature | Statut |
|---|---|---|
| `groups.list_groups` | `(program, academic_year, academic_term, group_type, include_disabled)` | 🟢 `groups.py:20` |
| `groups.get_group` | `(name, count_only=0)` | 🟢 `groups.py:33` |
| `groups.get_student_groups` | `(student)` | 🟢 `groups.py:39` |
| `groups.list_group_candidates` | `(group)` | 🟢 `groups.py:45` |
| `groups.get_cohort_overview` | `(program, academic_year, academic_term)` | 🟢 `groups.py:51` |

    // get_group
    { …, students: [{ student, student_name, group_roll_number, active }],
         instructors: [{ instructor, instructor_name }],
         active_count, instructors_count }

    // get_cohort_overview
    { program, academic_year, groups: [{ …, active_count }], totals_by_type: { <type>: n } }

⚠️ **`get_group` rend le groupe AVEC ses membres et ses enseignants** — un appel là où la première
version en faisait trois. Règle 6 appliquée au contrat : trois lectures du même ensemble
divergeraient, et l'effectif d'en-tête aurait cessé de s'accorder avec la liste en dessous.
`active_count` est **sommé** sur `students`, jamais déclaré à côté.

⚠️ **`count_only=1` rend le seul effectif SOUS LES MÊMES GARDES.** Le décompte-avant-chargement du
châssis est donc porté par le serveur, sur ce point d'entrée même — pas par un second contrat.

⚠️ **`list_group_candidates(group)` ne prend QUE le groupe.** C'est elle qui tranche l'éligibilité,
« source unique, indépendante des System Defaults vendor ». La première version passait l'année et le
découpage pour dériver l'éligibilité elle-même : elle aurait divergé dès le premier tronc commun.

⚠️ **La vue d'effectifs existait** — `get_cohort_overview`. Le bouchon est retiré.

### 6.2 Groupes — écriture [GA (+SM)]

`create_group` · `update_group` · `set_group_disabled` · `add_students_to_group` ·
`deactivate_students_in_group` · `transfer_student` · `assign_instructor` · `remove_instructor`
— 🟢 `groups.py:57` à `99`.

⚠️ **DÉSACTIVER, non supprimer** : un membre inactif reste au groupe avec son numéro d'ordre. L'écran
dit « retirer du groupe », jamais « effacer ».

⚠️ **`add_students_to_group` rend un rapport ligne à ligne** : acte de masse, succès partiel courant.

### 6.3 Inscription administrative

| | |
|---|---|
| **Point d'entrée** | `emela_core.academic_core.api.enrollment.create_student_from_applicant` — 🟢 `enrollment.py:57` |

⚠️ **ACTE D'ÉCRITURE, EN CASCADE** : étudiant, inscription au programme, inscription pédagogique,
compte, rattachements. Il ne part QUE d'un geste — jamais d'un cycle de vie. **Un identifiant inventé
envoyé à une fonction qui écrit est pire qu'un chemin inventé : l'appel réussit.**

⚠️ **L'inscription manuelle ne crée pas le badge d'accès** (T2) — aucune trace serveur. L'écran le dit.

⚠️ **Une période disciplinaire active refuse l'inscription** : la cascade s'arrête avant toute
écriture. L'écran EXPLIQUE le refus, il n'affiche pas une erreur.

### 6.4 Reprise d'une inscription — L'APPELANT EXISTE

| | |
|---|---|
| **Point d'entrée** | `enrollment_mgmt.replay_enrollment(integration_log)` — 🟢 `enrollment_mgmt.py:61` |
| **Aussi** | `list_incomplete_enrollments(limit=50)` — 🟢 `:67` · `list_moodle_orphans(limit=50)` — 🟢 `:43` · `run_pedagogical_enrollment(student)` — 🟢 `:55` |

La fonction interne `replay_enrollment_from_log` n'est pas whitelistée, et sa docstring disait vrai :
« la garde de rôle vit chez l'appelant (portal_app enrollment_mgmt) ». **Cet appelant est exposé** —
je n'avais pas cherché du bon côté. Le bouchon est retiré, le bouton est branché.

⚠️ **ACTE D'ÉCRITURE** : il rejoue la cascade. L'étudiant déjà créé pour ce candidat est RÉUTILISÉ —
aucune duplication — mais l'appel écrit.

⚠️ **`list_moodle_orphans` RESTREINT le périmètre de l'écran.** Le point d'entrée réel ne connaît que
les orphelins de la plateforme d'apprentissage. La seconde nature affichée — un étudiant sans groupe —
n'a pas de source lue : elle redevient un manque nommé plutôt qu'un affichage adossé à rien.

### 6.5 Ce qui manque

| Manque | Statut |
|---|---|
| `get_enrollment_log(log_name)` — lire un journal sans rien exécuter | **accordé**, entre dans la vague |

⚠️ C'est la démonstration du défaut le plus grave de cette grappe : faute de lecture, l'écran
affichait le rapport en **rejouant la cascade**.

---

## 7. Grappe 5 — planning et examens

Surfaces MINCES : `portal_app/api/academic/planning_mgmt.py` (onze points) et `exam_mgmt.py` (sept).
Gardes par bloc : lecture = staff, RF/PM **scopés par le programme du GROUPE** (fail-closed) ;
écriture et publication = GA (+SM) ; la dérogation au préavis exige motif **et** rôle Directeur des
Études chez l'appelant.

### 7.1 Séances — lecture

| Point d'entrée | Signature | Statut |
|---|---|---|
| `planning_mgmt.list_schedules` | `(student_group, course, instructor, room, program, date_from, date_to, planning_status, session_type, status, limit, count_only)` | 🟢 `:27` |
| `planning_mgmt.get_schedule` | `(name)` | 🟢 `:44` |
| `planning_mgmt.get_module_planning_summary` | `(course)` | 🟢 `:50` |
| `planning_mgmt.check_schedule_conflicts` | `(schedule_date, from_time, to_time, student_group, instructor, room, exclude)` | 🟢 `:56` |
| `planning_mgmt.get_instructor_day_load` | `(instructor, day)` | 🟢 `:104` |
| `planning_mgmt.list_tp_requalification_candidates` | `(limit)` | 🟢 `:98` |

⚠️ **LES DEUX STATUTS SONT DEUX CHAMPS INDÉPENDANTS.**

    custom_status           Planifié · Confirmé · Réalisé · Annulé
    custom_planning_status  Brouillon · Publié · Modifié

« Une séance annulée reste publiée » n'est donc pas une convention d'écran : **c'est la forme du
modèle**. L'écran montre les deux, jamais l'un à la place de l'autre — et `set_schedule_status` ne
touche que le premier.

⚠️ **LA PROVENANCE DE L'ENSEIGNANT EST DÉRIVÉE, JAMAIS STOCKÉE.** `get_schedule` rend
`instructor_service_source` via `service_source_for_session()`, calculée à la lecture — « même après
remplacement : toujours vraie ». Trois issues, et **la troisième n'est pas la deuxième** :

| Valeur | Sens |
|---|---|
| `répartition` | l'enseignant est celui de la ligne de service |
| `choisi` | quelqu'un d'autre a été désigné, la ligne existe |
| `null` | **aucune ligne de service** sur ce module et ce type — personne n'a été contourné |

Confondre les deux dernières accuse un planificateur d'un écart qui n'existe pas.

⚠️ **`count_only=1`** rend `{count}` « sous les MÊMES gardes et le MÊME périmètre — l'écran annonce
le volume pendant le chargement ». Le contrat du châssis, porté par le serveur.

⚠️ **LE SCOPE EST FAIL-CLOSED ET SILENCIEUX EN LISTE** : un groupe hors périmètre rend `[]`, sans
erreur. L'écran ne doit donc pas lire une liste vide comme « rien cette semaine » sans dire qu'un
filtre de portée s'applique — c'est le vide crédible, encore.

⚠️ **`get_module_planning_summary` TAIT les types sans allocation** (`if allocated is None:
continue`) — pas rendus à zéro. C'est la règle du lot 6 côté serveur : zéro heure prévue n'est pas un
manque. L'écran ne doit pas compléter la liste par les types qu'il connaît.

⚠️ **`check_schedule_conflicts` est une VUE, pas une garde** — « lecture pure : le point
d'enforcement reste `validate_overlap` au save ». Exactement le contrat que la grille temporelle
attendait. Trois axes, et ils ne se valent pas : le scope s'applique à l'axe GROUPE, tandis que les
axes SALLE et ENSEIGNANT restent **volontairement cross-filière** — « détecter le conflit d'une
ressource PARTAGÉE est l'objet même de la vue ». Un conflit d'enseignant peut donc nommer une séance
d'une filière que le lecteur ne voit pas : l'écran le dit plutôt que d'afficher une ligne muette.
Il faut au moins un axe, sinon la fonction lève.

⚠️ **Les demi-heures sont RÉELLES** : les séances durent un multiple de trente minutes et s'alignent
sur la demi-heure — validation serveur. La grille reçoit `step: 0.5`, elle ne le devine pas.

### 7.2 Séances — écriture [GA (+SM)]

| Point d'entrée | Retour | Statut |
|---|---|---|
| `create_schedule(values)` | `{ name, custom_status, custom_planning_status, instructor, instructor_source }` | 🟢 `:70` |
| `update_schedule(name, values)` | `{ name, custom_status, custom_planning_status }` | 🟢 `:76` |
| `set_schedule_status(name, status, reason)` | — | 🟢 `:82` |
| `assign_instructor(schedules, instructor)` | `{ instructor, rows }` | 🟢 `:88` |
| `publish_schedules(schedules, override_reason)` | rapport de masse | 🟢 `:94` |

⚠️ **LA PROPOSITION SE FAIT PAR TYPE D'ACTIVITÉ, À LA CRÉATION.** Sans enseignant fourni,
`create_schedule` appelle `suggested_instructor_for(course, group, activity_type=custom_session_type)`
et rend `instructor_source` : « choisi » si l'appelant l'a nommé, « répartition » si la ligne de
service l'a proposé, `null` si aucune ligne n'existe. **La séance de travaux dirigés reçoit
l'enseignant des travaux dirigés.**

⚠️ **Jamais une contrainte** : « un enseignant explicite gagne toujours — le remplacement produit le
signal de contournement, pas un refus ».

⚠️ **L'édition d'une séance PUBLIÉE repasse « Modifié » avec trace** — machine du contrôleur. Le front
ne pose pas ce statut, il le LIT. Une modification n'est jamais silencieuse pour les étudiants qui
avaient déjà vu la séance.

⚠️ **`set_schedule_status` ne touche que `custom_status`.** Annuler ne dépublie pas. Le motif est
FACULTATIF côté serveur (tracé en Comment) : un écran qui l'exige ajoute une règle d'interface, il ne
relaie pas une règle serveur — et il doit le savoir.

### 7.3 Publier — et la dérogation au préavis

    { total, ok, ko, retry_ids, rows: [{ schedule, status, message?, min_days? }] }

⚠️ **LA GARDE MORD PAR SÉANCE, PAS PAR LOT.** Une ligne revient `j7_derogation_required` avec son
message et `min_days`, tandis que les autres sont publiées. Succès partiel au sens strict — et
**courant, pas exceptionnel**.

⚠️ **`retry_ids` ne contient QUE les rejouables** : « une dérogation peut être accordée ; un
introuvable restera introuvable ». L'écran ne doit pas offrir de tout réessayer.

⚠️ **LE PRÉAVIS NE CONCERNE QUE LES ÉPREUVES**, et il vaut pour les quatre types — écrit, pratique,
mixte, autre : le type est une information au registre, pas un régime. **Les travaux pratiques en sont
sortis** : un TP se publie comme un cours, sans préavis.

⚠️ **La dérogation exige le rôle Directeur des Études CHEZ L'APPELANT.** Donc `derogate:planning`
commande la présence du **champ de motif**, pas du bouton de publication.

⚠️ **Publier vaut CONVOCATION** — c'est pourquoi `publish:planning` est une clé distincte de
`write:planning` alors que l'acteur est le même : l'acte a des effets externes.

### 7.4 Requalification des travaux pratiques

`list_tp_requalification_candidates(limit)` — 🟢 `:98`. **LECTURE SEULE**, geste de RUNBOOK à la
mise en service : « TP est sorti des types d'épreuve — les séances TP qui étaient de VRAIES épreuves
ont perdu préavis et convocation : le système présente les INDICES ». Le système ne requalifie rien
seul, et l'écran ne doit pas suggérer qu'il le ferait.

### 7.5 Examens

`list_exam_schedules` · `get_exam_schedule` · `create_exam_schedule` · `update_exam_schedule` ·
`add_exam_students` · `remove_exam_students` · `populate_exam_students_from_group`
— 🟢 `exam_mgmt.py:25` à `66`.

⚠️ **INSCRIRE N'EST PAS CONVOQUER.** Ces points d'entrée composent la liste des candidats ; la
convocation naît de la **publication** de la séance d'examen. Un écran qui dit « convoquer » sur ce
bouton promet un acte qu'il ne fait pas.

### 7.6 Ce qui manque

| Manque | Motif |
|---|---|
| l'enseignant que la répartition **proposait** | `instructor_service_source` dit qu'il y a eu contournement, pas QUI a été contourné. L'écran porte une table de correspondance marquée comme pis-aller : elle divergera de la répartition dès la première modification de ligne — règle 6. Il faut que `get_schedule` rende le nom proposé à côté de la provenance. |

---

## 8. Grappe 6 — notes, délibération et examens

Surfaces MINCES : `grade_control.py` (sept points), `module_grade.py` (trois),
`deliberation_mgmt.py` (sept). Gardes : contrôle = Education Manager (+SM) · décision de modification
de note = EM/PM (+SM) · échéances = EM/GA (+SM).

### 8.1 Contrôle des notes

| Point d'entrée | Signature | Statut |
|---|---|---|
| `grade_control.list_submissions_for_control` | `(status, course, student_group, evaluation_component, limit, include_attendance)` | 🟢 `:44` |
| `receive_submission` · `process_submission` · `integrate_submission` | `(name)` | 🟢 `:20` `:26` `:32` |
| `reject_submission` | `(name, reason)` | 🟢 `:38` |
| `decide_modification` | `(name, decision, reason)` | 🟢 `:56` |
| `set_module_deadline` | `(course, evaluation_component, deadline_date)` | 🟢 `:62` |

⚠️ **`include_attendance=1` EST L'AMENDEMENT A7 DU LOT 8, ET IL EXISTAIT DÉJÀ.** La docstring serveur
porte la phrase que la maquette avait écrite :

> « au contrôle, un zéro d'évaluation ne se lit pas comme un zéro d'absence (Art. 12.3) »

Chaque ligne reçoit alors `unexcused_absences` et `attendance_rows` — « mêmes rôles, aucune donnée
nouvelle : un croisement ».

⚠️ **L'assiduité porte sur LE MODULE**, toutes séances confondues — jointure
`Student Attendance ↔ Course Schedule du cours`. Pas sur la composante soumise : la correspondance
composante ↔ type d'activité n'est pas fiable, d'où « **probable** » et jamais une conclusion.

⚠️ **`student_count` est rendu pour chaque ligne, `lines` seulement avec le drapeau.** Le
décompte-avant-chargement vit donc au niveau du point d'entrée : l'écran annonce le volume sans
charger le détail.

⚠️ **Renvoyer et rejeter sont le même acte serveur** : `reject_submission(name, reason)`. Un point
d'entrée, un motif obligatoire. La catégorie que l'écran demande voyage dans `reason` — deux boutons
auraient promis deux actes.

⚠️ **`set_module_deadline` est PRIORITAIRE sur « dernière séance »** (DEC-289). Une échéance absente
n'est donc pas une absence d'échéance : elle retombe sur la dernière séance planifiée. L'écran doit
dire laquelle des deux règles s'applique, sinon un enseignant croit avoir le temps.

### 8.2 Moyennes de module

`propose_module_average(course, student_group)` · `validate_module_average(course, student_group,
decisions)` · `list_adjusted_module_averages(course, student, limit)` — 🟢 `module_grade.py:21` à `:33`.

⚠️ Une liste d'écarts n'est pas une liste d'erreurs : un ajustement est un acte motivé. L'écran ne
doit pas en faire un signalement.

### 8.3 Le tableau de délibération

| | |
|---|---|
| **Point d'entrée** | `deliberation_mgmt.get_deliberation_dashboard(name)` — 🟢 `:62` |

    { name, status, program, academic_term,
      jury_members: [{ member_role, user }],
      rows: [{ student, decision, new_academic_status,
               attendance_exceeded, attendance_derogation_reason, attendance,
               semester_result: { total_ects_earned, total_ects_possible,
                                  semester_validated, all_mhc_validated,
                                  jury_decision },
               ue_results: [{ course_ue, academic_term, ue_average, is_validated,
                              is_compensated, has_floor_violation, ects_earned,
                              ects_grade, is_after_retake, is_jury_validated }],
               annual_average,
               cps_history: { preconisations: [{ kind, academic_term, status,
                                                 details, finding, closed_on }],
                              unjustified_cps_absences: [{ session, academic_term,
                                                           session_date }] } }] }

⚠️ **`cps_history` EST L'AJOUT LE PLUS IMPORTANT DU LOT 8, ET IL EXISTE.** La docstring serveur porte
la même intention que la maquette :

> « Le jury voit tout (Art. 32.4) : les préconisations du CPS (avec le constat du contrat) et
> l'absence NON justifiée à une convocation (32.5) — des INFORMATIONS présentées au jury, jamais des
> décisions (32.3). »

`finding` est le constat du contrat de remédiation, `closed_on` dit s'il a été posé. Un contrat
**sans constat** se lit tel quel : le jury le lit, il ne le bloque pas.

⚠️ **L'historique est lu sur TOUS LES SEMESTRES de l'année**, pas sur le seul semestre délibéré. C'est
ce qui fait que l'alerte de janvier éclaire la décision de juillet.

⚠️ **`rows` NE PORTE QUE LES DÉCISIONS DÉJÀ INSTRUITES** — `for decision in doc.decisions`. Un jury
de quatre-vingt-seize étudiants dont onze sont décidés en reçoit onze. Voir §8.5.

⚠️ **`annual_average` est INDICATIVE, jamais bloquante** (Art. 33, « fonctions moteur réveillées »).
L'écran ne doit pas la présenter comme un résultat arrêté.

### 8.4 Les actes de la délibération

| Acte | Point d'entrée | Acteur |
|---|---|---|
| créer | `create_deliberation(program, academic_level, academic_year, academic_term, deliberation_date, president, jury_members)` | EM instruit |
| jury | `add_jury_member(deliberation, member_role, user)` | EM |
| ouvrir | `start_deliberation(name)` | EM |
| décider | `add_decision(deliberation, student, semester_result, decision, new_academic_status, decision_reason, attendance_derogation_reason)` | EM |
| unité | `apply_jury_ue_decision(deliberation, ue_result, kind, basis)` | EM |
| **clore** | `close_deliberation(name)` | **DE ou Direction, ≠ créateur** |

⚠️ **LE MAKER-CHECKER VIT AU CONTRÔLEUR, ET UNE DE SES CONDITIONS EST INVÉRIFIABLE AU FRONT.** Trois
conditions : (a) ≠ créateur, (b) DE ou Direction, (c) jury enregistré. La première demande de savoir
qui a créé la délibération — l'écran ne le sait pas avant de l'avoir lue, et le savoir ne suffirait
pas. L'écran affiche donc le bouton selon `close:deliberation` et laisse le serveur refuser. **Un
refus ici n'est pas une erreur : c'est le maker-checker qui fonctionne**, et l'écran le dit dans ces
mots.

⚠️ **LA DÉROGATION D'ASSIDUITÉ SE JOUE EN DEUX MOMENTS.** Le flag `attendance_exceeded` est posé à
l'instruction ; le motif est **exigé à la clôture** pour un passage en dépassement. Le champ est
accepté dès `add_decision`, mais l'avoir saisi tôt ne dispense pas de la vérification au moment de
clore. « Le jury reste souverain, Art. 31.2 » : le dépassement ne refuse pas le passage, il refuse un
passage sans motif.

⚠️ **La clôture gèle le procès-verbal** (`pv_attachment`) et propage aux dossiers. Elle n'est pas
réversible depuis l'interface.

### 8.5 Ce qui manque

| Manque | Pourquoi il est structurant |
|---|---|
| les étudiants d'un jury, **décidés ou non** | `get_deliberation_dashboard` ne rend que les décisions instruites. Sans cette lecture, l'écran du jury liste **ce qui est fait** au lieu de ce qui reste à décider — l'inverse de son usage. |

⚠️ **La forme la plus sûre est un DRAPEAU sur le point d'entrée existant** —
`get_deliberation_dashboard(name, include_pending=1)` — plutôt qu'un second point d'entrée. Un
drapeau garde **une seule** construction de ligne au serveur ; deux points d'entrée en auraient deux,
et elles divergeraient à la première évolution. C'est la règle 6, appliquée au contrat plutôt qu'aux
données.

⚠️ Le front porte aujourd'hui un appel `list_deliberation_roster` marqué 🔴, dans un module qui ne
contient que ce manque (`api/deliberation.js`). Il rend la MÊME forme de ligne que le dashboard :
quand le drapeau existera, ce fichier disparaît et l'écran ne change pas.

### 8.6 Examens — l'écran de composition

`list_exam_schedules` · `get_exam_schedule` · `create_exam_schedule` · `update_exam_schedule` ·
`add_exam_students` · `remove_exam_students` · `populate_exam_students_from_group`
— 🟢 `exam_mgmt.py:25` à `:66`.

⚠️ **INSCRIRE N'EST PAS CONVOQUER.** Ces points composent la liste ; la convocation naît de la
**publication** (`planning_mgmt.publish_schedules`, §7.3). Deux champs le disent :
`custom_planning_status` porte la publication, `custom_status` le cycle de la séance.

⚠️ **Conséquence pour l'écran** : avant publication, composer la liste n'a aucun effet visible ; après,
**chaque ajout convoque** et un retrait ne décommande pas de lui-même. Ce sont deux régimes, et l'écran
doit les distinguer par des phrases différentes, pas par une seule mention.

⚠️ `populate_exam_students_from_group` rend un rapport de masse au contrat commun. Un étudiant déjà
inscrit compte comme un **succès** — la liste est dans l'état voulu.

---

## 9. Grappe 7 — les dossiers

Six surfaces MINCES : `academic_leave_request.py` (huit points), `leave_return.py` (sept),
`reorientation.py` (neuf), `resignation.py` (neuf), `abandonment.py` (sept), `discipline.py` (treize).
« La doctrine et les gardes vivent au service et au CONTRÔLEUR. »

### 9.1 Le patron commun

| Étape | Verbes | Garde |
|---|---|---|
| créer | `create_*` | l'étudiant, ou l'EM pour l'abandon |
| déposer | `submit_*` · `deposit_*` · `issue_*_notice` | déposant |
| **instruire** | `instruct_*` · `start_*_commission` · `convoke_*` | Education Manager |
| **décider** | `decide_*` · `pronounce_*` · `register_*` | DE ou EM selon la procédure |
| notifier | `record_*_notification` | l'instructeur |
| sortir | `cancel_*` · `retract_*` · `refuse_*` · `dismiss_*` · `close_without_sanction` | selon l'acte |

⚠️ **INSTRUCTION ET DÉCISION SONT DEUX ACTES**, et ce sont deux points d'entrée distincts dans les six
procédures. Le patron du lot 3 est donc confirmé par le code, pas seulement par la conception.

⚠️ **La sortie sans décision existe partout**, et elle exige un motif partout. Un dossier ne se ferme
jamais en silence.

### 9.2 Ce que chaque procédure ajoute — et qui est une garantie

| Procédure | Ajout | Point d'entrée |
|---|---|---|
| congé | **arbitrage** au-dessus de la décision | `arbitrate_coa_request(name, decision, arbitration_reason)` |
| réorientation | **commission** collégiale | `start_reorientation_commission` · `add_commission_member` |
| réorientation | crédits **avec leur fondement** | `add_credit_recognition(name, source_label, credits_recognized, basis)` |
| démission | **information préalable**, canal tracé | `record_resignation_information(name, info_channel)` |
| démission | **rétractation** de l'étudiant | `retract_resignation(name)` |
| abandon | **contradictoire** en deux actes | `issue_abandonment_notice` · `record_abandonment_response` |
| discipline | **appel suspensif** | `appeal_suspension` · `decide_suspension_appeal` |

⚠️ **Aucun de ces ajouts n'est du remplissage.** `basis` sur une reconnaissance de crédits, le canal de
l'information préalable, l'ordre de la mise en demeure : chacun est ce qui distingue une décision d'une
faveur. Un écran qui les traiterait comme des champs optionnels serait juste en apparence.

⚠️ **Le congé est la seule procédure dont une décision n'est pas définitive.** L'écran doit montrer deux
niveaux — sinon un étudiant organise son année sur une décision reprenable.

### 9.3 L'appel disciplinaire

| | |
|---|---|
| **Déposer** | `appeal_suspension(name, appeal_grounds)` — 🟢 `discipline.py:64` |
| **Statuer** | `decide_suspension_appeal(name, decision, appeal_reason, resume_start, resume_days_remaining)` — 🟢 `:71` |

Champs rendus : `days_served_at_appeal` · `appeal_decision` · `resume_start` ·
`resume_days_remaining` · `resume_end`.

La docstring serveur :

> « le geste unique — statuer (Confirmée/Réformée/Infirmée) ET, si la sanction survit, fixer la
> reprise (plafond = jours non encore purgés, gardes au contrôleur) »

⚠️ **UN SEUL ACTE, PAS DEUX.** Il n'existe pas d'état « appel statué, reprise à fixer ». Un écran en
deux étapes promettrait un état qui n'existe pas.

⚠️ **L'APPEL EST SUSPENSIF** : `days_served_at_appeal` fige les jours purgés au dépôt. Le décompte est
**arrêté, pas effacé** — et c'est ce chiffre qui plafonne la reprise.

⚠️ **LE PLAFOND DE NON-AGGRAVATION EST AU CONTRÔLEUR.** `resume_days_remaining` ne peut pas dépasser
les jours non encore purgés. L'écran affiche le plafond sur le champ et le calcul sous la saisie — le
refus fait autorité au serveur, mais l'écran doit pouvoir montrer POURQUOI, sinon un refus ressemble à
une panne.

⚠️ **`resume_start` ET `resume_days_remaining` SONT FACULTATIFS**, parce qu'ils n'ont d'objet que si la
sanction survit. Sur une infirmation, l'écran les **retire** — il ne les grise pas : un champ grisé
laisse croire qu'il y a une valeur à y mettre.

⚠️ **LEVER N'EST PAS INFIRMER.** `lift_suspension(name, lift_reason)` est un acte de grâce en cours
d'exécution ; l'infirmation annule la sanction. L'une laisse la sanction au dossier, l'autre la retire.

### 9.4 L'échéance structurée — le contrat D-05

Les bandeaux d'effet différé et la fenêtre de rétractation consomment **le même contrat** :

    { term, unit, remaining, opened_on, stages[], will[], can[], at_term }

⚠️ **`remaining` VIENT DU SERVEUR.** « Une échéance de droit ne se calcule pas au front : deux
appareils mal réglés produiraient deux dates limites. »

⚠️ **`will` ET `can` SONT DEUX LISTES, jamais une** : « ce qui se produira sans ce qui reste possible
transforme une information en menace ». Sur une suspension sous appel, elles disent ce qui est **arrêté**
et ce qui a **repris**.

⚠️ **`state` A CINQ VALEURS** : `a_venir` · `en_cours` · `suspendue` · `reprise` · `expiree`.
« Suspendue » est un état à part entière — ni active, ni expirée — et la période n'est plus une paire de
dates fixée au prononcé.

### 9.5 La cause d'un statut hors cursus

🟢 `status_cause.py:18` — `get_my_status_cause(student_id)`. L'amendement A5 du lot 8 : l'ACTE, la
CATÉGORIE et la DATE. **Jamais les faits**, qui restent dans le dossier qui les a établis.

### 9.6 Les suspensions échues dont l'accès reste fermé

🟢 `discipline.py:95` — `list_suspensions_needing_moodle_reactivation()` · `:102` —
`reactivate_moodle_after_expiry(name, reason)`.

⚠️ **Une suspension échue ne rouvre pas l'accès toute seule.** Dette du chantier d'authentification,
comme le badge d'accès de la grappe 4. Sans cette liste, un étudiant reste fermé après le terme de sa
sanction et personne ne le sait.

### 9.7 Ce qui manque

| Manque | Forme demandée |
|---|---|
| la file **transversale** des dossiers | **pas un sixième point d'entrée.** `work_queue` porte déjà le domaine `dossiers` : qu'il rende, pour ce domaine, la ligne dont l'écran a besoin. Une seule construction. |
| les dossiers **en attente d'un autre décideur** | l'écran A8 du lot 8. Cherché `awaiting`, `no_decider`, `other_decider`, `instructed_by` : aucune correspondance. |

⚠️ Le premier manque reçoit la **même réponse** que celui de la grappe 6 : étendre le point d'entrée
existant, jamais en ajouter un parallèle. Deux points d'entrée auraient deux constructions de ligne, et
elles divergeraient.

### 9.8 Ce que le code appelle en attendant — et que ce document ne nommait pas

⚠️ **CE DOCUMENT PRESCRIVAIT L'INVERSE DE CE QUE LE CODE APPELLE, sans le dire.**

Le §9.7 demande d'étendre `work_queue` plutôt que d'ajouter un point d'entrée parallèle. Or l'écran des
dossiers en appelle **deux**, provisoires, et ce document ne les nommait nulle part :

| Point d'entrée | Appelé par | Statut |
|---|---|---|
| `list_dossiers` | `dossiers-read.js` → `listDossiers` | 🔴 non vérifié · **provisoire** |
| `get_dossier` | `dossiers-read.js` → `getDossier` | 🔴 non vérifié · **provisoire** |

Un lecteur qui câblait depuis le §9.7 étendait `work_queue` et ne construisait ni l'un ni l'autre —
donc l'écran des dossiers, celui de la grappe livrée, restait **sans données**. C'est mot pour mot le
défaut du §1.5, appliqué à l'écran principal au lieu de A8.

Formes rendues, relues dans la fixture :

    // list_dossiers
    { count, items: [ <même forme qu'un dossier, ci-dessous> ] }

    // get_dossier — { name }
    {
      name, kind, kind_label, student, student_name,
      reached, status, status_tone, opened_on, ground,
      instructed_by, decided_by, decision_reason, decider_role,
      step_dates, arbitration, outcomes,
      extra, extra_applies,              // ce que la procédure PEUT porter / ce que CE dossier porte
      suspended_by_appeal,
      chain: [{ key, label, actor, status, date }]
    }

⚠️ **La forme demandée reste celle du §9.7** : une seule construction de ligne, portée par
`work_queue`. Ces deux chemins existent pour que l'écran soit jugeable avant le branchement, et ils
doivent disparaître quand l'extension arrive — un provisoire non résorbé devient une convention.

⚠️ `extra` et `extra_applies` sont **deux champs distincts** : le premier dit ce que la procédure peut
porter, le second si **ce dossier** le porte. Les confondre faisait monter un panneau vide sur un
dossier qui n'a pas d'appel.

---

## 10. Grappe 8 — le conseil pédagogique

⚠️ **AUCUNE SURFACE. La carte des surfaces (P-05b) ne porte pas de conseil pédagogique.** Cherché
`council`, `cps`, `preconisation`, `absence_threshold` : aucune correspondance. Les quatre lectures
et les sept actes ci-dessous sont formés par analogie, et le relevé
`releve-grappes-8-11.md` les nomme tous.

**Règle du domaine, et elle est négative : le conseil ne prononce aucune décision.** Ni progression,
ni redoublement, ni exclusion. Il constate, il alerte, il préconise — les décisions appartiennent au
jury de fin d'année.

### 10.1 Les quatre lectures

| Point d'entrée | Signature | Statut |
|---|---|---|
| `list_council_candidates` | `(academic_year, term, program, criterion?)` | 🔴 |
| `get_council_session` | `(name?, item?)` | 🔴 |
| `list_council_preconisations` | `(academic_year, program, kind?)` | 🔴 |
| `list_absence_thresholds` | `(academic_year, term)` | 🔴 |

⚠️ **`list_council_candidates` ne doit rendre NI SCORE, NI RANG, NI GRAVITÉ.** Trois critères
booléens — vingt crédits non acquis, une unité sous 6/20, dix séances d'absence ou plus — et l'ordre
du registre. Un champ de gravité rendrait le tri par gravité possible, donc probable, et un
classement d'étudiants se lit comme une conclusion. Or figurer sur cette liste n'emporte rien.

⚠️ **Chaque valeur calculée porte `official: false`.** La délibération est annuelle et se tient en
juillet : en janvier, crédits et moyennes sont calculés, pas arrêtés. Si l'écran devait déduire ce
statut de la période, il se tromperait un an sur deux. C'est aussi l'argument qui justifie que le
conseil ne décide rien.

⚠️ **`get_council_session` rend `can_close` ET `close_blocked_reason`.** L'écran de séance porte le
seul bouton **désactivé** du dépôt, et il reprend cette raison telle quelle. Une phrase écrite dans
la vue serait une seconde implémentation de la règle de clôture, et divergerait d'elle au premier
amendement.

⚠️ **`list_council_preconisations` porte TOUS les semestres de l'année**, jamais le seul semestre
courant : c'est ce qui fait qu'une alerte de janvier éclaire la décision de juillet. Et elle ne
porte **aucune date de transmission** — voir §10.3.

⚠️ **Chaque ligne du second seuil porte `first_pronounced`.** Sans lui, l'écran ne peut pas savoir
qu'un avertissement de premier seuil reste dû, et il ne proposerait que la convocation :
l'avertissement resterait dû indéfiniment, sans que rien ne le dise. **Franchir le second seuil
n'efface pas le premier.**

### 10.2 Les sept actes — déclarés, non branchés

`prepare_council_session` · `retain_for_council` · `examine_council_student` ·
`add_council_preconisation` · `post_preconisation_finding` · `close_council_session` ·
`pronounce_absence_warning` — tous 🔴.

⚠️ **`pronounce_absence_warning` : PRONONCER, jamais déclencher.** Franchir un seuil ne produit ni
avertissement, ni convocation, ni inscription au dossier. Le système compte et affiche ; l'acte
appartient à quelqu'un, et tant qu'il n'est pas posé la ligne reste dans la liste.

⚠️ **Aucun de ces actes n'est branché, et les boutons le disent.** Même cause qu'à la grappe 7 : les
catégories de motif — types de préconisation, verdicts de constat — n'ont **aucune source lue**. Les
inventer serait inventer un vocabulaire réglementaire, ce qui est pire qu'inventer un chemin : un
chemin faux ne résout pas, un motif faux s'enregistre.

### 10.3 Le constat de préconisation — la seule vraie exigence de forme

Cinq types de préconisation, **un seul exige un constat** : le contrat de remédiation. Le retour doit
donc porter, par type, un drapeau du genre `needs_finding` — sinon l'écran reconnaît le type à son
**libellé**, et une reformulation du règlement casserait la règle en silence.

⚠️ Sans son constat de fin de semestre, un contrat de remédiation **n'est qu'une intention morte** :
le jury lit « non constaté ». C'est le seul vrai risque du dispositif.

⚠️ **ET AUCUN CHAMP DE TRANSMISSION AU JURY.** Le règlement impose que **toutes** les préconisations
soient portées au jury ; elles le sont par **affichage permanent** dans le tableau de délibération.
Un envoi horodaté aurait figé une liste à une date, et il en aurait toujours manqué une — celle
rendue après coup. L'audit garde cette absence.

---

## 11. Grappe 9 — documents et clôture d'année

⚠️ **AUCUNE SURFACE, dans les deux cas.** Cherché `document_request`, `transcript`, `attestation`,
`verification_code` ; puis `close_year`, `year_closure`, `reopen`. Aucune correspondance.

### 11.1 Documents

| Point d'entrée | Signature | Statut |
|---|---|---|
| `list_document_requests` | `(academic_year, state?)` | 🔴 |
| `get_document_request` | `(name)` | 🔴 |
| `emit_document` | `(request)` | 🔴 |
| `refuse_document_request` | `(request, category, detail)` | 🔴 |

⚠️ **LE CATALOGUE EST RESTREINT AU SOUS-ENSEMBLE DEMANDABLE, et il dit pourquoi.** Le diplôme et
l'attestation de réussite sont émis par la **diplomation**, à l'issue du cursus : ils figurent au
catalogue avec `requestable: false` et leur service d'origine. Ce n'est pas un droit manquant, et la
conséquence porte sur le **refus** : une telle demande est **irrecevable**, non prématurée — elle ne
se reformule pas, elle se réadresse.

⚠️ **`issuable` ET `blocked_reason` par demande.** C'est ce que l'étudiant ne pouvait pas voir en
déposant : l'état de délibération sur lequel repose l'émission. Un `issuable` seul obligerait l'agent
à chercher ailleurs pourquoi.

⚠️ **AUCUN EXEMPLAIRE.** Rien à compter, rien à retirer : un document porte un **code de vérification
publique** et se télécharge autant de fois que nécessaire.

⚠️ **ET LE CODE NAÎT DE L'ÉMISSION.** Le serveur doit rendre `verification_code: null` avant l'acte.
Le pré-calculer le ferait lire comme une pièce du dossier, et un agent aurait pu le communiquer avant
que le document n'existe. L'audit garde les deux sens : pas de code sans émission, pas d'émission
sans code.

⚠️ **DEUX CATÉGORIES DE REFUS, et la distinction voyage jusqu'au serveur.** « Prématurée » annonce à
l'étudiant qu'il pourra reformuler ; « irrecevable » annonce le contraire. Les confondre laisse
quelqu'un attendre indéfiniment, ou renoncer à tort.

### 11.2 Clôture d'année

| Point d'entrée | Signature | Statut |
|---|---|---|
| `get_year_closure` | `(academic_year)` | 🔴 |
| `close_academic_year` | `(academic_year, reason?)` | 🔴 |
| `reopen_academic_year` | `(academic_year, reason)` | 🔴 |

⚠️ **`close:year` appartient au Director, non à la Direction** — deux rôles de nom voisin, confondus
par la version 01 du vocabulaire des permissions.

⚠️ **LE RETOUR PORTE DEUX LISTES SÉPARÉES, et une seule serait fausse dans les deux sens :**

- les **anomalies** — ce qui aurait dû être réglé. Clore quand même est permis, et **exige un
  motif** ;
- les **continuations** — ce qui survit à la clôture par conception : un constat de contrat encore
  posable, une procédure disciplinaire qui court, une demande de document traitable. **Aucun motif.**

Une liste unique obligerait l'écran à trier au libellé, et il se tromperait dans les deux sens : un
motif exigé pour une procédure qui court normalement, ou une clôture **sans un mot** sur trois
dossiers sans décideur. D'où `requires_reason` porté par la ligne, et le drapeau global **dérivé** des
anomalies ouvertes.

⚠️ **Le motif de réouverture NE S'EFFACE PAS à la nouvelle clôture.** Il reste lisible par tous ceux
qui consultent l'année — sans quoi une année deux fois close se lirait comme une année close une
seule fois.

---

## 12. Grappe 10 — la diplomation

**Onze fonctions, toutes annoncées existantes** par la carte des surfaces (P-06, toutes ✅). Leur
chemin d'exposition m'est inconnu : les noms sont donc portés **nus**, comme les points d'entrée T5.

| 🟡 | Point d'entrée | Acteur |
|---|---|---|
| 🟡 | `list_graduation_dossiers` · `get_graduation_dossier` | Staff |
| 🟡 | `create_graduation_dossier` · `attest_national_exam` | EM · GA |
| 🟡 | `present_eligibility` | EM |
| 🟡 | `open_graduation_jury` | DIR |
| 🟡 | `decide_graduation` · `reopen_after_adjournment` | DIR |
| 🟡 | `award_felicitations` · `issue_graduation_document` | DIR |

⚠️ **CE SONT DES 🟡, PAS DES 🔴, et la distinction coûte un chantier.** Un 🔴 dit « je ne sais pas si
la fonction existe » ; un 🟡 dit « elle existe, je ne sais pas où ». Présenter la diplomation comme un
manque ferait construire ce qui est déjà construit.

⚠️ **L'ÉLIGIBILITÉ EST PRÉSENTÉE, JAMAIS DÉCIDÉE (Art. 45).** Le jury reste souverain : il peut
attribuer sur un dossier non éligible, par **indulgence motivée**. L'écran garde donc l'issue
« Diplômé » offerte sur un dossier non éligible — la retirer aurait retiré l'indulgence — et le motif
devient alors obligatoire.

⚠️ **LA MENTION EST UN DÉRIVÉ IMPOSÉ (Art. 49) :** bornes exactes, aucun arrondi, absente sous 10,00.
Elle s'affiche, elle ne se saisit jamais. L'audit l'éprouve **aux bornes et juste en dessous** —
c'est là qu'un arrondi se verrait, et nulle part ailleurs.

⚠️ **`attest_national_exam` EST UN INPUT TRACÉ, jamais un calcul.** L'attestation ne se déduit
d'aucune note : la condition dit qui l'a attestée et quand, ou dit qu'elle manque.

⚠️ **LE CONSTAT EST RECALCULÉ AU MOMENT DE L'ACTE**, et l'écran le dit : le constat affiché n'engage
pas la décision du lendemain.

⚠️ **`open_graduation_jury` : le quorum de l'article 46 est vérifié au SERVEUR** — une présidence, un
directeur des études, au moins un responsable de formation. Un écran qui le recompterait dupliquerait
la règle.

⚠️ **`issue_graduation_document` NE REND PAS DE PDF.** Le rendu des parchemins est différé
(`D-TEMPLATE-DIPLOME-01`) : l'acte au registre et le **numéro** font foi, et un numéro n'est jamais
réattribué. L'écran montre le numéro et le code de vérification. Un bouton « télécharger le diplôme »
aurait promis ce qui n'existe pas.

---

## 13. Grappe 11 — l'attribution des rôles

**Douze points d'entrée, tous 🔴 — le trou T5.** Les signatures complètes vivent dans
`T5-points-d-entree.md` ; ce paragraphe ne dit que ce qui décide de l'écran.

| 🔴 | Point d'entrée |
|---|---|
| 🔴 | `list_role_grants` · `get_role_grant` |
| 🔴 | `list_role_profiles` · `list_assignable_roles` |
| 🔴 | `preview_grant_effect` |
| 🔴 | `assign_role_profile` · `add_role` · `remove_role` |
| 🔴 | `set_role_scope` · `clear_role_scope` |
| 🔴 | `list_grant_anomalies` · `list_grant_journal` |

⚠️ **`scope.kind` PORTE TOUT L'ÉCRAN**, et ses quatre valeurs ne sont pas quatre nuances :
`nature` (rien à cloisonner) · `liaison` (le cloisonnement joue) · `annulee` (un cumul le neutralise,
**la liaison reste enregistrée**) · `nulle` (rôle cloisonnable sans liaison — la personne **ne voit
rien**, et ne le sait probablement pas). `nulle` ferme tout, `annulee` élargit tout. Une simple liste
de filières obligerait l'écran à deviner pourquoi elle est vide ou complète.

⚠️ **`preview_grant_effect` DÉCIDE DU RESTE.** Les phrases « ce rôle ouvre… » et « ce cumul annule le
cloisonnement » sont **rédigées au serveur**. Sans lui, l'écran les écrirait lui-même : ce serait une
seconde matrice des rôles, dans un navigateur, divergente au premier changement — et toujours
plausible, donc invisible.

⚠️ **C'est pourquoi le panneau de dotation N'EST PAS PRODUIT.** L'écran affiche la liste des
avertissements **attendus** et dit qu'il ne les fabrique pas. Moins qu'une maquette, et plus honnête
qu'un panneau qui aurait l'air de marcher.

⚠️ **L'ACCUSÉ EST UNE DONNÉE, PAS UN CLIC.** La confirmation doit voyager jusqu'au serveur et y être
stockée, sinon elle n'aura existé que dans un navigateur. Et **le journal est une trace, jamais une
garde** : celui qui détient les accès système contournerait toute garde applicative.

⚠️ **Le journal porte « avant et après », non « rôle ajouté »** : un an plus tard, la question est
l'état, pas le geste.

⚠️ **Cet écran est la cible du lien « désigner un décideur » de l'écran A8.** Il reçoit le dossier en
contexte et le dit — et **ne pré-remplit rien** : il ne connaît pas le rôle décideur qu'exige ce
dossier, et le deviner attribuerait le mauvais.

---

## 14. Mode simulacre

`VITE_API_MODE=mock` (défaut) fait tourner l'application sans serveur : `src/api/mock/` porte une
table `point d'entrée → fixture`, aux formes de ce manifeste. `VITE_API_MODE=live` bascule sur
`fetch`, même origine, `credentials: same-origin`.

Trois bascules d'URL font tomber **tous** les appels dans un état, pour voir les branches en vrai :

    ?simulate=denied   refus de droit → le refus expliqué, partout
    ?simulate=error    erreur serveur
    ?simulate=empty    listes vides

C'est ce qui permet de vérifier que les cinq états sont des branches et non des dessins.
