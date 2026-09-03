<template>
  <div>
    <header class="mb-4 flex flex-wrap items-start justify-between gap-5">
      <div>
        <p class="mb-2 text-caption text-ln-gray-500">Répartition · <b class="font-semibold text-ln-gray-900">Prévu / réalisé</b></p>
        <h1 class="text-h1 tracking-tight text-ln-gray-900">Prévu contre réalisé — {{ data.program_label || '…' }}</h1>
        <p class="mt-1 text-body-sm text-ln-gray-500">{{ subtitle }}</p>
      </div>
      <button type="button" class="ln-btn-secondary" @click="notBuilt">Exporter</button>
    </header>

    <StateBanner v-if="pending" variant="warning" lead="Acte non disponible." :text="pending" />

    <StateBanner variant="info" lead="Ce que compte le réalisé.">
      Les séances <b class="font-semibold">tenues</b>, et elles seules : une séance annulée ne compte
      pas, une séance planifiée mais non tenue non plus. Le compte porte la <b class="font-semibold">durée
      réelle</b> de chaque séance, jamais une durée standard. Un cours mutualisé entre plusieurs filières
      compte <b class="font-semibold">une seule fois</b>. Les épreuves ne comptent pas — la surveillance
      est réputée incluse dans l'heure d'enseignement.
    </StateBanner>

    <DenseTable :state="state === 'denied' ? 'loading' : state" :row-height="36"
                :expected-count="data.line_count" expected-label="lignes"
                :skeleton-widths="[240, 150, 70, 78, 186, 86, 160]" max-height="none"
                state-title="Aucun réalisé à ce jour"
                state-message="Aucune séance tenue n'a encore été enregistrée pour cette filière."
                @retry="reload">
      <template #head>
        <tr>
          <th :class="headTh" class="!text-left">Ligne de service</th>
          <th :class="headTh" class="!text-left">Enseignant</th>
          <th :class="headTh">Prévu</th>
          <th :class="headTh">Réalisé</th>
          <th :class="headTh">Avancement</th>
          <th :class="headTh">Écart</th>
          <th :class="headTh" class="!text-left">Séances</th>
        </tr>
      </template>
      <template #body>
        <tr v-for="l in lines" :key="l.id" class="hover:bg-ln-gray-50">
          <td :class="bodyTd" class="!text-left">
            <ActivityTag :kind="l.activity" />
            <span class="ml-1.5 font-mono text-[11.5px] text-ln-gray-500">{{ l.module_code }}</span>
            <span class="ml-1">{{ l.module_label }}</span>
            <span v-if="l.group" class="text-ln-gray-500"> — {{ l.group }}</span>
            <span v-if="l.shared_count" class="ml-1.5 inline-flex h-5 items-center rounded-[4px] bg-ln-blue-50 px-[7px] text-[11px] font-semibold text-ln-blue-700">
              mutualisé · {{ l.shared_count }} filières
            </span>
          </td>
          <td :class="bodyTd" class="!text-left">{{ l.teacher }}</td>
          <td :class="bodyTd">{{ l.planned }} h</td>
          <td :class="bodyTd">{{ l.done }} h</td>
          <td :class="bodyTd">
            <span class="relative block h-1.5 w-[132px] overflow-hidden rounded-full bg-ln-gray-100">
              <span class="block h-full rounded-full"
                    :class="l.progress_tone === 'short' ? 'bg-ln-warning' : 'bg-ln-blue-800'"
                    :style="{ width: Math.min(100, Math.round((l.done / (l.planned || 1)) * 100)) + '%' }"></span>
            </span>
          </td>
          <td :class="bodyTd">
            <!-- L'écart n'est pas une alerte : négatif en cours d'année, c'est
                 normal. Le ton reste neutre sauf pour un écart signalé serveur. -->
            <span class="font-semibold" :class="gapTone(l)">{{ gapLabel(l) }}</span>
          </td>
          <td :class="bodyTd" class="!text-left !whitespace-normal text-caption text-ln-gray-500">{{ l.sessions_note }}</td>
        </tr>
      </template>
      <template #footbar>
        <div class="border-t border-ln-gray-300 bg-ln-gray-50 px-4 py-3 text-caption leading-relaxed text-ln-gray-500">
          Écart signé = réalisé − prévu. Un écart négatif en cours d'année est normal : l'année n'est
          pas finie. <b class="font-semibold text-ln-gray-900">Aucune alerte n'en découle et aucun acte
          ne s'y rattache.</b>
        </div>
      </template>
    </DenseTable>

    <div v-if="state === 'ready'" class="mt-4 grid gap-5 lg:grid-cols-2">
      <div v-for="note in notes" :key="note.lead"
           class="flex items-start gap-3 rounded-md-ln border border-dashed border-ln-gray-300 bg-ln-gray-50 p-4 text-caption leading-relaxed text-ln-gray-600">
        <svg class="mt-0.5 h-[18px] w-[18px] flex-shrink-0 text-ln-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.6v.2" /></svg>
        <p><b class="font-semibold text-ln-gray-900">{{ note.lead }}</b> {{ note.text }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Grappe 3 · Répartition — écran N5 du lot 6.
 *
 * C'est la donnée la plus proche du financier que le système produise : le
 * réalisé sert de base à la rémunération des vacataires. L'écran ne prend donc
 * aucune liberté avec les chiffres — chaque règle de comptage est écrite à côté
 * du total qu'elle affecte, et rien n'y est présenté comme une alerte.
 *
 * ⚠️ `computed_at` est OBLIGATOIRE. Un tableau qui sert de base de paie sans
 * millésime n'est pas opposable. Le millésime est dans le sous-titre, contre le
 * chiffre — pas en note de bas de page.
 *
 * ⚠️ Le réalisé compte la DURÉE RÉELLE des séances tenues, jamais une durée
 * standard par type d'activité. C'est le serveur qui somme ; l'écran ne convertit
 * pas une séance en heures.
 */
import { computed, onMounted, ref, watch } from 'vue';
import { DenseTable, StateBanner, headTh, bodyTd } from '../components/index.js';
import ActivityTag from './repartition/ActivityTag.vue';
import { useAcademicContext } from '../composables/useAcademicContext.js';
import { useResource } from '../composables/useResource.js';
import { getServiceProgress } from '../api/service.js';

const { params } = useAcademicContext();
const res = useResource(getServiceProgress, { isEmpty: (d) => !d?.lines?.length });
const state = res.state;
const pending = ref('');

const data = computed(() => res.data.value || {});
const lines = computed(() => data.value.lines || []);

const subtitle = computed(() => {
  const d = data.value;
  if (state.value !== 'ready') return 'Chargement du réalisé';
  return [d.planned_hours + ' h prévues', d.done_hours + ' h réalisées',
    d.computed_at_label ? 'arrêté au ' + d.computed_at_label : 'sans millésime — chiffre non opposable',
  ].join(' · ');
});

/** L'écart vient signé du serveur ; l'écran ne le recalcule pas. */
function gapLabel(l) {
  const gap = Number(l.gap);
  if (!gap) return '0 h';
  return (gap > 0 ? '+' : '−') + Math.abs(gap) + ' h';
}
function gapTone(l) {
  if (l.gap > 0) return 'text-ln-blue-700';
  if (l.gap_flagged) return 'text-ln-warning';
  return 'text-ln-gray-400 font-medium';
}

const notes = computed(() => {
  const d = data.value;
  return [
    // ARBITRAGE F3-FORMES (2) : le CHIFFRE des surveillances est RETIRÉ
    // (« épreuves hors service » est une décision gravée — le montrer
    // inviterait à l'additionner) ; la PHRASE reste : dire ce qu'on ne
    // compte pas vaut mieux qu'un silence.
    { lead: 'Les épreuves ne figurent pas dans ce tableau.',
      text: 'Les surveillances d’examen ne s’ajoutent pas au service réalisé : '
        + 'elles sont réputées incluses dans l’heure d’enseignement (décision de répartition).' },
    { lead: 'Une ligne mutualisée porte le nombre de filières concernées.',
      text: 'Ses heures sont comptées une seule fois, ici comme au bilan de charge — le total ne se retrouve pas en additionnant les tableaux de chaque filière.' },
  ];
});

function notBuilt() { pending.value = "L'export n'est pas encore branché au serveur. Rien n'a été produit."; }
function reload() { res.load(params.value); }

onMounted(() => { if (params.value.academic_year) reload(); });  // pas d'appel sans contexte (§5)
watch(params, reload);
</script>
