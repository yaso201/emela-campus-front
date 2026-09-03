<template>
  <span class="inline-flex h-5 items-center rounded-[4px] px-[7px] text-[11px] font-bold tracking-wide"
        :class="muted ? 'border border-dashed border-ln-gray-300 bg-ln-gray-100 text-ln-gray-400' : tone">
    {{ LABELS[kind] || kind }}
  </span>
</template>

<script setup>
/**
 * Étiquette de type d'activité — CM, TD, TP, projet.
 * Contenu de page, pas un composant de l'inventaire : elle ne sert qu'aux
 * écrans de répartition et de planning, et n'a ni état ni variante.
 */
import { computed } from 'vue';

const props = defineProps({
  kind: { type: String, required: true },
  muted: { type: Boolean, default: false },
});

const LABELS = { cm: 'CM', td: 'TD', tp: 'TP', pj: 'PJ' };
const TONES = {
  cm: 'bg-ln-blue-100 text-ln-blue-900',
  td: 'bg-[#EDE9FE] text-[#5B21B6]',
  tp: 'bg-[#DCFCE7] text-[#166534]',
  pj: 'bg-[#FEF3C7] text-[#92400E]',
};
const tone = computed(() => TONES[props.kind] || 'bg-ln-gray-100 text-ln-gray-700');
</script>
