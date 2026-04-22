<script setup>
// BottomNav — navigation inférieure mobile (< 768px)
// P6-Ph2 : Design institutionnel (fond blanc, icône active ln-blue-800)
// Réf : DESIGN_SYSTEM_LaNEM_Institutionnel_v1.md §4, U06-PWA-Mobile.md
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useProfileStore } from '@/stores/profile';

const route = useRoute();
const profile = useProfileStore();

const allNavItems = [
  { to: '/', label: 'Accueil', icon: 'home', profiles: ['student', 'instructor', 'director', 'candidate', 'generic', 'employee'] },
  { to: '/planning', label: 'Planning', icon: 'calendar', profiles: ['student', 'instructor'] },
  { to: '/results', label: 'Résultats', icon: 'chart', profiles: ['student'] },
  { to: '/support', label: 'Aide', icon: 'help-circle', profiles: ['student', 'instructor', 'director', 'candidate', 'generic', 'employee'] },
  { to: '/notifications', label: 'Notifs', icon: 'bell', profiles: ['student', 'instructor', 'director', 'candidate', 'generic', 'employee'] },
];

const visibleItems = computed(() => {
  const current = profile.profile || 'generic';
  return allNavItems.filter((item) => item.profiles.includes(current)).slice(0, 5);
});

function isActive(item) {
  if (item.to === '/') {
    return route.path === '/';
  }
  return route.path.startsWith(item.to);
}
</script>

<template>
  <nav
    class="fixed bottom-0 inset-x-0 bg-white border-t border-ln-gray-200 flex items-center justify-around px-2 pt-2 z-50"
    style="padding-bottom: max(8px, env(safe-area-inset-bottom));"
    aria-label="Navigation mobile"
  >
    <router-link
      v-for="item in visibleItems"
      :key="item.to"
      :to="item.to"
      class="flex flex-col items-center gap-1 px-2 py-1 min-w-[44px] min-h-[44px] text-[11px] font-medium rounded-md-ln transition-colors focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
      :class="[
        isActive(item)
          ? 'text-ln-blue-800'
          : 'text-ln-gray-400 hover:text-ln-gray-600 hover:bg-ln-gray-50'
      ]"
    >
      <NavIcon :name="item.icon" class="w-5 h-5" />
      <span>{{ item.label }}</span>
    </router-link>
  </nav>
</template>
