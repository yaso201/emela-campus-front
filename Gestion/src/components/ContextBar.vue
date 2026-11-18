<template>
  <div class="sticky top-14 z-[29] flex h-11 items-center gap-4 border-b border-ln-gray-200 bg-ln-gray-50 px-5 text-body-sm">
    <span class="text-micro font-semibold uppercase tracking-wider text-ln-gray-500">Contexte</span>

    <template v-if="loading">
      <span class="ln-skeleton h-[30px] w-40 rounded-sm-ln"></span>
      <span class="ln-skeleton h-[30px] w-28 rounded-sm-ln"></span>
    </template>

    <template v-else>
      <button type="button" class="ln-ctx-pick" @click="emit('pick', 'year')">
        {{ yearLabel }} <span class="text-[10px] text-ln-gray-400">▾</span>
      </button>
      <button v-if="term" type="button" class="ln-ctx-pick" @click="emit('pick', 'term')">
        {{ term.label }} <span class="text-[10px] text-ln-gray-400">▾</span>
      </button>
      <!-- MANDAT-12 (M8, Q8 b) : plusieurs semestres en cours — le serveur n'en choisit aucun ; le
           lecteur choisit, et son choix vit dans l'adresse comme tout contexte. -->
      <span v-else-if="candidates.length" class="inline-flex items-center gap-2 rounded-sm-ln bg-ln-warning-bg px-2.5 py-1 text-caption text-[#6B4415]"
            role="group" aria-label="Choisir le semestre">
        <b class="font-semibold">Plusieurs semestres en cours :</b>
        <button v-for="t in candidates" :key="t.id" type="button" class="ln-ctx-pick !h-[26px]" @click="emit('choose', t.id)">{{ t.label }}</button>
      </span>
      <p v-if="note" class="ml-auto truncate text-caption text-ln-gray-500">{{ note }}</p>
    </template>
  </div>
</template>

<script setup>
/**
 * 2 · Bandeau de contexte académique — année et semestre, permanents, hérités
 * par tout écran. Réf : lot 1 §1. La filière N'EST PAS un contexte : elle est
 * un filtre d'écran, parce qu'un responsable n'en a qu'une et qu'un
 * gestionnaire les manipule toutes à la fois.
 * Props : year · term · note · loading
 * Événement : pick('year'|'term')
 */
import { computed } from 'vue';

const props = defineProps({
  year: { type: Object, default: null },
  term: { type: Object, default: null },
  note: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  candidates: { type: Array, default: () => [] },   // [{ id, label }] — MANDAT-12 (Q8 b) : semestres à choisir
});
const emit = defineEmits(['pick', 'choose']);

const yearLabel = computed(() => (props.year ? 'Année ' + props.year.label : 'Année —'));
</script>
