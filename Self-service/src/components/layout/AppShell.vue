<script setup>
// AppShell — layout principal responsive avec détection profil
// Desktop (≥ 768px) : SideNav 220px + main (TopBar + router-view)
// Mobile (< 768px)  : TopBar + router-view + BottomNav fixed
// Guest             : GuestWelcome en pleine page (aucune nav)
import { onMounted } from 'vue';
import { useProfileStore } from '@/stores/profile';
import TopBar from './TopBar.vue';
import SideNav from './SideNav.vue';
import BottomNav from './BottomNav.vue';
import GuestWelcome from './GuestWelcome.vue';

const profile = useProfileStore();

onMounted(() => {
  profile.fetchProfile();
});
</script>

<template>
  <div v-if="profile.isGuest" class="min-h-screen bg-neutral-50 flex items-center justify-center">
    <GuestWelcome />
  </div>

  <div v-else class="hidden md:flex min-h-screen bg-neutral-50">
    <SideNav />
    <main class="flex-1 min-w-0">
      <TopBar />
      <div class="px-10 pb-16 max-w-[1280px]">
        <router-view v-slot="{ Component }">
          <component :is="Component" />
        </router-view>
      </div>
    </main>
  </div>

  <div v-if="!profile.isGuest" class="md:hidden flex flex-col min-h-screen bg-neutral-50">
    <TopBar mobile />
    <main class="flex-1 px-4 py-5 pb-24">
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
    </main>
    <BottomNav />
  </div>
</template>
