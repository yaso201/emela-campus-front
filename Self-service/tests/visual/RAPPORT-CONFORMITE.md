# Rapport de conformité visuelle — Relevé de notes

**Date** : 2026-05-20  
**Site** : campus-recette (localhost:8080)  
**Méthode** : Mock API fidèle + session Admin (Playwright)  
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

## ✅ Conformité maquette PC1 — Élément par élément

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

1. **Auth étudiant réelle** : les tests ont été faits avec mock API. La connexion directe étudiant est bloquée (dettes `RV2-DEBT-AUTH-ETUDIANT-SETUP-B`).
2. **Modal onboarding** : fermé par interception API `custom_onboarding_done=1`. En conditions réelles, 3 clics "Suivant" seraient nécessaires au premier login (dettes `RV2-DEBT-WELCOME-MODAL-FIRST-LOGIN`).
3. **Grade ECTS label F** : le frontend affiche "Insuffisant" (conforme au composant `GradeEctsBadge.vue`). Le backend envoie aussi `grade_ects_label` mais ce champ est ignoré côté frontend — pas de risque de désynchro.
4. **Tokens ln-*** : tous les tokens Tailwind (`ln-success`, `ln-warning`, `ln-error`, `ln-blue-*`, `ln-gray-*`) sont correctement appliqués.

---

## 📁 Livrables

| Fichier | Chemin |
|---------|--------|
| Mock JSON corrigé | `tests/visual/releve-mock.json` |
| Screenshot desktop fullpage | `screenshots-releve/releve-desktop-fullpage.png` |
| Screenshot desktop viewport | `screenshots-releve/releve-desktop-viewport.png` |
| Screenshot mobile fullpage | `screenshots-releve/releve-mobile-fullpage.png` |
| Screenshot mobile viewport | `screenshots-releve/releve-mobile-viewport.png` |
| Dette auth étudiant | `specifications/kimi/RV2-DEBT-AUTH-ETUDIANT-SETUP-B.md` |
| Dette modal onboarding | `specifications/kimi/RV2-DEBT-WELCOME-MODAL-FIRST-LOGIN.md` |

---

## Verdict

**🟢 GO V1 — Conforme maquette PC1**  
Le rendu visuel du Relevé de notes couvre tous les cas métier critiques (validation directe, compensation, plancher, MHC) avec les tokens de design corrects, le responsive est fonctionnel, et aucune erreur console n'est détectée.
