<template>
  <section class="overflow-hidden rounded-md-ln border border-ln-gray-200" :aria-label="title || 'Objet'">
    <header v-if="title" class="flex items-start gap-4 border-b border-ln-gray-200 px-5 py-4">
      <div>
        <h3 class="text-h2 text-ln-gray-900">{{ title }}</h3>
        <p v-if="subtitle" class="mt-0.5 text-caption text-ln-gray-500">{{ subtitle }}</p>
      </div>
      <div class="ml-auto flex items-center gap-2"><slot name="header-right" /></div>
    </header>

    <BlockState v-if="state !== 'ready'" :state="state" :title="stateTitle" :message="stateMessage"
                :rows="5" :skeleton-widths="[160, 240]" :row-height="44" class="m-5" @retry="emit('retry')" />

    <div v-else class="p-5">
      <StateBanner v-if="warning" variant="warning" :lead="warning.lead" :text="warning.text" />
      <slot />
    </div>

    <slot name="actions" />
  </section>
</template>

<script setup>
/**
 * 6 · Panneau d'objet — édition en place des champs de l'objet sélectionné.
 * Réf : lot 2, écran 1.
 * Variantes : lecture · édition · lecture avec avertissement.
 * États : vide (rien de sélectionné) · refus de droit — dans ce dernier cas la
 * page monte AccessDenied à la place, pas un panneau désactivé.
 *
 * L'avertissement arrive AVANT la frappe : modifier un objet validé le repasse
 * en brouillon, et cela se dit d'abord.
 */
import BlockState from './internal/BlockState.vue';
import StateBanner from './StateBanner.vue';

defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  warning: { type: Object, default: null },     // { lead, text }
  state: { type: String, default: 'ready' },
  stateTitle: { type: String, default: 'Sélectionnez un élément' },
  stateMessage: { type: String, default: 'Choisissez un élément dans la liste pour en voir le détail.' },
});
defineEmits(['retry']);
</script>
