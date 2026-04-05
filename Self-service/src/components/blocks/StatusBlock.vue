<script setup>
// StatusBlock — Bloc statut générique (student_status ou application_status)
// Backend : portal_app.api.cockpit.get_cockpit_block(blockName)
import { useCockpitBlock } from '@/composables/useCockpitBlock';
import CockpitBlockWrapper from './CockpitBlockWrapper.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';

const props = defineProps({
  blockName: {
    type: String,
    required: true,
    validator: (v) => ['student_status', 'application_status'].includes(v),
  },
  title: { type: String, default: 'Statut' },
});

const status = useCockpitBlock(props.blockName);

function handleCta(url) {
  if (url) window.location.href = url;
}
</script>

<template>
  <CockpitBlockWrapper :resource="status" :title="title">
    <template #default="{ payload }">
      <div class="bg-white rounded-lg border border-subtle p-5">
        <div class="text-lg font-bold text-neutral-950">{{ payload.headline }}</div>
        <div class="text-sm text-neutral-600 mt-1">{{ payload.summary }}</div>

        <div v-if="payload.badges?.length" class="flex flex-wrap gap-2 mt-3">
          <StatusBadge
            v-for="(badge, i) in payload.badges"
            :key="i"
            variant="info"
            :label="badge"
            :dot="false"
          />
        </div>

        <dl v-if="payload.fields?.length" class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
          <div v-for="(field, i) in payload.fields" :key="i" class="text-xs">
            <dt class="text-neutral-500">{{ field.label }}</dt>
            <dd class="text-neutral-950 font-medium mt-0.5">{{ field.value }}</dd>
          </div>
        </dl>

        <button
          v-if="payload.cta"
          type="button"
          class="mt-5 inline-flex items-center text-xs font-semibold text-white bg-brand-900 hover:bg-brand-700 px-4 py-2 rounded-sm focus:outline-none focus:ring-2 focus:ring-brand-500/25 min-h-[44px]"
          @click="handleCta(payload.cta.url)"
        >
          {{ payload.cta.label }}
        </button>
      </div>
    </template>
  </CockpitBlockWrapper>
</template>
