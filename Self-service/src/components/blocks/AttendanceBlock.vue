<script setup>
// AttendanceBlock — bloc assiduité étudiant (Phase 5)
// Backend : portal_app.api.cockpit.get_attendance_summary
// Composants : DonutGauge + ProgressBar × 2 + ThresholdGauge
// Réf visuelle : specs-interfaces/mela_cockpit_with_micro_charts.html §Assiduité
import { computed } from 'vue';
import { useFrappeCall } from '@/composables/useFrappeCall';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import BlockError from '@/components/ui/BlockError.vue';
import DonutGauge from '@/components/ui/viz/DonutGauge.vue';
import ProgressBar from '@/components/ui/viz/ProgressBar.vue';
import ThresholdGauge from '@/components/ui/viz/ThresholdGauge.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';

const attendance = useFrappeCall('portal_app.api.cockpit.get_attendance_summary');

const payload = computed(() => attendance.data?.payload || null);
const hasData = computed(() => payload.value?.has_data === true);

const thresholdVariant = computed(() => {
  const rate = payload.value?.unjustified_rate ?? 0;
  if (rate < 10) return 'success';
  if (rate < 15) return 'warning';
  return 'error';
});

const thresholdLabel = computed(() => {
  const rate = payload.value?.unjustified_rate ?? 0;
  if (rate < 10) return `${rate}% — sous le seuil`;
  if (rate < 15) return `${rate}% — attention`;
  return `${rate}% — seuil critique`;
});
</script>

<template>
  <section class="flex flex-col gap-3">
    <h2 class="text-[11px] font-semibold text-neutral-600 tracking-wider uppercase">
      Assiduité
    </h2>

    <BlockSkeleton v-if="attendance.loading" :lines="3" :show-title="false" />

    <BlockError
      v-else-if="attendance.error"
      title="Assiduité indisponible"
      :message="attendance.error.message || 'Erreur réseau'"
      :retry="() => attendance.reload()"
    />

    <div
      v-else-if="!hasData"
      class="bg-white rounded-lg border border-subtle p-6 text-sm text-neutral-500"
    >
      Aucune donnée d'assiduité disponible pour votre compte.
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <!-- Carte 1 : Taux de présence (DonutGauge) -->
      <div class="bg-white rounded-lg border border-subtle p-5 flex items-center gap-4">
        <DonutGauge
          :value="payload.present"
          :total="payload.total"
          color="success"
          :aria-label="`Taux de présence ${payload.presence_rate} pourcent`"
        />
        <div>
          <div class="text-sm font-semibold text-neutral-950">Présence</div>
          <div class="text-xs text-neutral-500 mt-0.5">
            {{ payload.present }}/{{ payload.total }} séances
          </div>
        </div>
      </div>

      <!-- Carte 2 : Absences par type (ProgressBar × 2) -->
      <div class="bg-white rounded-lg border border-subtle p-5">
        <div class="text-xs text-neutral-500 mb-3">Absences par type</div>

        <div class="mb-3">
          <div class="flex justify-between mb-1">
            <span class="text-xs text-neutral-600">Non justifiées</span>
            <span class="text-xs font-semibold text-neutral-950 tabular-nums">
              {{ payload.absent_unjustified }}
            </span>
          </div>
          <ProgressBar
            :value="payload.absent_unjustified"
            :max="Math.max(payload.total, 1)"
            color="error"
            aria-label="Taux d'absences non justifiées"
          />
        </div>

        <div>
          <div class="flex justify-between mb-1">
            <span class="text-xs text-neutral-600">Justifiées</span>
            <span class="text-xs font-semibold text-neutral-950 tabular-nums">
              {{ payload.absent_justified }}
            </span>
          </div>
          <ProgressBar
            :value="payload.absent_justified"
            :max="Math.max(payload.total, 1)"
            color="warning"
            aria-label="Taux d'absences justifiées"
          />
        </div>
      </div>

      <!-- Carte 3 : Seuils d'alerte (ThresholdGauge) -->
      <div class="bg-white rounded-lg border border-subtle p-5">
        <div class="text-xs text-neutral-500 mb-3">Seuils d'alerte</div>
        <ThresholdGauge
          :value="payload.unjustified_rate"
          :thresholds="[
            { at: 0, label: '0%' },
            { at: 50, label: '10%' },
            { at: 75, label: '15%' },
            { at: 100, label: '20%' },
          ]"
          :aria-label="`Taux absences non justifiées ${payload.unjustified_rate} pourcent`"
        />
        <div class="mt-3">
          <StatusBadge :variant="thresholdVariant" :label="thresholdLabel" :dot="false" />
        </div>
      </div>
    </div>
  </section>
</template>
