<script setup>
// SideNav — navigation latérale desktop (≥ 768px) filtrée par profil
// Réf visuelle : specs-interfaces/mela_student_cockpit_desktop_1280.html §SideNav
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useProfileStore } from '@/stores/profile';

const auth = useAuthStore();
const profile = useProfileStore();

const allNavItems = [
  { to: '/', label: 'Accueil', icon: 'home', profiles: ['student', 'instructor', 'director', 'candidate', 'generic'] },
  { to: '/planning', label: 'Planning', icon: 'calendar', profiles: ['student', 'instructor'] },
  { to: '/results', label: 'Résultats', icon: 'chart', profiles: ['student'] },
  { to: '/evals', label: 'Évaluations', icon: 'star', profiles: ['student'] },
  { to: '/insights', label: 'Pilotage', icon: 'bar-chart', profiles: ['director'] },
  { to: '/support', label: 'Support', icon: 'help', profiles: ['student', 'instructor', 'director', 'candidate', 'generic'] },
  { to: '/notifications', label: 'Notifications', icon: 'bell', profiles: ['student', 'instructor', 'director', 'candidate', 'generic'] },
];

const visibleItems = computed(() => {
  const current = profile.profile || 'generic';
  return allNavItems.filter((item) => item.profiles.includes(current));
});
</script>

<template>
  <aside class="w-[220px] bg-white border-r border-subtle flex flex-col flex-shrink-0 h-screen sticky top-0">
    <div class="px-6 pt-6 pb-8">
      <span class="text-2xl font-bold tracking-tight text-brand-900">
        mela<span class="text-accent-500">.</span>
      </span>
    </div>

    <nav class="px-3 flex-1" aria-label="Navigation principale">
      <router-link
        v-for="item in visibleItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-2.5 px-3 py-2.5 rounded-md mb-1 text-sm text-neutral-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/25 min-h-[44px]"
        active-class="bg-brand-50 text-brand-900 font-semibold"
        exact-active-class="bg-brand-50 text-brand-900 font-semibold"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="flex-shrink-0">
          <path v-if="item.icon === 'home'" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
          <g v-else-if="item.icon === 'calendar'">
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.5" />
            <path d="M3 10h18M8 4v-2M16 4v-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
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
        <span>{{ item.label }}</span>
      </router-link>
    </nav>

    <div class="px-4 py-4 border-t border-subtle flex items-center gap-2.5">
      <div
        class="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-xs font-semibold text-brand-900 flex-shrink-0"
        :aria-label="auth.displayName"
      >
        {{ auth.initials }}
      </div>
      <div class="min-w-0">
        <div class="text-xs font-medium text-neutral-950 truncate">{{ auth.displayName }}</div>
        <div class="text-[11px] text-neutral-400 truncate">{{ profile.profileLabel }}</div>
      </div>
    </div>
  </aside>
</template>
