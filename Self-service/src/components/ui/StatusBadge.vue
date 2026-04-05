<script setup>
// StatusBadge — badge sémantique avec dot optionnel
// Réf visuelle : specs-interfaces/mela_component_library_reference.html §StatusBadge
import { computed } from 'vue';

const props = defineProps({
  variant: {
    type: String,
    default: 'neutral',
    validator: (v) => ['success', 'warning', 'error', 'info', 'neutral'].includes(v),
  },
  label: { type: String, required: true },
  dot: { type: Boolean, default: true },
});

const variantClasses = computed(() => {
  const map = {
    success: 'bg-success-100 text-success-700',
    warning: 'bg-warning-100 text-warning-700',
    error:   'bg-error-100 text-error-700',
    info:    'bg-info-100 text-info-700',
    neutral: 'bg-neutral-100 text-neutral-600',
  };
  return map[props.variant];
});

const dotColor = computed(() => {
  const map = {
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    error:   'bg-error-600',
    info:    'bg-info-600',
    neutral: 'bg-neutral-500',
  };
  return map[props.variant];
});

const showDot = computed(() => props.dot && props.variant !== 'neutral');
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-xs font-semibold"
    :class="variantClasses"
  >
    <span
      v-if="showDot"
      class="w-1.5 h-1.5 rounded-full"
      :class="dotColor"
      aria-hidden="true"
    ></span>
    {{ label }}
  </span>
</template>
