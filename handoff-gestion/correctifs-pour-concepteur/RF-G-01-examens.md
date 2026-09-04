# RF-G-01 — écran Examens (`src/views/ExamView.vue`)
**Quoi** : `SOURCE_GROUP = 'SG-L2GL-PROMO'` (constante en dur) supprimée — le groupe source du
peuplement est LU de l'épreuve sélectionnée (`exam.student_group`, champ serveur des lectures
d'épreuve), et le chargement du panneau ne part plus si l'épreuve n'a pas de groupe.
**Pourquoi** : un identifiant en dur partait dans l'acte de MASSE `populate_exam_students_from_group`
— la classe de défaut que ton relevé nomme (« l'écran affichait le rapport en rejouant la cascade ») :
ici l'écran aurait peuplé la mauvaise épreuve du bon groupe, silencieusement, sur toute filière ≠ L2GL.
