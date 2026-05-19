<script setup>
// SemesterBlock — bloc Semestre avec UE, MHC, moyenne (Art. 20)
import { computed } from 'vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import UEBlock from './UEBlock.vue';
import MHCList from './MHCList.vue';

const props = defineProps({
  semester: { type: Object, required: true },
});

function semesterTitle(semester) {
  const term = semester.academic_term || 'Semestre';
  const year = semester.academic_year || '';
  return year ? `${term} · ${year}` : term;
}

function formatNote(note) {
  if (note === null || note === undefined || Number.isNaN(Number(note))) {
    return '—';
  }
  return `${Number(note).toFixed(1).replace('.', ',')} /20`;
}

const decisionStatus = computed(() => {
  const map = {
    APD: 'validated',
    PIN: 'pending',
    PRE: 'pending',
    PCO: 'pending',
    RED: 'failed',
    EXC: 'failed',
    REO: 'failed',
    COA: 'compensated',
  };
  return map[props.semester.jury_decision] || 'decision';
});
</script>

<template>
  <div class="bg-white rounded-lg border border-ln-gray-200 p-5 md:p-6">
    <!-- Semester Header -->
    <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between border-b border-ln-gray-100 pb-4 mb-4">
      <div>
        <h3 class="text-lg font-semibold text-ln-gray-900">
          {{ semesterTitle(semester) }}
        </h3>
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-ln-gray-600">
          <span v-if="semester.academic_level">
            Niveau {{ semester.academic_level }}
          </span>
          <span v-if="semester.semester_average !== null && semester.semester_average !== undefined">
            Moyenne semestrielle :
            <span class="font-semibold text-ln-gray-900">{{ formatNote(semester.semester_average) }}</span>
            <span class="text-xs text-ln-gray-500 ml-1">(indicatif — Art. 20.2)</span>
          </span>
        </div>
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-ln-gray-500">
          <span>
            ECTS validés :
            <span class="font-medium text-ln-gray-700">{{ semester.total_ects_earned ?? '—' }} / {{ semester.total_ects_possible ?? '—' }}</span>
          </span>
          <span>
            Cumul programme :
            <span class="font-medium text-ln-gray-700">{{ semester.cumulative_ects ?? '—' }}</span>
          </span>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <StatusBadge
          v-if="semester.jury_decision"
          :status="decisionStatus"
          :label="`Jury ${semester.jury_decision}`"
        />
        <StatusBadge
          :status="semester.semester_validated ? 'validated' : 'failed'"
          :label="semester.semester_validated ? 'Semestre validé' : 'Semestre non validé'"
        />
      </div>
    </div>

    <!-- UE List -->
    <div class="flex flex-col gap-4">
      <UEBlock
        v-for="(ue, idx) in semester.ue_results"
        :key="`${semester.academic_year}-${semester.academic_term}-ue-${idx}`"
        :ue="ue"
      />
    </div>

    <!-- MHC -->
    <MHCList
      :mhc-modules="semester.mhc_obligatoires || []"
      :all-mhc-validated="semester.all_mhc_validated"
    />

    <!-- Regulatory note -->
    <div class="mt-4 pt-3 border-t border-ln-gray-100 text-[11px] text-ln-gray-500">
      Note : Validation UE par UE. Pas de compensation inter-UE (Art. 24.1).
    </div>
  </div>
</template>
