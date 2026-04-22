<script setup>
// PlanningEntry — entrée de planning avec 3 états visuels
// Réf visuelle : specs-interfaces/mela_component_library_reference.html §PlanningEntry
// Refactor C-002 : prop session unique, calcul interne du state
import { computed } from 'vue';
import StatusBadge from './StatusBadge.vue';
import {
  getSessionVisualState,
  normalizePlanningSession,
} from '@/utils/planning';

const props = defineProps({
  session: {
    type: Object,
    required: true,
    // Accepts two shapes:
    //   get_planning_range: { title, date, from_time, to_time, room, subtitle, status }
    //   get_my_planning:    { course_name, schedule_date, from_time, to_time, room, student_group, custom_planning_status }
  },
});

const normalizedSession = computed(() => normalizePlanningSession(props.session));

// Calcul du state à partir de la date et du statut de la séance
const state = computed(() => {
  return getSessionVisualState(normalizedSession.value);
});

const barColor = computed(() => {
  const map = {
    upcoming: 'bg-ln-blue-900',
    past: 'bg-ln-gray-300',
    cancelled: 'bg-ln-error',
  };
  return map[state.value];
});

const containerClass = computed(() => (state.value === 'past' ? 'opacity-60' : ''));
const titleClass = computed(() => (state.value === 'cancelled' ? 'line-through' : ''));

const badgeConfig = computed(() => {
  if (state.value === 'upcoming') return { status: 'open', label: 'À venir' };
  if (state.value === 'cancelled') return { status: 'failed', label: 'Annulé' };
  return null;
});

// Formatage de l'affichage horaire/lieu
const scheduleDisplay = computed(() => {
  const parts = [];
  const session = normalizedSession.value;

  // Horaire : "14:00 – 16:00"
  const from = session.from_time?.slice(0, 5);
  const to = session.to_time?.slice(0, 5);
  if (from && to) {
    parts.push(`${from} – ${to}`);
  } else if (from) {
    parts.push(from);
  }

  // Salle
  if (session.room) {
    parts.push(session.room);
  }

  // Groupe pédagogique
  if (session.subtitle) {
    parts.push(session.subtitle);
  }

  return parts.join(' · ');
});

const courseTitle = computed(() => normalizedSession.value.title || 'Sans titre');
</script>

<template>
  <div
    class="bg-white rounded-lg border border-ln-gray-200 p-3.5 flex items-start gap-3"
    :class="containerClass"
  >
    <div
      class="w-[3px] h-9 rounded-xs flex-shrink-0 mt-0.5"
      :class="barColor"
      aria-hidden="true"
    ></div>
    <div class="flex-1 min-w-0">
      <div class="text-sm font-semibold text-ln-gray-900" :class="titleClass">
        {{ courseTitle }}
      </div>
      <div class="text-xs text-ln-gray-600 mt-0.5">{{ scheduleDisplay }}</div>
    </div>
    <StatusBadge
      v-if="badgeConfig"
      :status="badgeConfig.status"
      :label="badgeConfig.label"
    />
    <span v-else class="text-xs text-ln-gray-400 flex-shrink-0">Passé</span>
  </div>
</template>
