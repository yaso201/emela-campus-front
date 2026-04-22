<script setup>
// RecentRequestsBlock — Dernières demandes administratives (profil salarié)
// Spec : U07 §4.16, D05 §10, U05 §2.2
// DEC : DEC-119 (quota), DEC-127 (composable custom fetch), DEC-134 (lazy),
//       DEC-139 (pas de congés), DEC-140 (RecentRequestsBlock, pas SupportBlock)
//
// P4-FRONT-001 : migré vers portal_app.api.cockpit.get_recent_support_requests
// La réponse contient : { requests: [{id, subject, service, status, updated}], total_open }

import { computed, onMounted, ref } from 'vue';
import { MessageCircle, ChevronRight } from 'lucide-vue-next';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import BlockError from '@/components/ui/BlockError.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';

// État réactif
const requests = ref([]);
const totalOpen = ref(0);
const isLoading = ref(true);
const error = ref(null);

// 3 dernières demandes (le backend renvoie déjà max 3)
const recentRequests = computed(() => requests.value.slice(0, 3));
const hasRequests = computed(() => recentRequests.value.length > 0);

// Mapping statuts backend (FR) → badge UI
const STATUS_MAP = {
  'Nouveau': { status: 'pending', label: 'Nouveau' },
  'En cours': { status: 'in-review', label: 'En cours' },
  'Répondu': { status: 'validated', label: 'Répondu' },
  'Transféré': { status: 'in-review', label: 'Transféré' },
  'Clos': { status: 'closed', label: 'Clos' },
  'Annulé': { status: 'withdrawn', label: 'Annulé' },
};

function mapRequestStatus(frappeStatus) {
  return STATUS_MAP[frappeStatus] || { status: frappeStatus || 'pending', label: frappeStatus || 'Inconnu' };
}

async function loadRecentRequests() {
  isLoading.value = true;
  error.value = null;

  try {
    const response = await fetch(
      '/api/method/portal_app.api.cockpit.get_recent_support_requests',
      {
        method: 'GET',
        headers: {
          'X-Frappe-CSRF-Token': window.csrf_token || '',
          'Accept': 'application/json',
        },
        credentials: 'same-origin',
      }
    );

    if (!response.ok) {
      const text = await response.text();
      let message = `HTTP ${response.status}`;
      try {
        const json = JSON.parse(text);
        message = json._server_messages || json.exc || json.message || message;
      } catch {
        // keep HTTP status
      }
      throw new Error(message);
    }

    const json = await response.json();
    const data = json.message || json;

    requests.value = Array.isArray(data?.requests) ? data.requests : [];
    totalOpen.value = Number.isFinite(data?.total_open) ? data.total_open : 0;
  } catch (e) {
    error.value = e?.message || String(e);
    requests.value = [];
    totalOpen.value = 0;
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadRecentRequests();
});
</script>

<template>
  <section class="flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-semibold text-ln-gray-900">
        Mes demandes récentes
      </h2>
      <span v-if="totalOpen > 0" class="text-xs text-ln-gray-500">
        {{ totalOpen }} en cours
      </span>
    </div>

    <BlockSkeleton v-if="isLoading && !requests.length" :lines="3" :show-title="false" />

    <BlockError
      v-else-if="error && !requests.length"
      title="Demandes indisponibles"
      :message="error"
      :retry="loadRecentRequests"
    />

    <!-- État vide -->
    <div
      v-else-if="!hasRequests"
      class="bg-white rounded-lg border border-ln-gray-200 p-6 text-center"
    >
      <MessageCircle class="w-8 h-8 text-ln-gray-300 mx-auto mb-3" aria-hidden="true" />
      <p class="text-sm font-medium text-ln-gray-500">Aucune demande en cours</p>
      <p class="text-xs text-ln-gray-400 mt-1">Vos demandes apparaîtront ici</p>
    </div>

    <!-- Liste des demandes -->
    <div v-else class="bg-white rounded-lg border border-ln-gray-200 p-3">
      <div class="flex flex-col gap-1">
        <router-link
          v-for="req in recentRequests"
          :key="req.id"
          :to="`/support/${req.id}`"
          class="flex items-center justify-between py-2.5 px-2 hover:bg-ln-gray-50 rounded-md transition-colors min-h-[44px] no-underline"
        >
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-ln-gray-900 truncate">{{ req.subject }}</p>
            <p class="text-xs text-ln-gray-500 truncate">{{ req.service }}</p>
          </div>
          <StatusBadge
            :status="mapRequestStatus(req.status).status"
            :label="mapRequestStatus(req.status).label"
            size="sm"
          />
        </router-link>
      </div>

      <!-- Lien voir tout -->
      <router-link
        to="/support"
        class="flex items-center justify-center gap-1 mt-2 pt-2 border-t border-ln-gray-100 text-xs font-medium text-ln-blue-900 hover:text-ln-blue-700 transition-colors min-h-[44px] no-underline"
      >
        Voir tout
        <ChevronRight class="w-3.5 h-3.5" aria-hidden="true" />
      </router-link>
    </div>
  </section>
</template>
