<script setup>
// MetricsBlock — KPIs direction (Étudiants actifs, Candidatures, Campagnes, Blocages)
// Backend : portal_app.api.cockpit.get_cockpit_block("indicators")
// Profil : director uniquement
import { useCockpitBlock } from '@/composables/useCockpitBlock';
import CockpitBlockWrapper from './CockpitBlockWrapper.vue';
import MetricCard from '@/components/ui/MetricCard.vue';

const metrics = useCockpitBlock('indicators');
</script>

<template>
  <CockpitBlockWrapper :resource="metrics" title="Indicateurs">
    <template #default="{ payload }">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          v-for="(item, i) in payload.items"
          :key="i"
          :label="item.label"
          :value="item.value"
        />
      </div>
    </template>
  </CockpitBlockWrapper>
</template>
