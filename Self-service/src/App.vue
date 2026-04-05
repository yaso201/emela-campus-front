<script setup>
// App.vue — Shell minimal Phase 0.
// Affiche le wordmark mela. pour valider que :
//   1. Vue 3 + Vite buildent correctement
//   2. Les tokens sont chargés (couleur de fond warm off-white)
//   3. Plus Jakarta Sans est bien appliquée (poids 700)
//   4. L'accent ambre du point final est présent
// Sera remplacé en Phase 3 par l'AppShell complet (SideNav + BottomNav).
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-neutral-50">
    <h1
      class="text-4xl font-bold tracking-tighter text-neutral-950"
      aria-label="mela"
    >
      mela<span class="text-accent-500">.</span>
    </h1>
  </div>
</template>
