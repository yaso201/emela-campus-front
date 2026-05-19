<script setup>
// AppShell — Shell privé authentifié (DEC-151, ADR-001)
// Ce shell ne gère QUE des utilisateurs connectés.
// Un guest ne doit jamais atteindre ce composant : la garde serveur (app_emela.py)
// redirige les guests vers /emela/login avant tout chargement JS.
// Si malgré tout un guest atteint la SPA (session expirée entre le rendu serveur
// et le bootstrap JS), onMounted redirige vers /emela/login.
//
// Layout responsive :
//   Desktop (>= 768px) : SideNav 240px fixe + main content
//   Mobile  (< 768px)  : TopBar avec hamburger + router-view + BottomNav
//
// UI PWA désactivée (DEC-128) — VitePWA est retiré et l'ancien SW Workbox
// est neutralisé par le killswitch L11 côté build.

import { computed, onMounted, ref } from 'vue';
import { useProfileStore } from '@/stores/profile';
import { useAuth } from '@/composables/useAuth';
import { useSessionTimeout } from '@/composables/useSessionTimeout';
import TopBar from './TopBar.vue';
import SideNav from './SideNav.vue';
import BottomNav from './BottomNav.vue';
import SessionExpiredModal from '@/components/ui/SessionExpiredModal.vue';
import SessionTimeoutWarning from '@/components/ui/SessionTimeoutWarning.vue';
import OnboardingModal from '@/components/ui/OnboardingModal.vue';

const profile = useProfileStore();
const { isSessionExpired, setupSessionInterceptor, reconnect } = useAuth();
const { showWarning, remainingMinutes, extendSession, dismissWarning } = useSessionTimeout();

const sideNavOpen = ref(false);
const showOnboarding = ref(false);

// Shell privé : 2 états seulement (bootstrap, authenticated)
// Pas de branche guest — élimine structurellement le crash nextSibling null
const shellState = computed(() => {
  if (profile.status === 'loaded') return 'authenticated';
  return 'bootstrap';
});

onMounted(async () => {
  await profile.fetchProfile();

  // Garde JS de secours : si la session a expiré entre le rendu serveur
  // et le bootstrap JS, le profil résolu est "guest". Rediriger vers login.
  if (profile.isGuest || profile.status === 'guest') {
    const requestedUrl =
      window.location.pathname + window.location.search + window.location.hash;
    window.location.href = '/emela/login?redirect-to=' + encodeURIComponent(requestedUrl);
    return;
  }

  setupSessionInterceptor();
  await checkOnboarding();
});

async function checkOnboarding() {
  try {
    const response = await fetch('/api/method/frappe.client.get_value', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Frappe-CSRF-Token': window.csrf_token || '',
      },
      body: JSON.stringify({
        doctype: 'User',
        filters: { name: window.user },
        fieldname: 'custom_onboarding_done',
      }),
      credentials: 'same-origin',
    });

    if (response.ok) {
      const json = await response.json();
      const done = json.message?.custom_onboarding_done;
      if (!done) {
        showOnboarding.value = true;
      }
    }
  } catch (e) {
    console.warn('[AppShell] Failed to check onboarding:', e);
  }
}

function toggleSideNav() {
  sideNavOpen.value = !sideNavOpen.value;
}

function closeSideNav() {
  sideNavOpen.value = false;
}
</script>

<template>
  <div>
  <!-- Skip-link pour accessibilité clavier -->
  <a
    href="#main-content"
    class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:bg-white focus:text-ln-blue-900 focus:px-4 focus:py-2 focus:rounded-md focus:shadow-md focus:ring-2 focus:ring-ln-blue-500/25"
  >
    Aller au contenu
  </a>

  <!-- Bootstrap : chargement initial du profil -->
  <div
    v-if="shellState === 'bootstrap'"
    class="min-h-screen bg-white flex items-center justify-center px-6"
  >
    <div
      class="w-full max-w-sm rounded-2xl border border-ln-gray-200 bg-white px-8 py-10 text-center shadow-sm"
      aria-live="polite"
    >
      <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ln-blue-50 text-ln-blue-900">
        <span class="text-xl font-semibold">e.</span>
      </div>
      <p class="mt-5 text-xs font-semibold uppercase tracking-[0.28em] text-ln-gray-500">
        emela
      </p>
      <h1 class="mt-3 text-lg font-semibold text-ln-gray-900">
        Chargement de votre espace...
      </h1>
      <p class="mt-2 text-sm text-ln-gray-600">
        Initialisation s&eacute;curis&eacute;e de votre session LaNEM.
      </p>
      <div class="mt-6 h-1.5 overflow-hidden rounded-full bg-ln-gray-100">
        <div class="h-full w-2/5 rounded-full bg-ln-blue-800/70 animate-pulse" />
      </div>
    </div>
  </div>

  <!-- Layout authentifié -->
  <div v-else class="min-h-screen bg-white">
    <!-- SideNav mobile overlay -->
    <SideNav
      v-model="sideNavOpen"
      mobile-overlay
      @close="closeSideNav"
    />

    <!-- Desktop layout -->
    <div class="hidden md:flex min-h-screen">
      <SideNav />
      <main id="main-content" class="flex-1 min-w-0 flex flex-col">
        <TopBar />
        <div class="flex-1 px-8 lg:px-10 py-6 pb-16 overflow-y-auto">
          <div class="max-w-[1280px] mx-auto">
            <router-view v-slot="{ Component }">
              <component :is="Component" />
            </router-view>
          </div>
        </div>
      </main>
    </div>

    <!-- Mobile layout -->
    <div class="md:hidden flex flex-col min-h-screen">
      <TopBar mobile show-menu-button @toggle-side-nav="toggleSideNav" />
      <main id="main-content" class="flex-1 px-4 py-5 pb-24 overflow-y-auto">
        <router-view v-slot="{ Component }">
          <component :is="Component" />
        </router-view>
      </main>
      <BottomNav />
    </div>
  </div>

  <!-- Modal session expirée -->
  <SessionExpiredModal
    :is-open="isSessionExpired"
    @reconnect="reconnect"
  />

  <!-- Session timeout warning -->
  <SessionTimeoutWarning
    :show="showWarning"
    :remaining="remainingMinutes"
    @extend="extendSession"
    @dismiss="dismissWarning"
  />

  <!-- Onboarding (première connexion) -->
  <OnboardingModal
    :is-open="showOnboarding"
    @close="showOnboarding = false"
  />
  </div>
</template>
