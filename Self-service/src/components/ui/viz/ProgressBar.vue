<script setup>
// ProgressBar — barre de progression horizontale (zero dépendance, ~50 octets)
// Réf visuelle : specs-interfaces/mela_cockpit_with_micro_charts.html §Finances Card 1
import { computed } from 'vue';

const props = defineProps({
  value: { type: Number, required: true },
  max: { type: Number, default: 100 },
  color: {
    type: String,
    default: 'brand',
    validator: (v) => ['brand', 'success', 'warning', 'error', 'info'].includes(v),
  },
  ariaLabel: { type: String, required: true },
});

const percent = computed(() => {
  const p = (props.value / props.max) * 100;
  return Math.max(0, Math.min(100, p));
});

const fillClass = computed(() => {
  const map = {
    brand:   'bg-ln-blue-900',
    success: 'bg-ln-success',
    warning: 'bg-ln-warning',
    error:   'bg-ln-error',
    info:    'bg-ln-blue-600',
  };
  return map[props.color];
});
</script>

<template>
  <div
    class="h-1.5 bg-ln-gray-100 rounded-sm overflow-hidden"
    role="progressbar"
    :aria-valuenow="value"
    :aria-valuemin="0"
    :aria-valuemax="max"
    :aria-label="ariaLabel"
  >
    <div
      class="h-full rounded-sm transition-[width] duration-300"
      :class="fillClass"
      :style="{ width: percent + '%' }"
    ></div>
  </div>
</template>
