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
import FinancesBlock from '@/components/blocks/FinancesBlock.vue';
import AttendanceBlock from '@/components/blocks/AttendanceBlock.vue';
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
    <FinancesBlock />
    <AttendanceBlock />
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
    <router-link
      to="/insights"
      class="flex items-center justify-between bg-brand-900 text-white rounded-lg p-5 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/25 transition-colors min-h-[44px]"
    >
      <div>
        <div class="text-sm font-semibold">Pilotage détaillé</div>
        <div class="text-xs opacity-80 mt-0.5">
          Consulter les 56 indicateurs clés par domaine
        </div>
      </div>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M5 12h14M13 6l6 6-6 6"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </router-link>
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
