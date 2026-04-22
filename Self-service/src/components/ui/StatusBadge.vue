<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 font-semibold rounded tracking-wide',
      sizeClasses,
      colorClasses,
    ]"
    role="status"
  >
    <span :class="['rounded-full flex-shrink-0', dotSize, dotColor]" aria-hidden="true" />
    {{ displayLabel }}
  </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  status: { type: String, required: true },
  label: { type: String, default: null },
  size: { type: String, default: 'md' },
});

const statusMap = {
  active: { color: 'success', label: 'Actif' },
  suspended: { color: 'warning', label: 'Suspendu' },
  blocked: { color: 'error', label: 'Bloqué' },
  pending: { color: 'neutral', label: 'En attente' },
  admitted: { color: 'success', label: 'Admis' },
  rejected: { color: 'error', label: 'Refusé' },
  'in-review': { color: 'info', label: 'En cours' },
  graduated: { color: 'success', label: 'Diplômé' },
  withdrawn: { color: 'neutral', label: 'Retiré' },
  open: { color: 'success', label: 'Ouvert' },
  closed: { color: 'neutral', label: 'Fermé' },
  overdue: { color: 'error', label: 'En retard' },
  validated: { color: 'success', label: 'Validé' },
  failed: { color: 'error', label: 'Échoué' },
  compensated: { color: 'warning', label: 'Compensé' },
};

const colorTokens = {
  success: { bg: 'bg-ln-success-bg', text: 'text-ln-success', dot: 'bg-ln-success' },
  warning: { bg: 'bg-ln-warning-bg', text: 'text-ln-warning', dot: 'bg-ln-warning' },
  error: { bg: 'bg-ln-error-bg', text: 'text-ln-error', dot: 'bg-ln-error' },
  neutral: { bg: 'bg-ln-gray-100', text: 'text-ln-gray-600', dot: 'bg-ln-gray-400' },
  info: { bg: 'bg-ln-blue-100', text: 'text-ln-blue-700', dot: 'bg-ln-blue-600' },
};

const config = computed(() => statusMap[props.status] ?? { color: 'neutral', label: props.status });
const tokens = computed(() => colorTokens[config.value.color]);
const displayLabel = computed(() => props.label ?? config.value.label);
const sizeClasses = computed(() =>
  props.size === 'sm' ? 'text-[11px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5',
);
const colorClasses = computed(() => `${tokens.value.bg} ${tokens.value.text}`);
const dotSize = computed(() => (props.size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'));
const dotColor = computed(() => tokens.value.dot);
</script>
