<script setup>
// BlockSkeleton — placeholder animé pendant le chargement d'un bloc
// Respecte prefers-reduced-motion (pas d'animation si activé)
defineProps({
  lines: { type: Number, default: 3 },
  showTitle: { type: Boolean, default: true },
});
</script>

<template>
  <div
    class="bg-white rounded-lg border border-subtle p-6"
    role="status"
    aria-label="Chargement en cours"
  >
    <div
      v-if="showTitle"
      class="h-4 bg-neutral-100 rounded-xs w-1/3 mb-4 motion-safe:animate-pulse"
    ></div>
    <div class="space-y-3">
      <div
        v-for="i in lines"
        :key="i"
        class="h-3 bg-neutral-100 rounded-xs motion-safe:animate-pulse"
        :class="i === lines ? 'w-2/3' : 'w-full'"
      ></div>
    </div>
  </div>
</template>
