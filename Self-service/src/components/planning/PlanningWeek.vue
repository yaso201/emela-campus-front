<script setup>
// PlanningWeek — vue semaine en grille 7 colonnes (lun-dim)
// Mobile (< 768px) : fallback vers PlanningAgenda (grille trop étroite)
// Phase 5 — consommé par PlanningPage
import { computed } from 'vue';
import PlanningAgenda from './PlanningAgenda.vue';
import {
  buildSessionOverlapLayout,
  clamp,
  formatTimeRange,
  getSessionVisualState,
  getWeekDays,
  normalizePlanningSession,
  sessionDurationMinutes,
  sessionDate,
  timeToMinutes,
} from '@/utils/planning';

const props = defineProps({
  sessions: { type: Array, required: true },
  currentDate: { type: String, required: true }, // ISO YYYY-MM-DD
});

const weekDays = computed(() => getWeekDays(props.currentDate));
const DAY_START_HOUR = 7;
const DAY_END_HOUR = 22;
const HOUR_HEIGHT = 68;
const hours = computed(() =>
  Array.from(
    { length: DAY_END_HOUR - DAY_START_HOUR + 1 },
    (_, index) => DAY_START_HOUR + index,
  ),
);
const timelineHeight = computed(() => (DAY_END_HOUR - DAY_START_HOUR) * HOUR_HEIGHT);

function barColor(state) {
  if (state === 'current') return 'bg-ln-blue-600';
  if (state === 'cancelled') return 'bg-ln-error';
  if (state === 'past') return 'bg-ln-gray-300';
  return 'bg-orange-500';
}

const calendarSessions = computed(() => {
  const dayIndexByIso = Object.fromEntries(
    weekDays.value.map((day, index) => [day.iso, index]),
  );

  const sessionsByDay = new Map();
  for (const rawSession of props.sessions) {
    const session = normalizePlanningSession(rawSession);
    const dayIndex = dayIndexByIso[sessionDate(session)];
    if (dayIndex === undefined) continue;
    if (!sessionsByDay.has(dayIndex)) sessionsByDay.set(dayIndex, []);
    sessionsByDay.get(dayIndex).push(session);
  }

  const items = [];
  for (const [dayIndex, daySessions] of sessionsByDay.entries()) {
    for (const layoutItem of buildSessionOverlapLayout(daySessions)) {
      items.push({
        ...layoutItem,
        dayIndex,
        state: getSessionVisualState(layoutItem.session),
      });
    }
  }

  return items.sort((a, b) =>
    a.dayIndex - b.dayIndex ||
    (a.session.from_time || '').localeCompare(b.session.from_time || ''),
  );
});

function sessionStyle(item) {
  const dayStart = DAY_START_HOUR * 60;
  const dayEnd = DAY_END_HOUR * 60;
  const start = clamp(timeToMinutes(item.session.from_time, dayStart), dayStart, dayEnd);
  const duration = sessionDurationMinutes(item.session, 60);
  const top = ((start - dayStart) / 60) * HOUR_HEIGHT;
  const height = clamp((duration / 60) * HOUR_HEIGHT, 44, timelineHeight.value - top);
  const dayWidth = 100 / 7;
  const columnWidth = dayWidth / item.columnCount;
  const leftPercent = (item.dayIndex * dayWidth) + (item.columnIndex * columnWidth);

  return {
    top: `${top}px`,
    height: `${height}px`,
    left: `calc(${leftPercent}% + 4px)`,
    width: `calc(${columnWidth}% - 8px)`,
  };
}

function sessionCardClass(state) {
  if (state === 'cancelled') return 'opacity-75 bg-ln-error-bg border-red-200';
  if (state === 'past') return 'opacity-60 bg-ln-gray-50 border-ln-gray-200';
  if (state === 'current') return 'bg-ln-blue-50 border-ln-blue-200 shadow-card';
  return 'bg-orange-50 border-orange-200 shadow-card';
}

function titleClass(state) {
  return state === 'cancelled' ? 'line-through text-ln-error' : 'text-ln-gray-900';
}
</script>

<template>
  <!-- Mobile fallback -->
  <div class="md:hidden">
    <PlanningAgenda :sessions="sessions" />
  </div>

  <!-- Desktop grid -->
  <section class="hidden md:block rounded-xl border border-ln-gray-200 bg-white shadow-card overflow-hidden">
    <div class="grid grid-cols-[64px_1fr] border-b border-ln-gray-200">
      <div class="bg-ln-gray-50"></div>
      <div class="grid grid-cols-7">
        <div
          v-for="day in weekDays"
          :key="day.iso"
          class="py-3 text-center border-l border-ln-gray-200"
          :class="day.isWeekend ? 'bg-slate-50' : 'bg-white'"
        >
          <div
            class="text-[11px] font-semibold capitalize"
            :class="day.isToday ? 'text-ln-blue-900' : day.isWeekend ? 'text-ln-gray-500' : 'text-ln-gray-600'"
          >
            {{ day.label }}
          </div>
          <div
            class="mx-auto mt-1 flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-sm font-bold"
            :class="day.isToday ? 'bg-orange-500 text-white' : 'text-ln-gray-900'"
          >
            {{ day.dayNumber }}
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-[64px_1fr]">
      <div
        class="relative border-r border-ln-gray-200 bg-ln-gray-50"
        :style="{ height: `${timelineHeight}px` }"
      >
        <div
          v-for="hour in hours"
          :key="hour"
          class="absolute right-3 -translate-y-1/2 text-xs tabular-nums text-ln-gray-500"
          :style="{ top: `${(hour - DAY_START_HOUR) * HOUR_HEIGHT}px` }"
        >
          {{ String(hour).padStart(2, '0') }}
        </div>
      </div>

      <div class="relative bg-white" :style="{ height: `${timelineHeight}px` }">
        <div class="absolute inset-0 grid grid-cols-7">
          <div
            v-for="day in weekDays"
            :key="`col-${day.iso}`"
            class="border-l border-ln-gray-200"
            :class="day.isWeekend ? 'bg-slate-50' : 'bg-white'"
          ></div>
        </div>
        <div
          v-for="hour in hours"
          :key="`line-${hour}`"
          class="absolute left-0 right-0 border-t border-ln-gray-200"
          :style="{ top: `${(hour - DAY_START_HOUR) * HOUR_HEIGHT}px` }"
        ></div>
        <div
          v-for="hour in hours.slice(0, -1)"
          :key="`half-${hour}`"
          class="absolute left-0 right-0 border-t border-ln-gray-100"
          :style="{ top: `${((hour - DAY_START_HOUR) * HOUR_HEIGHT) + (HOUR_HEIGHT / 2)}px` }"
        ></div>

        <article
          v-for="item in calendarSessions"
          :key="item.session.name || `${item.session.title}-${item.session.from_time}`"
          class="absolute rounded-lg border p-2 overflow-hidden"
          :class="sessionCardClass(item.state)"
          :style="sessionStyle(item)"
          :title="`${formatTimeRange(item.session)} · ${item.session.title}`"
        >
          <div class="flex h-full gap-2">
            <div
              class="w-1 rounded-full flex-shrink-0"
              :class="[barColor(item.state), item.state === 'current' ? 'motion-safe:animate-pulse' : '']"
              aria-hidden="true"
            ></div>
            <div class="min-w-0">
              <span class="mb-1 inline-flex rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase leading-none text-white">
                Cours
              </span>
              <h3 class="truncate text-xs font-bold" :class="titleClass(item.state)">
                {{ item.session.title }}
              </h3>
              <p class="truncate text-[10px] text-ln-gray-600">
                {{ formatTimeRange(item.session) }}
              </p>
              <p v-if="item.session.room" class="truncate text-[10px] text-ln-gray-500">
                {{ item.session.room }}
              </p>
              <p v-if="item.state === 'cancelled'" class="truncate text-[10px] font-semibold text-ln-error">
                Annulé
              </p>
            </div>
          </div>
        </article>

        <div
          v-if="calendarSessions.length === 0"
          class="absolute inset-0 flex items-center justify-center text-sm text-ln-gray-500"
        >
          Aucune séance publiée cette semaine.
        </div>
      </div>
    </div>
  </section>

</template>
