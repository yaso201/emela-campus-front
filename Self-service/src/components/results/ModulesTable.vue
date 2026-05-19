<script setup>
// ModulesTable — table détaillée des modules d'une UE (Art. 19, 23)
import ModuleStatusBadge from './ModuleStatusBadge.vue';

const props = defineProps({
  modules: { type: Array, default: () => [] },
  compensationFloor: { type: Number, default: 6.0 },
});

function formatNote(note) {
  if (note === null || note === undefined || Number.isNaN(Number(note))) {
    return '—';
  }
  return `${Number(note).toFixed(1).replace('.', ',')} /20`;
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="min-w-full border-separate border-spacing-0">
      <thead>
        <tr>
          <th
            scope="col"
            class="px-3 py-2 text-left text-[11px] font-semibold text-ln-gray-500 uppercase tracking-wider border-b border-ln-gray-200"
          >
            Module
          </th>
          <th
            scope="col"
            class="px-3 py-2 text-right text-[11px] font-semibold text-ln-gray-500 uppercase tracking-wider border-b border-ln-gray-200"
          >
            Coef.
          </th>
          <th
            scope="col"
            class="px-3 py-2 text-right text-[11px] font-semibold text-ln-gray-500 uppercase tracking-wider border-b border-ln-gray-200"
          >
            Note
          </th>
          <th
            scope="col"
            class="px-3 py-2 text-left text-[11px] font-semibold text-ln-gray-500 uppercase tracking-wider border-b border-ln-gray-200"
          >
            Statut
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(mod, idx) in modules"
          :key="`${mod.module_code || mod.module_name || idx}`"
          class="align-top"
        >
          <td class="px-3 py-2.5 border-b border-ln-gray-100">
            <div class="text-sm font-medium text-ln-gray-900">{{ mod.module_name || '—' }}</div>
            <div class="text-xs text-ln-gray-500 mt-0.5">{{ mod.module_code || '' }}</div>
            <div v-if="mod.is_retake_result" class="text-[11px] text-ln-blue-700 mt-0.5">
              Rattrapage
              <span v-if="mod.original_grade !== null && mod.original_grade !== undefined">
                (avant : {{ formatNote(mod.original_grade) }})
              </span>
            </div>
          </td>
          <td class="px-3 py-2.5 border-b border-ln-gray-100 text-right text-sm text-ln-gray-700 whitespace-nowrap">
            {{ mod.coefficient !== null && mod.coefficient !== undefined ? mod.coefficient : '—' }}
          </td>
          <td class="px-3 py-2.5 border-b border-ln-gray-100 text-right text-sm text-ln-gray-700 whitespace-nowrap font-medium">
            {{ formatNote(mod.module_average) }}
          </td>
          <td class="px-3 py-2.5 border-b border-ln-gray-100">
            <ModuleStatusBadge
              :status="mod.status || 'unknown'"
              :label="mod.status_label || '—'"
              size="sm"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
