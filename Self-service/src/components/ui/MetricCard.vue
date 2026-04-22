<script setup>
// MetricCard — carte KPI avec label, valeur, trend et slot pour viz
// Réf visuelle : specs-interfaces/mela_component_library_reference.html §MetricCard
// + specs-interfaces/mela_cockpit_with_micro_charts.html §Cockpit direction
import { computed } from 'vue';

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  unit: { type: String, default: '' },
  trend: { type: Number, default: null },
  trendLabel: { type: String, default: '' },
  subtitle: { type: String, default: '' },
});

const trendDirection = computed(() => {
  if (props.trend === null || props.trend === undefined) return null;
  return props.trend >= 0 ? 'up' : 'down';
});

const trendClass = computed(() =>
  trendDirection.value === 'up' ? 'text-ln-success' : 'text-ln-error',
);

const trendText = computed(() => {
  if (props.trend === null) return '';
  const sign = props.trend >= 0 ? '+' : '';
  return `${sign}${props.trend}${props.trendLabel ? ' ' + props.trendLabel : ''}`;
});
</script>

<template>
  <div class="bg-white rounded-lg border border-ln-gray-200 p-4">
    <div class="text-xs text-ln-gray-500 mb-1.5">{{ label }}</div>
    <div class="flex items-baseline gap-1.5 flex-wrap">
      <span class="text-2xl font-bold text-ln-gray-900 tabular-nums">{{ value }}</span>
      <span v-if="unit" class="text-xs text-ln-gray-500">{{ unit }}</span>
      <span v-if="trend !== null" class="text-xs font-medium inline-flex items-center gap-1" :class="trendClass">
        <svg
          v-if="trendDirection === 'up'"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          role="img"
          aria-label="en hausse"
        >
          <path d="M6 2v8M3 5l3-3 3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        </svg>
        <svg
          v-else
          width="12"
          height="12"
          viewBox="0 0 12 12"
          role="img"
          aria-label="en baisse"
        >
          <path d="M6 10V2M9 7l-3 3-3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        </svg>
        {{ trendText }}
      </span>
    </div>
    <div v-if="subtitle && trend === null" class="text-xs text-ln-gray-500 mt-1.5">
      {{ subtitle }}
    </div>
    <div v-if="$slots.viz" class="mt-2.5">
      <slot name="viz" />
    </div>
  </div>
</template>
