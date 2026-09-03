<template>
  <section class="overflow-hidden rounded-md-ln border border-ln-gray-200 bg-white" :aria-label="title">
    <header class="flex flex-wrap items-center gap-4 border-b border-ln-gray-200 px-5 py-4">
      <h4 class="text-[15px] font-semibold text-ln-gray-900">{{ title }}</h4>
      <p class="ml-auto flex gap-4 text-caption">
        <span class="text-ln-success"><b class="tabular">{{ report.ok }}</b> {{ okLabel }}</span>
        <span v-if="report.ko" class="text-ln-error"><b class="tabular">{{ report.ko }}</b> {{ koLabel }}</span>
        <span class="text-ln-gray-500"><b class="tabular">{{ report.total }}</b> traitées</span>
      </p>
    </header>

    <ol>
      <li v-for="line in orderedLines" :key="line.id"
          class="grid min-h-[40px] grid-cols-[24px_1fr_200px_118px] items-center gap-4 border-b border-ln-gray-100 px-5 text-body-sm last:border-0"
          :class="line.status === 'ko' ? 'bg-ln-error-bg' : ''">
        <span class="grid h-4 w-4 place-items-center rounded-full text-[10px] font-bold text-white"
              :class="line.status === 'ko' ? 'bg-ln-error' : 'bg-ln-success'" aria-hidden="true">
          {{ line.status === 'ko' ? '!' : '✓' }}
        </span>
        <span class="truncate text-ln-gray-900">{{ line.label }}</span>
        <span class="truncate text-caption" :class="line.status === 'ko' ? 'text-ln-error' : 'text-ln-gray-500'">
          {{ line.status === 'ko' ? line.reason : line.detail }}
        </span>
        <span class="text-right">
          <button v-if="line.retry_action" type="button" class="ln-btn-secondary h-7 px-2.5 text-caption" @click="emit('retry-line', line.id)">
            {{ line.retry_action }}
          </button>
        </span>
        <span class="sr-only">{{ line.status === 'ko' ? 'Échec' : 'Réussite' }}</span>
      </li>
    </ol>

    <footer class="flex flex-wrap items-center gap-3 border-t border-ln-gray-200 bg-ln-gray-50 px-5 py-4">
      <p class="mr-auto text-caption text-ln-gray-500">{{ footnote }}</p>
      <slot name="secondary" />
      <!-- ⚠️ La reprise n'est pas toujours possible : elle demande un point
           d'entrée. `retryable` par défaut à vrai, faux quand aucun chemin
           n'existe — un bouton muet est pire qu'un bouton absent. -->
      <button v-if="report.ko && retryable" type="button" class="ln-btn-primary" @click="emit('retry-failed')">
        Reprendre les {{ report.ko }} en échec
      </button>
    </footer>
  </section>
</template>

<script setup>
/**
 * 13 · Rapport ligne par ligne — résultat d'un traitement en masse.
 * Réf : lot 4 §1, né du dessin. Variantes : peuplement de groupe · publication
 * de planning · réouverture d'accès · reprise d'inscriptions · intégration.
 * États : en cours · succès · SUCCÈS PARTIEL · échec total.
 *
 * Le succès partiel n'est pas un état qui s'ajoute après coup : c'est la forme
 * NORMALE du traitement en masse. Le rapport ne dit pas « 8 sur 10 » — il nomme
 * les deux qui ont échoué, dit pourquoi, et laisse reprendre celles-là SEULES.
 * Ne jamais écrire « terminé avec des erreurs » : cela pousse à tout relancer,
 * ce qui produit des doublons.
 *
 * Consomme le CONTRAT DE RAPPORT (D-06) :
 *   { total, ok, ko, lines: [{ id, label, detail, status, reason, retry_action }] }
 */
import { computed } from 'vue';

const props = defineProps({
  title: { type: String, required: true },
  report: { type: Object, required: true },
  okLabel: { type: String, default: 'réussies' },
  koLabel: { type: String, default: 'en échec' },
  footnote: { type: String, default: '' },
  failuresFirst: { type: Boolean, default: false },
  // Faux quand aucun point d'entrée de reprise n'existe : le bouton n'est alors
  // pas rendu, jamais rendu puis inerte.
  retryable: { type: Boolean, default: true },
});
const emit = defineEmits(['retry-line', 'retry-failed']);

// Les réussites ne sont jamais masquables : savoir ce qui est passé compte
// autant que savoir ce qui a échoué.
const orderedLines = computed(() => {
  const lines = props.report.lines || [];
  if (!props.failuresFirst) return lines;
  return [...lines].sort((a, b) => (a.status === b.status ? 0 : a.status === 'ko' ? -1 : 1));
});
</script>
