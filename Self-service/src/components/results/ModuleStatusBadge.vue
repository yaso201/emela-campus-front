<script setup>
// ModuleStatusBadge — statut module (rendu pur, pas de logique métier)
// Le calcul status/label est fait côté backend via emela_core.business.releve_notes.
import { computed } from 'vue';

const props = defineProps({
  status: { type: String, required: true },
  label: { type: String, required: true },
  size: { type: String, default: 'md' },
});

const colorTokens = {
  validated: { bg: 'bg-ln-success-bg', text: 'text-ln-success', dot: 'bg-ln-success' },
  failed_compensable: { bg: 'bg-ln-warning-bg', text: 'text-ln-warning', dot: 'bg-ln-warning' },
  failed_eliminatoire: { bg: 'bg-ln-error-bg', text: 'text-ln-error', dot: 'bg-ln-error' },
  unknown: { bg: 'bg-ln-gray-100', text: 'text-ln-gray-600', dot: 'bg-ln-gray-400' },
};

const tokens = computed(() => colorTokens[props.status] || colorTokens.unknown);
const sizeClasses = computed(() =>
  props.size === 'sm'
    ? 'text-[11px] px-1.5 py-0.5'
    : 'text-xs px-2 py-0.5',
);
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 font-semibold rounded tracking-wide"
    :class="[sizeClasses, tokens.bg, tokens.text]"
    role="status"
  >
    <span :class="['rounded-full flex-shrink-0 w-2 h-2', tokens.dot]" aria-hidden="true" />
    {{ label }}
  </span>
</template>
