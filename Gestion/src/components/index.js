/**
 * Les seize composants de l'inventaire (lot 4 §1 + arbitrage C-01 du lot 8).
 * Aucun dix-septième. Si un écran semble en exiger un, c'est l'écran ou
 * l'inventaire qui a tort — et cela se signale, cela ne s'ajoute pas ici.
 *
 * internal/BlockState.vue n'est PAS exporté : c'est la mise en œuvre partagée
 * des états des seize, pas un composant public.
 */
export { default as AppShell } from './AppShell.vue';                        //  1 châssis
export { default as ContextBar } from './ContextBar.vue';                    //  2 bandeau de contexte
export { default as WorkQueue } from './WorkQueue.vue';                      //  3 file de travail
export { default as DenseTable } from './DenseTable.vue';                    //  4 tableau dense
export { default as TreeEditor } from './TreeEditor.vue';                    //  5 éditeur d'arbre
export { default as ObjectPanel } from './ObjectPanel.vue';                  //  6 panneau d'objet
export { default as ProcedureChain } from './ProcedureChain.vue';            //  7 fil de la procédure
export { default as ActionBar } from './ActionBar.vue';                      //  8 barre d'acte
export { default as ReasonStep } from './ReasonStep.vue';                    //  9 étape de motif
export { default as StateBanner } from './StateBanner.vue';                  // 10 bandeau d'état
export { default as DeferredEffectBanner } from './DeferredEffectBanner.vue';// 11 effet différé
export { default as RetractionWindow } from './RetractionWindow.vue';        // 12 fenêtre de rétractation
export { default as BatchReport } from './BatchReport.vue';                  // 13 rapport ligne par ligne
export { default as AccessDenied } from './AccessDenied.vue';                // 14 refus expliqué
export { default as StatusPill } from './StatusPill.vue';                    // 15 pastille d'état
export { default as TimeGrid } from './TimeGrid.vue';                        // 16 grille temporelle

export * from './tableClasses.js';
