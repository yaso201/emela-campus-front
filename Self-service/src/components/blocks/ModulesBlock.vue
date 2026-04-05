<script setup>
// ModulesBlock — Modules enseignés par l'instructeur connecté
// Backend : portal_app.api.cockpit.get_cockpit_block("teaching_load")
// Profil : instructor uniquement
import { useCockpitBlock } from '@/composables/useCockpitBlock';
import CockpitBlockWrapper from './CockpitBlockWrapper.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';

const modules = useCockpitBlock('teaching_load');
</script>

<template>
  <CockpitBlockWrapper :resource="modules" title="Mes modules">
    <template #default="{ payload }">
      <div class="flex flex-col gap-2">
        <div
          v-for="(item, i) in payload.items"
          :key="i"
          class="bg-white rounded-lg border border-subtle p-4 flex items-start gap-3"
        >
          <div class="flex-1 min-w-0">
            <div class="text-sm font-semibold text-neutral-950">{{ item.title }}</div>
            <div class="text-xs text-neutral-600 mt-0.5">{{ item.description }}</div>
          </div>
          <StatusBadge
            v-if="item.badge"
            :variant="item.badge.includes('Résultats') ? 'success' : 'neutral'"
            :label="item.badge"
            :dot="false"
          />
        </div>
      </div>
    </template>
  </CockpitBlockWrapper>
</template>
