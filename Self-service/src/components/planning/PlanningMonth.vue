<script setup>
// PlanningMonth — vue mois en grille calendrier 7 colonnes
// Chaque cellule = 1 jour ; clic sur une cellule émet 'select-day' pour drill-down vers PlanningDay
// Phase 5 — consommé par PlanningPage
import { computed } from 'vue';
import {
  formatTimeRange,
  getMonthGridDays,
  normalizePlanningSession,
  sessionDate,
} from '@/utils/planning';

const props = defineProps({
  sessions: { type: Array, required: true },
  currentDate: { type: String, required: true }, // ISO YYYY-MM-DD
});

const emit = defineEmits(['select-day']);

const gridDays = computed(() => getMonthGridDays(props.currentDate));

const sessionsByDay = computed(() => {
  const map = {};
  for (const s of props.sessions) {
    const session = normalizePlanningSession(s);
    const date = sessionDate(session);
    if (!date) continue;
    if (!map[date]) map[date] = [];
    map[date].push(session);
  }
  for (const iso in map) {
    map[iso].sort((a, b) => (a.from_time || '').localeCompare(b.from_time || ''));
  }
  return map;
});

const weekdayHeaders = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function selectDay(iso) {
  emit('select-day', iso);
}
</script>

<template>
  <div class="bg-white rounded-lg border border-ln-gray-200 overflow-hidden">
    <!-- Weekday headers -->
    <div class="grid grid-cols-7 border-b border-ln-gray-200">
      <div
        v-for="(wd, i) in weekdayHeaders"
        :key="wd"
        class="text-center py-2 text-[10px] font-semibold uppercase tracking-wider text-ln-gray-500"
        :class="i >= 5 ? 'text-ln-gray-400' : ''"
      >
        {{ wd }}
      </div>
    </div>

    <!-- Days grid -->
    <div class="grid grid-cols-7">
      <button
        v-for="cell in gridDays"
        :key="cell.iso"
        type="button"
        class="aspect-square p-2 text-left border-b border-r border-ln-gray-200 last:border-r-0 hover:bg-ln-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ln-blue-500/25 transition-colors flex flex-col"
        :class="[
          !cell.inCurrentMonth ? 'bg-ln-gray-50' : cell.isWeekend ? 'bg-slate-50' : 'bg-white',
          cell.isToday ? 'ring-2 ring-inset ring-ln-blue-900' : '',
        ]"
        @click="selectDay(cell.iso)"
      >
        <span
          class="text-sm font-medium"
          :class="[
            cell.inCurrentMonth ? 'text-ln-gray-900' : 'text-ln-gray-400',
            cell.isToday ? 'text-ln-blue-900 font-bold' : '',
          ]"
        >
          {{ cell.day }}
        </span>
        <div
          v-if="sessionsByDay[cell.iso]?.length"
          class="mt-2 flex flex-col gap-1 overflow-hidden"
        >
          <span
            v-for="session in sessionsByDay[cell.iso].slice(0, 2)"
            :key="session.name || `${session.title}-${session.from_time}`"
            class="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] leading-none truncate"
            :class="cell.inCurrentMonth ? 'text-ln-blue-900' : 'text-ln-gray-400'"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-orange-400 flex-shrink-0" aria-hidden="true"></span>
            <span class="truncate">
              {{ formatTimeRange(session) }} {{ session.title }}
            </span>
          </span>
          <span
            v-if="sessionsByDay[cell.iso].length > 2"
            class="text-[10px] font-semibold text-ln-gray-500"
          >
            +{{ sessionsByDay[cell.iso].length - 2 }} autre(s)
          </span>
        </div>
      </button>
    </div>
  </div>
</template>
