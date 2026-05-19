<script setup>
// GradeEctsBadge — Grade ECTS selon Règlement des Études V2.1 Art. 25
// A/B/C/E/NV/F avec couleurs sémantiques ln-*
import { computed } from 'vue';

const props = defineProps({
  grade: { type: String, default: '' },
  size: { type: String, default: 'md' }, // sm | md
});

const gradeConfig = computed(() => {
  const g = (props.grade || '').toUpperCase().trim();
  const map = {
    A: { label: 'A', text: 'text-ln-success', bg: 'bg-ln-success-bg', border: 'border-ln-success', desc: 'Excellent' },
    B: { label: 'B', text: 'text-ln-success', bg: 'bg-ln-success-bg', border: 'border-ln-success', desc: 'Très bien' },
    C: { label: 'C', text: 'text-ln-blue-700', bg: 'bg-ln-blue-100', border: 'border-ln-blue-600', desc: 'Bien' },
    D: { label: 'D', text: 'text-ln-blue-700', bg: 'bg-ln-blue-100', border: 'border-ln-blue-600', desc: 'Bien' },
    E: { label: 'E', text: 'text-ln-warning', bg: 'bg-ln-warning-bg', border: 'border-ln-warning', desc: 'Passable' },
    NV: { label: 'NV', text: 'text-ln-gray-600', bg: 'bg-ln-gray-100', border: 'border-ln-gray-400', desc: 'Non validé' },
    F: { label: 'F', text: 'text-ln-error', bg: 'bg-ln-error-bg', border: 'border-ln-error', desc: 'Insuffisant' },
  };
  return map[g] || { label: g || '—', text: 'text-ln-gray-600', bg: 'bg-ln-gray-100', border: 'border-ln-gray-400', desc: '' };
});

const sizeClasses = computed(() =>
  props.size === 'sm'
    ? 'text-[11px] px-1.5 py-0.5'
    : 'text-xs px-2 py-0.5',
);
</script>

<template>
  <span
    class="inline-flex items-center gap-1 font-semibold rounded tracking-wide border"
    :class="[sizeClasses, gradeConfig.bg, gradeConfig.text, gradeConfig.border]"
    role="status"
    :aria-label="`Grade ECTS ${gradeConfig.label}`"
  >
    <span class="font-bold">{{ gradeConfig.label }}</span>
    <span v-if="gradeConfig.desc" class="font-normal opacity-80">· {{ gradeConfig.desc }}</span>
  </span>
</template>
