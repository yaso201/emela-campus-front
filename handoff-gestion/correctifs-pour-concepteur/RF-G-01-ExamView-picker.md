# M0 — ExamView : sélection du groupe à l'écran (arbitrage C1 final)
**Quoi** : le panneau « Peupler depuis un groupe » porte un SELECT des groupes de la filière de
l'épreuve (`listGroups({program})`), sans valeur par défaut ; bouton « Ajouter » inerte tant que
rien n'est choisi ; garde en profondeur conservée. Plus aucun identifiant en dur.
**Pourquoi** : `Exam Schedule` ne porte AUCUN `student_group` (ni table ni lecture serveur) — ta
constante puis notre lecture `exam.student_group` lisaient un champ inexistant (V-LEARN-M0-01 :
un champ présent au simulacre et absent du schéma n'existe pas). La garde serveur de
`populate_exam_students_from_group` vérifie la cohérence programme↔groupe d'un groupe CHOISI —
le sélecteur est la forme que le serveur attend. Vérifié : tes fixtures d'épreuves ne portaient
pas `student_group` (rien à retirer côté simulacre).
