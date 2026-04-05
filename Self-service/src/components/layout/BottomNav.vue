<script setup>
// BottomNav — navigation inférieure mobile (< 768px) filtrée par profil
// Réf visuelle : specs-interfaces/mela_student_cockpit_mobile.html §BottomNav
import { computed } from 'vue';
import { useProfileStore } from '@/stores/profile';

const profile = useProfileStore();

const allNavItems = [
  { to: '/', label: 'Accueil', icon: 'home', profiles: ['student', 'instructor', 'director', 'candidate', 'generic'] },
  { to: '/planning', label: 'Planning', icon: 'calendar', profiles: ['student', 'instructor'] },
  { to: '/results', label: 'Résultats', icon: 'chart', profiles: ['student'] },
  { to: '/evals', label: 'Évals', icon: 'star', profiles: ['student'] },
  { to: '/insights', label: 'Pilotage', icon: 'bar-chart', profiles: ['director'] },
  { to: '/support', label: 'Aide', icon: 'help', profiles: ['student', 'instructor', 'director', 'candidate', 'generic'] },
  { to: '/notifications', label: 'Notifs', icon: 'bell', profiles: ['student', 'instructor', 'director', 'candidate', 'generic'] },
];

const visibleItems = computed(() => {
  const current = profile.profile || 'generic';
  return allNavItems.filter((item) => item.profiles.includes(current));
});
</script>

<template>
  <nav
    class="fixed bottom-0 inset-x-0 bg-white border-t border-subtle flex items-center justify-around px-2 pb-2 pt-1.5 z-sticky"
    aria-label="Navigation mobile"
  >
    <router-link
      v-for="item in visibleItems"
      :key="item.to"
      :to="item.to"
      class="flex flex-col items-center gap-1 px-2 py-1 min-w-[44px] min-h-[44px] text-[10px] text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/25 rounded-sm"
      active-class="text-brand-900"
      exact-active-class="text-brand-900"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path v-if="item.icon === 'home'" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
        <g v-else-if="item.icon === 'calendar'">
          <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.5" />
          <path d="M3 10h18" stroke="currentColor" stroke-width="1.5" />
        </g>
        <path v-else-if="item.icon === 'chart'" d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path v-else-if="item.icon === 'star'" d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
        <g v-else-if="item.icon === 'bar-chart'">
          <path d="M3 3v18h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          <rect x="7" y="12" width="3" height="6" stroke="currentColor" stroke-width="1.5" />
          <rect x="12" y="8" width="3" height="10" stroke="currentColor" stroke-width="1.5" />
          <rect x="17" y="5" width="3" height="13" stroke="currentColor" stroke-width="1.5" />
        </g>
        <path v-else-if="item.icon === 'bell'" d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <g v-else-if="item.icon === 'help'">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5" />
          <path d="M9.5 9a2.5 2.5 0 115 0c0 1-.5 1.5-1.5 2s-1 1-1 2M12 17h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </g>
      </svg>
      <span class="font-medium">{{ item.label }}</span>
    </router-link>
  </nav>
</template>
