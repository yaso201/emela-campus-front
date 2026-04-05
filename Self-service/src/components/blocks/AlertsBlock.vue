<script setup>
// AlertsBlock — Bloc alertes actives (student: blocages, director: alertes transverses)
// Backend : portal_app.api.cockpit.get_cockpit_block("alerts")
import { useCockpitBlock } from '@/composables/useCockpitBlock';
import CockpitBlockWrapper from './CockpitBlockWrapper.vue';
import AlertBlock from '@/components/ui/AlertBlock.vue';

const alerts = useCockpitBlock('alerts');

function handleAction(url) {
  if (url) window.location.href = url;
}
</script>

<template>
  <CockpitBlockWrapper :resource="alerts" title="Alertes">
    <template #default="{ payload }">
      <div class="flex flex-col gap-2">
        <AlertBlock
          v-for="(item, i) in payload.items"
          :key="i"
          severity="error"
          :title="item.title"
          :description="item.description"
          :action-label="item.action_label || ''"
          :on-action="item.action_label ? () => handleAction(item.action_url) : null"
        />
      </div>
    </template>
  </CockpitBlockWrapper>
</template>
