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
          <div v-if="DECIDES.has(a.act) && a.outcomes?.length" class="mt-2">
            <label :for="'act-out-' + a.act" class="text-caption font-semibold text-ln-gray-700">Issue</label>
            <select :id="'act-out-' + a.act" v-model="outcome" class="mt-1 h-10 w-full rounded-sm-ln border border-ln-gray-300 bg-white px-2 text-body-sm">
              <option v-for="o in a.outcomes" :key="o" :value="o">{{ o }}</option>
            </select>
          </div>
          <template v-for="f in FIELDS[a.act] || []" :key="f.key">
            <!-- MANDAT-12 (M9) : un champ ne paraît que pour l'issue qui l'exige (`when`), ou tant qu'un autre
                 ne l'annule pas (`unless`) — le placement d'une acceptation, la date d'une sanction sans sursis. -->
            <div v-if="shown(f)" class="mt-2">
              <label v-if="f.type === 'checkbox'" class="inline-flex items-center gap-2 text-body-sm text-ln-gray-900">
                <input :id="'act-f-' + f.key" v-model="values[f.key]" type="checkbox" class="accent-ln-blue-900" />
                {{ f.label }}
              </label>
              <!-- Un siège du conseil (Art. 18.2) : le compte qui le tient, et s'il y est représenté. -->
              <div v-else-if="f.type === 'seat'" class="rounded-sm-ln border border-ln-gray-200 p-2">
                <label :for="'act-f-' + f.key" class="text-caption font-semibold text-ln-gray-700">{{ f.label }}</label>
                <input :id="'act-f-' + f.key" v-model="seat(f.key).member_user" type="text" placeholder="compte (courriel)"
                       class="mt-1 h-10 w-full rounded-sm-ln border border-ln-gray-300 px-2 text-body-sm" />
                <label class="mt-1.5 inline-flex items-center gap-2 text-caption text-ln-gray-700">
                  <input v-model="seat(f.key).is_representative" type="checkbox" class="accent-ln-blue-900"
                         :aria-label="'Représenté — ' + f.label" />
                  représenté(e)
                </label>
              </div>
              <template v-else>
                <label :for="'act-f-' + f.key" class="text-caption font-semibold text-ln-gray-700">{{ f.label }}</label>
                <select v-if="f.options || f.choices" :id="'act-f-' + f.key" v-model="values[f.key]"
                        class="mt-1 h-10 w-full rounded-sm-ln border border-ln-gray-300 bg-white px-2 text-body-sm">
                  <!-- C9 (PC1C) : rien n'est prérempli — une liste lue s'ouvre sur un choix vide. -->
                  <option v-if="f.choices" value="" disabled>{{ optionsOf(f).length ? 'Choisir…' : 'Aucune valeur lue' }}</option>
                  <option v-for="o in optionsOf(f)" :key="o.value" :value="o.value">{{ o.label }}</option>
                </select>
                <input v-else :id="'act-f-' + f.key" v-model="values[f.key]" :type="f.type || 'text'" :min="f.min" :max="f.max"
                       class="mt-1 h-10 w-full rounded-sm-ln border border-ln-gray-300 px-2 text-body-sm" />
              </template>
              <p v-if="f.hint" class="mt-1 text-caption text-ln-gray-500">{{ f.hint }}</p>
            </div>
          </template>
          <div v-if="a.requires_reason" class="mt-2">
            <label :for="'act-r-' + a.act" class="text-caption font-semibold text-ln-gray-700">Motif <span class="text-ln-error">obligatoire</span></label>
            <textarea :id="'act-r-' + a.act" v-model="reason" rows="3"
                      class="mt-1 w-full rounded-sm-ln border border-ln-gray-300 p-2 text-body-sm" />
          </div>
          <div class="mt-3 flex justify-end gap-2">
            <button type="button" class="ln-btn-secondary" @click="openAct = null">Annuler</button>
            <button type="button" class="ln-btn-primary" :disabled="(a.requires_reason && !reason.trim()) || missing(a.act) || busy"
                    @click="emit('act', { act: a, outcome: DECIDES.has(a.act) ? outcome : '', reason: reason.trim(), values: { ...values } })">
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
  // MANDAT-12 (M9) : les listes que la vue lit pour un acte (années, semestres, niveaux d'accueil) —
  // { years: [{ value, label }], terms: [{ value, label }], levels: [{ value, label }] }
  choices: { type: Object, default: () => ({}) },
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
/**
 * Les verbes qui PRENNENT une issue (`decision`). Pour les autres, `outcomes` (S-18) n'est que le statut
 * d'arrivée de l'acte : l'envoyer comme `decision` à `pronounce_disciplinary_suspension`, `convoke_…`, etc.
 * serait un paramètre que leur signature ne connaît pas (le serveur répond 500).
 */
const DECIDES = new Set(['decideCoaRequest', 'arbitrateCoaRequest', 'decideLeaveReturnRequest',
  'decideReorientation', 'decideSuspensionAppeal']);
// Les champs propres à un acte — la signature de son verbe serveur, rien de plus.
const FIELDS = {
  addCommissionMember: [
    // Les options du doctype, À LA LETTRE (apostrophe droite) : une apostrophe typographique serait refusée par le Select.
    { key: 'member_role', label: 'Siège', options: ['Directeur des Études', "Responsable de la formation d'origine", 'Responsable de la formation visée'] },
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
  // MANDAT-12 (M9, Q17) — la sanction : `pronounce_disciplinary_suspension(duration_weeks, pronounce_reason,
  // council_members, is_suspended_sentence, period_start)`. Les trois sièges de l'Art. 18.2, chacun une fois ; un
  // compte mal saisi est refusé au serveur par une phrase qui nomme le siège (C10).
  pronounceDisciplinarySuspension: [
    { key: 'duration_weeks', label: 'Durée (semaines)', type: 'number', min: 1, max: 4, required: true, hint: 'De 1 à 4 semaines.' },
    { key: 'is_suspended_sentence', label: 'Avec sursis — aucune période ne court', type: 'checkbox' },
    { key: 'period_start', label: 'Début de la période', type: 'date', unless: 'is_suspended_sentence',
      hint: 'Aujourd’hui si vide. La période court sur 7 jours par semaine prononcée.' },
    { key: 'seat_presidence', label: 'Présidence (directeur des études)', type: 'seat', seat: 'Présidence (directeur des études)', required: true },
    { key: 'seat_rf', label: 'Responsable de formation', type: 'seat', seat: 'Responsable de formation', required: true },
    { key: 'seat_concerne', label: 'Enseignant ou responsable concerné', type: 'seat', seat: 'Enseignant ou responsable concerné', required: true },
  ],
  // MANDAT-12 (M9, Q17 ; C9) — l'acceptation crée l'inscription d'accueil : les TROIS valeurs sont exigées à l'écran
  // (rien n'est prérempli) ; « Rejetée » n'en demande aucune.
  decideReorientation: [
    { key: 'target_academic_year', label: 'Année d’accueil', choices: 'years', when: 'Acceptée', required: true },
    { key: 'target_academic_term', label: 'Semestre d’accueil', choices: 'terms', when: 'Acceptée', required: true },
    { key: 'target_level', label: 'Niveau d’accueil (filière visée)', choices: 'levels', when: 'Acceptée', required: true,
      hint: 'L’acceptation inscrit l’étudiant dans la filière visée : la décision et l’inscription sont un seul acte.' },
  ],
};
/** Les options d'un champ : écrites (`options`) ou lues par la vue (`choices`). */
function optionsOf(f) {
  const raw = f.options || props.choices[f.choices] || [];
  return raw.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
}
/** Un siège du conseil, dans `values` (posé à l'ouverture de l'acte) : { seat, member_user, is_representative }. */
function seat(key) { return values[key] || {}; }
/** Un champ paraît-il, pour l'issue et les valeurs du moment ? */
function shown(f) { return (!f.when || f.when === outcome.value) && (!f.unless || !values[f.unless]); }
/** C9 : un champ exigé et visible qui n'a pas sa valeur garde l'acte inactif. */
function missing(act) {
  return (FIELDS[act] || []).some((f) => f.required && shown(f)
    && (f.type === 'seat' ? !(values[f.key]?.member_user || '').trim() : (values[f.key] === undefined || values[f.key] === '')));
}
const intro = computed(() => (props.available.length
  ? 'Ce que la procédure permet à votre rôle, à ce statut. Le serveur fait foi à l’acte.'
  : 'Rien ne vous revient à ce statut.'));
const waiting = computed(() => (props.waitingRoles.length
  ? 'Le dossier attend : ' + props.waitingRoles.join(', ') + '.' : 'Le dossier n’attend plus aucun acte.'));
function start(a) {
  openAct.value = a.act; outcome.value = (a.outcomes || [])[0] || ''; reason.value = '';
  for (const k of Object.keys(values)) delete values[k];
  for (const f of FIELDS[a.act] || []) {
    if (f.type === 'seat') values[f.key] = { seat: f.seat, member_user: '', is_representative: false };
    if (f.choices) values[f.key] = '';   // C9 : une liste lue s'ouvre sur « Choisir… »
  }
}
</script>
