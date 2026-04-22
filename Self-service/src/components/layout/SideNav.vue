<script setup>
// SideNav — navigation latérale desktop (≥ 768px) + overlay mobile
// P6-Ph2 : Design institutionnel LaNEM (fond blanc, item actif avec barre latérale)
// Réf : DESIGN_SYSTEM_LaNEM_Institutionnel_v1.md §4, P6 §6 Phase 2
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useProfileStore } from '@/stores/profile';
import { X, LogOut, ExternalLink, User } from 'lucide-vue-next';
import { useAuth } from '@/composables/useAuth';

const props = defineProps({
  /**
   * Mode overlay mobile (affiché par-dessus le contenu avec backdrop)
   */
  mobileOverlay: { type: Boolean, default: false },
  /**
   * Contrôle l'affichage en mode overlay
   */
  modelValue: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'close']);

const auth = useAuthStore();
const profile = useProfileStore();
const { logout } = useAuth();

const allNavItems = [
  { to: '/', label: 'Accueil', icon: 'home', profiles: ['student', 'instructor', 'director', 'candidate', 'generic', 'employee'] },
  { to: '/planning', label: 'Planning', icon: 'calendar', profiles: ['student', 'instructor'] },
  { to: '/results', label: 'Résultats', icon: 'chart', profiles: ['student'] },
  { to: '/evals', label: 'Évaluations', icon: 'star', profiles: ['student'] },
  { to: '/documents', label: 'Documents', icon: 'file-text', profiles: ['student'] },
  { to: '/internship', label: 'Stage', icon: 'briefcase', profiles: ['student'] },
  { to: '/insights', label: 'Pilotage', icon: 'bar-chart', profiles: ['director'] },
  { to: '/support', label: 'Support', icon: 'help-circle', profiles: ['student', 'instructor', 'director', 'candidate', 'generic', 'employee'] },
  { to: '/notifications', label: 'Notifications', icon: 'bell', profiles: ['student', 'instructor', 'director', 'candidate', 'generic', 'employee'] },
  { to: '/account', label: 'Mon compte', icon: 'user', profiles: ['student', 'instructor', 'director', 'candidate', 'generic', 'employee'] },
];

const visibleItems = computed(() => {
  const current = profile.profile || 'generic';
  return allNavItems.filter((item) => item.profiles.includes(current));
});

function close() {
  emit('update:modelValue', false);
  emit('close');
}
</script>

<template>
  <!-- Mode overlay mobile -->
  <template v-if="mobileOverlay">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        @click="close"
      />
    </Transition>
    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      enter-from-class="-translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-200 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="-translate-x-full"
    >
      <aside
        v-if="modelValue"
        class="fixed left-0 top-0 bottom-0 w-[240px] bg-white border-r border-ln-gray-200 flex flex-col z-50 shadow-elevated"
      >
        <!-- Header avec bouton fermeture -->
        <div class="flex items-center justify-between px-5 pt-5 pb-6">
          <router-link
            to="/"
            class="text-2xl font-bold tracking-tight text-ln-blue-900 hover:text-ln-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 rounded-sm"
            @click="close"
          >
            emela<span class="text-ln-blue-600">.</span>
          </router-link>
          <button
            type="button"
            class="p-2 rounded-md-ln text-ln-gray-500 hover:text-ln-gray-700 hover:bg-ln-gray-50 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px] min-w-[44px] flex items-center justify-center"
            @click="close"
            aria-label="Fermer le menu"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Navigation -->
        <nav class="px-3 flex-1 overflow-y-auto" aria-label="Navigation principale">
          <router-link
            v-for="item in visibleItems"
            :key="item.to"
            :to="item.to"
            class="group flex items-center gap-3 px-3 py-2.5 rounded-md-ln mb-1 text-sm text-ln-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px]"
            :class="[
              // Item actif : fond bleu clair + texte bleu + barre gauche
              $route.path === item.to || ($route.path === '/' && item.to === '/') 
                ? 'bg-ln-blue-50 text-ln-blue-800 font-semibold border-l-4 border-l-ln-blue-800 -ml-[1px] pl-[calc(0.75rem-3px)]' 
                : 'hover:bg-ln-gray-50 hover:text-ln-gray-900 border-l-4 border-l-transparent'
            ]"
            @click="close"
          >
            <NavIcon :name="item.icon" class="w-5 h-5 flex-shrink-0" />
            <span>{{ item.label }}</span>
          </router-link>
        </nav>

        <!-- Lien Espace gestion (conditionnel) -->
        <div v-if="profile.canAccessDesk" class="px-4 py-2">
          <a
            href="/app"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-3 px-3 py-2.5 rounded-md-ln text-sm text-ln-gray-600 hover:bg-ln-gray-50 hover:text-ln-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px]"
          >
            <ExternalLink class="w-5 h-5 flex-shrink-0" />
            <span>Espace gestion</span>
          </a>
        </div>

        <!-- User + Déconnexion -->
        <div class="px-4 py-4 border-t border-ln-gray-100">
          <div class="flex items-center gap-3 mb-3">
            <div
              class="w-9 h-9 rounded-full bg-ln-blue-50 flex items-center justify-center text-sm font-semibold text-ln-blue-800 flex-shrink-0"
              :aria-label="auth.displayName"
            >
              {{ auth.initials }}
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-sm font-medium text-ln-gray-900 truncate">{{ auth.displayName }}</div>
              <div class="text-xs text-ln-gray-500">{{ profile.profileLabel }}</div>
            </div>
          </div>
          <button
            type="button"
            class="flex items-center gap-2 w-full px-3 py-2 text-sm text-ln-gray-600 hover:text-ln-error hover:bg-[#FEF2F2] rounded-md-ln transition-colors focus:outline-none focus:ring-2 focus:ring-ln-error/25 min-h-[44px]"
            @click="logout"
          >
            <LogOut class="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>Se déconnecter</span>
          </button>
        </div>
      </aside>
    </Transition>
  </template>

  <!-- Mode desktop fixe -->
  <aside
    v-else
    class="hidden md:flex w-[240px] bg-white border-r border-ln-gray-200 flex-col flex-shrink-0 h-screen sticky top-0"
  >
    <!-- Logo -->
    <div class="px-5 pt-6 pb-8">
      <router-link
        to="/"
        class="text-2xl font-bold tracking-tight text-ln-blue-900 hover:text-ln-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 rounded-sm"
      >
        emela<span class="text-ln-blue-600">.</span>
      </router-link>
    </div>

    <!-- Navigation -->
    <nav class="px-3 flex-1" aria-label="Navigation principale">
      <router-link
        v-for="item in visibleItems"
        :key="item.to"
        :to="item.to"
        class="group flex items-center gap-3 px-3 py-2.5 rounded-md-ln mb-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px]"
        :class="[
          // Item actif : fond bleu clair + texte bleu + barre gauche
          $route.path === item.to || ($route.path.startsWith(item.to) && item.to !== '/') || (item.to === '/' && $route.path === '/')
            ? 'bg-ln-blue-50 text-ln-blue-800 font-semibold border-l-4 border-l-ln-blue-800 -ml-[1px] pl-[calc(0.75rem-3px)]' 
            : 'text-ln-gray-700 hover:bg-ln-gray-50 hover:text-ln-gray-900 border-l-4 border-l-transparent'
        ]"
      >
        <NavIcon :name="item.icon" class="w-5 h-5 flex-shrink-0" />
        <span>{{ item.label }}</span>
      </router-link>
    </nav>

    <!-- User + Déconnexion -->
    <div class="px-4 py-4 border-t border-ln-gray-100">
      <div class="flex items-center gap-3 mb-3">
        <div
          class="w-9 h-9 rounded-full bg-ln-blue-50 flex items-center justify-center text-sm font-semibold text-ln-blue-800 flex-shrink-0"
          :aria-label="auth.displayName"
        >
          {{ auth.initials }}
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-sm font-medium text-ln-gray-900 truncate">{{ auth.displayName }}</div>
          <div class="text-xs text-ln-gray-500">{{ profile.profileLabel }}</div>
        </div>
      </div>
      <button
        type="button"
        class="flex items-center gap-2 w-full px-3 py-2 text-sm text-ln-gray-600 hover:text-ln-error hover:bg-[#FEF2F2] rounded-md-ln transition-colors focus:outline-none focus:ring-2 focus:ring-ln-error/25 min-h-[44px]"
        @click="logout"
      >
        <LogOut class="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <span>Se déconnecter</span>
      </button>
    </div>
  </aside>
</template>
