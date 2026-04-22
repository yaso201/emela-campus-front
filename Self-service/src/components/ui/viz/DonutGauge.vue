<script setup>
// DonutGauge — jauge circulaire SVG (~100 octets)
// Réf visuelle : specs-interfaces/mela_cockpit_with_micro_charts.html §Assiduité Card 1
import { computed } from 'vue';

const props = defineProps({
  value: { type: Number, required: true },
  total: { type: Number, required: true },
  color: {
    type: String,
    default: 'success',
    validator: (v) => ['brand', 'success', 'warning', 'error', 'info'].includes(v),
  },
  size: { type: Number, default: 52 },
  ariaLabel: { type: String, required: true },
});

const radius = 22;
const circumference = computed(() => 2 * Math.PI * radius);
const percent = computed(() => Math.max(0, Math.min(1, props.value / props.total)));
const dashLength = computed(() => percent.value * circumference.value);
const dashGap = computed(() => circumference.value - dashLength.value);
const displayPercent = computed(() => Math.round(percent.value * 100));

const strokeClass = computed(() => {
  const map = {
    brand:   'text-ln-blue-900',
    success: 'text-ln-success',
    warning: 'text-ln-warning',
    error:   'text-ln-error',
    info:    'text-ln-blue-600',
  };
  return map[props.color];
});

const center = computed(() => props.size / 2);
</script>

<template>
  <div class="relative flex-shrink-0" :style="{ width: size + 'px', height: size + 'px' }">
    <svg
      :width="size"
      :height="size"
      :viewBox="`0 0 ${size} ${size}`"
      role="img"
      :aria-label="ariaLabel"
    >
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        fill="none"
        stroke="currentColor"
        stroke-width="5"
        class="text-ln-gray-100"
      />
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        fill="none"
        stroke="currentColor"
        stroke-width="5"
        stroke-linecap="round"
        :stroke-dasharray="`${dashLength} ${dashGap}`"
        :transform="`rotate(-90 ${center} ${center})`"
        :class="strokeClass"
      />
    </svg>
    <div class="absolute inset-0 flex items-center justify-center text-sm font-bold text-ln-gray-900">
      {{ displayPercent }}%
    </div>
  </div>
</template>
