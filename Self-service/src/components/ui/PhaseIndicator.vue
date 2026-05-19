<script setup>
// PhaseIndicator — Indicateur visuel des 5 phases d'un stage (L6-E05)
// Ref: D04 §5, U07 §4.13
// Usage: <PhaseIndicator :current-phase="3" :labels="phaseLabels" />

const props = defineProps({
  /** Phase actuelle (1-5), 0 = aucune */
  currentPhase: {
    type: Number,
    default: 0,
    validator: (v) => v >= 0 && v <= 5,
  },
  /** Labels des 5 phases (index 0 ignoré) */
  labels: {
    type: Array,
    default: () => ['', 'Déclaration', 'Convention', 'En cours', 'Rapport', 'Soutenance'],
  },
});

/**
 * Détermine l'état visuel d'un point de phase
 * @param {number} phase - Numéro de phase (1-5)
 * @returns {'completed'|'current'|'pending'}
 */
function getPointState(phase) {
  if (props.currentPhase === 0) return 'pending';
  if (phase < props.currentPhase) return 'completed';
  if (phase === props.currentPhase) return 'current';
  return 'pending';
}

/**
 * Détermine l'état visuel d'une ligne connectrice
 * @param {number} lineIndex - Index de la ligne (1-4)
 * @returns {'completed'|'pending'}
 */
function getLineState(lineIndex) {
  if (props.currentPhase === 0) return 'pending';
  return lineIndex < props.currentPhase ? 'completed' : 'pending';
}
</script>

<template>
  <div class="w-full" role="img" :aria-label="`Avancement du stage: phase ${currentPhase} sur 5`">
    <!-- Points et lignes connectrices -->
    <div class="flex items-center gap-1">
      <template v-for="phase in 5" :key="phase">
        <!-- Point de phase -->
        <div
          class="w-3 h-3 rounded-full border-2 transition-colors duration-200 flex-shrink-0"
          :class="{
            'bg-ln-blue-600 border-ln-blue-600': getPointState(phase) === 'completed',
            'bg-ln-blue-600 border-ln-blue-600 ring-2 ring-ln-blue-200': getPointState(phase) === 'current',
            'bg-white border-ln-gray-300': getPointState(phase) === 'pending',
          }"
          :aria-current="getPointState(phase) === 'current' ? 'step' : undefined"
        />
        
        <!-- Ligne connectrice (sauf après le dernier point) -->
        <div
          v-if="phase < 5"
          class="flex-1 h-0.5 min-w-[20px] transition-colors duration-200"
          :class="{
            'bg-ln-blue-600': getLineState(phase) === 'completed',
            'bg-ln-gray-200': getLineState(phase) === 'pending',
          }"
        />
      </template>
    </div>
    
    <!-- Labels des phases -->
    <div class="flex justify-between mt-2">
      <span
        v-for="phase in 5"
        :key="`label-${phase}`"
        class="text-[10px] uppercase tracking-wide flex-1 text-center"
        :class="{
          'text-ln-blue-700 font-semibold': phase === currentPhase,
          'text-ln-gray-500': phase !== currentPhase,
        }"
      >
        {{ labels[phase] || `Phase ${phase}` }}
      </span>
    </div>
  </div>
</template>
