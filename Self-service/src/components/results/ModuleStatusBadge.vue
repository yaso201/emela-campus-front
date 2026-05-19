<script setup>
// ModuleStatusBadge — statut module selon Règlement V2.1 Art. 22-23
// validé / à_rattraper / éliminatoire avec tokens ln-*
import { computed } from 'vue';

const props = defineProps({
  moduleAverage: { type: Number, default: null },
  compensationFloor: { type: Number, default: 6.0 },
  size: { type: String, default: 'md' },
});

const config = computed(() => {
  const note = props.moduleAverage;
  if (note === null || note === undefined || Number.isNaN(Number(note))) {
    return { label: '—', status: 'unknown', text: 'text-ln-gray-600', bg: 'bg-ln-gray-100', dot: 'bg-ln-gray-400' };
  }
  const n = Number(note);
  if (n >= 12) {
    return { label: 'Validé', status: 'validated', text: 'text-ln-success', bg: 'bg-ln-success-bg', dot: 'bg-ln-success' };
  }
  if (n < props.compensationFloor) {
    return { label: 'Éliminatoire', status: 'eliminatory', text: 'text-ln-error', bg: 'bg-ln-error-bg', dot: 'bg-ln-error' };
  }
  return { label: 'À rattraper', status: 'retake', text: 'text-ln-warning', bg: 'bg-ln-warning-bg', dot: 'bg-ln-warning' };
});

const sizeClasses = computed(() =>
  props.size === 'sm'
    ? 'text-[11px] px-1.5 py-0.5'
    : 'text-xs px-2 py-0.5',
);
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 font-semibold rounded tracking-wide"
    :class="[sizeClasses, config.bg, config.text]"
    role="status"
  >
    <span :class="['rounded-full flex-shrink-0 w-2 h-2', config.dot]" aria-hidden="true" />
    {{ config.label }}
  </span>
</template>
