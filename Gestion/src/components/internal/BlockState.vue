<template>
  <!-- CHARGEMENT — la forme du squelette est celle du contenu attendu, pour que
       rien ne saute à l'arrivée. Le volume annoncé transforme une attente en
       information (exposition D-04 du relevé). -->
  <div v-if="state === 'loading'" class="rounded-md-ln border border-ln-gray-200 p-4" role="status" aria-live="polite">
    <div v-for="n in rows" :key="n" class="flex items-center gap-4 border-b border-ln-gray-100 last:border-0" :style="rowStyle">
      <span v-for="(w, i) in skeletonWidths" :key="i" class="ln-skeleton h-2.5 rounded-full" :style="widthStyle(w)"></span>
    </div>
    <p v-if="expectedCount" class="mt-4 border-t border-ln-gray-100 pt-4 text-caption text-ln-gray-500">
      Chargement de <b class="text-ln-gray-700">{{ expectedCount }} {{ expectedLabel }}</b> — cela peut prendre
      quelques secondes sur une connexion lente.
    </p>
    <span class="sr-only">Chargement en cours</span>
  </div>

  <!-- VIDE — trois phrases au plus : ce qui manque, pourquoi, la sortie. -->
  <div v-else-if="state === 'empty'" class="rounded-md-ln border border-dashed border-ln-gray-300 bg-white px-6 py-8 text-center">
    <h4 class="text-h3 text-ln-gray-900">{{ title }}</h4>
    <p v-if="message" class="mx-auto mt-1.5 max-w-md text-body-sm leading-relaxed text-ln-gray-500">{{ message }}</p>
    <slot name="action" />
  </div>

  <!-- ERREUR — jamais de code technique au premier plan, toujours une phrase
       sur ce qui est sauf : c'est la seule question de quelqu'un qui travaillait. -->
  <div v-else-if="state === 'error'" class="rounded-md-ln border border-[#F3C6C6] bg-ln-error-bg px-6 py-8 text-center" role="alert">
    <h4 class="text-h3 text-ln-error">{{ title }}</h4>
    <p v-if="message" class="mx-auto mt-1.5 max-w-md text-body-sm leading-relaxed text-[#7A2020]">{{ message }}</p>
    <p v-if="safeguard" class="mx-auto mt-2 max-w-md text-body-sm font-semibold text-[#7A2020]">{{ safeguard }}</p>
    <div class="mt-5 flex justify-center gap-2">
      <button type="button" class="ln-btn-secondary" @click="emit('retry')">Réessayer</button>
      <slot name="action" />
    </div>
  </div>
</template>

<script setup>
/**
 * BlockState — mise en œuvre partagée des états des quinze composants.
 * Réf : lot 4 §2. CE N'EST PAS UN SEIZIÈME COMPOSANT : il n'est pas exporté par
 * components/index.js et aucune page ne l'importe. Le rendre public créerait
 * deux façons d'afficher un état vide — exactement ce que l'inventaire interdit.
 */
import { computed } from 'vue';

const props = defineProps({
  state: { type: String, required: true },            // 'loading' | 'empty' | 'error'
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  safeguard: { type: String, default: '' },           // erreur : ce qui n'est pas perdu
  rows: { type: Number, default: 4 },                 // chargement : lignes du squelette
  skeletonWidths: { type: Array, default: () => [186, 54, 180, 148] },
  rowHeight: { type: Number, default: 44 },
  expectedCount: { type: [Number, String], default: null },
  expectedLabel: { type: String, default: 'lignes' },
});

const emit = defineEmits(['retry']);

const rowStyle = computed(() => ({ height: props.rowHeight + 'px' }));
function widthStyle(w) {
  if (w === 'auto') return { flex: '1 1 auto' };
  return { width: w + 'px' };
}
</script>
