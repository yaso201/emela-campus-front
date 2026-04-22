<script setup>
// PlanningBlock — Prochaines séances (student: 5 prochains cours, instructor: ses séances)
// Backend : portal_app.api.cockpit.get_cockpit_block("planning")
// C-002 : passe l'objet session complet à PlanningEntry
import { useCockpitBlock } from '@/composables/useCockpitBlock';
import CockpitBlockWrapper from './CockpitBlockWrapper.vue';
import PlanningEntry from '@/components/ui/PlanningEntry.vue';

const planning = useCockpitBlock('planning');
</script>

<template>
  <CockpitBlockWrapper :resource="planning" title="Prochain cours">
    <template #default="{ payload }">
      <div class="flex flex-col gap-2">
        <PlanningEntry
          v-for="(item, i) in payload.items"
          :key="i"
          :session="item"
        />
      </div>
    </template>
  </CockpitBlockWrapper>
</template>
