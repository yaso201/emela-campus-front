<script setup>
// AccountPage — Mon profil utilisateur
// UX-PROFIL — Phase 3
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useProfileStore } from '@/stores/profile';
import { useAuth } from '@/composables/useAuth';
import Card from '@/components/ui/Card.vue';
import {
  Lock,
  Settings,
  LogOut,
  ChevronRight,
  ExternalLink
} from 'lucide-vue-next';

const auth = useAuthStore();
const profile = useProfileStore();
const { logout } = useAuth();

const initials = computed(() => auth.initials);
const displayName = computed(() => auth.displayName);
const email = computed(() => auth.user);
const profileTypeLabel = computed(() => profile.profileLabel);

// Données à enrichir via API ultérieurement
const fullName = computed(() => auth.displayName);
const matricule = computed(() => null); // À récupérer via API

const linkedAccounts = computed(() => {
  const accounts = [];
  // Moodle
  accounts.push({
    type: 'moodle',
    label: 'Moodle (Cours en ligne)',
    id: email.value,
  });
  return accounts;
});
</script>

<template>
  <div class="max-w-2xl mx-auto py-6 px-4 space-y-6">
    <!-- Header -->
    <header class="flex items-center gap-4">
      <div class="w-16 h-16 rounded-full bg-ln-blue-100 flex items-center justify-center flex-shrink-0">
        <span class="text-2xl font-semibold text-ln-blue-800">{{ initials }}</span>
      </div>
      <div>
        <h1 class="text-xl font-bold text-ln-gray-900">{{ displayName }}</h1>
        <p class="text-sm text-ln-gray-500">{{ profileTypeLabel }}</p>
      </div>
    </header>

    <!-- Section Identité -->
    <Card title="Identité" padding="md">
      <div class="space-y-3">
        <div class="flex justify-between items-center py-2 border-b border-ln-gray-100">
          <span class="text-sm text-ln-gray-500">Nom complet</span>
          <span class="text-sm font-medium text-ln-gray-900">{{ fullName }}</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-ln-gray-100">
          <span class="text-sm text-ln-gray-500">Email</span>
          <span class="text-sm font-medium text-ln-gray-900">{{ email }}</span>
        </div>
        <div v-if="matricule" class="flex justify-between items-center py-2">
          <span class="text-sm text-ln-gray-500">Matricule</span>
          <span class="text-sm font-medium text-ln-gray-900">{{ matricule }}</span>
        </div>
      </div>
    </Card>

    <!-- Section Comptes liés -->
    <Card v-if="linkedAccounts.length" title="Comptes liés" padding="md">
      <div class="space-y-2">
        <div
          v-for="account in linkedAccounts"
          :key="account.type"
          class="flex items-center justify-between p-3 bg-ln-gray-50 rounded-lg"
        >
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-md bg-ln-blue-100 flex items-center justify-center">
              <ExternalLink class="w-4 h-4 text-ln-blue-800" />
            </div>
            <div>
              <span class="text-sm font-medium text-ln-gray-900 block">{{ account.label }}</span>
              <span class="text-xs text-ln-gray-500">{{ account.id }}</span>
            </div>
          </div>
          <span class="text-xs text-ln-gray-400 bg-white px-2 py-1 rounded border border-ln-gray-200">
            Externe
          </span>
        </div>
      </div>
    </Card>

    <!-- Actions -->
    <section class="space-y-3">
      <router-link
        to="/account/password"
        class="flex items-center justify-between p-4 bg-white border border-ln-gray-200 rounded-lg hover:border-ln-gray-300 hover:bg-ln-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px]"
      >
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-md bg-ln-blue-50 flex items-center justify-center">
            <Lock class="w-5 h-5 text-ln-blue-800" />
          </div>
          <span class="text-sm font-medium text-ln-gray-900">Modifier mon mot de passe</span>
        </div>
        <ChevronRight class="w-5 h-5 text-ln-gray-400" />
      </router-link>

      <router-link
        to="/account/preferences"
        class="flex items-center justify-between p-4 bg-white border border-ln-gray-200 rounded-lg hover:border-ln-gray-300 hover:bg-ln-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px]"
      >
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-md bg-ln-blue-50 flex items-center justify-center">
            <Settings class="w-5 h-5 text-ln-blue-800" />
          </div>
          <span class="text-sm font-medium text-ln-gray-900">Préférences</span>
        </div>
        <ChevronRight class="w-5 h-5 text-ln-gray-400" />
      </router-link>

      <button
        @click="logout"
        class="w-full flex items-center justify-center gap-2 p-4 rounded-lg min-h-[44px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1"
        style="background-color: #FEF2F2; color: #B91C1C;"
      >
        <LogOut class="w-5 h-5" />
        Se déconnecter
      </button>
    </section>
  </div>
</template>
