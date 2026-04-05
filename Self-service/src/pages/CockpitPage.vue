<script setup>
// CockpitPage — home page avec composition dynamique par profil
// Le profil vient de useProfileStore (fetché par AppShell au mount).
import { computed } from 'vue';
import { useProfileStore } from '@/stores/profile';

import AlertsBlock from '@/components/blocks/AlertsBlock.vue';
import PlanningBlock from '@/components/blocks/PlanningBlock.vue';
import NotificationsBlock from '@/components/blocks/NotificationsBlock.vue';
import TasksBlock from '@/components/blocks/TasksBlock.vue';
import MetricsBlock from '@/components/blocks/MetricsBlock.vue';
import ModulesBlock from '@/components/blocks/ModulesBlock.vue';
import StatusBlock from '@/components/blocks/StatusBlock.vue';
import ServicesBlock from '@/components/blocks/ServicesBlock.vue';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';

const profile = useProfileStore();
const profileName = computed(() => profile.profile || 'generic');
</script>

<template>
  <div v-if="profile.isLoading" class="flex flex-col gap-6">
    <BlockSkeleton :lines="3" />
    <BlockSkeleton :lines="4" />
    <BlockSkeleton :lines="3" />
  </div>

  <div v-else-if="profileName === 'student'" class="flex flex-col gap-8">
    <AlertsBlock />
    <StatusBlock block-name="student_status" title="Mon statut" />
    <PlanningBlock />
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <TasksBlock />
      <NotificationsBlock />
    </div>
    <ServicesBlock />
  </div>

  <div v-else-if="profileName === 'instructor'" class="flex flex-col gap-8">
    <PlanningBlock />
    <ModulesBlock />
    <NotificationsBlock />
    <ServicesBlock />
  </div>

  <div v-else-if="profileName === 'director'" class="flex flex-col gap-8">
    <MetricsBlock />
    <AlertsBlock />
    <NotificationsBlock />
  </div>

  <div v-else-if="profileName === 'candidate'" class="flex flex-col gap-8">
    <StatusBlock block-name="application_status" title="Mon dossier" />
    <TasksBlock />
    <NotificationsBlock />
  </div>

  <div v-else class="flex flex-col gap-8">
    <div class="bg-white rounded-lg border border-subtle p-5">
      <p class="text-sm text-neutral-600">
        Votre compte n'a pas encore de profil académique associé. Seules les notifications
        générales sont disponibles.
      </p>
    </div>
    <NotificationsBlock />
  </div>
</template>
