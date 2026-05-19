<script setup>
// UEBlock — bloc Unité d'Enseignement conforme Règlement V2.1
import { computed } from 'vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import GradeEctsBadge from './GradeEctsBadge.vue';
import ModulesTable from './ModulesTable.vue';
import UECalculation from './UECalculation.vue';

const props = defineProps({
  ue: { type: Object, required: true },
});

const ueStatusForBadge = computed(() => {
  if (props.ue.is_validated) return 'validated';
  if (props.ue.has_floor_violation) return 'failed';
  return 'pending';
});

const ueLabelForBadge = computed(() => {
  if (props.ue.is_validated && props.ue.is_compensated) return 'Validée (compensation)';
  if (props.ue.is_validated) return 'Validée';
  if (props.ue.has_floor_violation) return 'Échouée (plancher)';
  return 'Non validée';
});

function formatNote(note) {
  if (note === null || note === undefined || Number.isNaN(Number(note))) {
    return '—';
  }
  return `${Number(note).toFixed(1).replace('.', ',')} /20`;
}
</script>

<template>
  <div class="bg-white rounded-lg border border-ln-gray-200 overflow-hidden">
    <!-- UE Header -->
    <div class="px-5 py-4 border-b border-ln-gray-100">
      <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h4 class="text-base font-semibold text-ln-gray-900">
              {{ ue.ue_code }} — {{ ue.ue_name }}
            </h4>
            <StatusBadge
              :status="ueStatusForBadge"
              :label="ueLabelForBadge"
              size="sm"
            />
          </div>
          <div class="flex items-center gap-3 mt-2 flex-wrap">
            <span class="text-sm font-bold text-ln-gray-900">
              {{ formatNote(ue.ue_average) }}
            </span>
            <GradeEctsBadge
              v-if="ue.grade_ects"
              :grade="ue.grade_ects"
              size="sm"
            />
            <span class="text-xs text-ln-gray-500">
              {{ ue.ects_earned ?? '—' }} / {{ ue.ects_possible ?? '—' }} ECTS
            </span>
            <span v-if="ue.is_after_retake" class="text-[11px] text-ln-warning font-medium">
              Après rattrapage
            </span>
          </div>
        </div>
      </div>

      <!-- Compensation notice -->
      <div
        v-if="ue.is_compensated"
        class="mt-2 text-xs text-ln-success font-medium flex items-center gap-1"
      >
        <span aria-hidden="true">ℹ</span>
        Validée avec compensation intra-UE (Art. 23.1)
      </div>

      <!-- Floor violation notice -->
      <div
        v-if="ue.has_floor_violation"
        class="mt-2 text-xs text-ln-error font-medium flex items-center gap-1"
        role="alert"
      >
        <span aria-hidden="true">⚠</span>
        Module éliminatoire (&lt; {{ ue.compensation_floor || 6 }}/20) — compensation impossible (Art. 23.2)
      </div>

      <!-- Not validated notice -->
      <div
        v-else-if="!ue.is_validated"
        class="mt-2 text-xs text-ln-warning font-medium flex items-center gap-1"
        role="alert"
      >
        <span aria-hidden="true">⚠</span>
        UE non validée — rattrapage obligatoire
      </div>
    </div>

    <!-- Modules detail -->
    <div v-if="ue.modules && ue.modules.length > 0" class="px-2 py-3">
      <ModulesTable
        :modules="ue.modules"
        :compensation-floor="ue.compensation_floor"
      />
      <UECalculation :formula="ue.calculation_formula" />
    </div>

    <!-- Empty modules fallback -->
    <div v-else class="px-5 py-4 text-xs text-ln-gray-500">
      Aucun détail de module disponible pour cette UE.
    </div>
  </div>
</template>
