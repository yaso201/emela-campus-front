<template>
  <ol class="mb-5 flex overflow-hidden rounded-md-ln border border-ln-gray-200 bg-white">
    <li v-for="(step, i) in steps" :key="step.key"
        class="relative min-w-0 flex-1 border-r border-ln-gray-200 px-4 py-3 last:border-r-0"
        :class="[stepClass(step), step.isMine ? 'pr-14' : '']"
        :aria-current="step.status === 'now' ? 'step' : undefined">
      <span v-if="step.isMine" class="absolute right-2.5 top-2 rounded border border-ln-blue-200 bg-white px-1.5 py-px text-[10px] font-bold uppercase tracking-wider text-ln-blue-800">vous</span>
      <span class="block text-[10.5px] font-bold uppercase tracking-wider" :class="actorClass(step)">{{ step.actor }}</span>
      <span class="block text-body-sm font-semibold leading-tight" :class="labelClass(step)">{{ step.label }}</span>
      <span class="tabular block text-caption" :class="dateClass(step)">{{ step.date || '—' }}</span>
      <span class="sr-only">Étape {{ i + 1 }} sur {{ steps.length }} — {{ statusWord(step) }}</span>
    </li>
  </ol>
</template>

<script setup>
/**
 * 7 · Fil de la procédure — les étapes, leur acteur, leur date ; marque celle
 * qui vous concerne. Réf : lot 3, présent dans les cinq vues staff.
 * Props : steps[] = { key, actor, label, date, status: 'done'|'now'|'todo', isMine }
 * Variantes : 5 étapes (discipline) · 4 (congé, réorientation) · 3 (démission).
 */
defineProps({
  steps: { type: Array, required: true },
});

function stepClass(s) {
  if (s.status === 'now') return 'bg-ln-blue-50 shadow-[inset_0_-3px_0_var(--ln-blue-800)]';
  if (s.status === 'done') return 'bg-ln-gray-50';
  return '';
}
function actorClass(s) {
  if (s.status === 'now') return 'text-ln-blue-700';
  if (s.status === 'done') return 'text-ln-gray-500';
  return 'text-ln-gray-400';
}
function labelClass(s) {
  if (s.status === 'now') return 'text-ln-blue-900';
  if (s.status === 'done') return 'text-ln-gray-700';
  return 'text-ln-gray-400';
}
function dateClass(s) {
  if (s.status === 'now') return 'font-semibold text-ln-blue-700';
  if (s.status === 'done') return 'text-ln-gray-500';
  return 'text-ln-gray-400';
}
function statusWord(s) {
  return s.status === 'done' ? 'faite' : s.status === 'now' ? 'en cours' : 'à venir';
}
</script>
