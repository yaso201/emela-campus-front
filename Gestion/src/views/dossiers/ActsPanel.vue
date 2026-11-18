<template>
  <!-- MANDAT-12 (M6, S-18) — LES ACTES DE CE LECTEUR, sur CE dossier, tels que le serveur les dérive de
       la machine de la procédure (VERDICT-MANDAT-12-PC1 P2) : ni table d'issues écrite dans la vue, ni
       bouton offert à qui le serveur refuserait. Un acte que le statut permet mais qu'un fait bloque est
       NOMMÉ, avec la phrase du serveur. -->
  <section class="mb-4 overflow-hidden rounded-md-ln border border-ln-gray-200">
    <header class="border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
      <h3 class="text-[14px] font-semibold text-ln-gray-900">Vos actes sur ce dossier</h3>
      <p class="mt-0.5 text-caption text-ln-gray-500">{{ intro }}</p>
    </header>
    <div class="flex flex-col gap-3 px-4 py-3">
      <div v-for="a in available" :key="a.act">
        <div v-if="openAct === a.act" class="rounded-md-ln border border-ln-gray-300 p-3">
          <p class="text-body-sm font-semibold text-ln-gray-900">{{ LABEL[a.act] || a.act }}</p>
          <div v-if="a.outcomes?.length" class="mt-2">
            <label :for="'act-out-' + a.act" class="text-caption font-semibold text-ln-gray-700">Issue</label>
            <select :id="'act-out-' + a.act" v-model="outcome" class="mt-1 h-10 w-full rounded-sm-ln border border-ln-gray-300 bg-white px-2 text-body-sm">
              <option v-for="o in a.outcomes" :key="o" :value="o">{{ o }}</option>
            </select>
          </div>
          <div v-for="f in FIELDS[a.act] || []" :key="f.key" class="mt-2">
            <label :for="'act-f-' + f.key" class="text-caption font-semibold text-ln-gray-700">{{ f.label }}</label>
            <select v-if="f.options" :id="'act-f-' + f.key" v-model="values[f.key]"
                    class="mt-1 h-10 w-full rounded-sm-ln border border-ln-gray-300 bg-white px-2 text-body-sm">
              <option v-for="o in f.options" :key="o" :value="o">{{ o }}</option>
            </select>
            <input v-else :id="'act-f-' + f.key" v-model="values[f.key]" :type="f.type || 'text'"
                   class="mt-1 h-10 w-full rounded-sm-ln border border-ln-gray-300 px-2 text-body-sm" />
          </div>
          <div v-if="a.requires_reason" class="mt-2">
            <label :for="'act-r-' + a.act" class="text-caption font-semibold text-ln-gray-700">Motif <span class="text-ln-error">obligatoire</span></label>
            <textarea :id="'act-r-' + a.act" v-model="reason" rows="3"
                      class="mt-1 w-full rounded-sm-ln border border-ln-gray-300 p-2 text-body-sm" />
          </div>
          <div class="mt-3 flex justify-end gap-2">
            <button type="button" class="ln-btn-secondary" @click="openAct = null">Annuler</button>
            <button type="button" class="ln-btn-primary" :disabled="(a.requires_reason && !reason.trim()) || busy"
                    @click="emit('act', { act: a, outcome, reason: reason.trim(), values: { ...values } })">
              {{ LABEL[a.act] || a.act }}
            </button>
          </div>
        </div>
        <button v-else type="button" class="ln-btn-secondary" @click="start(a)">{{ (LABEL[a.act] || a.act) + '…' }}</button>
      </div>
      <p v-for="b in blocked" :key="b.act" class="rounded-sm-ln bg-ln-warning-bg p-3 text-caption leading-snug text-[#6B4415]">
        <b class="font-semibold">{{ LABEL[b.act] || b.act }} — indisponible :</b> {{ b.reason }}
      </p>
      <p v-if="!available.length && !blocked.length" class="text-caption text-ln-gray-500">
        Aucun acte ne vous revient à ce statut. {{ waiting }}
      </p>
    </div>
  </section>
</template>

<script setup>
/**
 * Props :
 *   available — [{act, method, outcomes: [statut]|null, requires_reason}] : `available_acts` de S-18 ;
 *   blocked — [{act, reason}] : `blocked_acts` de S-18 (la phrase du serveur) ;
 *   waitingRoles — [rôle] : qui le dossier attend ;
 *   busy — un acte est en cours.
 * Événement : act({ act, outcome, reason, values }).
 */
import { computed, reactive, ref } from 'vue';

const props = defineProps({
  available: { type: Array, default: () => [] },   // [{ act, method, outcomes[], requires_reason }]
  blocked: { type: Array, default: () => [] },     // [{ act, reason }]
  waitingRoles: { type: Array, default: () => [] },   // noms de rôles (chaînes) — S-18 `waiting_for_roles`
  busy: { type: Boolean, default: false },
});
const emit = defineEmits(['act']);
const openAct = ref(null);
const outcome = ref('');
const reason = ref('');
const values = reactive({});

// Le libellé d'un acte (vocabulaire d'écran) ; ses issues et l'exigence du motif viennent du SERVEUR.
const LABEL = {
  instructCoaRequest: 'Instruire la demande', decideCoaRequest: 'Décider', arbitrateCoaRequest: 'Arbitrer',
  reactivateFromCoa: 'Réactiver l’étudiant', instructLeaveReturnRequest: 'Instruire le retour',
  decideLeaveReturnRequest: 'Décider le retour', startReorientationCommission: 'Ouvrir la commission',
  addCommissionMember: 'Ajouter un membre de la commission', addCreditRecognition: 'Saisir une reconnaissance d’acquis',
  decideReorientation: 'Décider la réorientation', recordReorientationNotification: 'Tracer la notification',
  recordResignationInformation: 'Tracer l’information préalable', registerResignation: 'Enregistrer la démission',
  refuseResignation: 'Refuser la démission', issueAbandonmentNotice: 'Adresser la mise en demeure',
  pronounceAbandonment: 'Prononcer l’abandon', dismissAbandonment: 'Classer sans suite',
  convokeDisciplinaryCouncil: 'Convoquer le conseil de discipline', pronounceDisciplinarySuspension: 'Prononcer la sanction',
  closeWithoutSanction: 'Clore sans sanction', recordDisciplinaryNotification: 'Tracer la notification',
  decideSuspensionAppeal: 'Statuer sur l’appel', liftSuspension: 'Lever la suspension',
};
// Les champs propres à un acte — la signature de son verbe serveur, rien de plus.
const FIELDS = {
  addCommissionMember: [
    { key: 'member_role', label: 'Siège', options: ['Directeur des Études', 'Responsable de la formation d’origine', 'Responsable de la formation visée'] },
    { key: 'member_user', label: 'Membre (compte)' },
  ],
  addCreditRecognition: [
    { key: 'source_label', label: 'Acquis reconnu' },
    { key: 'credits_recognized', label: 'Crédits (ECTS)', type: 'number' },
    { key: 'basis', label: 'Fondement' },
  ],
  recordResignationInformation: [{ key: 'info_channel', label: 'Moyen de l’information (écrit, entretien proposé)' }],
  convokeDisciplinaryCouncil: [
    { key: 'convocation_date', label: 'Convocation le', type: 'date' },
    { key: 'council_date', label: 'Séance le (au moins cinq jours ouvrables après)', type: 'date' },
  ],
};
const intro = computed(() => (props.available.length
  ? 'Ce que la procédure permet à votre rôle, à ce statut. Le serveur fait foi à l’acte.'
  : 'Rien ne vous revient à ce statut.'));
const waiting = computed(() => (props.waitingRoles.length
  ? 'Le dossier attend : ' + props.waitingRoles.join(', ') + '.' : 'Le dossier n’attend plus aucun acte.'));
function start(a) {
  openAct.value = a.act; outcome.value = (a.outcomes || [])[0] || ''; reason.value = '';
  for (const k of Object.keys(values)) delete values[k];
}
</script>
