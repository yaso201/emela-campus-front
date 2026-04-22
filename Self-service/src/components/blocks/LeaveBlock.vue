<script setup>
// LeaveBlock — Solde de congés et prochains congés du salarié
// Placeholder P1-B-003 : implémentation complète prévue en Phase 3
// Spec : U07 §4.17, DEC-132
// Endpoint prévu : portal_app.api.cockpit.get_leave_summary
// Source : Cross-site backoffice → HRMS Leave Request + Leave Allocation
import { computed } from 'vue';
import { useFrappeCall } from '@/composables/useFrappeCall';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import BlockError from '@/components/ui/BlockError.vue';
import ProgressBar from '@/components/ui/viz/ProgressBar.vue';
import { Calendar, Plus } from 'lucide-vue-next';

const leaveData = useFrappeCall('portal_app.api.cockpit.get_leave_summary');

const leaveBalance = computed(() => {
  return leaveData.data?.leave_balance?.[0] || null;
});

const upcomingLeave = computed(() => {
  return leaveData.data?.upcoming_leaves?.[0] || null;
});

const hasData = computed(() => leaveBalance.value || upcomingLeave.value);

function formatDateRange(fromDate, toDate) {
  if (!fromDate || !toDate) return '—';
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const fmt = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  return `${fmt(from)} → ${fmt(to)}`;
}

function formatStatus(status) {
  const map = {
    'Approved': 'Approuvé',
    'Open': 'En attente',
    'Rejected': 'Refusé',
    'Cancelled': 'Annulé',
  };
  return map[status] || status;
}
</script>

<template>
  <section class="flex flex-col gap-3">
    <h2 class="text-sm font-semibold text-ln-gray-900">
      Mes congés
    </h2>

    <BlockSkeleton v-if="leaveData.loading" :lines="3" :show-title="false" />

    <BlockError
      v-else-if="leaveData.error"
      title="Congés indisponibles"
      :message="leaveData.error.message || 'Erreur réseau'"
      :retry="() => leaveData.reload()"
    />

    <!-- État vide -->
    <div
      v-else-if="!hasData"
      class="bg-white rounded-lg border border-ln-gray-200 p-6 text-center"
    >
      <Calendar class="w-8 h-8 text-ln-gray-300 mx-auto mb-3" aria-hidden="true" />
      <p class="text-sm font-medium text-ln-gray-500">Aucune information de congé</p>
      <a
        href="/app-emela/support?type=conge"
        class="inline-flex items-center gap-1 mt-3 text-xs font-medium text-ln-blue-900 hover:text-ln-blue-700"
      >
        <Plus class="w-3.5 h-3.5" aria-hidden="true" />
        Demander un congé
      </a>
    </div>

    <!-- Contenu -->
    <div v-else class="bg-white rounded-lg border border-ln-gray-200 p-4 space-y-4">
      <!-- Solde de congés -->
      <div v-if="leaveBalance" class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-ln-gray-900">{{ leaveBalance.leave_type }}</span>
          <span class="text-sm text-ln-gray-600">
            {{ leaveBalance.remaining_days }} / {{ leaveBalance.total_days }} j
          </span>
        </div>
        <ProgressBar
          :value="(leaveBalance.remaining_days / leaveBalance.total_days) * 100"
          color="brand"
          :aria-label="`Solde de congés ${leaveBalance.remaining_days} sur ${leaveBalance.total_days} jours`"
        />
      </div>

      <!-- Prochain congé -->
      <div v-if="upcomingLeave" class="pt-3 border-t border-ln-gray-100">
        <p class="text-xs text-ln-gray-500 mb-1">Prochain congé</p>
        <p class="text-sm font-medium text-ln-gray-900">
          {{ formatDateRange(upcomingLeave.from_date, upcomingLeave.to_date) }}
          · {{ upcomingLeave.total_days }} jour{{ upcomingLeave.total_days > 1 ? 's' : '' }}
        </p>
        <p class="text-xs text-ln-gray-500 mt-0.5">
          {{ formatStatus(upcomingLeave.status) }}
        </p>
      </div>

      <!-- Bouton action -->
      <a
        href="/app-emela/support?type=conge"
        class="flex items-center justify-center gap-1.5 w-full py-2 bg-ln-blue-50 hover:bg-ln-blue-100 text-ln-blue-900 text-xs font-medium rounded-md transition-colors"
      >
        <Plus class="w-3.5 h-3.5" aria-hidden="true" />
        Demander un congé
      </a>
    </div>
  </section>
</template>
