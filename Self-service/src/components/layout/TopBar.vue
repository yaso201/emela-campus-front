<script setup>
// TopBar — barre supérieure responsive avec titre de page dynamique
// P6-Ph2 : Design institutionnel (bordure bottom, hamburger mobile)
// Réf : DESIGN_SYSTEM_LaNEM_Institutionnel_v1.md §4
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useProfileStore } from '@/stores/profile';
import { Menu, LogOut } from 'lucide-vue-next';
import { useAuth } from '@/composables/useAuth';

const props = defineProps({
  /**
   * Afficher le bouton menu hamburger (pour mobile)
   */
  showMenuButton: { type: Boolean, default: false },
  /**
   * Mode compact (mobile header)
   */
  mobile: { type: Boolean, default: false },
});

const emit = defineEmits(['toggleSideNav']);

const route = useRoute();
const auth = useAuthStore();
const profile = useProfileStore();
const { logout } = useAuth();

// Titre de page depuis la meta de la route
const pageTitle = computed(() => {
  return route.meta?.label || 'emela';
});

// Sous-titre avec date
const today = computed(() => {
  const d = new Date();
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
});

const greeting = computed(() => `Bonjour, ${auth.displayName}`);

const subtitle = computed(() => {
  if (profile.isLoading) return '…';
  const label = profile.profileLabel;
  return auth.isGuest ? label : `${label} · ${auth.user}`;
});

function toggleMenu() {
  emit('toggleSideNav');
}
</script>

<template>
  <!-- Mode mobile compact (header avec logo/hamburger) -->
  <header
    v-if="mobile"
    class="flex items-center justify-between px-4 py-3 bg-white border-b border-ln-gray-200 sticky top-0 z-30"
  >
    <div class="flex items-center gap-3">
      <button
        v-if="showMenuButton"
        type="button"
        class="p-2 -ml-2 rounded-md-ln text-ln-gray-600 hover:text-ln-gray-900 hover:bg-ln-gray-50 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px] min-w-[44px] flex items-center justify-center"
        @click="toggleMenu"
        aria-label="Ouvrir le menu"
      >
        <Menu class="w-5 h-5" />
      </button>
      <span class="text-xl font-bold tracking-tight text-ln-blue-900">
        emela<span class="text-ln-blue-600">.</span>
      </span>
    </div>
    <button
      type="button"
      @click="logout"
      class="p-2 rounded-md-ln text-ln-gray-500 hover:text-ln-error hover:bg-[#FEF2F2] focus:outline-none focus:ring-2 focus:ring-ln-error/25 min-h-[44px] min-w-[44px] flex items-center justify-center"
      aria-label="Se déconnecter"
    >
      <LogOut class="w-5 h-5" />
    </button>
  </header>

  <!-- Mode desktop (greeting + titre de page) -->
  <header
    v-else
    class="hidden md:flex items-center justify-between px-8 lg:px-10 pt-6 pb-5 bg-white border-b border-ln-gray-200"
  >
    <div>
      <h1 class="text-2xl font-bold text-ln-gray-900">{{ pageTitle }}</h1>
      <p class="text-sm text-ln-gray-500 mt-0.5 capitalize">{{ today }}</p>
    </div>
    <div class="flex items-center gap-3">
      <div class="text-right hidden lg:block">
        <div class="text-sm font-medium text-ln-gray-900">{{ auth.displayName }}</div>
        <div class="text-xs text-ln-gray-500">{{ profile.profileLabel }}</div>
      </div>
      <div
        class="w-10 h-10 rounded-full bg-ln-blue-50 flex items-center justify-center text-sm font-semibold text-ln-blue-800"
        :aria-label="auth.displayName"
      >
        {{ auth.initials }}
      </div>
      <button
        type="button"
        @click="logout"
        class="p-2 rounded-md-ln text-ln-gray-500 hover:text-ln-error hover:bg-[#FEF2F2] focus:outline-none focus:ring-2 focus:ring-ln-error/25 min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Se déconnecter"
      >
        <LogOut class="w-5 h-5" />
      </button>
    </div>
  </header>
</template>
