<template>
  <div>
    <header class="mb-5">
      <p class="mb-2 text-caption text-ln-gray-500">Atelier</p>
      <h1 class="text-h1 tracking-tight text-ln-gray-900">Grille temporelle — le seizième composant</h1>
      <p class="mt-1 max-w-3xl text-body-sm leading-relaxed text-ln-gray-500">
        Ses quatre états sont des branches, pas des dessins. Le cinquième — le refus de droit — n'est
        pas ici : il est porté une fois par la couche d'appel, et la coquille rend le refus expliqué
        à la place de la page. Pour le voir, ajoutez <code class="font-mono text-[12px]">?simulate=denied</code> à l'URL.
      </p>
    </header>

    <div class="mb-4 flex flex-wrap items-center gap-2">
      <button v-for="s in states" :key="s.key" type="button"
              class="inline-flex h-[30px] items-center rounded-sm-ln border px-3 text-caption font-medium"
              :class="s.key === shown ? 'border-ln-blue-900 bg-ln-blue-900 font-semibold text-white' : 'border-ln-gray-300 text-ln-gray-700'"
              @click="shown = s.key">{{ s.label }}</button>
      <p class="ml-auto text-caption text-ln-gray-500">Semaine du 14 septembre · L2 Génie logiciel</p>
    </div>

    <TimeGrid :days="grid.days" :hours="grid.hours"
              :items="shown === 'ready' || shown === 'partial' ? grid.items : []"
              :draft="shown === 'ready' || shown === 'partial' ? draft : null"
              :conflicts="shown === 'ready' || shown === 'partial' ? grid.conflicts || [] : []"
              :legend="legend"
              :selected-id="selectedId"
              :state="gridState"
              :partial="shown === 'partial' ? partialMessage : ''"
              :expected-count="11"
              state-title="Aucune séance cette semaine"
              state-message="La répartition est validée, mais rien n'a encore été planifié pour cette semaine."
              @select="selectedId = $event" @retry="reload" />

    <p class="mt-4 max-w-3xl text-caption leading-relaxed text-ln-gray-500">
      La grille ne calcule ni les conflits ni les chevauchements : elle reçoit des items placés et
      des conflits rédigés. Ce qui fait autorité reste la vérification du serveur à l'enregistrement.
    </p>
  </div>
</template>

<script setup>
/**
 * Atelier — la preuve que le seizième composant s'assemble, avec ses états.
 * Une bibliothèque de composants qui ne s'assemble pas ne prouve rien.
 */
import { computed, onMounted, ref } from 'vue';
import { TimeGrid } from '../components/index.js';
import { useResource } from '../composables/useResource.js';
import { listSchedules } from '../api/planning.js';

const shown = ref('ready');
const selectedId = ref('S5');
const states = [
  { key: 'ready', label: 'Prêt' },
  { key: 'loading', label: 'Chargement' },
  { key: 'empty', label: 'Vide' },
  { key: 'error', label: 'Erreur' },
  { key: 'partial', label: 'Succès partiel' },
];

/**
 * ⚠️ Ce chargeur appelait `emela_core.academic_core.api.planning.week_sessions` —
 * un chemin de MON invention, écrit à la grappe 1 avant que le mur des noms ne
 * soit connu. Il visait donc une fonction qui n'existe pas.
 *
 * Il lit le vrai point d'entrée, celui de l'écran de planning : l'atelier et
 * l'écran éprouvent donc la MÊME lecture. Un atelier qui interroge un contrat
 * différent de l'écran ne prouve rien sur l'écran.
 */
const loader = (params) => listSchedules({ ...params, date_from: '2026-09-14', date_to: '2026-09-18' });
const { data, load } = useResource(loader, { isEmpty: (d) => !d?.length });

const DAYS = [
  { key: 'mon', label: 'Lundi', dayNumber: 14 },
  { key: 'tue', label: 'Mardi', dayNumber: 15 },
  { key: 'wed', label: 'Mercredi', dayNumber: 16, today: true },
  { key: 'thu', label: 'Jeudi', dayNumber: 17 },
  { key: 'fri', label: 'Vendredi', dayNumber: 18 },
];
const toDecimal = (t) => {
  const [h, m] = String(t || '0:0').split(':').map(Number);
  return h + (m || 0) / 60;
};
const TONE = { Publié: 'published', Brouillon: 'draft', Modifié: 'modified' };
const grid = computed(() => ({
  days: DAYS,
  // step: 0.5 — les demi-heures sont réelles, validées au serveur.
  hours: { from: 8, to: 18, step: 0.5 },
  items: (data.value || []).map((s) => ({
    id: s.name, day: s.day,
    start: toDecimal(s.from_time), end: toDecimal(s.to_time),
    code: s.course, lines: [s.custom_session_type + ' · ' + s.room, s.instructor],
    tone: s.custom_status === 'Annulé' ? 'cancelled' : s.is_exam ? 'exam' : (TONE[s.custom_planning_status] || 'draft'),
    origin: s.instructor_service_source === 'répartition' ? 'repartition'
      : s.instructor_service_source === 'choisi' ? 'choisi' : null,
    stateLabel: s.custom_status === 'Annulé' ? 'Annulée · reste publiée' : s.custom_planning_status,
  })),
  conflicts: [],
}));
const gridState = computed(() => (shown.value === 'partial' ? 'ready' : shown.value));

const draft = {
  id: 'draft', day: 'wed', start: 10, end: 12, code: 'INF-207-A',
  lines: ['TD · salle 4', 'Pr. Soglo — proposé par la répartition'],
};

const partialMessage =
  '9 séances publiées sur 11. Deux séances n’ont pas pu l’être : la salle 12 est occupée le lundi à 10 h, ' +
  'et l’épreuve du jeudi tombe sous le préavis de sept jours. Les neuf autres sont publiées et visibles des étudiants.';

const legend = [
  { label: 'Publiée', color: 'var(--ln-blue-800)' },
  { label: 'Brouillon', color: 'var(--ln-gray-300)' },
  { label: 'Annulée', color: 'var(--ln-error)' },
  { label: 'Épreuve', color: '#5B21B6' },
];

function reload() { shown.value = 'ready'; load({}); }
onMounted(() => load({}));
</script>
