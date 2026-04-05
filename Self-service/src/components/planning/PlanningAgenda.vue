<script setup>
// PlanningAgenda — vue agenda groupée par jour
// Phase 5 — consommé par PlanningPage
import { computed } from 'vue';
import PlanningEntry from '@/components/ui/PlanningEntry.vue';
import {
  groupByDay,
  formatDayLabel,
  formatTimeRange,
  getSessionState,
} from '@/utils/planning';

const props = defineProps({
  sessions: { type: Array, required: true },
});

const groups = computed(() => groupByDay(props.sessions));

function formatSchedule(s) {
  const parts = [];
  const time = formatTimeRange(s);
  if (time) parts.push(time);
  if (s.room) parts.push(s.room);
  if (s.subtitle) parts.push(s.subtitle);
  return parts.join(' · ');
}
</script>

<template>
  <div v-if="groups.length === 0" class="bg-white rounded-lg border border-subtle p-6 text-sm text-neutral-500 text-center">
    Aucune séance publiée sur cette période.
  </div>

  <div v-else class="flex flex-col gap-6">
    <div v-for="group in groups" :key="group.date">
      <div class="text-[11px] font-semibold text-neutral-600 tracking-wider uppercase mb-3">
        {{ formatDayLabel(group.date) }}
      </div>
      <div class="flex flex-col gap-2">
        <PlanningEntry
          v-for="s in group.sessions"
          :key="s.name"
          :course-title="s.title"
          :schedule="formatSchedule(s)"
          :state="getSessionState(s)"
        />
      </div>
    </div>
  </div>
</template>
