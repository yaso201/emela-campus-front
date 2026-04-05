<script setup>
// PlanningPage — vue dédiée planning (plein écran sur desktop)
import PlanningBlock from '@/components/blocks/PlanningBlock.vue';
</script>

<template>
  <div class="flex flex-col gap-6">
    <header>
      <h1 class="text-2xl font-bold text-neutral-950 mb-1">Planning</h1>
      <p class="text-sm text-neutral-600">Vos prochaines séances de cours.</p>
    </header>
    <PlanningBlock />
  </div>
</template>
