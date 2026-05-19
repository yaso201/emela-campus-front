<script setup>
// MHCList — MHC obligatoires du semestre (Art. 4.5)
import { Check, X } from 'lucide-vue-next';

const props = defineProps({
  mhcModules: { type: Array, default: () => [] },
  allMhcValidated: { type: Boolean, default: false },
});
</script>

<template>
  <div v-if="mhcModules.length > 0" class="mt-4">
    <h4 class="text-sm font-semibold text-ln-gray-900 mb-2">
      MHC obligatoires du semestre
    </h4>
    <div class="flex flex-col gap-1.5">
      <div
        v-for="mhc in mhcModules"
        :key="mhc.mhc_code"
        class="flex items-center gap-2 text-sm"
      >
        <Check
          v-if="allMhcValidated"
          class="w-4 h-4 text-ln-success flex-shrink-0"
          aria-hidden="true"
        />
        <X
          v-else
          class="w-4 h-4 text-ln-error flex-shrink-0"
          aria-hidden="true"
        />
        <span :class="allMhcValidated ? 'text-ln-gray-700' : 'text-ln-gray-700'">
          <span class="font-medium">{{ mhc.mhc_code }}</span>
          <span class="text-ln-gray-500"> — {{ mhc.mhc_name }}</span>
        </span>
      </div>
    </div>
    <div
      v-if="!allMhcValidated"
      class="mt-2 text-xs text-ln-error font-medium"
      role="alert"
    >
      ⚠ MHC obligatoire(s) non validé(s) — bloque la validation du semestre (Art. 4.5)
    </div>
  </div>
</template>
