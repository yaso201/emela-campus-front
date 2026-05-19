<script setup>
// UECalculation — formule transparente de calcul Note UE (Art. 19.1)
const props = defineProps({
  formula: { type: String, default: '' },
});
</script>

<template>
  <div
    v-if="formula"
    class="mt-2 px-3 py-2 bg-ln-gray-50 rounded border border-ln-gray-100"
  >
    <p class="text-[11px] text-ln-gray-500 font-medium uppercase tracking-wider mb-1">
      Calcul Note UE — Art. 19.1
    </p>
    <p class="text-xs text-ln-gray-700 font-mono leading-relaxed">
      {{ formula }}
    </p>
  </div>
</template>
