<script setup>
// PlanningWeek — vue semaine en grille 5 colonnes (lun-ven)
// Mobile (< 768px) : fallback vers PlanningAgenda (grille trop étroite)
// Phase 5 — consommé par PlanningPage
import { computed } from 'vue';
import PlanningAgenda from './PlanningAgenda.vue';
import { formatTimeRange, getSessionState, getWeekStart, addDaysIso } from '@/utils/planning';

const props = defineProps({
  sessions: { type: Array, required: true },
  currentDate: { type: String, required: true }, // ISO YYYY-MM-DD
});

const weekStart = computed(() => getWeekStart(props.currentDate));

// 5 days (Lun à Ven) — on pourrait étendre à 7 mais le samedi/dimanche est rarement utilisé
const weekDays = computed(() => {
  const days = [];
  for (let i = 0; i < 5; i++) {
    const iso = addDaysIso(weekStart.value, i);
    const d = new Date(iso + 'T00:00:00');
    days.push({
      iso,
      label: d.toLocaleDateString('fr-FR', { weekday: 'short' }),
      dayNumber: d.getDate(),
      isToday: iso === new Date().toISOString().slice(0, 10),
    });
  }
  return days;
});

const sessionsByDay = computed(() => {
  const map = {};
  for (const day of weekDays.value) map[day.iso] = [];
  for (const s of props.sessions) {
    if (map[s.date]) map[s.date].push(s);
  }
  for (const iso in map) {
    map[iso].sort((a, b) => (a.from_time || '').localeCompare(b.from_time || ''));
  }
  return map;
});

function barColor(state) {
  if (state === 'current') return 'bg-accent-500';
  if (state === 'past') return 'bg-neutral-300';
  return 'bg-brand-900';
}
</script>

<template>
  <!-- Mobile fallback -->
  <div class="md:hidden">
    <PlanningAgenda :sessions="sessions" />
  </div>

  <!-- Desktop grid -->
  <div class="hidden md:grid grid-cols-5 gap-3">
    <div
      v-for="day in weekDays"
      :key="day.iso"
      class="flex flex-col gap-2"
    >
      <!-- Day header -->
      <div
        class="text-center pb-2 border-b"
        :class="day.isToday ? 'border-brand-900' : 'border-subtle'"
      >
        <div
          class="text-[10px] font-semibold uppercase tracking-wider"
          :class="day.isToday ? 'text-brand-900' : 'text-neutral-500'"
        >
          {{ day.label }}
        </div>
        <div
          class="text-xl font-bold mt-1"
          :class="day.isToday ? 'text-brand-900' : 'text-neutral-950'"
        >
          {{ day.dayNumber }}
        </div>
      </div>

      <!-- Sessions of the day -->
      <div v-if="sessionsByDay[day.iso].length === 0" class="text-center py-2">
        <span class="text-xs text-neutral-400">—</span>
      </div>
      <div
        v-for="s in sessionsByDay[day.iso]"
        :key="s.name"
        class="bg-white rounded-md border border-subtle p-2.5 flex gap-2"
        :class="{ 'opacity-60': getSessionState(s) === 'past' }"
      >
        <div
          class="w-1 self-stretch rounded-xs flex-shrink-0"
          :class="barColor(getSessionState(s))"
          aria-hidden="true"
        ></div>
        <div class="min-w-0 flex-1">
          <div class="text-xs font-semibold text-neutral-950 truncate">
            {{ s.title }}
          </div>
          <div class="text-[10px] text-neutral-500 mt-0.5">
            {{ formatTimeRange(s) }}
          </div>
          <div v-if="s.room" class="text-[10px] text-neutral-500 truncate">
            {{ s.room }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
