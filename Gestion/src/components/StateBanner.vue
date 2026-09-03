<template>
  <div class="flex items-start gap-3 rounded-md-ln border text-body-sm leading-relaxed" :class="[tone.wrap, compact ? 'mb-2 px-3 py-2' : 'mb-4 px-4 py-3']" :role="variant === 'error' ? 'alert' : 'note'">
    <svg class="mt-px h-4 w-4 flex-shrink-0" :class="tone.icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <template v-if="variant === 'info'"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.6v.2" /></template>
      <template v-else-if="variant === 'success'"><circle cx="12" cy="12" r="9" /><path d="m8.5 12.2 2.4 2.4 4.6-5" /></template>
      <template v-else><path d="M12 4 2.5 20h19z" /><path d="M12 10v4.5M12 17.4v.2" /></template>
    </svg>
    <div>
      <span v-if="lead" class="font-semibold" :class="tone.lead">{{ lead }}</span>
      <span v-if="lead"> </span><slot>{{ text }}</slot>
    </div>
  </div>
</template>

<script setup>
/**
 * 10 · Bandeau d'état — une information, un avertissement ou un blocage
 * attaché à la vue. Réf : lot 4 §1.
 * Props : variant ('info'|'success'|'warning'|'error') · lead · text · compact
 *
 * La variante « success » et la forme compacte servent les TROIS REGISTRES de la
 * détection de conflits du planning : blocage (error), signal (warning),
 * confirmation (success). Le vert compte autant que le rouge — sans lui, on ne
 * sait pas si la vérification a tourné. Amendement du composant 10, pas un
 * seizième composant.
 */
import { computed } from 'vue';

const props = defineProps({
  variant: { type: String, default: 'info' },
  lead: { type: String, default: '' },
  text: { type: String, default: '' },
  compact: { type: Boolean, default: false },
});

const TONES = {
  info:    { wrap: 'border-ln-blue-200 bg-ln-blue-100/60 text-ln-gray-700', icon: 'text-ln-blue-700', lead: 'text-ln-blue-900' },
  success: { wrap: 'border-[#BFE5D5] bg-ln-success-bg text-[#0B5341]',      icon: 'text-ln-success',  lead: 'text-ln-success' },
  warning: { wrap: 'border-[#F3D9A6] bg-ln-warning-bg text-[#6B4415]',      icon: 'text-ln-warning',  lead: 'text-ln-warning' },
  error:   { wrap: 'border-[#F3C6C6] bg-ln-error-bg text-[#7A2020]',        icon: 'text-ln-error',    lead: 'text-ln-error' },
};
const tone = computed(() => TONES[props.variant] ?? TONES.info);
</script>
