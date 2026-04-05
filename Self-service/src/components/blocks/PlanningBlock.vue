<script setup>
// PlanningBlock — Prochaines séances (student: 5 prochains cours, instructor: ses séances)
// Backend : portal_app.api.cockpit.get_cockpit_block("planning")
import { useCockpitBlock } from '@/composables/useCockpitBlock';
import CockpitBlockWrapper from './CockpitBlockWrapper.vue';
import PlanningEntry from '@/components/ui/PlanningEntry.vue';

const planning = useCockpitBlock('planning');

function formatSchedule(item) {
  const parts = [];
  if (item.date) parts.push(item.date);
  if (item.time) parts.push(item.time);
  if (item.subtitle) parts.push(item.subtitle);
  return parts.join(' · ');
}
</script>

<template>
  <CockpitBlockWrapper :resource="planning" title="Prochain cours">
    <template #default="{ payload }">
      <div class="flex flex-col gap-2">
        <PlanningEntry
          v-for="(item, i) in payload.items"
          :key="i"
          :course-title="item.title"
          :schedule="formatSchedule(item)"
          state="upcoming"
        />
      </div>
    </template>
  </CockpitBlockWrapper>
</template>
