<template>
  <section class="overflow-hidden rounded-md-ln border border-ln-gray-200" aria-label="Couverture par module">
    <header class="border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
      <h3 class="text-[14px] font-semibold text-ln-gray-900">Couverture par module</h3>
      <p class="mt-0.5 text-caption text-ln-gray-500">
        Heures réparties contre volume de la maquette, par type d'activité.
      </p>
    </header>

    <BlockState v-if="state !== 'ready'" :state="state" title="Couverture indisponible"
                message="La couverture se calcule contre le volume de la maquette. Sans ce volume, elle ne peut pas être établie — et un chiffre approché serait pire que pas de chiffre."
                :rows="6" :skeleton-widths="[180, 90]" :row-height="38" class="m-4"
                @retry="emit('retry')" />

    <template v-else>
      <div class="px-4 pb-3 pt-2">
        <div v-for="m in modules" :key="m.id"
             class="flex min-h-[38px] items-center gap-3 border-b border-ln-gray-100 px-1 text-caption last:border-0">
          <span class="min-w-0 flex-1 truncate text-ln-gray-900">
            <span class="font-mono text-[11px] text-ln-gray-500">{{ m.code }}</span> {{ m.label }}
          </span>
          <span class="flex flex-shrink-0 gap-[3px]">
            <!-- Une pastille par type d'activité PRÉVU. Un zéro de maquette
                 n'apparaît pas : il n'est pas un manque. -->
            <span v-for="a in m.activities" :key="a.activity"
                  class="grid h-[18px] w-[30px] place-items-center rounded-[4px] text-[9.5px] font-bold tracking-tight"
                  :class="toneClass(a)" :title="tooltip(m, a)">
              {{ (a.activity || '').toUpperCase() }}
            </span>          </span>
        </div>
      </div>

      <footer class="flex flex-wrap gap-3 border-t border-ln-gray-200 bg-ln-gray-50 px-4 py-3 text-caption text-ln-gray-500">
        <span><b class="font-semibold text-ln-success">plein</b> volume atteint</span>
        <span><b class="font-semibold text-ln-gray-500">creux</b> heures manquantes</span>
        <span><b class="font-semibold text-ln-blue-700">bleu</b> partiellement réparti</span>
        <span><b class="font-semibold text-ln-warning">ambre</b> au-delà du volume</span>
        <span class="basis-full leading-relaxed">
          Un type d'activité <b class="font-semibold text-ln-gray-900">non prévu à la maquette n'apparaît pas</b> —
          zéro heure prévue n'est pas un manque. Le calcul porte sur les <b class="font-semibold text-ln-gray-900">heures</b>,
          pas sur le nombre de lignes : 18 h + 12 h pour 24 h de maquette, c'est un dépassement de 6 h,
          pas deux lignes en trop. Une ligne <b class="font-semibold text-ln-gray-900">sans enseignant</b> s'enregistre
          en brouillon mais <b class="font-semibold text-ln-gray-900">ne couvre rien</b> : ses heures sont dites
          « posées sans titulaire » (F3-PROV — l'enseignant est exigé à la PROPOSITION, pas à la création).
        </span>
      </footer>
    </template>
  </section>
</template>

<script setup>
/**
 * Couverture par module — contenu de page de l'écran N1.
 *
 * ⚠️ Le front ne calcule RIEN. Il reçoit `covered_hours` et `expected_hours` par
 * type d'activité, et lit le rapport. La règle « le sur-couvert se calcule sur
 * les heures » vit côté serveur : si l'écran la recalculait, deux endroits
 * pourraient en changer.
 */
import BlockState from '../../components/internal/BlockState.vue';

defineProps({
  modules: { type: Array, default: () => [] },   // [{ id, code, label, activities: [{ activity, covered_hours, expected_hours, pending_hours }] }]
  state: { type: String, default: 'ready' },
});
const emit = defineEmits(['retry']);

function toneClass(a) {
  const covered = Number(a.covered_hours) || 0;
  const expected = Number(a.expected_hours) || 0;
  if (covered === 0) return 'border border-dashed border-ln-gray-300 bg-ln-gray-100 text-ln-gray-400';
  if (covered > expected) return 'border border-[#F3D9A6] bg-ln-warning-bg text-ln-warning';
  if (covered < expected) return 'border border-ln-blue-200 bg-ln-blue-50 text-ln-blue-700';
  return 'border border-[#A7E3CD] bg-ln-success-bg text-ln-success';
}

function tooltip(m, a) {
  const covered = Number(a.covered_hours) || 0;
  const expected = Number(a.expected_hours) || 0;
  const pending = Number(a.pending_hours) || 0;
  const head = m.code + ' · ' + (a.activity || '').toUpperCase() + ' — ' + covered + ' h réparties sur ' + expected + ' h prévues';
  // F3-PROV : la promesse RESTAURÉE (l'arbitrage FORMES l'avait retirée
  // faute de donnée) — le serveur expose les heures posées SANS titulaire,
  // et la phrase de manque DISTINGUE : « aucune heure répartie » serait
  // FAUX sur un module où 18 h sont posées sans enseignant.
  const note = pending > 0 ? ' · dont ' + pending + ' h posées sans titulaire (brouillon)' : '';
  if (covered === 0 && pending > 0) return head + ' · rien de proposé — ' + pending + ' h posées sans titulaire';
  if (covered === 0) return head + ' · aucune heure répartie';
  if (covered > expected) return head + ' · ' + (covered - expected) + ' h au-delà du volume' + note;
  if (covered < expected) return head + ' · ' + (expected - covered) + ' h manquantes' + note;
  return head + ' · volume atteint' + note;
}
</script>
