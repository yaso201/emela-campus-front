<template>
  <section class="overflow-hidden rounded-md-ln border border-ln-gray-200 bg-white" :aria-label="label">
    <!-- En-tête des jours -->
    <div v-if="state === 'ready'" class="grid border-b border-ln-gray-300 bg-ln-gray-50" :style="columnStyle">
      <div></div>
      <div v-for="day in days" :key="day.key"
           class="flex h-[34px] items-center justify-center gap-1.5 text-caption font-semibold"
           :class="day.today ? 'text-ln-blue-900 shadow-[inset_0_-2px_0_var(--ln-blue-800)]' : 'text-ln-gray-700'">
        {{ day.label }} <span class="font-medium text-ln-gray-500">{{ day.dayNumber }}</span>
      </div>
    </div>

    <BlockState v-if="state !== 'ready'" :state="state" :title="stateTitle" :message="stateMessage"
                :rows="6" :skeleton-widths="[52, 'auto', 'auto', 'auto', 'auto', 'auto']" :row-height="44"
                :expected-count="expectedCount" expected-label="séances"
                class="m-4" @retry="emit('retry')">
      <template #action><slot name="empty-action" /></template>
    </BlockState>

    <template v-else>
      <!-- Grille : une colonne d'heures, une colonne par jour -->
      <div class="relative grid" :style="[columnStyle, gridStyle]">
        <div v-for="(day, i) in days" :key="'col-' + day.key"
             class="border-r border-ln-gray-100 last:border-r-0"
             :style="{ gridColumn: i + 2, gridRow: '1 / span ' + rowCount }"></div>
        <div v-for="(h, i) in hourLabels" :key="'h-' + i"
             class="tabular flex justify-end border-r border-ln-gray-200 pr-2 pt-0.5 text-[11px] text-ln-gray-400"
             :style="{ gridColumn: 1, gridRow: i + 1 }">{{ h }}</div>

        <button v-for="item in items" :key="item.id" type="button"
                class="relative z-[1] m-0.5 overflow-hidden rounded-sm-ln border-l-[3px] px-[7px] py-1 text-left text-[11.5px] leading-tight"
                :class="[toneClass(item), item.id === selectedId ? 'outline outline-2 -outline-offset-1 outline-ln-blue-800' : '']"
                :style="placement(item)"
                @click="emit('select', item.id)">
          <span class="block font-bold text-ln-gray-900">{{ item.code }}</span>
          <span v-for="(line, i) in item.lines || []" :key="i" class="block text-[11px] text-ln-gray-600">{{ line }}</span>
          <span v-if="item.origin" class="mt-0.5 inline-flex h-[15px] items-center rounded-[3px] px-[5px] align-[1px] text-[9.5px] font-bold uppercase tracking-wide"
                :class="item.origin === 'choisi' ? 'bg-ln-warning-bg text-ln-warning' : 'bg-ln-blue-100 text-ln-blue-800'">
            {{ item.origin === 'choisi' ? 'choisi' : 'répartition' }}
          </span>
          <span v-if="item.stateLabel" class="mt-0.5 block text-[10px] font-bold uppercase tracking-wide" :class="stateLabelClass(item)">{{ item.stateLabel }}</span>
        </button>

        <!-- Créneau en cours de création : dessiné, jamais enregistré -->
        <div v-if="draft" class="pointer-events-none z-[2] m-0.5 rounded-sm-ln border-2 border-dashed border-ln-blue-600 border-l-[3px] border-l-ln-blue-800 bg-white px-[7px] py-1 text-[11.5px] text-ln-blue-900"
             :style="placement(draft)">
          <span class="block font-bold">{{ draft.code || 'Nouvelle séance' }}</span>
          <span v-for="(line, i) in draft.lines || []" :key="i" class="block text-[11px]">{{ line }}</span>
        </div>
      </div>

      <!-- Conflits signalés PENDANT le choix : le composant les montre, il ne les calcule pas -->
      <div v-if="conflicts.length" class="border-t border-ln-gray-200 px-4 py-3">
        <div v-for="(c, i) in conflicts" :key="i" class="mb-2 flex gap-3 rounded-sm-ln p-3 text-caption leading-snug last:mb-0" :class="conflictClass(c)">
          <span class="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" :class="conflictDot(c)"></span>
          <span><b class="block font-semibold">{{ c.title }}</b>{{ c.detail }}</span>
        </div>
      </div>

      <!-- Succès partiel : ce qui est passé, ce qui ne l'est pas -->
      <p v-if="partial" class="border-t border-[#F3D9A6] bg-ln-warning-bg px-4 py-3 text-caption leading-snug text-[#6B4415]">{{ partial }}</p>

      <div v-if="legend.length" class="flex flex-wrap gap-4 border-t border-ln-gray-200 bg-ln-gray-50 px-4 py-3 text-caption text-ln-gray-500">
        <span v-for="l in legend" :key="l.label" class="flex items-center gap-1.5">
          <i class="inline-block h-2.5 w-2.5 rounded-[2px]" :style="{ background: l.color }"></i>{{ l.label }}
        </span>
        <slot name="legend" />
      </div>
    </template>
  </section>
</template>

<script setup>
/**
 * 16 · Grille temporelle — semaine ou journée, une colonne par jour, une ligne
 * par heure. Réf : arbitrage C-01 du lot 8. Le seizième composant existe parce
 * qu'il a un TROISIÈME emploi : le planning des séances, le registre des
 * examens, et la vue enseignant du self-service.
 *
 * Variantes : variant='week' (5 ou 6 colonnes) · variant='day' (une seule).
 * États : vide · chargement · erreur · succès partiel (prop `partial`).
 *   ⚠ Le refus de droit n'est PAS un état de ce composant : il est porté une
 *   fois par la couche d'appel (règle 5), qui rend l'écran de refus expliqué à
 *   la place de la page. Un composant qui saurait refuser le referait mal.
 *
 * Le composant ne calcule NI les conflits NI les chevauchements : il reçoit des
 * items placés et des conflits rédigés. Ce qui fait autorité reste la
 * vérification du serveur à l'enregistrement — cette grille est un confort.
 *
 * Props : days[] · hours{from,to,step} · items[] · draft · conflicts[] · legend[]
 *         selectedId · state · partial · expectedCount
 * Événements : select(id) · retry
 */
import { computed } from 'vue';
import BlockState from './internal/BlockState.vue';

const props = defineProps({
  label: { type: String, default: 'Grille horaire' },
  variant: { type: String, default: 'week' },              // week | day
  days: { type: Array, default: () => [] },                // [{ key, label, dayNumber, today }]
  // step : granularité des créneaux, en heures décimales. REÇUE du serveur —
  // les séances durent un multiple de 30 min et s'alignent sur la demi-heure
  // (validation serveur). La grille ne la déduit jamais des items.
  hours: { type: Object, default: () => ({ from: 8, to: 18, step: 0.5 }) },
  slotHeight: { type: Number, default: 44 },
  items: { type: Array, default: () => [] },               // [{ id, day, start, end, code, lines[], tone, origin, stateLabel }]
  draft: { type: Object, default: null },
  conflicts: { type: Array, default: () => [] },           // [{ level:'ko'|'wa'|'ok', title, detail }]
  legend: { type: Array, default: () => [] },  // [{ label, color }]
  selectedId: { type: [String, Number], default: null },
  state: { type: String, default: 'ready' },               // ready | loading | empty | error
  stateTitle: { type: String, default: 'Aucune séance cette semaine' },
  stateMessage: { type: String, default: '' },
  partial: { type: String, default: '' },
  expectedCount: { type: [Number, String], default: null },
});
const emit = defineEmits(['select', 'retry']);

const step = computed(() => props.hours.step || 1);
/** Une ligne par créneau de `step` — deux lignes par heure en demi-heures. */
const rowCount = computed(() =>
  Math.max(1, Math.round((props.hours.to - props.hours.from) / step.value)));
/** Un libellé par HEURE pleine ; les créneaux intermédiaires n'en portent pas. */
const perHour = computed(() => Math.max(1, Math.round(1 / step.value)));
const hourLabels = computed(() =>
  Array.from({ length: rowCount.value }, (_, i) =>
    i % perHour.value === 0 ? props.hours.from + i * step.value + ' h' : ''));
const columnStyle = computed(() => ({
  gridTemplateColumns: '52px repeat(' + (props.variant === 'day' ? 1 : props.days.length) + ', 1fr)',
}));
/** Hauteur d'un créneau : l'heure garde sa hauteur, quel que soit le pas. */
const slotPx = computed(() => Math.round(props.slotHeight * step.value));
const gridStyle = computed(() => {
  const hour = slotPx.value * perHour.value;
  return {
    gridAutoRows: slotPx.value + 'px',
    // Filet plein à l'heure, filet léger à la demi-heure : sans cette
    // distinction, une grille au pas de 30 min devient illisible.
    backgroundImage:
      'repeating-linear-gradient(to bottom,transparent 0 ' + (hour - 1) + 'px,var(--ln-gray-200) ' + (hour - 1) + 'px ' + hour + 'px),' +
      'repeating-linear-gradient(to bottom,transparent 0 ' + (slotPx.value - 1) + 'px,var(--ln-gray-100) ' + (slotPx.value - 1) + 'px ' + slotPx.value + 'px)',
  };
});

/** Placement en grille : l'heure fait la ligne, le jour fait la colonne. */
function placement(item) {
  const dayIndex = props.variant === 'day' ? 0 : props.days.findIndex((d) => d.key === item.day);
  // L'arrondi porte sur le PAS reçu : à 0,5 h, 8 h 30 tombe sur sa ligne.
  const row = Math.max(1, Math.round((item.start - props.hours.from) / step.value) + 1);
  const span = Math.max(1, Math.round((item.end - item.start) / step.value));
  return { gridColumn: (dayIndex < 0 ? 0 : dayIndex) + 2, gridRow: row + ' / span ' + span };
}

const TONES = {
  published: 'border-l-ln-blue-800 bg-ln-blue-50',
  draft: 'border border-dashed border-ln-gray-300 border-l-[3px] border-l-ln-gray-400 bg-ln-gray-50',
  modified: 'border-l-ln-warning bg-ln-warning-bg',
  cancelled: 'border-l-ln-error bg-ln-error-bg line-through',
  exam: 'border-l-[#5B21B6] bg-[#F3EEFF]',
};
function toneClass(item) { return TONES[item.tone] || 'border-l-ln-gray-400 bg-ln-gray-100'; }
function stateLabelClass(item) {
  return {
    published: 'text-ln-blue-700', draft: 'text-ln-gray-500', modified: 'text-ln-warning',
    cancelled: 'text-ln-error', exam: 'text-[#5B21B6]',
  }[item.tone] || 'text-ln-gray-500';
}
function conflictClass(c) {
  return { ko: 'bg-ln-error-bg text-[#7A2020]', wa: 'bg-ln-warning-bg text-[#6B4415]' }[c.level] || 'bg-ln-success-bg text-[#0B5341]';
}
function conflictDot(c) {
  return { ko: 'bg-ln-error', wa: 'bg-ln-warning' }[c.level] || 'bg-ln-success';
}
</script>
