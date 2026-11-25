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
                <!-- MANDAT-14 (C7) : le titulaire du siège se cherche parmi le personnel (serveur) ; Q18 : son nom. -->
                <PeopleSearch :id="'act-f-' + f.key" kind="staff" :selected="seat(f.key).member_user"
                              :label="f.label + (f.required ? ' — obligatoire' : '')" placeholder="Nom ou courriel"
                              @pick="seat(f.key).member_user = $event.user; picked[f.key] = $event.full_name" />
                <p v-if="seat(f.key).member_user" class="mt-1 text-caption text-ln-gray-700">
                  Retenu : <b class="font-semibold">{{ picked[f.key] || seat(f.key).member_user }}</b>
                </p>
                <label class="mt-1.5 inline-flex items-center gap-2 text-caption text-ln-gray-700">
                  <input v-model="seat(f.key).is_representative" type="checkbox" class="accent-ln-blue-900"
                         :aria-label="'Représenté — ' + f.label" />
                  siège tenu par un représentant
                </label>
              </div>
              <div v-else-if="f.type === 'person'">
                <PeopleSearch :id="'act-f-' + f.key" kind="staff" :selected="values[f.key] || ''"
                              :label="f.label + (f.required ? ' — obligatoire' : '')" placeholder="Nom ou courriel"
                              @pick="values[f.key] = $event.user; picked[f.key] = $event.full_name" />
                <p v-if="values[f.key]" class="mt-1 text-caption text-ln-gray-700">
                  Retenu : <b class="font-semibold">{{ picked[f.key] || values[f.key] }}</b>
                </p>
              </div>
              <template v-else>
                <label :for="'act-f-' + f.key" class="text-caption font-semibold text-ln-gray-700">{{ f.label }} <span v-if="f.required" class="text-ln-error">obligatoire</span></label>
                <select v-if="f.options || f.choices" :id="'act-f-' + f.key" v-model="values[f.key]"
                        :disabled="Boolean(f.after && !values[f.after])"
                        class="mt-1 h-10 w-full rounded-sm-ln border border-ln-gray-300 bg-white px-2 text-body-sm disabled:bg-ln-gray-50">
                  <!-- C9 (PC1C) : rien n'est prérempli — une liste lue s'ouvre sur un choix vide. P22 : une liste qui
                       dépend d'un autre champ (`after`) attend ce champ, et le dit. -->
                  <option v-if="f.choices" value="" disabled>{{ f.after && !values[f.after] ? f.afterHint
                    : optionsOf(f).length ? 'Choisir…' : 'Aucune valeur lue' }}</option>
                  <option v-for="o in optionsOf(f)" :key="o.value" :value="o.value">{{ o.label }}</option>
                </select>
                <input v-else :id="'act-f-' + f.key" v-model="values[f.key]" :type="f.type || 'text'" :min="f.min"
                       :max="f.maxFrom ? choices[f.maxFrom] : f.max"
                       class="mt-1 h-10 w-full rounded-sm-ln border border-ln-gray-300 px-2 text-body-sm" />
              </template>
              <p v-if="f.hint" class="mt-1 text-caption text-ln-gray-500">{{ typeof f.hint === 'function' ? f.hint(choices) : f.hint }}</p>
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
                    @click="emit('act', { act: a, outcome: DECIDES.has(a.act) ? outcome : '', reason: reason.trim(),
                                          values: Object.fromEntries((FIELDS[a.act] || []).filter(shown).map((f) => [f.key, values[f.key]])) })">
              {{ LABEL[a.act] || a.act }}
            </button>
          </div>
        </div>
        <button v-else type="button" class="ln-btn-secondary" @click="start(a)">{{ (LABEL[a.act] || a.act) + '…' }}</button>
      </div>
      <p v-for="b in blocked" :key="b.act" class="rounded-sm-ln bg-ln-warning-bg p-3 text-caption leading-snug text-[var(--ln-warning-ink)]">
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
import { computed, reactive, ref, watch } from 'vue';
import PeopleSearch from '../../components/PeopleSearch.vue';
import { listTargetTerms } from '../../api/dossiers.js';

const props = defineProps({
  available: { type: Array, default: () => [] },   // [{ act, method, outcomes[], requires_reason }]
  blocked: { type: Array, default: () => [] },     // [{ act, reason }]
  waitingRoles: { type: Array, default: () => [] },   // noms de rôles (chaînes) — S-18 `waiting_for_roles`
  busy: { type: Boolean, default: false },
  // MANDAT-12 (M9) : les listes que la vue lit pour un acte (années, semestres, niveaux d'accueil) —
  // { years: [{ value, label }], terms: [{ value, label }], levels: [{ value, label }], appeal_cap: nombre (Q19),
  //   target_terms: [{ value, label }] (C9, sans niveau), target_program: la filière visée (MANDAT-14) }
  choices: { type: Object, default: () => ({}) },
});
const emit = defineEmits(['act']);
const openAct = ref(null);
const outcome = ref('');
const reason = ref('');
const values = reactive({});
// MANDAT-14 (C7) : le nom de la personne retenue, pour la relire avant l'acte (la valeur envoyée reste le compte).
const picked = reactive({});

/**
 * MANDAT-14 (G-M8, C9 ; P22) : les semestres d'accueil d'une réorientation dépendent du NIVEAU décidé — ceux où la
 * filière visée offre au moins une UE à ce niveau (`list_target_terms(target_program, target_academic_year,
 * target_level)`). Le niveau se choisit donc AVANT le semestre ; changer le niveau ou l'année vide le semestre et
 * relit la liste. Garde de séquence : une réponse dépassée ne gagne pas.
 */
const levelTerms = ref([]);
let levelSeq = 0;
watch(() => [openAct.value, values.target_academic_year, values.target_level, props.choices.target_program],
  async ([act, year, level, program], before) => {
    if (act !== 'decideReorientation') return;
    if (before && (before[1] !== year || before[2] !== level)) values.target_academic_term = '';
    const mine = ++levelSeq;
    levelTerms.value = [];
    if (!program || !year || !level) return;
    try {
      const out = ((await listTargetTerms({ target_program: program, target_academic_year: year, target_level: level }))
        ?.terms || []).map((t) => ({ value: t.academic_term,
        label: `${t.academic_term} — ${t.ue_count} ${t.ue_count >= 2 ? 'UE offertes' : 'UE offerte'}` }));
      if (mine === levelSeq) levelTerms.value = out;
    } catch { if (mine === levelSeq) levelTerms.value = []; }
  });

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
    // Revue adversariale MANDAT-12 (bas) : les paramètres POSITIONNELS du verbe sont exigés à l'écran (C9) — vides,
    // ils donnaient l'erreur d'argument manquant du cadre au lieu de garder l'acte inactif.
    { key: 'member_role', label: 'Siège', options: ['Directeur des Études', "Responsable de la formation d'origine", 'Responsable de la formation visée'], required: true },
    // MANDAT-14 (C7) : le membre se cherche parmi le personnel (serveur), au lieu d'un compte tapé.
    { key: 'member_user', label: 'Membre', type: 'person', required: true },
  ],
  addCreditRecognition: [
    { key: 'source_label', label: 'Acquis reconnu', required: true },
    { key: 'credits_recognized', label: 'Crédits (ECTS)', type: 'number', required: true },
    { key: 'basis', label: 'Fondement', required: true },
    // MANDAT-14 (X1) : le semestre couvert, et la totalité. La totalité exige le semestre (le serveur le refuse
    // sinon, par sa phrase) ; seule une ligne qui porte les deux tient les MHC obligatoires pour validés.
    { key: 'covers_academic_term', label: 'Semestre couvert (facultatif)', choices: 'target_terms' },
    { key: 'covers_full_semester', label: 'Reconnu en totalité — ses MHC obligatoires sont tenus pour validés', type: 'checkbox',
      hint: 'Exige le semestre couvert. Une reconnaissance partielle ne couvre aucun MHC.' },
  ],
  recordResignationInformation: [{ key: 'info_channel', label: 'Moyen de l’information (écrit, entretien proposé)', required: true }],
  convokeDisciplinaryCouncil: [
    { key: 'convocation_date', label: 'Convocation le', type: 'date', required: true },
    { key: 'council_date', label: 'Séance le (au moins cinq jours ouvrables après)', type: 'date', required: true },
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
  // MANDAT-12 (Q19, VERDICT-MANDAT-12-PC1C §4 ter) — statuer sur l'appel : « Confirmée » ou « Réformée » FIXE la
  // reprise dans le même acte (`resume_start`, `resume_days_remaining`), quand il reste des jours à purger ; le
  // plafond (jours non purgés) se lit au détail. « Infirmée » n'en demande aucune. Rien n'est prérempli (C9).
  decideSuspensionAppeal: [
    { key: 'resume_start', label: 'Reprise le', type: 'date', when: ['Confirmée', 'Réformée'], onlyIf: 'appeal_cap',
      required: true, hint: 'Aujourd’hui au plus tôt.' },
    { key: 'resume_days_remaining', label: 'Jours restants à purger', type: 'number', min: 1, maxFrom: 'appeal_cap',
      when: ['Confirmée', 'Réformée'], onlyIf: 'appeal_cap', required: true,
      hint: (c) => `De 1 à ${c.appeal_cap} jour${c.appeal_cap > 1 ? 's' : ''} : la durée prononcée moins les jours purgés au dépôt de l’appel.` },
  ],
  // MANDAT-12 (M9, Q17 ; C9) — l'acceptation crée l'inscription d'accueil : les TROIS valeurs sont exigées à l'écran
  // (rien n'est prérempli) ; « Rejetée » n'en demande aucune.
  // MANDAT-14 (P22) : l'année, puis le NIVEAU, puis le semestre — la liste des semestres dépend du niveau (C9 : seuls
  // ceux où la filière visée offre au moins une UE à ce niveau ; un autre serait refusé par le serveur).
  decideReorientation: [
    { key: 'target_academic_year', label: 'Année d’accueil', choices: 'years', when: 'Acceptée', required: true },
    { key: 'target_level', label: 'Niveau d’accueil (filière visée)', choices: 'levels', when: 'Acceptée', required: true,
      hint: 'L’acceptation inscrit l’étudiant dans la filière visée : la décision et l’inscription sont un seul acte.' },
    { key: 'target_academic_term', label: 'Semestre d’accueil', choices: 'level_terms', when: 'Acceptée', required: true,
      after: 'target_level', afterHint: 'Choisir d’abord le niveau d’accueil',
      hint: 'Les semestres où la filière visée offre au moins une UE à ce niveau. Un autre serait refusé par le serveur, qui nomme les possibles.' },
  ],
};
/** Les options d'un champ : écrites (`options`), lues par la vue (`choices`), ou lues ici (`level_terms`, P22). */
function optionsOf(f) {
  const raw = f.options || (f.choices === 'level_terms' ? levelTerms.value : props.choices[f.choices]) || [];
  return raw.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
}
/** Un siège du conseil, dans `values` (posé à l'ouverture de l'acte) : { seat, member_user, is_representative }. */
function seat(key) { return values[key] || {}; }
/**
 * Un champ paraît-il, pour l'issue et les valeurs du moment ? Revue de code MANDAT-12 (bas 6) : seuls les champs
 * qui paraissent sont ENVOYÉS — une reprise saisie sous « Confirmée » puis l'issue changée en « Infirmée » ne part
 * pas au serveur (qui la refuserait), un placement saisi puis une issue « Rejetée » non plus.
 */
function shown(f) {
  const when = !f.when || (Array.isArray(f.when) ? f.when.includes(outcome.value) : f.when === outcome.value);
  return when && (!f.unless || !values[f.unless]) && (!f.onlyIf || Number(props.choices[f.onlyIf]) > 0);
}
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
  for (const k of Object.keys(picked)) delete picked[k];
  for (const f of FIELDS[a.act] || []) {
    if (f.type === 'seat') values[f.key] = { seat: f.seat, member_user: '', is_representative: false };
    if (f.choices) values[f.key] = '';   // C9 : une liste lue s'ouvre sur « Choisir… »
  }
}
</script>
