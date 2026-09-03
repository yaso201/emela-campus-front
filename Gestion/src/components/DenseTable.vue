<template>
  <div>
    <BlockState v-if="state !== 'ready'" :state="state" :title="stateTitle" :message="stateMessage"
                :rows="6" :skeleton-widths="skeletonWidths" :row-height="rowHeight"
                :expected-count="expectedCount" :expected-label="expectedLabel" @retry="emit('retry')">
      <template #action><slot name="empty-action" /></template>
    </BlockState>

    <template v-else>
      <div class="overflow-auto rounded-md-ln border border-ln-gray-200" :style="{ maxHeight: maxHeight }">
        <table class="w-max min-w-full border-separate border-spacing-0 text-body-sm">
          <thead>
            <slot name="head" />
          </thead>
          <tbody>
            <slot name="body" />
          </tbody>
        </table>
        <slot name="footbar" />
      </div>
      <div v-if="$slots.legend" class="mt-3 flex flex-wrap gap-4 text-caption text-ln-gray-500">
        <slot name="legend" />
      </div>
    </template>
  </div>
</template>

<script setup>
/**
 * 4 · Tableau dense — volume de lignes, en-tête et première colonne ancrés.
 * Réf : lot 2 (délibération), lot 5 (rôles).
 * Variantes : synthèse · détail · bascule entre les deux.
 * États : vide · chargement · erreur · VIDE APRÈS FILTRE (distinct du vide :
 * les confondre fait croire à une panne — passer state='empty' avec un
 * stateMessage nommant les filtres actifs et le total réel).
 *
 * Densité (lot 1 §5, hypothèse de travail) : lignes 36 / 44 / 52 px, une seule
 * hauteur par tableau · chiffres tabulaires · texte à gauche, nombres à droite ·
 * filet horizontal seul, jamais de zébrures ni de filets verticaux.
 *
 * Les cellules ancrées se déclarent dans les slots avec stuckTh / stuckTd de
 * ./tableClasses.js — sorties du SFC parce qu'un <script setup> ne peut rien
 * exporter. La colonne ancrée porte l'identité de la ligne : sans elle, le
 * défilement fait perdre le sujet.
 */
defineProps({
  state: { type: String, default: 'ready' },
  stateTitle: { type: String, default: 'Aucune donnée' },
  stateMessage: { type: String, default: '' },
  maxHeight: { type: String, default: '596px' },
  rowHeight: { type: Number, default: 36 },
  skeletonWidths: { type: Array, default: () => [186, 56, 60, 56, 54, 132, 148] },
  expectedCount: { type: [Number, String], default: null },
  expectedLabel: { type: String, default: 'lignes' },
});
defineEmits(['retry']);

</script>
