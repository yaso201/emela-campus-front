<script setup>
// ThresholdGauge — jauge avec zones colorées + marqueur position (~100 octets)
// Réf visuelle : specs-interfaces/mela_cockpit_with_micro_charts.html §Assiduité Card 3
// Les 3 zones (safe/warning/danger) sont fixes : 0-50% vert, 50-75% ambre, 75-100% rouge.
import { computed } from 'vue';

const props = defineProps({
  value: { type: Number, required: true },
  thresholds: {
    type: Array,
    default: () => [
      { at: 0,   label: '0%' },
      { at: 50,  label: 'seuil' },
      { at: 75,  label: 'alerte' },
      { at: 100, label: 'max' },
    ],
  },
  ariaLabel: { type: String, required: true },
});

const clampedValue = computed(() => Math.max(0, Math.min(100, props.value)));
</script>

<template>
  <div>
    <div
      class="relative h-2 rounded-sm"
      :style="{
        background: 'linear-gradient(to right, var(--color-ln-success-bg) 0%, var(--color-ln-success-bg) 50%, var(--color-ln-warning-bg) 50%, var(--color-ln-warning-bg) 75%, var(--color-ln-error-bg) 75%, var(--color-ln-error-bg) 100%)'
      }"
      role="meter"
      :aria-valuenow="value"
      :aria-valuemin="0"
      :aria-valuemax="100"
      :aria-label="ariaLabel"
    >
      <div
        class="absolute -top-1 w-1 h-4 bg-ln-gray-900 rounded-xs"
        :style="{ left: clampedValue + '%' }"
        aria-hidden="true"
      ></div>
    </div>
    <div class="flex justify-between mt-1.5">
      <span
        v-for="(t, i) in thresholds"
        :key="i"
        class="text-[10px]"
        :class="i === 0 ? 'text-ln-success' : i < thresholds.length - 1 ? 'text-ln-warning' : 'text-ln-error'"
      >
        {{ t.label }}
      </span>
    </div>
  </div>
</template>
