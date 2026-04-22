<script setup>
// CockpitBlockWrapper — wrapper universel loading/error/empty/data pour les blocs du cockpit.
// P6-Ph3 : restylé avec Card.vue + EmptyState.vue — les blocs qui le consomment
// (AlertsBlock, PlanningBlock, MetricsBlock, ModulesBlock, StatusBlock, TasksBlock)
// héritent automatiquement du design institutionnel LaNEM.
// Utilisé par AlertsBlock, PlanningBlock, etc.
import Card from '@/components/ui/Card.vue';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import BlockError from '@/components/ui/BlockError.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import { computed } from 'vue';

const props = defineProps({
  resource: { type: Object, required: true },
  title: { type: String, default: '' },
  skeletonLines: { type: Number, default: 3 },
  /**
   * Icône Lucide pour l'état vide (passé à EmptyState)
   */
  emptyIcon: { type: String, default: 'Inbox' },
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
  <Card :title="title" padding="md">
    <BlockSkeleton v-if="state === 'loading'" :lines="skeletonLines" :show-title="false" />

    <BlockError
      v-else-if="state === 'error'"
      :title="title ? `${title} indisponible` : 'Bloc indisponible'"
      :message="errorMessage"
      :retry="() => resource.reload()"
    />

    <EmptyState
      v-else-if="state === 'empty'"
      :icon="emptyIcon"
      :label="emptyMessage"
    />

    <slot
      v-else
      :payload="resource.data.payload"
      :profile="resource.data.profile"
    />
  </Card>
</template>
