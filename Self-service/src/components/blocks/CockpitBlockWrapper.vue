<script setup>
// CockpitBlockWrapper — wrapper universel loading/error/empty/data pour les blocs du cockpit.
// Utilisé par AlertsBlock, PlanningBlock, etc.
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import BlockError from '@/components/ui/BlockError.vue';
import { computed } from 'vue';

const props = defineProps({
  resource: { type: Object, required: true },
  title: { type: String, default: '' },
  skeletonLines: { type: Number, default: 3 },
});

const state = computed(() => {
  if (props.resource.loading) return 'loading';
  if (props.resource.error) return 'error';
  const data = props.resource.data;
  if (!data) return 'error';
  if (data.status === 'error') return 'error';
  const payload = data.payload || {};
  const items = payload.items || payload.fields || [];
  if (items.length === 0 && !payload.headline) return 'empty';
  return 'ok';
});

const errorMessage = computed(() => {
  if (props.resource.error) {
    return props.resource.error.messages?.[0] || props.resource.error.message || 'Erreur réseau';
  }
  return props.resource.data?.message || 'Données indisponibles';
});

const emptyMessage = computed(() =>
  props.resource.data?.payload?.empty_message || 'Aucune donnée à afficher.'
);
</script>

<template>
  <section class="flex flex-col gap-3">
    <h2
      v-if="title"
      class="text-[11px] font-semibold text-neutral-600 tracking-wider uppercase"
    >
      {{ title }}
    </h2>

    <BlockSkeleton v-if="state === 'loading'" :lines="skeletonLines" :show-title="false" />

    <BlockError
      v-else-if="state === 'error'"
      :title="title ? `${title} indisponible` : 'Bloc indisponible'"
      :message="errorMessage"
      :retry="() => resource.reload()"
    />

    <div
      v-else-if="state === 'empty'"
      class="bg-white rounded-lg border border-subtle p-6 text-sm text-neutral-500"
    >
      {{ emptyMessage }}
    </div>

    <slot
      v-else
      :payload="resource.data.payload"
      :profile="resource.data.profile"
    />
  </section>
</template>
