<script setup>
// GuestWelcome — page d'accueil pour utilisateurs non connectés
// Affichée par AppShell quand useProfileStore.isGuest = true
function handleLogin() {
  window.location.href = '/login?redirect-to=/mela';
}
</script>

<template>
  <div class="max-w-md mx-auto py-12 px-4 text-center">
    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-50 mb-6">
      <span class="text-3xl font-bold tracking-tight text-brand-900">
        m<span class="text-accent-500">.</span>
      </span>
    </div>
    <h1 class="text-2xl font-bold text-neutral-950 mb-2">Bienvenue sur mela.</h1>
    <p class="text-sm text-neutral-600 mb-8">
      Votre espace personnalisé au sein de l'université LaNEM — planning, notifications,
      évaluations et services internes.
    </p>
    <button
      type="button"
      class="inline-flex items-center gap-2 text-sm font-semibold text-white bg-brand-900 hover:bg-brand-700 px-6 py-3 rounded-sm focus:outline-none focus:ring-2 focus:ring-brand-500/25 min-h-[44px]"
      @click="handleLogin"
    >
      Se connecter
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
    <p class="text-xs text-neutral-400 mt-6">
      Vous serez redirigé vers la page de connexion Frappe.
    </p>
  </div>
</template>
