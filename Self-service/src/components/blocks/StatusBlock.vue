<script setup>
// StatusBlock — Bloc statut générique (student_status ou application_status)
// Backend : portal_app.api.cockpit.get_cockpit_block(blockName)
import { useCockpitBlock } from '@/composables/useCockpitBlock';
import CockpitBlockWrapper from './CockpitBlockWrapper.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import { normalizePortalHref } from '@/utils/portalUrls';

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
  const href = normalizePortalHref(url);
  if (href) window.location.href = href;
}
</script>

<template>
  <CockpitBlockWrapper :resource="status" :title="title">
    <template #default="{ payload }">
      <div class="p-1">
        <div class="text-lg font-bold text-ln-gray-900">{{ payload.headline }}</div>
        <div class="text-sm text-ln-gray-600 mt-1">{{ payload.summary }}</div>

        <div v-if="payload.badges?.length" class="flex flex-wrap gap-2 mt-3">
          <StatusBadge
            v-for="(badge, i) in payload.badges"
            :key="i"
            status="in-review"
            :label="badge"
          />
        </div>

        <dl v-if="payload.fields?.length" class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
          <div v-for="(field, i) in payload.fields" :key="i" class="text-xs">
            <dt class="text-ln-gray-500">{{ field.label }}</dt>
            <dd class="text-ln-gray-900 font-medium mt-0.5">{{ field.value }}</dd>
          </div>
        </dl>

        <button
          v-if="payload.cta"
          type="button"
          class="mt-5 inline-flex items-center text-xs font-semibold text-white bg-ln-blue-900 hover:bg-ln-blue-700 px-4 py-2 rounded-sm focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px]"
          @click="handleCta(payload.cta.url)"
        >
          {{ payload.cta.label }}
        </button>
      </div>
    </template>
  </CockpitBlockWrapper>
</template>
