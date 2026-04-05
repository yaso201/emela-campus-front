<script setup>
// InsightsPage — page de pilotage direction (Phase 7)
// Lit les 56 KPIs de university_finance via frappe.client.get_list (RBAC auto).
// Filtrage par catégorie + groupement visuel par domaine.
// Accessible uniquement aux profils 'director' via le routing (meta.requiresProfile).
import { ref, computed, onMounted } from 'vue';
import { useProfileStore } from '@/stores/profile';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import BlockError from '@/components/ui/BlockError.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import KpiDomainSection from '@/components/insights/KpiDomainSection.vue';

const profile = useProfileStore();

const CATEGORIES = [
  'Admissions',
  'Effectifs',
  'Résultats',
  'Plannings',
  'Qualité pédagogique',
  'Assiduité',
  'Finances',
  'Paie',
  'RH',
];

const selectedCategory = ref('all'); // 'all' | un des 9

const loading = ref(true);
const error = ref(null);
const kpis = ref([]);

async function fetchKpis() {
  loading.value = true;
  error.value = null;
  try {
    const response = await fetch(
      '/api/method/portal_app.api.insights.get_director_kpis',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Frappe-CSRF-Token': window.csrf_token || '',
          'Accept': 'application/json',
        },
        credentials: 'same-origin',
      },
    );

    if (!response.ok) {
      const err = new Error(`HTTP ${response.status}`);
      err.status = response.status;
      throw err;
    }

    const json = await response.json();
    const data = json.message || json;
    if (data.status === 'error') {
      throw new Error(data.message || 'Indicateurs indisponibles');
    }
    kpis.value = data.kpis || [];
  } catch (err) {
    error.value = err;
  } finally {
    loading.value = false;
  }
}

onMounted(fetchKpis);

// Filtrage + groupement
const filteredKpis = computed(() => {
  if (selectedCategory.value === 'all') return kpis.value;
  return kpis.value.filter((k) => k.category === selectedCategory.value);
});

const kpisByCategory = computed(() => {
  const map = new Map();
  for (const cat of CATEGORIES) map.set(cat, []);
  for (const kpi of filteredKpis.value) {
    if (map.has(kpi.category)) {
      map.get(kpi.category).push(kpi);
    }
  }
  return [...map.entries()]
    .filter(([, arr]) => arr.length > 0)
    .map(([category, items]) => ({ category, kpis: items }));
});

// Stats global
const totalKpis = computed(() => kpis.value.length);
const availableKpis = computed(() => {
  return kpis.value.filter((k) => {
    const details = k.last_value_json && typeof k.last_value_json === 'string'
      ? safeParse(k.last_value_json)
      : k.last_value_json || {};
    const note = details?.note || '';
    return !note.startsWith('resolver_error') && !note.includes('_unavailable');
  }).length;
});

function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return {};
  }
}

// Only directors can see this page in practice
const isAuthorized = computed(() => profile.profile === 'director');
</script>

<template>
  <div class="flex flex-col gap-6">
    <header>
      <h1 class="text-2xl font-bold text-neutral-950 mb-1">Pilotage</h1>
      <p class="text-sm text-neutral-600">
        Indicateurs clés de la plateforme LaNEM. Chaque source est interrogée indépendamment
        pour ne pas bloquer la consultation.
      </p>
    </header>

    <!-- Garde-fou profil -->
    <div
      v-if="!profile.isLoading && !isAuthorized"
      class="bg-white rounded-lg border border-subtle p-6 text-sm text-neutral-500"
    >
      Cette page est réservée aux profils Direction.
    </div>

    <template v-else>
      <!-- Barre de stats + filtres -->
      <div class="bg-white rounded-lg border border-subtle p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold text-neutral-950 tabular-nums">
            {{ availableKpis }}
          </span>
          <span class="text-sm text-neutral-500">/ {{ totalKpis }} indicateurs disponibles</span>
          <StatusBadge
            v-if="!loading && totalKpis > 0"
            :variant="availableKpis / Math.max(1, totalKpis) > 0.7 ? 'success' : availableKpis / Math.max(1, totalKpis) > 0.3 ? 'warning' : 'error'"
            :label="`${Math.round((availableKpis / Math.max(1, totalKpis)) * 100)}%`"
            :dot="false"
          />
        </div>

        <!-- Filtre catégorie -->
        <div class="flex flex-wrap gap-1">
          <button
            type="button"
            class="px-2.5 py-1 text-xs font-medium rounded-sm focus:outline-none focus:ring-2 focus:ring-brand-500/25 min-h-[32px]"
            :class="selectedCategory === 'all'
              ? 'bg-brand-900 text-white'
              : 'bg-white text-neutral-600 border border-default hover:bg-neutral-100'"
            @click="selectedCategory = 'all'"
          >
            Tous
          </button>
          <button
            v-for="cat in CATEGORIES"
            :key="cat"
            type="button"
            class="px-2.5 py-1 text-xs font-medium rounded-sm focus:outline-none focus:ring-2 focus:ring-brand-500/25 min-h-[32px]"
            :class="selectedCategory === cat
              ? 'bg-brand-900 text-white'
              : 'bg-white text-neutral-600 border border-default hover:bg-neutral-100'"
            @click="selectedCategory = cat"
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex flex-col gap-6">
        <BlockSkeleton :lines="5" />
        <BlockSkeleton :lines="5" />
      </div>

      <!-- Error -->
      <BlockError
        v-else-if="error"
        title="Indicateurs indisponibles"
        :message="error.message || 'Erreur réseau'"
        :retry="fetchKpis"
      />

      <!-- Empty -->
      <div
        v-else-if="kpisByCategory.length === 0"
        class="bg-white rounded-lg border border-subtle p-6 text-sm text-neutral-500 text-center"
      >
        Aucun indicateur disponible pour ce filtre.
      </div>

      <!-- Data — groupé par catégorie -->
      <div v-else class="flex flex-col gap-8">
        <KpiDomainSection
          v-for="group in kpisByCategory"
          :key="group.category"
          :category="group.category"
          :kpis="group.kpis"
        />
      </div>
    </template>
  </div>
</template>
