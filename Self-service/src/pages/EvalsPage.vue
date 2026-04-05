<script setup>
// EvalsPage — vue dédiée évaluations (tâches d'éval teaching_eval)
import TasksBlock from '@/components/blocks/TasksBlock.vue';
</script>

<template>
  <div class="flex flex-col gap-6">
    <header>
      <h1 class="text-2xl font-bold text-neutral-950 mb-1">Évaluations</h1>
      <p class="text-sm text-neutral-600">Campagnes d'évaluation teaching_eval ouvertes pour vous.</p>
    </header>
    <TasksBlock />
  </div>
</template>
