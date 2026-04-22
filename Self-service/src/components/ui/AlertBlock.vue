<script setup>
// AlertBlock — alerte avec sévérité + border-left coloré
// Réf visuelle : specs-interfaces/mela_component_library_reference.html §AlertBlock
import { computed } from 'vue';

const props = defineProps({
  severity: {
    type: String,
    default: 'info',
    validator: (v) => ['error', 'warning', 'info', 'success'].includes(v),
  },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  actionLabel: { type: String, default: '' },
  onAction: { type: Function, default: null },
});

const severityClasses = computed(() => {
  const map = {
    error:   { bg: 'bg-ln-error-bg',   border: 'border-l-ln-error',   text: 'text-ln-error',   btn: 'bg-ln-error hover:bg-ln-error' },
    warning: { bg: 'bg-ln-warning-bg', border: 'border-l-ln-warning', text: 'text-ln-warning', btn: 'bg-ln-warning hover:bg-ln-warning' },
    info:    { bg: 'bg-ln-blue-100',    border: 'border-l-ln-blue-600',    text: 'text-ln-blue-700',    btn: 'bg-ln-blue-600 hover:bg-ln-blue-700' },
    success: { bg: 'bg-ln-success-bg', border: 'border-l-ln-success', text: 'text-ln-success', btn: 'bg-ln-success hover:bg-ln-success' },
  };
  return map[props.severity];
});
</script>

<template>
  <div
    class="rounded-lg p-4 border-l-[3px] flex items-start gap-2.5"
    :class="[severityClasses.bg, severityClasses.border]"
    role="alert"
  >
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      class="flex-shrink-0 mt-0.5"
      :class="severityClasses.text"
      role="img"
      :aria-label="severity"
    >
      <circle
        v-if="severity === 'error' || severity === 'info'"
        cx="10" cy="10" r="9"
        stroke="currentColor"
        stroke-width="1.5"
      />
      <path
        v-if="severity === 'warning'"
        d="M10 2L1 18h18L10 2z"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linejoin="round"
      />
      <circle
        v-if="severity === 'success'"
        cx="10" cy="10" r="9"
        stroke="currentColor"
        stroke-width="1.5"
      />
      <path
        v-if="severity === 'error'"
        d="M10 6v5M10 13.5v.5"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
      />
      <path
        v-if="severity === 'warning'"
        d="M10 8v4M10 14.5v.5"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
      />
      <path
        v-if="severity === 'info'"
        d="M10 9v5M10 6.5v.5"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
      />
      <path
        v-if="severity === 'success'"
        d="M6 10l3 3 5-6"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <div class="flex-1 min-w-0">
      <div class="text-sm font-semibold" :class="severityClasses.text">{{ title }}</div>
      <div v-if="description" class="text-xs mt-0.5 opacity-80" :class="severityClasses.text">
        {{ description }}
      </div>
    </div>
    <button
      v-if="actionLabel && onAction"
      type="button"
      class="flex-shrink-0 text-xs font-semibold text-white px-3.5 py-1.5 rounded-sm whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-white min-h-[44px]"
      :class="severityClasses.btn"
      @click="onAction"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>
