<script setup>
// AcademicContextBlock — contexte académique canonique (V6 — Flux 1)
// Backend : portal_app.api.academic_context.get_student_academic_context
// Read-only : le portail expose sans jamais corriger la donnée source.
// Ref: A05 §4.1, D05
import { computed } from 'vue';
import { useFrappeCall } from '@/composables/useFrappeCall';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import BlockError from '@/components/ui/BlockError.vue';
import { GraduationCap } from 'lucide-vue-next';

const ctx = useFrappeCall('portal_app.api.academic_context.get_student_academic_context');

const data = computed(() => ctx.data || null);
const hasProfile = computed(() => !!data.value?.student_id);

// Status labels — COA corrigé en "Congé académique" (pas "Admission sous conditions")
const STATUS_LABELS = {
  ACT: 'Actif',
  SUS: 'Suspendu',
  EXC: 'Exclu',
  DEM: 'Démissionné',
  DIP: 'Diplômé',
  COA: 'Congé académique',
};

const STATUS_BADGES = {
  ACT: 'bg-ln-success-bg text-ln-success',
  SUS: 'bg-ln-warning/10 text-ln-warning',
  EXC: 'bg-[#FEF2F2] text-ln-error',
  DEM: 'bg-ln-gray-100 text-ln-gray-500',
  DIP: 'bg-ln-blue-50 text-ln-blue-800',
  COA: 'bg-ln-warning/10 text-ln-warning',
};

const statusLabel = computed(() => {
  const s = data.value?.academic_status;
  return STATUS_LABELS[s] || s || '—';
});

const statusBadge = computed(() => {
  return STATUS_BADGES[data.value?.academic_status] || 'bg-ln-gray-100 text-ln-gray-600';
});

const warnings = computed(() => data.value?.warnings || []);

// Human-readable warning messages
const WARNING_MESSAGES = {
  no_program: 'Programme non renseigné.',
  no_academic_level: 'Niveau académique non renseigné.',
  no_active_enrollment: 'Aucune inscription active trouvée.',
  no_academic_year: 'Année académique non renseignée.',
  no_academic_term: 'Semestre non renseigné.',
  no_student_group: 'Groupe non renseigné.',
  terminal_status: 'Votre parcours est terminé.',
  academic_leave: 'Vous êtes actuellement en congé académique.',
  suspended_status: 'Votre compte est suspendu.',
  student_disabled: 'Votre compte étudiant est désactivé.',
};

function warningMessage(key) {
  return WARNING_MESSAGES[key] || key;
}
</script>

<template>
  <section class="flex flex-col gap-3">
    <h2 class="text-sm font-semibold text-ln-gray-900 flex items-center gap-2">
      <GraduationCap class="w-4 h-4 text-ln-blue-900" aria-hidden="true" />
      Mon parcours
    </h2>

    <BlockSkeleton v-if="ctx.loading" :lines="2" :show-title="false" />

    <BlockError
      v-else-if="ctx.error"
      title="Contexte académique indisponible"
      :message="ctx.error.message || 'Erreur réseau'"
      :retry="() => ctx.reload()"
    />

    <div
      v-else-if="!hasProfile"
      class="bg-white rounded-lg border border-ln-gray-200 p-4 text-sm text-ln-gray-500"
    >
      Aucun profil académique associé à votre compte.
    </div>

    <div v-else class="bg-white rounded-lg border border-ln-gray-200 p-4 space-y-3">
      <!-- Ligne 1 : Programme + Badge statut -->
      <div class="flex items-center justify-between">
        <div class="text-sm font-medium text-ln-gray-900">
          {{ data.program || '—' }}
          <span v-if="data.academic_level" class="text-ln-gray-500 font-normal ml-1">
            · {{ data.academic_level }}
          </span>
        </div>
        <span
          class="text-xs font-medium px-2 py-0.5 rounded-full"
          :class="statusBadge"
        >
          {{ statusLabel }}
        </span>
      </div>

      <!-- Ligne 2 : Année, semestre, groupe -->
      <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ln-gray-500">
        <span v-if="data.academic_year">Année : {{ data.academic_year }}</span>
        <span v-if="data.academic_term">Semestre : {{ data.academic_term }}</span>
        <span v-if="data.student_group">Groupe : {{ data.student_group }}</span>
      </div>

      <!-- Warnings -->
      <div
        v-for="(w, i) in warnings"
        :key="i"
        class="flex items-start gap-2 text-xs rounded-md p-2"
        :class="w === 'academic_leave' || w === 'suspended_status' || w === 'terminal_status'
          ? 'text-ln-warning bg-ln-warning/5'
          : 'text-ln-gray-500 bg-ln-gray-50'"
      >
        <svg class="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ warningMessage(w) }}</span>
      </div>
    </div>
  </section>
</template>
