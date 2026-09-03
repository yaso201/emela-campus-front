<template>
  <section class="overflow-hidden rounded-md-ln border border-ln-gray-200" aria-label="Structure">
    <header class="flex items-center gap-2 border-b border-ln-gray-200 bg-ln-gray-50 p-3">
      <label class="flex h-8 flex-1 items-center gap-1.5 rounded-sm-ln border border-ln-gray-200 bg-white px-3 text-caption">
        <svg class="h-3.5 w-3.5 text-ln-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
        <input v-model="query" type="search" placeholder="Filtrer l'arbre…" class="w-full border-0 bg-transparent p-0 text-body-sm text-ln-gray-900 outline-none placeholder:text-ln-gray-400" @input="emit('filter', query)" />
      </label>
      <button type="button" class="ln-btn-secondary h-8 px-2.5 text-caption" @click="emit('expand-all')">Tout déplier</button>
    </header>

    <BlockState v-if="state !== 'ready'" :state="state" :title="stateTitle" :message="stateMessage"
                :rows="6" :skeleton-widths="[24, 90, 200]" :row-height="44" class="m-4" @retry="emit('retry')" />

    <div v-else class="overflow-auto" :style="{ maxHeight: maxHeight }" role="tree">
      <div v-for="node in nodes" :key="node.id"
           class="flex min-h-[44px] items-center gap-2 border-b border-ln-gray-100 px-3"
           :class="nodeClass(node)"
           role="treeitem"
           :aria-level="node.level"
           :aria-expanded="node.children ? String(!!node.expanded) : undefined"
           :aria-selected="node.id === selectedId ? 'true' : 'false'"
           tabindex="0"
           @click="emit('select', node.id)"
           @keydown.enter.prevent="emit('select', node.id)"
           @keydown.space.prevent="emit('toggle', node.id)">
        <button v-if="node.children" type="button" class="w-3.5 text-[9px] text-ln-gray-400" :aria-label="node.expanded ? 'Replier' : 'Déplier'" @click.stop="emit('toggle', node.id)">
          {{ node.expanded ? '▾' : '▸' }}
        </button>
        <span v-else class="w-3.5" aria-hidden="true"></span>
        <span v-if="node.code" class="flex-shrink-0 font-mono text-[11.5px] text-ln-gray-500">{{ node.code }}</span>
        <span class="min-w-0 truncate" :class="labelClass(node)">{{ node.label }}</span>
        <span class="ml-auto flex flex-shrink-0 items-center gap-1.5">
          <svg v-if="node.shared" class="h-3.5 w-3.5 text-ln-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" :aria-label="'Mutualisée avec ' + node.shared + ' filières'"><path d="M10 13a4 4 0 0 0 6 .5l2-2a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 11a4 4 0 0 0-6-.5l-2 2A4 4 0 0 0 11.7 18l1-1" /></svg>
          <StatusPill v-if="node.status" :status="node.status" />
          <span v-if="node.metric" class="tabular text-[11.5px] font-semibold text-ln-gray-700">{{ node.metric }}</span>
        </span>
      </div>
      <button v-for="add in addActions" :key="add.key" type="button"
              class="flex min-h-[36px] w-full items-center gap-1.5 px-3 pl-5 text-left text-caption font-medium text-ln-blue-600"
              @click="emit('add', add.key)">
        <span aria-hidden="true">+</span> {{ add.label }}
      </button>
    </div>
  </section>
</template>

<script setup>
/**
 * 5 · Éditeur d'arbre — hiérarchie profonde, dépliage, sélection, ajout en place.
 * Réf : lot 2, écran 1. Filière → niveau → unité → modules → volumes.
 * Variantes : structure de maquette · catalogue.
 * États : vide · chargement · nœud en erreur.
 *
 * L'arbre reçoit une liste APLATIE (node.level porte la profondeur) : c'est ce
 * qui permet le défilement virtuel plus tard sans changer le contrat.
 * Props : nodes[] · selectedId · addActions[] · state · maxHeight
 * Événements : select(id) · toggle(id) · add(key) · filter(q) · expand-all · retry
 */
import { ref } from 'vue';
import BlockState from './internal/BlockState.vue';
import StatusPill from './StatusPill.vue';

const props = defineProps({
  nodes: { type: Array, default: () => [] },  // [{ id, level, label, code, metric, status, shared, children, expanded }]
  selectedId: { type: [String, Number], default: null },
  addActions: { type: Array, default: () => [] },  // [{ key, label }]
  state: { type: String, default: 'ready' },
  stateTitle: { type: String, default: 'Aucune structure' },
  stateMessage: { type: String, default: '' },
  maxHeight: { type: String, default: '640px' },
});
const emit = defineEmits(['select', 'toggle', 'add', 'filter', 'expand-all', 'retry']);

const query = ref('');

const INDENT = { 1: 'pl-3', 2: 'pl-5', 3: 'pl-10' };

function nodeClass(node) {
  const out = [INDENT[node.level] || 'pl-3'];
  if (node.level === 1) out.push('bg-ln-gray-50 font-semibold');
  if (node.level === 3) out.push('min-h-[36px]');
  if (node.id === props.selectedId) out.push('bg-ln-blue-50 shadow-[inset_2px_0_0_var(--ln-blue-800)]');
  else out.push('hover:bg-ln-gray-50');
  return out.join(' ');
}
function labelClass(node) {
  if (node.level === 1) return 'text-caption font-semibold uppercase tracking-wide text-ln-gray-500';
  if (node.level === 2) return 'text-body-sm font-semibold text-ln-gray-900';
  return 'text-body-sm text-ln-gray-700';
}
</script>
