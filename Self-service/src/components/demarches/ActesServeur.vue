<script setup>
// ActesServeur — les actes d'un dossier tels que la lecture les rend (P1) : chaque acte offert est un bouton, avec
// le chemin du serveur ; un acte que la garde refuse est DIT, avec sa phrase, sans bouton. Un acte irréversible ou
// qui porte un texte passe par une confirmation qui dit l'effet. L'écran n'ajoute ni ne retire aucun acte.
import { computed, nextTick, reactive } from 'vue';
import { AlertTriangle, Ban, Send } from 'lucide-vue-next';

const props = defineProps({
  available: { type: Array, default: () => [] },
  blocked: { type: Array, default: () => [] },
  busy: { type: String, default: '' },
});
const emit = defineEmits(['act']);

// Le vocabulaire des boutons (présentation) et l'effet dit avant un acte qui engage.
const LABELS = {
  submitCoaRequest: 'Soumettre la demande',
  cancelCoaRequest: 'Annuler la demande',
  submitLeaveReturnRequest: 'Soumettre la demande de retour',
  cancelLeaveReturnRequest: 'Annuler la demande de retour',
  submitReorientationRequest: 'Soumettre la demande',
  depositResignation: 'Déposer ma démission',
  cancelResignationRequest: 'Annuler le brouillon',
  retractResignation: 'Rétracter ma démission',
  recordAbandonmentResponse: 'Envoyer ma réponse',
  appealSuspension: 'Faire appel',
};
const EFFETS = {
  cancelCoaRequest: 'La demande est annulée ; vous pourrez en déposer une nouvelle.',
  cancelLeaveReturnRequest: 'La demande de retour est annulée ; votre congé continue.',
  depositResignation: 'La démission est déposée à la scolarité. Un délai de réflexion court avant son enregistrement (Art. 38).',
  retractResignation: 'Votre démission est retirée : votre inscription demeure, votre cursus continue (Art. 38.5).',
  recordAbandonmentResponse: 'Votre réponse est versée au dossier. Elle ne s’envoie qu’une fois.',
  appealSuspension: 'L’appel est enregistré. Il suspend la sanction jusqu’à la décision d’appel (Art. 18.6). Il ne se fait qu’une fois.',
};
// Revue adversariale (lot 7, A-7) : le serveur exige un texte, pas une longueur — l'écran n'ajoute pas de règle.
const TEXTES = {
  response_text: { label: 'Votre réponse à la mise en demeure' },
  appeal_grounds: { label: 'Les moyens de votre appel' },
};

const confirming = reactive({ act: '', text: '' });

const blockedOnly = computed(() => props.blocked.filter((b) => !props.available.some((a) => a.act === b.act)));

// Conception (lot 7 bis) : un acte que l'écran ne connaît pas se dit en français, jamais par son identifiant.
function label(act) { return LABELS[act] || 'Agir sur le dossier'; }
function needsConfirm(a) { return Boolean(EFFETS[a.act] || a.requires_text); }

// Conception (lot 7 bis, D-6) : la confirmation remplace le bouton ; le focus va dans le panneau (son champ, sinon son
// premier bouton) et revient au bouton de l'acte sur « Revenir » — au clavier, on ne perd pas sa place.
async function focusDans(selecteur) {
  await nextTick();
  document.querySelector(selecteur)?.focus();
}
function click(a) {
  if (needsConfirm(a)) {
    confirming.act = a.act;
    confirming.text = '';
    focusDans(`[data-confirm="${a.act}"] textarea, [data-confirm="${a.act}"] button`);
    return;
  }
  emit('act', { act: a, params: {} });
}
function confirm(a) {
  const params = a.requires_text ? { [a.requires_text]: confirming.text } : {};
  emit('act', { act: a, params });
  confirming.act = '';
}
function textOk(a) {
  if (!a.requires_text) return true;
  return confirming.text.trim().length > 0;
}
</script>

<template>
  <div class="space-y-3">
    <div v-if="available.length" class="flex flex-wrap gap-2">
      <template v-for="a in available" :key="a.act">
        <button
          v-if="confirming.act !== a.act"
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold min-h-[44px] disabled:opacity-60"
          :class="a.act.startsWith('cancel')
            ? 'border border-ln-gray-300 text-ln-gray-700 hover:bg-ln-gray-50'
            : 'bg-ln-blue-800 text-white hover:bg-ln-blue-900'"
          :disabled="busy === a.act"
          :data-act="a.act"
          @click="click(a)"
        >
          <Send v-if="!a.act.startsWith('cancel')" class="w-4 h-4" aria-hidden="true" />
          {{ busy === a.act ? 'Envoi…' : label(a.act) }}
        </button>
      </template>
    </div>

    <template v-for="a in available" :key="'c-' + a.act">
      <div v-if="confirming.act === a.act" class="rounded-md border border-ln-blue-200 bg-ln-blue-50 p-3 space-y-3"
           role="group" :aria-labelledby="'confirm-titre-' + a.act" :data-confirm="a.act">
        <p :id="'confirm-titre-' + a.act" class="text-sm font-semibold text-ln-gray-900">{{ label(a.act) }}</p>
        <p v-if="EFFETS[a.act]" class="text-sm text-ln-gray-700">{{ EFFETS[a.act] }}</p>
        <label v-if="a.requires_text" class="block space-y-1">
          <span class="text-sm font-medium text-ln-gray-700">{{ TEXTES[a.requires_text]?.label }}</span>
          <textarea
            v-model="confirming.text"
            rows="4"
            class="w-full rounded-md border border-ln-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ln-blue-600/25"
          />
          <span class="text-xs text-ln-gray-500">Obligatoire.</span>
        </label>
        <div class="flex flex-wrap justify-end gap-2">
          <button type="button" class="rounded-md border border-ln-gray-300 px-3 py-2 text-sm min-h-[44px]"
                  @click="confirming.act = ''; focusDans(`[data-act='${a.act}']`)">Revenir</button>
          <button type="button"
                  class="rounded-md bg-ln-blue-800 px-3 py-2 text-sm font-semibold text-white min-h-[44px] disabled:opacity-60"
                  :disabled="!textOk(a) || busy === a.act" @click="confirm(a)">
            Confirmer : {{ label(a.act).toLowerCase() }}
          </button>
        </div>
      </div>
    </template>

    <ul v-if="blockedOnly.length" class="space-y-2">
      <li v-for="b in blockedOnly" :key="b.act"
          class="flex items-start gap-2 rounded-md border border-ln-gray-200 bg-ln-gray-50 p-3 text-sm text-ln-gray-700">
        <Ban class="w-4 h-4 mt-0.5 flex-shrink-0 text-ln-gray-500" aria-hidden="true" />
        <span><span class="font-medium">{{ label(b.act) }} — indisponible.</span> {{ b.reason }}</span>
      </li>
    </ul>

    <p v-if="!available.length && !blockedOnly.length" class="flex items-center gap-2 text-sm text-ln-gray-500">
      <AlertTriangle class="w-4 h-4" aria-hidden="true" /> Aucun acte de votre part n’est attendu sur ce dossier.
    </p>
  </div>
</template>
