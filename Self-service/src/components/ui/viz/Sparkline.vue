<script setup>
// Sparkline — ligne SVG simple avec option fill (~120 octets)
// Réf visuelle : specs-interfaces/mela_cockpit_with_micro_charts.html §Finances Card 3
import { computed } from 'vue';

const props = defineProps({
  data: { type: Array, required: true },
  color: {
    type: String,
    default: 'brand',
    validator: (v) => ['brand', 'success', 'warning', 'error', 'info'].includes(v),
  },
  filled: { type: Boolean, default: true },
  height: { type: Number, default: 32 },
  ariaLabel: { type: String, required: true },
});

const viewBoxWidth = 120;

const points = computed(() => {
  if (!props.data.length) return '';
  const min = Math.min(...props.data);
  const max = Math.max(...props.data);
  const range = max - min || 1;
  const step = viewBoxWidth / Math.max(1, props.data.length - 1);
  return props.data
    .map((v, i) => {
      const x = i * step;
      const y = props.height - 2 - ((v - min) / range) * (props.height - 4);
      return `${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' L ');
});

const linePath = computed(() => `M ${points.value}`);
const fillPath = computed(
  () => `M ${points.value} L ${viewBoxWidth} ${props.height} L 0 ${props.height} Z`,
);

const strokeClass = computed(() => {
  const map = {
    brand:   'text-brand-900',
    success: 'text-success-600',
    warning: 'text-warning-600',
    error:   'text-error-600',
    info:    'text-info-600',
  };
  return map[props.color];
});
</script>

<template>
  <svg
    :width="viewBoxWidth"
    :height="height"
    :viewBox="`0 0 ${viewBoxWidth} ${height}`"
    preserveAspectRatio="none"
    class="block w-full"
    :class="strokeClass"
    role="img"
    :aria-label="ariaLabel"
  >
    <path
      v-if="filled"
      :d="fillPath"
      fill="currentColor"
      fill-opacity="0.06"
    />
    <path
      :d="linePath"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
