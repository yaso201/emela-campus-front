<script setup>
// PlanningEntry — entrée de planning avec 3 états visuels
// Réf visuelle : specs-interfaces/mela_component_library_reference.html §PlanningEntry
import { computed } from 'vue';
import StatusBadge from './StatusBadge.vue';

const props = defineProps({
  courseTitle: { type: String, required: true },
  schedule: { type: String, required: true },
  state: {
    type: String,
    default: 'upcoming',
    validator: (v) => ['upcoming', 'past', 'cancelled'].includes(v),
  },
});

const barColor = computed(() => {
  const map = {
    upcoming:  'bg-brand-900',
    past:      'bg-neutral-300',
    cancelled: 'bg-error-600',
  };
  return map[props.state];
});

const containerClass = computed(() => (props.state === 'past' ? 'opacity-60' : ''));
const titleClass = computed(() => (props.state === 'cancelled' ? 'line-through' : ''));

const badgeConfig = computed(() => {
  if (props.state === 'upcoming') return { variant: 'info', label: 'À venir' };
  if (props.state === 'cancelled') return { variant: 'error', label: 'Annulé' };
  return null;
});
</script>

<template>
  <div
    class="bg-white rounded-lg border border-subtle p-3.5 flex items-start gap-3"
    :class="containerClass"
  >
    <div
      class="w-[3px] h-9 rounded-xs flex-shrink-0 mt-0.5"
      :class="barColor"
      aria-hidden="true"
    ></div>
    <div class="flex-1 min-w-0">
      <div class="text-sm font-semibold text-neutral-950" :class="titleClass">
        {{ courseTitle }}
      </div>
      <div class="text-xs text-neutral-600 mt-0.5">{{ schedule }}</div>
    </div>
    <StatusBadge
      v-if="badgeConfig"
      :variant="badgeConfig.variant"
      :label="badgeConfig.label"
      :dot="false"
    />
    <span v-else class="text-xs text-neutral-400 flex-shrink-0">Passé</span>
  </div>
</template>
