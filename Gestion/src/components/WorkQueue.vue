<template>
  <section class="flex max-h-[560px] flex-col overflow-hidden rounded-md-ln border border-ln-gray-200" :aria-label="title">
    <header class="flex flex-shrink-0 items-center gap-2 border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
      <h3 class="text-caption font-semibold text-ln-gray-900">{{ title }}</h3>
      <p v-if="total" class="tabular ml-auto text-caption text-ln-gray-500">{{ doneCount }} / {{ total }} traitées</p>
    </header>

    <BlockState v-if="state !== 'ready'" :state="state" :title="stateTitle" :message="stateMessage"
                :rows="4" :skeleton-widths="[180, 120, 80]" :row-height="56"
                :expected-count="expectedCount" expected-label="soumissions"
                class="m-4" @retry="emit('retry')">
      <template #action><slot name="empty-action" /></template>
    </BlockState>

    <ul v-else class="overflow-auto">
      <li v-for="item in items" :key="item.id">
        <button type="button"
                class="flex w-full flex-col gap-[3px] border-b border-ln-gray-100 px-4 py-3 text-left"
                :class="itemClass(item)"
                :aria-current="item.id === selectedId ? 'true' : undefined"
                @click="emit('select', item.id)">
          <span class="text-body-sm font-semibold leading-tight text-ln-gray-900">{{ item.title }}</span>
          <span class="text-caption text-ln-gray-500">{{ item.subtitle }}</span>
          <span class="mt-0.5 flex items-center gap-1.5">
            <StatusPill :status="item.status" :label="item.statusLabel" />
            <span v-if="item.due" class="text-caption" :class="item.overdue ? 'font-semibold text-ln-error' : 'text-ln-gray-500'">{{ item.due }}</span>
          </span>
        </button>
      </li>
    </ul>
  </section>
</template>

<script setup>
/**
 * 3 · File de travail — liste d'objets attendant un geste, avec progression et
 * enchaînement. Réf : lot 2 (contrôle des notes), lot 1 (« À traiter »).
 * Variantes : contrôle · décision · à traiter (multi-domaines).
 * États : vide · chargement · erreur · traitée (item.done).
 *
 * ⚠ Files de DÉCISION : la liste reçue doit déjà exclure les dossiers dont
 * l'utilisateur est l'instructeur (R-02 — l'exclusion vaut à la liste ET à
 * l'acte). Le composant ne filtre rien : il affiche ce qu'on lui donne.
 *
 * Props : title · items[] · selectedId · total · state · expectedCount
 * Événements : select(id) · retry
 */
import { computed } from 'vue';
import BlockState from './internal/BlockState.vue';
import StatusPill from './StatusPill.vue';

const props = defineProps({
  title: { type: String, default: 'File de travail' },
  items: { type: Array, default: () => [] },  // [{ id, title, subtitle, status, statusLabel, due, overdue, done }]
  selectedId: { type: [String, Number], default: null },
  total: { type: Number, default: 0 },
  state: { type: String, default: 'ready' },   // ready | loading | empty | error
  stateTitle: { type: String, default: 'Rien à traiter' },
  stateMessage: { type: String, default: '' },
  expectedCount: { type: [Number, String], default: null },
});
const emit = defineEmits(['select', 'retry']);

const doneCount = computed(() => props.items.filter((i) => i.done).length);

function itemClass(item) {
  const out = [];
  if (item.done) out.push('opacity-55');
  if (item.id === props.selectedId) out.push('bg-ln-blue-50 shadow-[inset_2px_0_0_var(--ln-blue-800)]');
  else out.push('hover:bg-ln-gray-50');
  return out.join(' ');
}
</script>
