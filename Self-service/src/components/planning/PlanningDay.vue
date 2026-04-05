<script setup>
// PlanningDay — vue jour détaillée avec créneaux vides (pauses) et indicateur "En cours"
// Phase 5 — consommé par PlanningPage
import { computed } from 'vue';
import {
  buildDaySlots,
  formatTimeRange,
  getSessionState,
  formatDayLabel,
} from '@/utils/planning';

const props = defineProps({
  sessions: { type: Array, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
});

// Filter sessions to the current day only
const daySessions = computed(() =>
  props.sessions.filter((s) => s.date === props.date),
);

const slots = computed(() => buildDaySlots(daySessions.value));

const dayLabel = computed(() => formatDayLabel(props.date));

function barColor(state) {
  if (state === 'current') return 'bg-accent-500';
  if (state === 'past') return 'bg-neutral-300';
  return 'bg-brand-900';
}
</script>

<template>
  <div>
    <div class="text-[11px] font-semibold text-neutral-600 tracking-wider uppercase mb-4">
      {{ dayLabel }}
    </div>

    <div v-if="daySessions.length === 0" class="bg-white rounded-lg border border-subtle p-8 text-center">
      <p class="text-sm text-neutral-500">Aucune séance ce jour.</p>
    </div>

    <div v-else class="flex flex-col gap-2">
      <template v-for="(slot, i) in slots" :key="i">
        <!-- Session slot -->
        <div
          v-if="slot.type === 'session'"
          class="bg-white rounded-lg border border-subtle p-4 flex items-start gap-3"
          :class="{ 'opacity-60': getSessionState(slot.session) === 'past' }"
        >
          <div
            class="w-[3px] self-stretch rounded-xs flex-shrink-0"
            :class="[barColor(getSessionState(slot.session)), getSessionState(slot.session) === 'current' ? 'motion-safe:animate-pulse' : '']"
            aria-hidden="true"
          ></div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-semibold text-neutral-950">{{ slot.session.title }}</div>
            <div class="text-xs text-neutral-600 mt-0.5">
              {{ formatTimeRange(slot.session) }}
              <span v-if="slot.session.room"> · {{ slot.session.room }}</span>
              <span v-if="slot.session.subtitle"> · {{ slot.session.subtitle }}</span>
            </div>
          </div>
          <span
            v-if="getSessionState(slot.session) === 'current'"
            class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm text-xs font-semibold bg-accent-100 text-accent-700 flex-shrink-0"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-accent-500 motion-safe:animate-pulse" aria-hidden="true"></span>
            En cours
          </span>
        </div>

        <!-- Break slot -->
        <div
          v-else-if="slot.type === 'break'"
          class="text-center py-2"
          aria-hidden="true"
        >
          <span class="text-xs text-neutral-400">
            ┄ Pause · {{ slot.from }} – {{ slot.to }} ({{ Math.round(slot.duration / 60 * 10) / 10 }}h) ┄
          </span>
        </div>
      </template>
    </div>
  </div>
</template>
