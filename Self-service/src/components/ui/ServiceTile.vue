<script setup>
// ServiceTile — tuile de service avec icône + titre
// Réf visuelle : specs-interfaces/mela_component_library_reference.html §ServiceTile
// Utilise un slot pour l'icône afin que le parent fournisse n'importe quel SVG.
import { computed } from 'vue';

const props = defineProps({
  title: { type: String, required: true },
  url: { type: String, default: '' },
  external: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});

const isExternal = computed(() => props.external && props.url && !props.disabled);
const isInternal = computed(() => !props.external && props.url && !props.disabled);
const isDisabled = computed(() => props.disabled || !props.url);
</script>

<template>
  <!-- Lien interne SPA -->
  <router-link
    v-if="isInternal"
    :to="url"
    class="bg-white rounded-lg border border-ln-gray-200 p-4 text-center block relative min-h-[44px] focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 cursor-pointer hover:border-ln-gray-200 transition-colors"
  >
    <!-- Icône externe (visible uniquement pour liens externes) -->
    <svg
      v-if="isExternal"
      width="10"
      height="10"
      viewBox="0 0 12 12"
      class="absolute top-2 right-2 text-ln-gray-400"
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

    <div class="w-9 h-9 rounded-md flex items-center justify-center mx-auto mb-2 bg-ln-blue-50">
      <slot name="icon" />
    </div>

    <div class="text-xs font-medium text-ln-gray-900">
      {{ title }}
    </div>
    <slot name="subtitle" />
  </router-link>

  <!-- Lien externe -->
  <a
    v-else-if="isExternal"
    :href="url"
    target="_blank"
    rel="noopener noreferrer"
    class="bg-white rounded-lg border border-ln-gray-200 p-4 text-center block relative min-h-[44px] focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 cursor-pointer hover:border-ln-gray-200 transition-colors"
  >
    <svg
      width="10"
      height="10"
      viewBox="0 0 12 12"
      class="absolute top-2 right-2 text-ln-gray-400"
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

    <div class="w-9 h-9 rounded-md flex items-center justify-center mx-auto mb-2 bg-ln-blue-50">
      <slot name="icon" />
    </div>

    <div class="text-xs font-medium text-ln-gray-900">
      {{ title }}
    </div>
    <slot name="subtitle" />
  </a>

  <!-- Désactivé -->
  <div
    v-else
    class="bg-white rounded-lg border border-ln-gray-200 p-4 text-center block relative min-h-[44px] opacity-40 cursor-not-allowed"
    aria-disabled="true"
  >
    <div class="w-9 h-9 rounded-md flex items-center justify-center mx-auto mb-2 bg-ln-gray-100">
      <slot name="icon" />
    </div>

    <div class="text-xs font-medium text-ln-gray-400">
      {{ title }}
    </div>
    <slot name="subtitle" />
  </div>
</template>
