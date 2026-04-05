<script setup>
// ServicesBlock — Liste de services hardcodés (Planning, Moodle, Évals, Résultats)
// Pas de backend API dédiée ; sera enrichi en Phase 3 quand le routing sera en place.
import ServiceTile from '@/components/ui/ServiceTile.vue';

const services = [
  { title: 'Planning', url: '/planning', icon: 'calendar', external: false },
  { title: 'Moodle', url: '/moodle-launch', icon: 'book', external: true },
  { title: 'Évaluations', url: '/evals', icon: 'star', external: false },
  { title: 'Résultats', url: '/results', icon: 'chart', disabled: true },
  { title: 'Support', url: '/support', icon: 'help', external: false },
];
</script>

<template>
  <section class="flex flex-col gap-3">
    <h2 class="text-[11px] font-semibold text-neutral-600 tracking-wider uppercase">
      Mes services
    </h2>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <ServiceTile
        v-for="s in services"
        :key="s.title"
        :title="s.title"
        :url="s.url"
        :external="s.external"
        :disabled="s.disabled"
      >
        <template #icon>
          <svg v-if="s.icon === 'calendar'" width="18" height="18" viewBox="0 0 24 24" fill="none" :class="s.disabled ? 'text-neutral-400' : 'text-brand-900'">
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.5" />
            <path d="M3 10h18" stroke="currentColor" stroke-width="1.5" />
          </svg>
          <svg v-else-if="s.icon === 'book'" width="18" height="18" viewBox="0 0 24 24" fill="none" :class="s.disabled ? 'text-neutral-400' : 'text-brand-900'">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" stroke-width="1.5" />
          </svg>
          <svg v-else-if="s.icon === 'star'" width="18" height="18" viewBox="0 0 24 24" fill="none" :class="s.disabled ? 'text-neutral-400' : 'text-brand-900'">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
          </svg>
          <svg v-else-if="s.icon === 'help'" width="18" height="18" viewBox="0 0 24 24" fill="none" :class="s.disabled ? 'text-neutral-400' : 'text-brand-900'">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" />
            <path d="M9.5 9a2.5 2.5 0 115 0c0 1-.5 1.5-1.5 2s-1 1-1 2M12 17h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" :class="s.disabled ? 'text-neutral-400' : 'text-brand-900'">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </template>
      </ServiceTile>
    </div>
  </section>
</template>
