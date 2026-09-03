<template>
  <section class="overflow-hidden rounded-md-ln border border-ln-gray-300">
    <header class="border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
      <h3 class="text-[14px] font-semibold text-ln-gray-900">Statuer sur l'appel</h3>
      <p class="mt-1 text-caption leading-relaxed text-ln-gray-500">
        Trois issues. <b class="font-semibold text-ln-gray-900">Statuer et fixer la reprise sont un
        seul acte</b> — l'écran ne les sépare pas, parce que le serveur n'a pas d'état intermédiaire
        « appel statué, reprise à fixer ».
      </p>
    </header>

    <div class="px-4 py-4">
      <!-- ⚠️ Le patron GARDE, comme le script. Ma version déréférençait
           `dossier.appeal.appeal_grounds` sans garde alors que le script employait
           `?.` partout : un dossier disciplinaire sans appel plantait le rendu.
           Le montage est désormais conditionné en amont, et la garde reste ici —
           deux protections pour une, parce que ce panneau peut être remonté
           ailleurs. -->
      <p class="mb-1 text-caption text-ln-gray-500">Motifs invoqués par l'étudiant</p>
      <p class="mb-4 text-body-sm leading-relaxed text-ln-gray-700">
        « {{ dossier.appeal?.appeal_grounds || '—' }} »
      </p>

      <p class="mb-2 text-micro font-bold uppercase tracking-wider text-ln-gray-500">
        Issue de l'appel
      </p>
      <div class="mb-4 flex flex-col gap-2">
        <label v-for="o in OUTCOMES" :key="o.value"
               class="flex cursor-pointer items-start gap-2.5 rounded-sm-ln border px-3 py-2.5 text-body-sm"
               :class="o.value === outcome ? 'border-ln-blue-800 bg-ln-blue-50' : 'border-ln-gray-300'">
          <input type="radio" name="appeal-outcome" class="mt-1 accent-ln-blue-800"
                 :value="o.value" :checked="o.value === outcome" @change="outcome = o.value" />
          <span>
            <b class="font-semibold text-ln-gray-900">{{ o.label }}</b>
            <span class="block text-caption leading-snug text-ln-gray-600">{{ o.note }}</span>
          </span>
        </label>
      </div>

      <!-- ⚠️ La reprise n'a d'objet QUE si la sanction survit. Sur une
           infirmation, les deux champs sont RETIRÉS — pas grisés : il ne reste
           rien à purger, et un champ grisé laisserait croire qu'il y a une
           valeur à y mettre. -->
      <template v-if="outcome !== 'Infirmée'">
        <div class="mb-4 rounded-md-ln border border-ln-gray-200 p-4">
          <p class="mb-3 text-micro font-bold uppercase tracking-wider text-ln-gray-500">
            Reprise — à fixer
          </p>

          <div class="mb-3 flex items-baseline gap-3">
            <label class="w-[168px] flex-shrink-0 text-caption text-ln-gray-500" for="appeal-days">
              Jours restant à purger <span class="text-ln-error">*</span>
            </label>
            <span>
              <input id="appeal-days" type="number" min="0" :max="cap" :value="daysRemaining"
                     class="h-[30px] w-[80px] rounded-sm-ln border border-ln-gray-300 px-2 text-body-sm tabular"
                     @input="daysRemaining = Number($event.target.value)" />
              <!-- Le plafond est ÉNONCÉ SUR LE CHAMP, pas en note de bas de
                   panneau : c'est là qu'il sert. -->
              <span class="ml-2 text-caption text-ln-gray-600">
                plafond <b class="font-semibold text-ln-gray-900">{{ cap }}</b> —
                {{ plural(served, 'jour') }} déjà purgé{{ served > 1 ? 's' : '' }} sur
                {{ total }}, les fixer à nouveau aggraverait la sanction.
              </span>
            </span>
          </div>

          <div class="flex items-baseline gap-3">
            <label class="w-[168px] flex-shrink-0 text-caption text-ln-gray-500" for="appeal-start">
              Reprise des effets le <span class="text-ln-error">*</span>
            </label>
            <input id="appeal-start" type="date" :value="resumeStart"
                   class="h-[30px] rounded-sm-ln border border-ln-gray-300 px-2 text-body-sm"
                   @input="resumeStart = $event.target.value" />
          </div>
        </div>

        <!-- ⚠️ LE CALCUL DE NON-AGGRAVATION, SOUS LES YEUX. Le refus fait
             autorité au serveur ; l'écran doit pouvoir MONTRER pourquoi. -->
        <p class="mb-4 flex items-start gap-3 rounded-sm-ln p-3 text-caption leading-snug"
           :class="aggravates ? 'bg-ln-error-bg text-[#7A2020]' : 'bg-ln-success-bg text-[#0B5341]'">
          <span class="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                :class="aggravates ? 'bg-ln-error' : 'bg-ln-success'"></span>
          <span>
            <b class="font-semibold">Un appel ne doit jamais aggraver.</b>
            {{ served }} purgés + {{ daysRemaining }} restants = {{ served + daysRemaining }} jours,
            <template v-if="aggravates">
              ce qui <b class="font-semibold">dépasse</b> les {{ total }} prononcés. Le serveur
              refusera.
            </template>
            <template v-else>
              contre {{ total }} prononcés. Le plafond est respecté.
            </template>
          </span>
        </p>
      </template>

      <p v-else class="mb-4 rounded-sm-ln bg-ln-success-bg p-3 text-caption leading-snug text-[#0B5341]">
        <b class="font-semibold">Rien ne reste à purger.</b> L'infirmation annule la sanction — elle
        ne la lève pas en cours d'exécution. Les {{ plural(served, 'jour') }} déjà purgé{{ served > 1 ? 's' : '' }}
        ne sont pas rendus, mais la sanction ne figure plus comme exécutoire au dossier.
      </p>

      <p class="mb-2 text-micro font-bold uppercase tracking-wider text-ln-gray-500">
        Motivation <span class="text-ln-error">*</span>
      </p>
      <div class="min-h-[64px] rounded-sm-ln border border-ln-gray-300 p-2.5 text-body-sm text-ln-gray-400">
        Ce qui fonde l'issue retenue…
      </div>
    </div>

    <footer class="flex flex-wrap items-center gap-3 border-t border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
      <span class="text-caption text-ln-gray-500">
        La décision est notifiée à l'étudiant, avec sa motivation et la nouvelle fenêtre.
      </span>
      <span class="ml-auto flex gap-2">
        <button type="button" class="ln-btn-secondary" @click="emit('act', 'L’annulation')">Annuler</button>
        <button type="button" class="ln-btn-primary" :disabled="aggravates"
                @click="emit('act', 'La décision d’appel')">Statuer et notifier</button>
      </span>
    </footer>
  </section>
</template>

<script setup>
/**
 * L'appel disciplinaire — écran A3 du lot 8, porté par le code réel.
 *
 * `decide_suspension_appeal(name, decision, appeal_reason, resume_start,
 * resume_days_remaining)`. La docstring serveur dit :
 *
 * > « le geste unique — statuer (Confirmée/Réformée/Infirmée) ET, si la sanction
 * >   survit, fixer la reprise (plafond = jours non encore purgés) »
 *
 * ⚠️ UN SEUL ACTE : l'écran ne présente donc pas deux étapes. Il n'existe pas
 * d'état « appel statué, reprise à fixer ».
 *
 * ⚠️ LES DEUX CHAMPS DE REPRISE SONT RETIRÉS sur une infirmation, pas grisés. Un
 * champ grisé laisse croire qu'il y a une valeur à y mettre ; ici il n'y en a
 * aucune, et la signature serveur les rend facultatifs pour cette raison.
 *
 * ⚠️ LE PLAFOND EST ÉNONCÉ SUR LE CHAMP, et le calcul de non-aggravation est
 * affiché sous la saisie. Le refus fait autorité au serveur ; l'écran doit pouvoir
 * montrer POURQUOI — sinon un refus ressemble à une panne.
 */
import { computed, ref } from 'vue';

const props = defineProps({ dossier: { type: Object, required: true } });
const emit = defineEmits(['act']);

const OUTCOMES = [
  { value: 'Confirmée', label: 'Confirmée',
    note: 'La sanction prononcée est maintenue, telle quelle.' },
  { value: 'Réformée', label: 'Réformée',
    note: 'La sanction est modifiée, sans jamais être aggravée.' },
  { value: 'Infirmée', label: 'Infirmée',
    note: 'La sanction est annulée. Distincte d’une levée : l’une retire la sanction, l’autre la laisse au dossier.' },
];

const outcome = ref('Réformée');

const served = computed(() => props.dossier.appeal?.days_served_at_appeal || 0);
const total = computed(() => props.dossier.suspension?.days || 0);
/** Le plafond : jours prononcés moins jours purgés. Rien d'autre. */
const cap = computed(() => Math.max(0, total.value - served.value));

const daysRemaining = ref(0);
const resumeStart = ref('');
// Valeur d'ouverture : le plafond, qui est aussi le cas « confirmée ».
if (!daysRemaining.value) daysRemaining.value = cap.value;

const aggravates = computed(() =>
  outcome.value !== 'Infirmée' && served.value + daysRemaining.value > total.value);

function plural(n, w) { const v = Number(n) || 0; return v + ' ' + w + (v > 1 ? 's' : ''); }
</script>
