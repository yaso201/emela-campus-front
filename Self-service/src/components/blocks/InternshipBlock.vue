<script setup>
// InternshipBlock — Bloc cockpit pour le stage étudiant (L6-E05)
// Ref: U07 §4.13, D04 §4.2, D04 §5
// Profil: Étudiant uniquement
// Endpoint: internship_app.api.portal_internship.get_student_internship_status

import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Briefcase } from 'lucide-vue-next';

import { useInternship } from '@/composables/useInternship';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import BlockError from '@/components/ui/BlockError.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import PhaseIndicator from '@/components/ui/PhaseIndicator.vue';

const router = useRouter();

const {
  isLoading,
  error,
  internship,
  hasInternship,
  currentPhase,
  statusLabel,
  statusBadgeStatus,
  nextAction,
  phaseLabels,
  loadInternship,
} = useInternship();

// Charge les données au montage du bloc
onMounted(() => {
  loadInternship();
});

/** Formate une date ISO en français */
function formatDate(isoDate) {
  if (!isoDate) return '—';
  const d = new Date(isoDate);
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Navigue vers la page stage */
function goToInternship() {
  router.push('/internship');
}

/** Détermine si on affiche le bouton d'action */
const showActionButton = computed(() => {
  if (!hasInternship.value) return true; // "Déclarer mon stage"
  return false; // Le lien "Voir le détail" suffit
});
</script>

<template>
  <section class="flex flex-col gap-3">
    <h2 class="text-sm font-semibold text-ln-gray-900">
      Mon stage
    </h2>

    <!-- État 1: Loading -->
    <BlockSkeleton v-if="isLoading" :lines="4" :show-title="false" />

    <!-- État 2: Error -->
    <BlockError
      v-else-if="error"
      title="Statut de stage indisponible"
      :message="error"
      :retry="loadInternship"
    />

    <!-- État 3: Pas de stage (has_internship = false) -->
    <div
      v-else-if="!hasInternship"
      class="bg-white rounded-lg border border-ln-gray-200 p-5"
    >
      <EmptyState
        icon="Briefcase"
        label="Vous n'avez pas encore de stage déclaré"
        description="Déclarez votre stage pour démarrer la procédure"
      />
      <div class="flex justify-center mt-4">
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 text-xs font-semibold text-white bg-ln-blue-900 hover:bg-ln-blue-700 px-4 py-2.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px] transition-colors"
          @click="goToInternship"
        >
          <Briefcase class="w-4 h-4" aria-hidden="true" />
          Déclarer mon stage
        </button>
      </div>
    </div>

    <!-- État 4: Stage actif -->
    <div
      v-else
      class="bg-white rounded-lg border border-ln-gray-200 p-5 flex flex-col gap-4"
    >
      <!-- Header: Statut (prioritaire) + Entreprise -->
      <div class="flex items-start justify-between gap-3">
        <StatusBadge :status="statusBadgeStatus" :label="statusLabel" />
      </div>
      
      <div class="min-w-0">
        <h3 class="text-sm font-semibold text-ln-gray-900 truncate">
          {{ internship.company_name || 'Entreprise non renseignée' }}
        </h3>
        <p class="text-xs text-ln-gray-500 mt-0.5">
          Du {{ formatDate(internship.start_date) }} au {{ formatDate(internship.end_date) }}
        </p>
      </div>

      <!-- Indicateur de phase -->
      <PhaseIndicator :current-phase="currentPhase || 0" :labels="phaseLabels" />

      <!-- Détails rapides -->
      <div class="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span class="text-ln-gray-500">Tuteur académique</span>
          <p class="font-medium text-ln-gray-900">{{ internship.academic_tutor_name || '—' }}</p>
        </div>
        <div>
          <span class="text-ln-gray-500">N° stage</span>
          <p class="font-medium text-ln-gray-900">{{ internship.name }}</p>
        </div>
      </div>

      <!-- Footer: Lien vers détail -->
      <div class="flex items-center justify-between pt-3 border-t border-ln-gray-100">
        <button
          v-if="nextAction && nextAction.route"
          type="button"
          class="text-xs font-semibold text-ln-blue-900 hover:text-ln-blue-700 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 rounded-sm px-2 py-1 -ml-2 min-h-[44px] inline-flex items-center"
          @click="() => router.push(nextAction.route)"
        >
          {{ nextAction.label }}
          <svg class="w-4 h-4 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <span v-else-if="nextAction" class="text-xs text-ln-gray-500">
          {{ nextAction.label }}
        </span>
        <span v-else class="text-xs text-ln-gray-500">—</span>

        <button
          type="button"
          class="text-xs font-medium text-ln-gray-600 hover:text-ln-gray-900 focus:outline-none focus:ring-2 focus:ring-ln-gray-500/25 rounded-sm px-2 py-1 min-h-[44px] inline-flex items-center"
          @click="goToInternship"
        >
          Voir le détail
          <svg class="w-4 h-4 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  </section>
</template>
