<script setup>
// CockpitPage — home page avec composition dynamique par profil
// Le profil vient de useProfileStore (fetché par AppShell au mount).
// Correction B-003 : ajout du profil employee avec blocs RH (DEC-132)
// Correction C-003 : lazy loading de tous les blocs cockpit (DEC-134)
// Correction C-005 : pull-to-refresh mobile
import { computed, defineAsyncComponent, ref, onMounted } from 'vue';
import { useProfileStore } from '@/stores/profile';
import { usePullToRefresh } from '@/composables/usePullToRefresh';
import { useMandatoryDocuments } from '@/composables/useMandatoryDocuments';

import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import MandatoryDocumentPage from '@/pages/MandatoryDocumentPage.vue';

// Blocs cockpit — lazy loading conformément à DEC-134 (C-003)
const AlertsBlock = defineAsyncComponent(() =>
  import('@/components/blocks/AlertsBlock.vue')
);
const PlanningBlock = defineAsyncComponent(() =>
  import('@/components/blocks/PlanningBlock.vue')
);
const NotificationsBlock = defineAsyncComponent(() =>
  import('@/components/blocks/NotificationsBlock.vue')
);
const TasksBlock = defineAsyncComponent(() =>
  import('@/components/blocks/TasksBlock.vue')
);
const MetricsBlock = defineAsyncComponent(() =>
  import('@/components/blocks/MetricsBlock.vue')
);
const ModulesBlock = defineAsyncComponent(() =>
  import('@/components/blocks/ModulesBlock.vue')
);
const StatusBlock = defineAsyncComponent(() =>
  import('@/components/blocks/StatusBlock.vue')
);
const ServicesBlock = defineAsyncComponent(() =>
  import('@/components/blocks/ServicesBlock.vue')
);
const FinancesBlock = defineAsyncComponent(() =>
  import('@/components/blocks/FinancesBlock.vue')
);
const AttendanceBlock = defineAsyncComponent(() =>
  import('@/components/blocks/AttendanceBlock.vue')
);

// Bloc contexte académique — V6 Flux 1
const AcademicContextBlock = defineAsyncComponent(() =>
  import('@/components/blocks/AcademicContextBlock.vue')
);

// Bloc examens — L5-E01 (DEC-124)
const ExamsBlock = defineAsyncComponent(() =>
  import('@/components/blocks/ExamsBlock.vue')
);

// Bloc stage étudiant — L6-E05 (DEC-134)
const InternshipBlock = defineAsyncComponent(() =>
  import('@/components/blocks/InternshipBlock.vue')
);

// Blocs employee — lazy loading conformément à DEC-134 (B-003)
const HrSelfServiceBlock = defineAsyncComponent(() =>
  import('@/components/blocks/HrSelfServiceBlock.vue')
);
const LeaveBlock = defineAsyncComponent(() =>
  import('@/components/blocks/LeaveBlock.vue')
);
const RecentRequestsBlock = defineAsyncComponent(() =>
  import('@/components/blocks/RecentRequestsBlock.vue')
);

const profile = useProfileStore();
const profileName = computed(() => profile.profile || 'generic');

// L5-E05a : Documents obligatoires — vérification priorité 1 (DEC-098)
const {
  isLoading: mdLoading,
  isBlocked,
  pendingDoc,
  error: mdError,
  checkPending,
} = useMandatoryDocuments();

// Vague 0.5: fail-close — checkFailed is reflected via isBlocked + mdError
const mdCheckFailed = computed(() => isBlocked.value && !pendingDoc.value);

onMounted(() => {
  checkPending(); // vérification silencieuse au chargement
});

// C-005 : Pull-to-refresh — clé réactive pour forcer le rechargement des blocs
const refreshKey = ref(0);

async function refreshAllBlocks() {
  // Incrémenter la clé force le re-mount de tous les blocs du profil actif
  // Chaque bloc re-fetch automatiquement via son composable (useFrappeCall/useCockpitBlock)
  refreshKey.value++;
}

const { isRefreshing, pullDistance, threshold } = usePullToRefresh(refreshAllBlocks);

// Propriété calculée pour l'indicateur visuel
const indicatorProgress = computed(() => {
  if (isRefreshing.value) return 100;
  return Math.min((pullDistance.value / threshold) * 100, 100);
});
</script>

<template>
  <!-- C-005 : Indicateur pull-to-refresh (mobile uniquement) -->
  <div
    v-if="pullDistance > 0 || isRefreshing"
    class="pull-to-refresh-indicator"
    :class="{ 'is-refreshing': isRefreshing }"
    :style="{ transform: `translateY(${Math.min(pullDistance, threshold)}px)` }"
  >
    <div class="pull-indicator-content">
      <svg
        v-if="!isRefreshing"
        class="pull-arrow"
        :class="{ 'pull-ready': pullDistance >= threshold }"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M12 5v14M5 12l7 7 7-7" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <svg
        v-else
        class="refresh-spinner"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke-linecap="round" />
      </svg>
      <span class="pull-text">
        {{ isRefreshing ? 'Actualisation...' : (pullDistance >= threshold ? 'Relâcher pour actualiser' : '↓ Tirer pour actualiser') }}
      </span>
    </div>
  </div>

  <!-- PRIORITÉ 1 : Document obligatoire (DEC-098) — affiché avant tout autre contenu -->
  <MandatoryDocumentPage
    v-if="!mdLoading && isBlocked && pendingDoc"
    :document="pendingDoc"
    @validated="checkPending"
  />

  <!-- Vague 0.5: fail-close — erreur API = portail bloqué avec message explicite -->
  <div v-else-if="!mdLoading && mdCheckFailed" class="min-h-screen bg-ln-gray-50 flex items-center justify-center px-4">
    <div class="bg-white rounded-lg border border-ln-gray-200 p-8 max-w-md w-full text-center space-y-4">
      <div class="w-12 h-12 mx-auto rounded-full bg-error-50 flex items-center justify-center">
        <svg class="w-6 h-6 text-ln-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 class="text-lg font-semibold text-ln-gray-900">Vérification impossible</h2>
      <p class="text-sm text-ln-gray-600">{{ mdError || 'Impossible de vérifier vos documents obligatoires. Réessayez ou contactez le support.' }}</p>
      <button
        type="button"
        class="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold bg-ln-blue-900 text-white hover:bg-ln-blue-700 transition-colors min-h-[48px]"
        @click="checkPending"
      >
        Réessayer
      </button>
    </div>
  </div>

  <!-- Chargement document obligatoire en cours — affiché pendant la vérification initiale -->
  <div v-else-if="mdLoading" class="flex flex-col gap-6">
    <BlockSkeleton :lines="3" />
    <BlockSkeleton :lines="4" />
    <BlockSkeleton :lines="3" />
  </div>

  <!-- Chargement profil en cours -->
  <div v-else-if="profile.isLoading" class="flex flex-col gap-6">
    <BlockSkeleton :lines="3" />
    <BlockSkeleton :lines="4" />
    <BlockSkeleton :lines="3" />
  </div>

  <!-- Cockpit normal — profil étudiant -->
  <div v-else-if="profileName === 'student'" :key="`student-${refreshKey}`" class="flex flex-col gap-8">
    <AcademicContextBlock />
    <AlertsBlock />
    <StatusBlock block-name="student_status" title="Mon statut" />
    <ExamsBlock />
    <PlanningBlock />
    <FinancesBlock />
    <InternshipBlock />
    <AttendanceBlock />
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <TasksBlock />
      <NotificationsBlock />
    </div>
    <ServicesBlock />
  </div>

  <div v-else-if="profileName === 'instructor'" :key="`instructor-${refreshKey}`" class="flex flex-col gap-8">
    <PlanningBlock />
    <ModulesBlock />
    <NotificationsBlock />
    <ServicesBlock />
  </div>

  <div v-else-if="profileName === 'director'" :key="`director-${refreshKey}`" class="flex flex-col gap-8">
    <MetricsBlock />
    <router-link
      to="/app-emela/insights"
      class="flex items-center justify-between bg-ln-blue-900 text-white rounded-lg p-5 hover:bg-ln-blue-700 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 transition-colors min-h-[44px]"
    >
      <div>
        <div class="text-sm font-semibold">Pilotage détaillé</div>
        <div class="text-xs opacity-80 mt-0.5">
          Consulter les 56 indicateurs clés par domaine
        </div>
      </div>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M5 12h14M13 6l6 6-6 6"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </router-link>
    <AlertsBlock />
    <NotificationsBlock />
  </div>

  <div v-else-if="profileName === 'candidate'" :key="`candidate-${refreshKey}`" class="flex flex-col gap-8">
    <StatusBlock block-name="application_status" title="Mon dossier" />
    <TasksBlock />
    <NotificationsBlock />
  </div>

  <!-- Profil employee — DEC-132, U05 §2.2, CORRECTIONS.md B-003 -->
  <div v-else-if="profileName === 'employee'" :key="`employee-${refreshKey}`" class="flex flex-col gap-8">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <HrSelfServiceBlock />
      <LeaveBlock />
    </div>
    <RecentRequestsBlock />
    <NotificationsBlock />
    <ServicesBlock />
  </div>

  <div v-else :key="`generic-${refreshKey}`" class="flex flex-col gap-8">
    <div class="bg-white rounded-md-ln border border-ln-gray-200 shadow-card p-5">
      <p class="text-sm text-ln-gray-600">
        Votre compte n'a pas encore de profil académique associé. Seules les notifications
        générales sont disponibles.
      </p>
    </div>
    <NotificationsBlock />
  </div>
</template>

<style scoped>
/* C-005 : Styles pull-to-refresh (mobile uniquement) */
@media (max-width: 1023px) {
  .pull-to-refresh-indicator {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    background: linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(255,255,255,0));
    pointer-events: none;
    transition: transform 0.2s ease-out;
  }

  .pull-indicator-content {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: white;
    border-radius: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    color: #374151;
    font-size: 13px;
    font-weight: 500;
  }

  .pull-arrow {
    transition: transform 0.2s ease, color 0.2s ease;
    color: #9CA3AF;
  }

  .pull-arrow.pull-ready {
    transform: rotate(180deg);
    color: #1D4ED8;
  }

  .refresh-spinner {
    animation: spin 1s linear infinite;
    color: #1D4ED8;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .is-refreshing .pull-indicator-content {
    background: #EFF6FF;
    color: #1D4ED8;
  }
}

@media (min-width: 1024px) {
  .pull-to-refresh-indicator {
    display: none;
  }
}
</style>
