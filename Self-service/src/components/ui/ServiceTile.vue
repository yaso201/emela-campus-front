<script setup>
// ServiceTile — tuile de service avec icône + titre
// Réf visuelle : specs-interfaces/mela_component_library_reference.html §ServiceTile
// Utilise un slot pour l'icône afin que le parent fournisse n'importe quel SVG.
import { computed } from 'vue';

const props = defineProps({
  title: { type: String, required: true },
  url: { type: String, default: '#' },
  external: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});

const Tag = computed(() => (props.disabled ? 'div' : 'a'));
const href = computed(() => (props.disabled ? undefined : props.url));
const target = computed(() => (props.external ? '_blank' : undefined));
const rel = computed(() => (props.external ? 'noopener noreferrer' : undefined));
</script>

<template>
  <component
    :is="Tag"
    :href="href"
    :target="target"
    :rel="rel"
    class="bg-white rounded-lg border border-subtle p-4 text-center block relative min-h-[44px] focus:outline-none focus:ring-2 focus:ring-brand-500/25"
    :class="disabled
      ? 'opacity-40 cursor-not-allowed'
      : 'cursor-pointer hover:border-default transition-colors'"
    :aria-disabled="disabled ? 'true' : undefined"
  >
    <svg
      v-if="external && !disabled"
      width="10"
      height="10"
      viewBox="0 0 12 12"
      class="absolute top-2 right-2 text-neutral-400"
      role="img"
      aria-label="Ouvre dans un nouvel onglet"
    >
      <path
        d="M3 9L9 3M9 3H4M9 3v5"
        stroke="currentColor"
        stroke-width="1.2"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
      />
    </svg>

    <div
      class="w-9 h-9 rounded-md flex items-center justify-center mx-auto mb-2"
      :class="disabled ? 'bg-neutral-100' : 'bg-brand-50'"
    >
      <slot name="icon" />
    </div>

    <div
      class="text-xs font-medium"
      :class="disabled ? 'text-neutral-400' : 'text-neutral-950'"
    >
      {{ title }}
    </div>
  </component>
</template>
