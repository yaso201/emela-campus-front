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
          class="rounded-md-ln border border-ln-gray-200 p-4 flex items-start gap-3"
        >
          <div class="flex-1 min-w-0">
            <div class="text-sm font-semibold text-ln-gray-900">{{ item.title }}</div>
            <div class="text-xs text-ln-gray-600 mt-0.5">{{ item.description }}</div>
          </div>
          <StatusBadge
            v-if="item.badge"
            :status="item.badge.includes('Résultats') ? 'validated' : 'module-badge'"
            :label="item.badge"
          />
        </div>
      </div>
    </template>
  </CockpitBlockWrapper>
</template>
