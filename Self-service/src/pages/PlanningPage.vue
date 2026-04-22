<script setup>
// PlanningPage — wrapper avec 4 vues (agenda / jour / semaine / mois) + export iCal
// Phase 5 — remplace la version placeholder de Phase 3
import { ref, computed, reactive, watch } from 'vue';
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
  toLocalIsoDate,
  normalizePlanningSession,
} from '@/utils/planning';

const currentView = ref('agenda');
const currentDate = ref(toLocalIsoDate(new Date()));

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

const planning = reactive({
  data: null,
  loading: false,
  error: null,
});

let requestSeq = 0;

async function fetchWithRange(range) {
  const seq = ++requestSeq;
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
    if (seq !== requestSeq) return;
    planning.data = json.message || json;
  } catch (err) {
    if (seq !== requestSeq) return;
    planning.error = err;
  } finally {
    if (seq !== requestSeq) return;
    planning.loading = false;
  }
}

watch(
  [currentView, currentDate],
  () => {
    fetchWithRange(fetchRange.value);
  },
  { immediate: true },
);

const sessions = computed(() =>
  (planning.data?.payload?.sessions || []).map((session) =>
    normalizePlanningSession(session),
  ),
);

function shiftCurrentDate(days) {
  currentDate.value = addDaysIso(currentDate.value, days);
}

function previousPeriod() {
  if (currentView.value === 'month') {
    const nextDate = new Date(`${currentDate.value}T00:00:00`);
    nextDate.setMonth(nextDate.getMonth() - 1);
    currentDate.value = toLocalIsoDate(nextDate);
    return;
  }
  shiftCurrentDate(currentView.value === 'day' ? -1 : -7);
}

function nextPeriod() {
  if (currentView.value === 'month') {
    const nextDate = new Date(`${currentDate.value}T00:00:00`);
    nextDate.setMonth(nextDate.getMonth() + 1);
    currentDate.value = toLocalIsoDate(nextDate);
    return;
  }
  shiftCurrentDate(currentView.value === 'day' ? 1 : 7);
}

function navigateToday() {
  currentDate.value = toLocalIsoDate(new Date());
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
      <h1 class="text-2xl font-bold text-ln-gray-900 mb-1">Planning</h1>
      <p class="text-sm text-ln-gray-600">Vos prochaines séances de cours.</p>
    </header>

    <PlanningToolbar
      :period-label="periodLabel"
      :current-view="currentView"
      @prev="previousPeriod"
      @next="nextPeriod"
      @today="navigateToday"
      @change-view="currentView = $event"
    />

    <BlockSkeleton v-if="planning.loading" :lines="5" :show-title="false" />

    <BlockError
      v-else-if="planning.error"
      title="Planning indisponible"
      :message="planning.error.message || 'Erreur réseau'"
      :retry="() => fetchWithRange(fetchRange.value)"
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
        class="inline-flex items-center gap-2 text-xs font-semibold text-ln-blue-900 hover:text-ln-blue-700 px-4 py-2 rounded-md border border-ln-gray-200 hover:border-ln-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px]"
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
