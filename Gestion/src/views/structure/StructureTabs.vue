<template>
  <!-- « Structure » du Lot 1 : calendrier académique, catalogue des filières, éditeur de maquette — trois écrans
       sous une seule entrée de barre. Les onglets sont des LIENS de route (l'adresse dit l'écran), pas un état
       local qui se perdrait au rechargement. -->
  <nav aria-label="Structure" class="mb-4 flex gap-1 border-b border-ln-gray-200">
    <router-link v-for="t in TABS" :key="t.name" :to="{ name: t.name }"
                 class="-mb-px inline-flex h-[34px] items-center border-b-2 px-3 text-body-sm font-semibold"
                 :class="current === t.name ? 'border-ln-blue-800 text-ln-blue-900' : 'border-transparent text-ln-gray-500 hover:text-ln-gray-900'"
                 :aria-current="current === t.name ? 'page' : undefined">
      {{ t.label }}
    </router-link>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const TABS = [
  { name: 'calendar', label: 'Calendrier académique' },
  { name: 'catalogue', label: 'Catalogue des filières' },
  { name: 'structure', label: 'Maquette' },
];
const route = useRoute();
const current = computed(() => String(route.name || ''));
</script>
