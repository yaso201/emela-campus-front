<script setup>
// PlanningToolbar — barre de navigation et sélecteur de vue du planning
// Phase 5 — utilisé par PlanningPage
defineProps({
  periodLabel: { type: String, default: '' },
  currentView: { type: String, required: true },
});

const emit = defineEmits(['prev', 'next', 'today', 'change-view']);

const views = [
  { id: 'agenda', label: 'Agenda' },
  { id: 'day', label: 'Jour' },
  { id: 'week', label: 'Semaine' },
  { id: 'month', label: 'Mois' },
];
</script>

<template>
  <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
    <!-- Navigation temporelle -->
    <div class="flex items-center gap-1">
      <button
        type="button"
        class="p-2 rounded-md hover:bg-neutral-100 text-neutral-600 focus:outline-none focus:ring-2 focus:ring-brand-500/25 min-h-[44px] min-w-[44px]"
        :aria-label="'Période précédente'"
        @click="emit('prev')"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <button
        type="button"
        class="px-3 py-1.5 text-xs font-semibold rounded-md bg-brand-50 text-brand-900 hover:bg-brand-100 focus:outline-none focus:ring-2 focus:ring-brand-500/25 min-h-[44px]"
        @click="emit('today')"
      >
        Aujourd'hui
      </button>

      <button
        type="button"
        class="p-2 rounded-md hover:bg-neutral-100 text-neutral-600 focus:outline-none focus:ring-2 focus:ring-brand-500/25 min-h-[44px] min-w-[44px]"
        :aria-label="'Période suivante'"
        @click="emit('next')"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <span class="ml-2 text-sm font-medium text-neutral-950 first-letter:uppercase">
        {{ periodLabel }}
      </span>
    </div>

    <!-- Sélecteur de vue -->
    <div
      class="flex rounded-md overflow-hidden border border-default"
      role="tablist"
      aria-label="Sélecteur de vue"
    >
      <button
        v-for="v in views"
        :key="v.id"
        type="button"
        role="tab"
        :aria-selected="currentView === v.id"
        class="px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500/25 min-h-[44px]"
        :class="currentView === v.id
          ? 'bg-brand-900 text-white'
          : 'bg-white text-neutral-600 hover:bg-neutral-100'"
        @click="emit('change-view', v.id)"
      >
        {{ v.label }}
      </button>
    </div>
  </div>
</template>
