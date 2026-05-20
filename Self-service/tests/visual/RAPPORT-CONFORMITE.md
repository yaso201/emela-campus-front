# Rapport de conformité visuelle — Relevé de notes

**Date** : 2026-05-20  
**Site** : campus-test-v1 (localhost:8081) pour auth réelle ; campus-recette (localhost:8080) pour mock  
**Méthode** : Auth réelle étudiant (Playwright) + Mock API fidèle + session Admin (Playwright)  
**Viewport testés** : Desktop 1280×900, Mobile 375×667  

---

## ✅ Cas fonctionnels couverts (1 payload, 5 UE)

| Cas | UE | Statut attendu | Observations screenshot |
|-----|-----|----------------|------------------------|
| 1 — Validées directes (A) | ALGO101 | Validée, grade A | ✅ Badge vert "Validée", grade "A · Excellent", modules tous "Validé" |
| 1 — Validées directes (C) | ENG106 | Validée, grade C | ✅ Badge vert "Validée", grade "C · Bien", modules tous "Validé" |
| 2 — Compensation (Art. 23.1) | BD104 | Validée (compensation) | ✅ Badge orange "Validée (compensation)", notice verte ℹ Art. 23.1, module "À rattraper" visible |
| 3 — Plancher (Art. 23.2) | PROG103 | Échouée (plancher) | ✅ Badge rouge "Échouée (plancher)", alerte rouge ⚠ "Module éliminatoire (< 6/20) — compensation impossible (Art. 23.2)" |
| 4 — Échouée non compensable | MATH102 | Non validée | ✅ Badge gris "Non validée", alerte orange "UE non validée — rattrapage obligatoire" |
| 4 — MHC obligatoires | — | Non validés | ✅ Liste MHC avec croix rouges, alerte rouge "bloque la validation du semestre (Art. 4.5)" |

---

## ✅ Validation avec auth réelle — Student Setupb 002 (ETU-SETUPB-00002)

**User** : `student.setupb.002@recette.lanem.bj` / `Test2026!`  
**Site** : `campus-test-v1` (port 8081)  
**Données** : 41 UE Results sur semestre 2026-2027 (S1), statut `published`

| Élément | Statut | Détail données réelles |
|---------|--------|------------------------|
| Auth étudiant | ✅ OK | Login réussi, session valide, nom affiché "Student Setupb 002" |
| Header semestre | ✅ OK (corrigé) | Titre : "2026-2027 (S1)" — redondance corrigée via `semesterTitle()` |
| Moyenne semestrielle | ✅ OK | 12,1 /20 (indicatif — Art. 20.2) |
| ECTS validés / possibles | ✅ OK | 184 / 342 |
| Cumul programme | ✅ OK | 184 |
| Badges jury + semestre | ✅ OK | "Jury APD" (vert), "Semestre non validé" (rouge) |
| Bloc UE (code + nom) | ✅ OK | "LIS-S1-02 — Architecture des ordinateurs" |
| Note UE | ✅ OK | "12,5 /20" en gras |
| Badge grade ECTS | ✅ OK | Grades A, B, C, F affichés selon UE ; badge vide quand `grade_ects=""` |
| ECTS acquis/possibles | ✅ OK | "6 / 6 ECTS", "0 / 8 ECTS" |
| Notice compensation | ✅ OK | Texte vert ℹ "Validée avec compensation intra-UE (Art. 23.1)" visible sur au moins une UE |
| Alerte plancher | ✅ OK | Texte rouge ⚠ Art. 23.2 visible sur UE avec module éliminatoire |
| Alerte UE non validée | ✅ OK | Texte orange ⚠ "rattrapage obligatoire" visible |
| Table modules | ✅ OK | Colonnes Module, Coef., Note, Statut |
| Badge statut module | ✅ OK | Vert/orange/rouge selon statut module |
| Formule calcul UE | ✅ OK | "CALCUL NOTE UE — ART. 19.1" + formule détaillée |
| Section MHC | ✅ OK | Liste vide (`mhc_obligatoires: []`), pas d'alerte bloquante — conforme aux données |
| Section suivi temporaire | ✅ OK | Bannière jaune + message "Aucune note temporaire" |
| Section Moodle | ✅ OK | "Voir sur Moodle" |
| Responsive mobile | ✅ OK | Bottom nav, contenu adapté, scroll fluide sur 22 061 px |
| Console errors | ✅ OK | Zéro erreur console (auth réelle et mock) |

### Différences mock vs réel

| Aspect | Mock | Réel | Impact |
|--------|------|------|--------|
| Nombre d'UE | 5 | 41 | Fidélité données réelles — la page est très longue (15 506 px desktop) |
| Grade ECTS vide | Aucun | Plusieurs UE avec `grade_ects=""` | Badge grade absent — comportement normal (pas de données) |
| ECTS par UE | 6 uniforme | 6 ou 8 selon UE | Conforme règlement |
| MHC | 2 non validés | 0 | Conforme aux données de l'étudiant |
| Titre semestre | "Semestre 1 · 2026-2027" | "2026-2027 (S1)" | ✅ Corrigé : `semesterTitle()` évite la duplication |

---

## ✅ Conformité maquette PC1 — Élément par élément (mock)

| Élément | Statut | Détail |
|---------|--------|--------|
| Header semestre (titre, année, niveau) | ✅ OK | "Semestre 1 · 2026-2027", "Niveau L1" |
| Moyenne semestrielle indicative | ✅ OK | "11,6 /20 (indicatif — Art. 20.2)" |
| ECTS validés / possibles | ✅ OK | "18 / 30" |
| Cumul programme | ✅ OK | "18" |
| Badges jury + semestre | ✅ OK | "Jury APD" (vert), "Semestre non validé" (rouge) |
| Bloc UE (code + nom) | ✅ OK | "ALGO101 — Algorithmique et structures de données" |
| Note UE | ✅ OK | "14,5 /20" en gras |
| Badge grade ECTS | ✅ OK | A/B/C/E/NV/F avec couleurs sémantiques correctes |
| ECTS acquis/possibles | ✅ OK | "6 / 6 ECTS" |
| Notice compensation | ✅ OK | Texte vert ℹ Art. 23.1 |
| Alerte plancher | ✅ OK | Texte rouge ⚠ Art. 23.2 avec seuil 6/20 |
| Alerte UE non validée | ✅ OK | Texte orange ⚠ "rattrapage obligatoire" |
| Table modules | ✅ OK | Colonnes Module, Coef., Note, Statut |
| Badge statut module | ✅ OK | Vert/orange/rouge selon validated/failed_compensable/failed_eliminatoire |
| Formule calcul UE | ✅ OK | "CALCUL NOTE UE — ART. 19.1" + formule détaillée |
| Section MHC | ✅ OK | Titre + liste + icônes Check/X + alerte |
| Section suivi temporaire | ✅ OK | Bannière jaune + message "Aucune note temporaire" |
| Section Moodle | ✅ OK | "Voir sur Moodle" |
| Responsive mobile | ✅ OK | Bottom nav, contenu adapté, scroll fluide |

---

## ⚠️ Points de vigilance / Ajustements mineurs

1. **Finding résolu — Titre semestre redondant** : `semesterTitle()` dans `SemesterBlock.vue` corrigée pour éviter la duplication quand `academic_term` contient déjà `academic_year`. Capture confirmée : "2026-2027 (S1)" affiché seul.
2. **Grade ECTS vide** : quand `grade_ects=""`, le badge `GradeEctsBadge` retourne un label `"—"` avec style gris. C'est acceptable mais pourrait être masqué si vide.
3. **Page très longue** : 41 UE dans un semestre produisent une page de 15 000+ px. La pagination ou un accordéon pourrait améliorer l'UX en V2.
4. **Modal onboarding** : fermé par clic croix dans le test réel. La 1ère connexion affiche bien le modal (pas besoin d'interception API).

---

## 📁 Livrables

| Fichier | Chemin |
|---------|--------|
| Mock JSON corrigé | `frontend/tests/visual/releve-mock.json` |
| Screenshots mock desktop fullpage | `frontend/screenshots-releve/releve-desktop-fullpage.png` |
| Screenshots mock desktop viewport | `frontend/screenshots-releve/releve-desktop-viewport.png` |
| Screenshots mock mobile fullpage | `frontend/screenshots-releve/releve-mobile-fullpage.png` |
| Screenshots mock mobile viewport | `frontend/screenshots-releve/releve-mobile-viewport.png` |
| **Screenshots réels desktop fullpage** | `frontend/screenshots-releve/real-auth/releve-real-desktop-fullpage.png` |
| **Screenshots réels desktop viewport** | `frontend/screenshots-releve/real-auth/releve-real-desktop-viewport.png` |
| **Screenshot fix titre semestre** | `frontend/screenshots-releve/real-auth/releve-real-desktop-viewport-fixed.png` |
| **Screenshots réels mobile fullpage** | `frontend/screenshots-releve/real-auth/releve-real-mobile-fullpage.png` |
| **Screenshots réels mobile viewport** | `frontend/screenshots-releve/real-auth/releve-real-mobile-viewport.png` |
| Rapport conformité | `frontend/tests/visual/RAPPORT-CONFORMITE.md` |
| Dette auth étudiant | `specifications/kimi/RV2-DEBT-AUTH-ETUDIANT-SETUP-B.md` |
| Dette modal onboarding | `specifications/kimi/RV2-DEBT-WELCOME-MODAL-FIRST-LOGIN.md` |

---

## Verdict

**🟢 GO V1 — Conforme maquette PC1**

Le rendu visuel du Relevé de notes est validé avec **auth réelle étudiante** sur `campus-test-v1`. Tous les cas métier critiques sont visibles (validation directe A/B/C, compensation Art. 23.1, plancher Art. 23.2, UE non validée). Le mock et le rendu réel sont **conformes** ; le finding mineur du titre semestre a été **corrigé** (`2026-2027 (S1)` sans redondance).
