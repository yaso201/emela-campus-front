<template>
  <section class="overflow-hidden rounded-md-ln border border-ln-gray-300 bg-white" :class="{ 'opacity-95': closed }" :aria-label="title">
    <header class="flex flex-wrap items-baseline gap-3 border-b border-ln-gray-200 px-5 py-4">
      <h4 class="text-h3 text-ln-gray-900">{{ title }}</h4>
      <p class="tabular ml-auto text-caption font-semibold" :class="remainingClass">{{ remainingLabel }}</p>
    </header>

    <div class="p-5">
      <div class="my-3 h-2 overflow-hidden rounded-full bg-ln-gray-100">
        <span class="block h-full rounded-full" :class="fillClass" :style="{ width: elapsedPercent + '%' }" role="presentation"></span>
      </div>
      <div class="tabular flex justify-between text-micro text-ln-gray-500">
        <span>Ouverte le {{ deadline.opened_on }}</span>
        <span>{{ closed ? 'Close le ' + deadline.term : 'Dernier jour : ' + deadline.term }}</span>
      </div>
      <p class="mt-4 text-body-sm leading-relaxed text-ln-gray-700"><slot>{{ body }}</slot></p>
      <p v-if="aside" class="mt-2 text-caption leading-relaxed text-ln-gray-500">{{ aside }}</p>
    </div>

    <footer class="flex flex-wrap items-center gap-3 border-t border-ln-gray-200 bg-ln-gray-50 px-5 py-4">
      <p class="mr-auto text-caption text-ln-gray-500">{{ footnote }}</p>
      <slot name="secondary" />
      <button v-if="!closed" type="button" class="ln-btn-primary min-h-[44px]" @click="emit('act')">{{ actionLabel }}</button>
    </footer>
  </section>
</template>

<script setup>
/**
 * 12 · Fenêtre de rétractation — un acte de retour possible jusqu'à une date.
 * Réf : lot 3, composants. Variantes : rétractation · appel · report.
 * États : ouverte · dernier jour · close.
 *
 * Elle NE DISPARAÎT JAMAIS. Close, elle reste et dit sa date de clôture : une
 * fenêtre retirée laisse croire qu'elle n'a jamais existé.
 * La phrase sur ce qui suit la clôture est présente DÈS L'OUVERTURE, pas
 * seulement le dernier jour.
 */
import { computed } from 'vue';

const props = defineProps({
  title: { type: String, required: true },
  deadline: { type: Object, required: true },   // contrat D-05
  body: { type: String, default: '' },
  aside: { type: String, default: '' },
  footnote: { type: String, default: '' },
  actionLabel: { type: String, default: 'Agir' },
  totalDays: { type: Number, default: null },
});
const emit = defineEmits(['act']);

const closed = computed(() => props.deadline.remaining <= 0);
const lastDay = computed(() => props.deadline.remaining === 1);

const remainingClass = computed(() => {
  if (closed.value) return 'text-ln-error';
  if (lastDay.value) return 'text-ln-error';
  return 'text-ln-blue-900';
});
const fillClass = computed(() => {
  if (closed.value) return 'bg-ln-gray-300';
  if (lastDay.value) return 'bg-ln-warning';
  return 'bg-ln-blue-800';
});
const remainingLabel = computed(() => {
  if (closed.value) return 'Clos le ' + props.deadline.term;
  if (lastDay.value) return "Aujourd'hui, jusqu'à 23 h 59";
  const unit = props.deadline.unit === 'jours_ouvrables' ? 'jours ouvrables restants' : 'jours restants';
  return props.deadline.remaining + ' ' + unit;
});
const elapsedPercent = computed(() => {
  if (closed.value) return 100;
  const total = props.totalDays || props.deadline.remaining;
  const done = Math.max(0, total - props.deadline.remaining);
  return Math.min(100, Math.round((done / total) * 100));
});
</script>
