<script setup>
// PlanningDay — vue jour en grille horaire proportionnelle
// Phase 5 — consommé par PlanningPage
import { computed } from 'vue';
import {
  buildSessionOverlapLayout,
  clamp,
  formatTimeRange,
  formatDayLabel,
  getSessionVisualState,
  normalizePlanningSession,
  sessionDurationMinutes,
  sessionDate,
  timeToMinutes,
} from '@/utils/planning';

const props = defineProps({
  sessions: { type: Array, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
});

const DAY_START_HOUR = 7;
const DAY_END_HOUR = 22;
const HOUR_HEIGHT = 76;

// Filter sessions to the current day only
const daySessions = computed(() =>
  props.sessions
    .map((s) => normalizePlanningSession(s))
    .filter((s) => sessionDate(s) === props.date)
    .sort((a, b) => (a.from_time || '').localeCompare(b.from_time || '')),
);

const dayLabel = computed(() => formatDayLabel(props.date));
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

function sessionStyle(session, columnIndex = 0, columnCount = 1) {
  const dayStart = DAY_START_HOUR * 60;
  const dayEnd = DAY_END_HOUR * 60;
  const start = clamp(timeToMinutes(session.from_time, dayStart), dayStart, dayEnd);
  const duration = sessionDurationMinutes(session, 60);
  const top = ((start - dayStart) / 60) * HOUR_HEIGHT;
  const height = clamp((duration / 60) * HOUR_HEIGHT, 52, timelineHeight.value - top);
  const left = columnCount === 1
    ? '12px'
    : `calc(${(columnIndex * 100) / columnCount}% + 8px)`;
  const width = columnCount === 1
    ? 'calc(100% - 24px)'
    : `calc(${100 / columnCount}% - 12px)`;

  return {
    top: `${top}px`,
    height: `${height}px`,
    left,
    width,
  };
}

const calendarSessions = computed(() =>
  buildSessionOverlapLayout(daySessions.value).map((item) => ({
    ...item,
    state: getSessionVisualState(item.session),
    style: sessionStyle(item.session, item.columnIndex, item.columnCount),
  })),
);

const mobileSessions = computed(() =>
  daySessions.value.map((session) => ({
    session,
    state: getSessionVisualState(session),
  })),
);

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
  <section class="rounded-xl border border-ln-gray-200 bg-white shadow-card overflow-hidden">
    <header class="flex items-center justify-between gap-3 border-b border-ln-gray-200 px-4 py-3">
      <div>
        <p class="text-[11px] font-semibold text-ln-gray-500 tracking-wider uppercase">
          Vue jour
        </p>
        <h2 class="text-base font-semibold text-ln-gray-900 first-letter:uppercase">
          {{ dayLabel }}
        </h2>
      </div>
      <span class="rounded-full bg-ln-gray-100 px-3 py-1 text-xs font-semibold text-ln-gray-600">
        {{ daySessions.length }} séance(s)
      </span>
    </header>

    <div v-if="daySessions.length > 0" class="md:hidden flex flex-col gap-3 p-4">
      <article
        v-for="item in mobileSessions"
        :key="item.session.name || `${item.session.title}-${item.session.from_time}`"
        class="rounded-lg border p-4"
        :class="sessionCardClass(item.state)"
      >
        <div class="mb-2 inline-flex rounded-full bg-orange-500 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
          Cours
        </div>
        <h3 class="text-sm font-bold" :class="titleClass(item.state)">
          {{ item.session.title }}
        </h3>
        <p class="mt-1 text-xs text-ln-gray-600">
          {{ formatTimeRange(item.session) }}
          <span v-if="item.session.room"> · {{ item.session.room }}</span>
          <span v-if="item.session.subtitle"> · {{ item.session.subtitle }}</span>
        </p>
        <p v-if="item.state === 'cancelled'" class="mt-2 text-xs font-semibold text-ln-error">
          Séance annulée
        </p>
      </article>
    </div>

    <div v-else class="md:hidden p-8 text-center">
      <p class="text-sm text-ln-gray-500">Aucune séance ce jour.</p>
    </div>

    <div class="hidden md:grid grid-cols-[64px_1fr]">
      <div class="relative border-r border-ln-gray-200 bg-ln-gray-50" :style="{ height: `${timelineHeight}px` }">
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
          class="absolute left-3 right-3 rounded-lg border p-3 overflow-hidden"
          :class="sessionCardClass(item.state)"
          :style="item.style"
        >
          <div class="flex h-full gap-3">
            <div
              class="w-1 rounded-full flex-shrink-0"
              :class="[barColor(item.state), item.state === 'current' ? 'motion-safe:animate-pulse' : '']"
              aria-hidden="true"
            ></div>
            <div class="min-w-0">
              <span class="mb-2 inline-flex rounded-full bg-orange-500 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                Cours
              </span>
              <h3 class="truncate text-sm font-bold" :class="titleClass(item.state)">
                {{ item.session.title }}
              </h3>
              <p class="mt-1 truncate text-xs text-ln-gray-600">
                {{ formatTimeRange(item.session) }}
                <span v-if="item.session.room"> · {{ item.session.room }}</span>
                <span v-if="item.session.subtitle"> · {{ item.session.subtitle }}</span>
              </p>
              <p v-if="item.state === 'cancelled'" class="mt-1 text-xs font-semibold text-ln-error">
                Séance annulée
              </p>
            </div>
          </div>
          <span
            v-if="item.state === 'current'"
            class="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-ln-blue-100 px-2.5 py-0.5 text-xs font-semibold text-ln-blue-700"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-ln-blue-600 motion-safe:animate-pulse" aria-hidden="true"></span>
            En cours
          </span>
        </article>

        <div
          v-if="calendarSessions.length === 0"
          class="absolute inset-0 flex items-center justify-center px-6 text-center"
        >
          <div class="rounded-full border border-dashed border-ln-gray-300 bg-white/85 px-5 py-3 shadow-card">
            <p class="text-sm font-semibold text-ln-gray-600">Aucune séance planifiée</p>
            <p class="mt-0.5 text-xs text-ln-gray-500">C'est quartier libre aujourd'hui.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
