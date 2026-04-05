<script setup>
// PlanningMonth — vue mois en grille calendrier 7 colonnes
// Chaque cellule = 1 jour ; clic sur une cellule émet 'select-day' pour drill-down vers PlanningDay
// Phase 5 — consommé par PlanningPage
import { computed } from 'vue';
import { getMonthStart, getMonthEnd, addDaysIso } from '@/utils/planning';

const props = defineProps({
  sessions: { type: Array, required: true },
  currentDate: { type: String, required: true }, // ISO YYYY-MM-DD
});

const emit = defineEmits(['select-day']);

const monthStart = computed(() => getMonthStart(props.currentDate));
const monthEnd = computed(() => getMonthEnd(props.currentDate));

// Build 6×7 grid starting from the Monday before or equal to monthStart
const gridDays = computed(() => {
  const start = new Date(monthStart.value + 'T00:00:00');
  // Align to Monday (European calendar)
  const dayOfWeek = start.getDay(); // 0=Sun..6=Sat
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  start.setDate(start.getDate() - daysFromMonday);

  const monthStartDate = new Date(monthStart.value + 'T00:00:00');
  const todayIso = new Date().toISOString().slice(0, 10);

  const days = [];
  for (let i = 0; i < 42; i++) {
    const iso = start.toISOString().slice(0, 10);
    days.push({
      iso,
      day: start.getDate(),
      inCurrentMonth: start.getMonth() === monthStartDate.getMonth(),
      isToday: iso === todayIso,
    });
    start.setDate(start.getDate() + 1);
  }
  return days;
});

const sessionCountByDay = computed(() => {
  const map = {};
  for (const s of props.sessions) {
    if (!s.date) continue;
    map[s.date] = (map[s.date] || 0) + 1;
  }
  return map;
});

const weekdayHeaders = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function selectDay(iso) {
  emit('select-day', iso);
}
</script>

<template>
  <div class="bg-white rounded-lg border border-subtle overflow-hidden">
    <!-- Weekday headers -->
    <div class="grid grid-cols-7 border-b border-subtle">
      <div
        v-for="(wd, i) in weekdayHeaders"
        :key="wd"
        class="text-center py-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-500"
        :class="i >= 5 ? 'text-neutral-400' : ''"
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
        class="aspect-square p-2 text-left border-b border-r border-subtle last:border-r-0 hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500/25 transition-colors flex flex-col"
        :class="[
          !cell.inCurrentMonth ? 'bg-neutral-50' : 'bg-white',
          cell.isToday ? 'ring-2 ring-inset ring-brand-900' : '',
        ]"
        @click="selectDay(cell.iso)"
      >
        <span
          class="text-sm font-medium"
          :class="[
            cell.inCurrentMonth ? 'text-neutral-950' : 'text-neutral-400',
            cell.isToday ? 'text-brand-900 font-bold' : '',
          ]"
        >
          {{ cell.day }}
        </span>
        <div
          v-if="sessionCountByDay[cell.iso]"
          class="mt-auto flex items-center gap-1"
        >
          <span
            class="w-1.5 h-1.5 rounded-full"
            :class="cell.inCurrentMonth ? 'bg-brand-900' : 'bg-neutral-300'"
            aria-hidden="true"
          ></span>
          <span
            class="text-[10px] font-semibold tabular-nums"
            :class="cell.inCurrentMonth ? 'text-brand-900' : 'text-neutral-400'"
          >
            {{ sessionCountByDay[cell.iso] }}
          </span>
        </div>
      </button>
    </div>
  </div>
</template>
