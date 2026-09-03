<template>
  <section class="flex items-start gap-4 rounded-md-ln border border-ln-gray-200 bg-ln-gray-50 p-5" role="status">
    <svg class="mt-px h-[18px] w-[18px] flex-shrink-0 text-ln-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    </svg>
    <div>
      <h4 class="text-h3 text-ln-gray-900">{{ title }}</h4>
      <p class="mt-1 text-body-sm leading-relaxed text-ln-gray-700"><slot>{{ message }}</slot></p>
      <p v-if="untilLabel" class="mt-2 text-body-sm leading-relaxed text-ln-gray-700">{{ untilLabel }}</p>

      <template v-if="allowed.length">
        <p class="mt-2 text-body-sm font-semibold text-ln-gray-900">Restent accessibles :</p>
        <ul class="mt-3 flex flex-wrap gap-1.5">
          <li v-for="a in allowed" :key="a" class="inline-flex min-h-[26px] items-center rounded-sm-ln bg-ln-gray-100 px-3 py-1 text-caption font-medium text-ln-gray-700">{{ a }}</li>
        </ul>
      </template>

      <StateBanner v-if="missingChannel" class="mt-3" variant="warning"
                   lead="Ce canal n'existe pas encore."
                   :text="missingChannel" />
      <slot name="contact" />
    </div>
  </section>
</template>

<script setup>
/**
 * 14 · Refus expliqué — une vue fermée dit pourquoi, jusqu'à quand, et ce qui
 * reste ouvert. Réf : règle 5, lot 3 (vue 4), lot 5 (écran 6).
 * Variantes : statut hors cursus · période disciplinaire · accès expiré ·
 * droit absent.
 *
 * Monté sur err.code === 'PERMISSION_DENIED' — JAMAIS ErrorState, jamais une
 * page vide, jamais une erreur technique. Les details du refus portent
 * { status, since, days_left, allowed[] } et le message est rédigé serveur.
 *
 * Quand le canal de sortie n'existe pas (trou T1), on le NOMME au lieu
 * d'afficher un bouton qui ne mènerait nulle part.
 */
import StateBanner from './StateBanner.vue';

defineProps({
  title: { type: String, required: true },
  message: { type: String, default: '' },
  untilLabel: { type: String, default: '' },
  allowed: { type: Array, default: () => [] },
  missingChannel: { type: String, default: '' },
});
</script>
