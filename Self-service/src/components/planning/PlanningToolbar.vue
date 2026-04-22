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
  <div class="grid gap-3 rounded-xl border border-ln-gray-200 bg-white p-3 shadow-card md:grid-cols-[auto_1fr_auto] md:items-center">
    <div class="flex">
      <button
        type="button"
        class="min-h-[40px] rounded-md border border-ln-blue-200 bg-white px-4 text-xs font-bold uppercase tracking-wide text-ln-blue-900 hover:bg-ln-blue-50 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
        @click="emit('today')"
      >
        Aujourd'hui
      </button>
    </div>

    <!-- Navigation temporelle -->
    <div class="flex items-center justify-center gap-2">
      <button
        type="button"
        class="grid min-h-[40px] min-w-[40px] place-items-center rounded-md text-ln-gray-500 hover:bg-ln-gray-100 hover:text-ln-gray-900 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
        :aria-label="'Période précédente'"
        @click="emit('prev')"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <span class="min-w-0 px-2 text-center text-base font-semibold text-ln-gray-900 first-letter:uppercase md:min-w-[240px]">
        {{ periodLabel || 'Planning' }}
      </span>

      <button
        type="button"
        class="grid min-h-[40px] min-w-[40px] place-items-center rounded-md text-ln-gray-500 hover:bg-ln-gray-100 hover:text-ln-gray-900 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
        :aria-label="'Période suivante'"
        @click="emit('next')"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>

    <!-- Sélecteur de vue -->
    <div
      class="flex justify-self-start overflow-hidden rounded-md border border-ln-gray-200 md:justify-self-end"
      role="tablist"
      aria-label="Sélecteur de vue"
    >
      <button
        v-for="v in views"
        :key="v.id"
        type="button"
        role="tab"
        :aria-selected="currentView === v.id"
        class="min-h-[40px] px-3 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ln-blue-500/25"
        :class="currentView === v.id
          ? 'bg-ln-blue-900 text-white'
          : 'bg-white text-ln-gray-600 hover:bg-ln-gray-100'"
        @click="emit('change-view', v.id)"
      >
        {{ v.label }}
      </button>
    </div>
  </div>
</template>
