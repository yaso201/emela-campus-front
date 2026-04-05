<script setup>
// KpiDomainSection — groupe les KPIs d'une catégorie dans une section (Phase 7)
// Affiche un titre + compteur + grille de KpiCell
import { computed } from 'vue';
import KpiCell from './KpiCell.vue';

const props = defineProps({
  category: { type: String, required: true },
  kpis: { type: Array, required: true },
});

const availableCount = computed(() => {
  return props.kpis.filter((k) => {
    const details = k.last_value_json && typeof k.last_value_json === 'string'
      ? safeParse(k.last_value_json)
      : k.last_value_json || {};
    const note = details?.note || '';
    return !note.startsWith('resolver_error') && !note.includes('_unavailable');
  }).length;
});

function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return {};
  }
}
</script>

<template>
  <section class="flex flex-col gap-3">
    <div class="flex items-baseline justify-between">
      <h2 class="text-[11px] font-semibold text-neutral-600 tracking-wider uppercase">
        {{ category }}
      </h2>
      <span class="text-[11px] text-neutral-400 tabular-nums">
        {{ availableCount }}/{{ kpis.length }}
      </span>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <KpiCell v-for="kpi in kpis" :key="kpi.name" :kpi="kpi" />
    </div>
  </section>
</template>
