<script setup>
// PlanningPage — wrapper avec 4 vues (agenda / jour / semaine / mois) + export iCal
// Phase 5 — remplace la version placeholder de Phase 3
import { ref, computed, watch } from 'vue';
import { useFrappeCall } from '@/composables/useFrappeCall';
import PlanningToolbar from '@/components/planning/PlanningToolbar.vue';
import PlanningAgenda from '@/components/planning/PlanningAgenda.vue';
import PlanningDay from '@/components/planning/PlanningDay.vue';
import PlanningWeek from '@/components/planning/PlanningWeek.vue';
import PlanningMonth from '@/components/planning/PlanningMonth.vue';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import BlockError from '@/components/ui/BlockError.vue';
import {
  getWeekStart,
  getWeekEnd,
  getMonthStart,
  getMonthEnd,
  addDaysIso,
  formatDayLabel,
  formatWeekLabel,
  formatMonthLabel,
} from '@/utils/planning';

const currentView = ref('agenda');
const currentDate = ref(new Date().toISOString().slice(0, 10));

// Compute range to fetch based on current view + date
const fetchRange = computed(() => {
  if (currentView.value === 'day') {
    return { start_date: currentDate.value, end_date: currentDate.value };
  }
  if (currentView.value === 'week') {
    return { start_date: getWeekStart(currentDate.value), end_date: getWeekEnd(currentDate.value) };
  }
  if (currentView.value === 'month') {
    return { start_date: getMonthStart(currentDate.value), end_date: getMonthEnd(currentDate.value) };
  }
  // agenda: fetch 2 weeks around currentDate
  return {
    start_date: addDaysIso(currentDate.value, -7),
    end_date: addDaysIso(currentDate.value, 14),
  };
});

const planning = useFrappeCall(
  'portal_app.api.cockpit.get_planning_range',
  fetchRange.value,
  { auto: false },
);

// Initial fetch at mount
planning.reload();

// Re-fetch when view or date changes
watch([currentView, currentDate], () => {
  // Update params in place
  Object.assign(planning, { loading: true });
  // Use updated range
  const range = fetchRange.value;
  // Rebuild call with new params (simple inline for minimal change)
  fetchWithRange(range);
});

async function fetchWithRange(range) {
  planning.loading = true;
  planning.error = null;
  try {
    const formData = new URLSearchParams();
    formData.append('start_date', range.start_date);
    formData.append('end_date', range.end_date);

    const response = await fetch(
      '/api/method/portal_app.api.cockpit.get_planning_range',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Frappe-CSRF-Token': window.csrf_token || '',
          'Accept': 'application/json',
        },
        body: formData.toString(),
        credentials: 'same-origin',
      },
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    planning.data = json.message || json;
  } catch (err) {
    planning.error = err;
  } finally {
    planning.loading = false;
  }
}

const sessions = computed(() => planning.data?.payload?.sessions || []);

// Navigation handlers
function navigatePrev() {
  if (currentView.value === 'day') currentDate.value = addDaysIso(currentDate.value, -1);
  else if (currentView.value === 'week') currentDate.value = addDaysIso(currentDate.value, -7);
  else if (currentView.value === 'month') {
    const d = new Date(currentDate.value + 'T00:00:00');
    d.setMonth(d.getMonth() - 1);
    currentDate.value = d.toISOString().slice(0, 10);
  } else {
    currentDate.value = addDaysIso(currentDate.value, -7);
  }
}

function navigateNext() {
  if (currentView.value === 'day') currentDate.value = addDaysIso(currentDate.value, 1);
  else if (currentView.value === 'week') currentDate.value = addDaysIso(currentDate.value, 7);
  else if (currentView.value === 'month') {
    const d = new Date(currentDate.value + 'T00:00:00');
    d.setMonth(d.getMonth() + 1);
    currentDate.value = d.toISOString().slice(0, 10);
  } else {
    currentDate.value = addDaysIso(currentDate.value, 7);
  }
}

function navigateToday() {
  currentDate.value = new Date().toISOString().slice(0, 10);
}

function onSelectDay(iso) {
  currentDate.value = iso;
  currentView.value = 'day';
}

// Period label for toolbar
const periodLabel = computed(() => {
  if (currentView.value === 'day') return formatDayLabel(currentDate.value);
  if (currentView.value === 'week') return formatWeekLabel(currentDate.value);
  if (currentView.value === 'month') return formatMonthLabel(currentDate.value);
  return '';
});

// Export iCal — uses existing backend API (no new code)
function exportIcal() {
  window.open('/api/method/portal_app.api.campus_services.export_planning_ical', '_blank');
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <header>
      <h1 class="text-2xl font-bold text-neutral-950 mb-1">Planning</h1>
      <p class="text-sm text-neutral-600">Vos prochaines séances de cours.</p>
    </header>

    <PlanningToolbar
      :period-label="periodLabel"
      :current-view="currentView"
      @prev="navigatePrev"
      @next="navigateNext"
      @today="navigateToday"
      @change-view="currentView = $event"
    />

    <BlockSkeleton v-if="planning.loading" :lines="5" :show-title="false" />

    <BlockError
      v-else-if="planning.error"
      title="Planning indisponible"
      :message="planning.error.message || 'Erreur réseau'"
      :retry="() => fetchWithRange(fetchRange)"
    />

    <PlanningAgenda v-else-if="currentView === 'agenda'" :sessions="sessions" />
    <PlanningDay v-else-if="currentView === 'day'" :sessions="sessions" :date="currentDate" />
    <PlanningWeek v-else-if="currentView === 'week'" :sessions="sessions" :current-date="currentDate" />
    <PlanningMonth
      v-else-if="currentView === 'month'"
      :sessions="sessions"
      :current-date="currentDate"
      @select-day="onSelectDay"
    />

    <!-- Export iCal -->
    <div class="flex justify-end">
      <button
        type="button"
        class="inline-flex items-center gap-2 text-xs font-semibold text-brand-900 hover:text-brand-700 px-4 py-2 rounded-md border border-default hover:border-strong transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/25 min-h-[44px]"
        @click="exportIcal"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        Ajouter à mon calendrier (.ics)
      </button>
    </div>
  </div>
</template>
