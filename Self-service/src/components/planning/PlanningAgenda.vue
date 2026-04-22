<script setup>
// PlanningAgenda — vue agenda groupée par jour
// Phase 5 — consommé par PlanningPage
// C-002 : passe l'objet session complet à PlanningEntry, le state est calculé par le composant
import { computed } from 'vue';
import PlanningEntry from '@/components/ui/PlanningEntry.vue';
import {
  groupByDay,
  formatDayLabel,
} from '@/utils/planning';

const props = defineProps({
  sessions: { type: Array, required: true },
});

const groups = computed(() => groupByDay(props.sessions));
</script>

<template>
  <div v-if="groups.length === 0" class="bg-white rounded-lg border border-ln-gray-200 p-6 text-sm text-ln-gray-500 text-center">
    Aucune séance publiée sur cette période.
  </div>

  <div v-else class="flex flex-col gap-6">
    <div v-for="group in groups" :key="group.date">
      <div class="text-[11px] font-semibold text-ln-gray-600 tracking-wider uppercase mb-3">
        {{ formatDayLabel(group.date) }}
      </div>
      <div class="flex flex-col gap-2">
        <PlanningEntry
          v-for="s in group.sessions"
          :key="s.name"
          :session="s"
        />
      </div>
    </div>
  </div>
</template>
