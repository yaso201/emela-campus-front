<script setup>
// BottomNav — navigation inférieure mobile (< 768px)
// P6-Ph2 : Design institutionnel (fond blanc, icône active ln-blue-800)
// Réf : DESIGN_SYSTEM_LaNEM_Institutionnel_v1.md §4, U06-PWA-Mobile.md
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useProfileStore } from '@/stores/profile';
import { BOTTOM_NAV_ITEMS, BOTTOM_NAV_MAX, navItemsFor } from './navItems.js';

const route = useRoute();
const profile = useProfileStore();

// P8 (MANDAT-14) : les entrées et leurs droits viennent de `navItems.js`, qui suit la garde du routeur.
const visibleItems = computed(() => navItemsFor(BOTTOM_NAV_ITEMS, profile.profile || 'generic')
  .slice(0, BOTTOM_NAV_MAX));

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
          : 'text-ln-gray-500 hover:text-ln-gray-600 hover:bg-ln-gray-50'
      ]"
    >
      <NavIcon :name="item.icon" class="w-5 h-5" />
      <span>{{ item.label }}</span>
    </router-link>
  </nav>
</template>
