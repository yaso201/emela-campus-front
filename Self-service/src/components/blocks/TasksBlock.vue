<script setup>
// TasksBlock — Tâches prioritaires (student: évals à remplir, candidate: actions dossier)
// Backend : portal_app.api.cockpit.get_cockpit_block("tasks")
import { useCockpitBlock } from '@/composables/useCockpitBlock';
import CockpitBlockWrapper from './CockpitBlockWrapper.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';

const tasks = useCockpitBlock('tasks');
</script>

<template>
  <CockpitBlockWrapper :resource="tasks" title="À faire">
    <template #default="{ payload }">
      <div class="flex flex-col gap-2">
        <a
          v-for="(item, i) in payload.items"
          :key="i"
          :href="item.action_url"
          class="bg-white rounded-lg border border-subtle p-4 flex items-start gap-3 hover:border-default transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/25 min-h-[44px]"
        >
          <div class="flex-1 min-w-0">
            <div class="text-sm font-semibold text-neutral-950">{{ item.title }}</div>
            <div class="text-xs text-neutral-600 mt-0.5">{{ item.description }}</div>
          </div>
          <StatusBadge
            v-if="item.badge"
            :variant="item.badge.includes('Blocage') || item.badge.includes('BRO') ? 'error' : 'info'"
            :label="item.badge"
            :dot="false"
          />
        </a>
      </div>
    </template>
  </CockpitBlockWrapper>
</template>
