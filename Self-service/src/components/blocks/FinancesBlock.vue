<script setup>
// FinancesBlock — bloc finances étudiant (Phase 5)
// Backend : portal_app.api.cockpit.get_financial_block
// Composants : MetricCard × 3 + ProgressBar + Sparkline
// Réf visuelle : specs-interfaces/mela_cockpit_with_micro_charts.html §Finances
import { computed } from 'vue';
import { useFrappeCall } from '@/composables/useFrappeCall';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import BlockError from '@/components/ui/BlockError.vue';
import MetricCard from '@/components/ui/MetricCard.vue';
import ProgressBar from '@/components/ui/viz/ProgressBar.vue';
import Sparkline from '@/components/ui/viz/Sparkline.vue';

const finances = useFrappeCall('portal_app.api.cockpit.get_financial_block');

const payload = computed(() => finances.data?.payload || null);
const hasData = computed(() => payload.value?.has_data === true);

function formatAmount(value) {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('fr-FR').format(value);
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

const daysUntilDue = computed(() => {
  if (!payload.value?.next_due_date) return null;
  const due = new Date(payload.value.next_due_date);
  const now = new Date();
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
});
</script>

<template>
  <section class="flex flex-col gap-3">
    <h2 class="text-[11px] font-semibold text-neutral-600 tracking-wider uppercase">
      Finances
    </h2>

    <BlockSkeleton v-if="finances.loading" :lines="3" :show-title="false" />

    <BlockError
      v-else-if="finances.error"
      title="Finances indisponible"
      :message="finances.error.message || 'Erreur réseau'"
      :retry="() => finances.reload()"
    />

    <div
      v-else-if="!hasData"
      class="bg-white rounded-lg border border-subtle p-6 text-sm text-neutral-500"
    >
      Aucune donnée financière disponible pour votre compte.
    </div>

    <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <!-- Carte 1 : Paiement (pourcentage + ProgressBar) -->
      <MetricCard
        label="Paiement"
        :value="`${payload.payment_pct}%`"
        :subtitle="`${formatAmount(payload.total_paid)} / ${formatAmount(payload.total_billed)} ${payload.currency}`"
      >
        <template #viz>
          <ProgressBar
            :value="payload.payment_pct"
            color="brand"
            :aria-label="`Progression paiement ${payload.payment_pct} pourcent`"
          />
        </template>
      </MetricCard>

      <!-- Carte 2 : Prochaine échéance -->
      <MetricCard
        label="Prochaine échéance"
        :value="formatDate(payload.next_due_date)"
        :subtitle="daysUntilDue !== null ? (daysUntilDue > 0 ? `Dans ${daysUntilDue} jours` : 'Échu') : '—'"
      />

      <!-- Carte 3 : Historique paiements (Sparkline) -->
      <MetricCard
        label="Paiements reçus"
        :value="formatAmount(payload.total_paid)"
        :subtitle="payload.currency"
      >
        <template #viz>
          <Sparkline
            v-if="payload.history?.length >= 2"
            :data="payload.history"
            color="brand"
            aria-label="Historique des paiements sur les 6 derniers mois"
          />
        </template>
      </MetricCard>
    </div>
  </section>
</template>
