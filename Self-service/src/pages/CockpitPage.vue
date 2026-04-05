<script setup>
// CockpitPage — page d'accueil / cockpit avec les 8 blocs connectés
// Reprend les blocs Phase 2 avec un layout 2 colonnes responsive.
import AlertsBlock from '@/components/blocks/AlertsBlock.vue';
import PlanningBlock from '@/components/blocks/PlanningBlock.vue';
import NotificationsBlock from '@/components/blocks/NotificationsBlock.vue';
import TasksBlock from '@/components/blocks/TasksBlock.vue';
import MetricsBlock from '@/components/blocks/MetricsBlock.vue';
import ModulesBlock from '@/components/blocks/ModulesBlock.vue';
import StatusBlock from '@/components/blocks/StatusBlock.vue';
import ServicesBlock from '@/components/blocks/ServicesBlock.vue';
</script>

<template>
  <div class="flex flex-col gap-8">
    <AlertsBlock />
    <StatusBlock block-name="student_status" title="Mon statut" />
    <PlanningBlock />
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <TasksBlock />
      <NotificationsBlock />
    </div>
    <ModulesBlock />
    <MetricsBlock />
    <ServicesBlock />
  </div>
</template>
