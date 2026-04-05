<script setup>
// KpiCell — affiche un KPI individuel (Phase 7)
// Réutilise MetricCard + détecte les états resolver_error (note dans last_value_json)
import { computed } from 'vue';
import MetricCard from '@/components/ui/MetricCard.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';

const props = defineProps({
  kpi: { type: Object, required: true },
});

// Parse last_value_json pour extraire la note (ex: "resolver_error:OperationalError")
const lastValueDetails = computed(() => {
  const json = props.kpi.last_value_json;
  if (!json) return {};
  if (typeof json === 'object') return json;
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
});

const note = computed(() => lastValueDetails.value?.note || '');

const isError = computed(() =>
  note.value.startsWith('resolver_error') || note.value.includes('_unavailable'),
);

const isStub = computed(
  () => note.value.includes('stub') || note.value.includes('requires_history'),
);

const hasData = computed(
  () => props.kpi.last_value !== null && props.kpi.last_value !== undefined && !isError.value,
);

const displayValue = computed(() => {
  if (isError.value) return '—';
  if (isStub.value) return '—';
  const v = props.kpi.last_value;
  if (v === null || v === undefined) return '—';
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1) + ' M';
  if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(0) + ' k';
  return Number.isInteger(v) ? v.toString() : v.toFixed(1);
});

const computedAtLabel = computed(() => {
  if (!props.kpi.last_computed_at) return '';
  const d = new Date(props.kpi.last_computed_at);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
});

const frequencyLabel = computed(() => {
  const map = { daily: 'Quotidien', weekly: 'Hebdo.', monthly: 'Mensuel' };
  return map[props.kpi.frequency] || props.kpi.frequency || '';
});
</script>

<template>
  <div class="bg-white rounded-lg border border-subtle p-4">
    <!-- Label -->
    <div class="flex items-start justify-between gap-2 mb-2">
      <div class="text-xs text-neutral-500 min-w-0">
        <div class="truncate">{{ kpi.kpi_name || kpi.kpi_id }}</div>
        <div class="text-[10px] text-neutral-400 font-mono mt-0.5">{{ kpi.kpi_id }}</div>
      </div>
      <StatusBadge
        v-if="isError"
        variant="error"
        label="Indisponible"
        :dot="false"
      />
      <StatusBadge
        v-else-if="isStub"
        variant="neutral"
        label="Stub"
        :dot="false"
      />
    </div>

    <!-- Value -->
    <div class="text-2xl font-bold text-neutral-950 tabular-nums">{{ displayValue }}</div>

    <!-- Footer -->
    <div class="flex items-center justify-between mt-2 text-[11px] text-neutral-400">
      <span>{{ frequencyLabel }}</span>
      <span v-if="computedAtLabel">Mis à jour {{ computedAtLabel }}</span>
    </div>
  </div>
</template>
