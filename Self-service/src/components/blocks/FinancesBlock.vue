<script setup>
// FinancesBlock — bloc finances étudiant (V6 — rebranché sur finance_summary)
// Backend : portal_app.api.finance_summary.get_student_finance_summary
// Remplace l'ancien bloc legacy (cockpit.py, source Fees HRMS désormais inutilisée)
// Ref: A05 Flux 12, D05 §11
import { computed } from 'vue';
import { useFrappeCall } from '@/composables/useFrappeCall';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import BlockError from '@/components/ui/BlockError.vue';
import MetricCard from '@/components/ui/MetricCard.vue';

const finances = useFrappeCall('portal_app.api.finance_summary.get_student_finance_summary');

const payload = computed(() => finances.data?.payload || null);
const hasData = computed(() => payload.value?.has_data === true);

const STATUS_LABELS = {
  NFA: 'Non facturé',
  DU: 'Montant dû',
  PPY: 'Partiellement payé',
  PYD: 'Intégralement payé',
  RET: 'En retard',
  ANN: 'Annulé',
  SOL: 'Soldé',
};

// Explicit dot color classes — avoids dynamic class generation that Tailwind
// cannot detect statically at build time.
const STATUS_DOT_CLASSES = {
  NFA: 'bg-ln-gray-500',
  DU: 'bg-ln-warning',
  PPY: 'bg-ln-warning',
  PYD: 'bg-ln-success',
  RET: 'bg-ln-error',
  ANN: 'bg-ln-gray-400',
  SOL: 'bg-ln-success',
};

const statusLabel = computed(() => {
  const s = payload.value?.financial_status;
  return STATUS_LABELS[s] || s || '—';
});

const statusDotClass = computed(() => {
  return STATUS_DOT_CLASSES[payload.value?.financial_status] || 'bg-ln-gray-500';
});

function formatAmount(value) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('fr-FR').format(value);
}

function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

const daysUntilDue = computed(() => {
  if (!payload.value?.next_due_date) return null;
  const due = new Date(payload.value.next_due_date);
  const now = new Date();
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
});

const dueSubtitle = computed(() => {
  if (!payload.value?.next_due_date) return 'Aucune échéance synchronisée';
  const d = daysUntilDue.value;
  if (d === null) return '—';
  if (d > 0) return `Dans ${d} jour${d > 1 ? 's' : ''}`;
  if (d === 0) return "Aujourd'hui";
  return 'Échu';
});

const isStale = computed(() => payload.value?.is_stale === true);

const syncLabel = computed(() => {
  if (!payload.value?.last_sync_at) return 'Synchronisation inconnue';
  return `Mis à jour le ${formatDate(payload.value.last_sync_at)}`;
});

const warnings = computed(() => payload.value?.warnings || []);
</script>

<template>
  <section class="flex flex-col gap-3">
    <h2 class="text-sm font-semibold text-ln-gray-900">
      Finances
    </h2>

    <BlockSkeleton v-if="finances.loading" :lines="3" :show-title="false" />

    <BlockError
      v-else-if="finances.error"
      title="Finances indisponible"
      :message="finances.error.message || 'Erreur réseau'"
      :retry="() => finances.reload()"
    />

    <!-- État sans données — affiche les warnings s'ils existent -->
    <div
      v-else-if="!hasData"
      class="bg-white rounded-lg border border-ln-gray-200 p-6 space-y-2"
    >
      <p class="text-sm text-ln-gray-500">
        Aucune donnée financière disponible pour votre compte.
      </p>
      <div
        v-for="(w, i) in warnings"
        :key="i"
        class="flex items-start gap-2 text-xs text-ln-warning bg-ln-warning/5 rounded-md p-2"
      >
        <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <span>{{ w }}</span>
      </div>
    </div>

    <!-- État avec données -->
    <div v-else class="space-y-3">
      <div class="grid grid-cols-2 gap-3">
        <!-- Carte 1 : Statut financier + montant dû -->
        <MetricCard
          label="Statut financier"
          :value="statusLabel"
          :subtitle="`${formatAmount(payload.outstanding_amount)} ${payload.currency} restant dû`"
        >
          <template #viz>
            <span
              class="inline-block w-3 h-3 rounded-full"
              :class="statusDotClass"
              aria-hidden="true"
            />
          </template>
        </MetricCard>

        <!-- Carte 2 : Prochaine échéance -->
        <MetricCard
          label="Prochaine échéance"
          :value="payload.next_due_date ? formatDate(payload.next_due_date) : '—'"
          :subtitle="dueSubtitle"
        />
      </div>

      <!-- Fraîcheur -->
      <div class="flex items-center gap-2 text-xs text-ln-gray-500 px-1">
        <span
          class="inline-block w-2 h-2 rounded-full"
          :class="isStale ? 'bg-ln-warning' : 'bg-ln-success'"
          aria-hidden="true"
        />
        <span>{{ syncLabel }}</span>
      </div>

      <!-- Warnings -->
      <div
        v-for="(w, i) in warnings"
        :key="i"
        class="flex items-start gap-2 text-xs text-ln-warning bg-ln-warning/5 rounded-md p-2"
      >
        <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <span>{{ w }}</span>
      </div>
    </div>
  </section>
</template>
