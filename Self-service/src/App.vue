<script setup>
// App.vue — Cockpit mela (Phase 2)
// Monte les 8 blocs Phase 2 connectés au backend via frappe-ui.
// Sera remplacé par l'AppShell + router en Phase 3.
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
  <div class="min-h-screen bg-neutral-50 py-8 px-4">
    <div class="max-w-3xl mx-auto">
      <header class="mb-8">
        <h1 class="text-3xl font-bold tracking-tight text-neutral-950">
          mela<span class="text-accent-500">.</span>
        </h1>
        <p class="text-sm text-neutral-600 mt-1">Cockpit — Phase 2 (blocs connectés)</p>
      </header>

      <div class="flex flex-col gap-8">
        <StatusBlock block-name="student_status" title="Mon statut" />
        <AlertsBlock />
        <PlanningBlock />
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TasksBlock />
          <NotificationsBlock />
        </div>
        <ModulesBlock />
        <MetricsBlock />
        <ServicesBlock />
      </div>
    </div>
  </div>
</template>
