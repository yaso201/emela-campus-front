<template>
  <section class="grid gap-5 rounded-md-ln border border-l-4 border-ln-gray-300 bg-white p-5 md:grid-cols-[186px_1fr]"
           :class="edgeClass" :aria-label="heading">
    <div>
      <p class="tabular text-[38px] font-bold leading-none tracking-tight" :class="countClass">{{ deadline.remaining }}</p>
      <p class="mt-1 text-caption text-ln-gray-500" v-html="unitLabel"></p>
      <p class="mt-2.5 border-t border-ln-gray-200 pt-2.5 text-caption font-semibold text-ln-gray-900">{{ boundsLabel }}</p>
      <StatusPill v-if="state" class="mt-2.5" :status="pillStatus" :label="pillLabel" />
    </div>

    <div>
      <h4 class="text-[15px] font-semibold text-ln-gray-900">{{ heading }}</h4>
      <p v-if="lead" class="mt-1.5 max-w-[600px] text-body-sm leading-relaxed text-ln-gray-700">{{ lead }}</p>

      <!-- Paliers de prévenance — une échéance d'un an ne peut pas rester au
           même registre du premier au dernier jour. Savoir qu'on sera prévenu
           vaut mieux qu'être prévenu. -->
      <template v-if="deadline.stages && deadline.stages.length">
        <div class="mt-4 flex">
          <span v-for="(seg, i) in segments" :key="i" class="h-1.5 flex-1 first:rounded-l-full last:rounded-r-full" :class="seg"></span>
        </div>
        <div class="tabular flex justify-between text-micro text-ln-gray-500">
          <span>{{ deadline.opened_on }}</span>
          <span v-for="s in deadline.stages" :key="s">J-{{ s }}</span>
          <span>{{ deadline.term }}</span>
        </div>
      </template>

      <!-- Deux colonnes, jamais une : « ce qui se produira » sans « ce qui reste
           possible » transforme une information en menace. -->
      <div class="mt-4 grid gap-5 border-t border-ln-gray-200 pt-4 md:grid-cols-2">
        <div>
          <h5 class="mb-2 text-micro font-bold uppercase tracking-wider text-ln-gray-500">{{ willTitle }}</h5>
          <ul class="flex flex-col gap-1.5">
            <li v-for="(w, i) in deadline.will" :key="i" class="relative pl-3.5 text-caption leading-snug text-ln-gray-700">
              <span class="absolute left-0 top-1.5 h-1.5 w-1.5 rounded-full bg-ln-warning" aria-hidden="true"></span>{{ w }}
            </li>
          </ul>
        </div>
        <div>
          <h5 class="mb-2 text-micro font-bold uppercase tracking-wider text-ln-gray-500">{{ canTitle }}</h5>
          <ul class="flex flex-col gap-1.5">
            <li v-for="(c, i) in deadline.can" :key="i" class="relative pl-3.5 text-caption leading-snug text-ln-gray-700">
              <span class="absolute left-0 top-1.5 h-1.5 w-1.5 rounded-full bg-ln-success" aria-hidden="true"></span>{{ c }}
            </li>
          </ul>
        </div>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-3 border-t border-ln-gray-200 pt-4">
        <p class="mr-auto text-caption text-ln-gray-500">{{ atTermLabel }}</p>
        <slot name="actions" />
      </div>
    </div>
  </section>
</template>

<script setup>
/**
 * 11 · Bandeau d'effet différé — la décision est prise, l'effet arrive à une
 * date, rien n'est encore fait. Réf : lot 3, composants.
 *
 * Consomme le CONTRAT D'ÉCHÉANCE STRUCTURÉE (D-05) :
 *   { term, unit, remaining, opened_on, stages[], will[], can[], at_term }
 * remaining vient du SERVEUR. Une échéance de droit ne se calcule pas au front :
 * deux appareils mal réglés produiraient deux dates limites.
 *
 * Propriété state — la période disciplinaire en a CINQ depuis que l'appel est
 * suspensif : a_venir · en_cours · suspendue (appel déposé, en attente de la
 * Direction) · reprise (confirmée en appel, reprise fixée) · expiree.
 * Ni active ni expirée : « suspendue » est un état à part entière, et la
 * période n'est plus une paire de dates fixée au prononcé.
 */
import { computed } from 'vue';
import StatusPill from './StatusPill.vue';

const props = defineProps({
  deadline: { type: Object, required: true },
  heading: { type: String, required: true },
  lead: { type: String, default: '' },
  state: { type: String, default: '' },          // a_venir|en_cours|suspendue|reprise|expiree
  tone: { type: String, default: 'neutral' },    // neutral|warning|critical
  willTitle: { type: String, default: 'Ce qui se produira' },
  canTitle: { type: String, default: 'Ce qui reste possible' },
});

const STATES = {
  a_venir:   { pill: 'a_decider', label: 'À venir' },
  en_cours:  { pill: 'publiee',   label: 'En cours' },
  suspendue: { pill: 'suspendue', label: 'Suspendue · appel en cours' },
  reprise:   { pill: 'modifiee',  label: 'Reprise fixée' },
  expiree:   { pill: 'echue',     label: 'Expirée' },
};

const edgeClass = computed(() => {
  if (props.tone === 'critical') return 'border-l-ln-error';
  if (props.tone === 'warning') return 'border-l-ln-warning';
  return 'border-l-ln-blue-900';
});
const countClass = computed(() => (props.tone === 'critical' ? 'text-ln-error' : 'text-ln-gray-900'));
const unitLabel = computed(() =>
  props.deadline.unit === 'jours_ouvrables' ? 'jours ouvrables<br />restants' : 'jours restants');
const boundsLabel = computed(() =>
  props.deadline.opened_on ? props.deadline.opened_on + ' → ' + props.deadline.term : props.deadline.term);
const pillStatus = computed(() => (STATES[props.state] || {}).pill || 'a_decider');
const pillLabel = computed(() => (STATES[props.state] || {}).label || '');
const atTermLabel = computed(() =>
  props.deadline.at_term === 'expire_seule'
    ? "Au terme, l'effet cesse de lui-même : aucun acte n'est prévu ni nécessaire."
    : 'Au terme, un acte reste nécessaire.');

const segments = computed(() => {
  const total = (props.deadline.stages || []).length + 2;
  const stages = props.deadline.stages || [];
  const r = props.deadline.remaining;
  const out = [];
  for (let i = 0; i < total; i += 1) {
    const boundary = stages[i - 1];
    const passed = boundary === undefined ? i === 0 : r <= boundary;
    if (!passed) { out.push('bg-ln-gray-100'); continue; }
    const last = stages[stages.length - 1];
    out.push(r <= last ? 'bg-ln-error' : 'bg-ln-blue-700');
  }
  return out;
});
</script>
