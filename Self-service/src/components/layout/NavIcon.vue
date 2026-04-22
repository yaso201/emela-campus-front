<template>
  <!-- NavIcon — Icônes Lucide pour la navigation (SideNav/BottomNav) -->
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    :class="$attrs.class"
  >
    <!-- Home -->
    <template v-if="name === 'home'">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </template>

    <!-- Calendar -->
    <template v-else-if="name === 'calendar'">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </template>

    <!-- Chart (Résultats) -->
    <template v-else-if="name === 'chart'">
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </template>

    <!-- Star (Évaluations) -->
    <template v-else-if="name === 'star'">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </template>

    <!-- Briefcase (Stage) -->
    <template v-else-if="name === 'briefcase'">
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </template>

    <!-- BarChart (Pilotage) -->
    <template v-else-if="name === 'bar-chart'">
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </template>

    <!-- HelpCircle (Support) -->
    <template v-else-if="name === 'help-circle'">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" x2="12.01" y1="17" y2="17" />
    </template>

    <!-- Bell (Notifications) -->
    <template v-else-if="name === 'bell'">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </template>

    <!-- FileText (Documents) -->
    <template v-else-if="name === 'file-text'">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </template>

    <!-- Default (circle) -->
    <template v-else>
      <circle cx="12" cy="12" r="10" />
    </template>
  </svg>
</template>

<script setup>
defineProps({
  name: { type: String, required: true },
});
</script>
