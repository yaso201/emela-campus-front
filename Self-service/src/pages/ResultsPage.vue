<script setup>
// ResultsPage — placeholder. Les résultats transitent par Moodle (F11).
// En Phase 4 cette page affichera un résumé + lien contextualisé Moodle.
</script>

<template>
  <div class="flex flex-col gap-6">
    <header>
      <h1 class="text-2xl font-bold text-neutral-950 mb-1">Résultats</h1>
      <p class="text-sm text-neutral-600">Consultation de vos notes et relevés.</p>
    </header>
    <div class="bg-white rounded-lg border border-subtle p-10 text-center">
      <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-50 mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="text-brand-900">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      <h2 class="text-base font-semibold text-neutral-950">Résultats disponibles sur Moodle</h2>
      <p class="text-sm text-neutral-600 mt-2 max-w-md mx-auto">
        Vos relevés de notes et résultats d'examens sont publiés sur la plateforme Moodle.
        Cliquez ci-dessous pour y accéder directement.
      </p>
      <a
        href="/moodle-launch"
        class="inline-flex items-center gap-2 mt-5 text-xs font-semibold text-white bg-brand-900 hover:bg-brand-700 px-5 py-2.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-brand-500/25 min-h-[44px]"
      >
        Ouvrir Moodle
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M3 9L9 3M9 3H4M9 3v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        </svg>
      </a>
    </div>
  </div>
</template>
