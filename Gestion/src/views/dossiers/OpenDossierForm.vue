<template>
  <!-- MANDAT-12 (M9, VERDICT-MANDAT-12-PC1C) — OUVRIR UN DOSSIER : un constat d'abandon ou un dossier
       disciplinaire, par l'Education Manager seul (K-e). Les deux procédures naissent en Brouillon ; leurs actes
       suivants passent par le panneau des actes du dossier (M6). Rien n'est deviné : les catégories sont les options
       du doctype, les candidats à l'abandon sont ceux que le serveur calcule (`list_abandonment_candidates`, un signal,
       jamais une décision). L'étudiant se saisit par son matricule, que le serveur vérifie (K-f). -->
  <!-- Audit de conception MANDAT-12 (moyen 5) : la même coque que les autres fenêtres de l'application (SessionForm,
       ModuleForm) — voile, arrondi, ombre et titre identiques. -->
  <div class="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-6">
    <section class="w-full max-w-2xl overflow-hidden rounded-lg-ln border border-ln-gray-300 bg-white shadow-elevated"
             role="dialog" aria-modal="true" aria-label="Ouvrir un dossier">
      <header class="border-b border-ln-gray-200 p-5">
        <h2 class="text-[17px] font-semibold text-ln-gray-900">Ouvrir un dossier</h2>
        <p class="mt-1 text-caption text-ln-gray-500">Le dossier naît en brouillon. Il ne produit aucun effet sur l'étudiant tant qu'aucun acte n'est posé.</p>
      </header>

      <div class="flex flex-col gap-4 px-5 py-4">
        <fieldset>
          <legend class="text-caption font-semibold text-ln-gray-700">Procédure</legend>
          <div class="mt-1.5 flex flex-wrap gap-2">
            <label v-for="k in KINDS" :key="k.key"
                   class="inline-flex cursor-pointer items-center gap-2 rounded-sm-ln border px-3 py-2 text-body-sm"
                   :class="kind === k.key ? 'border-ln-blue-900 bg-ln-blue-50 font-semibold text-ln-blue-900' : 'border-ln-gray-300 text-ln-gray-700'">
              <input v-model="kind" type="radio" name="od-kind" :value="k.key" class="accent-ln-blue-900" />
              {{ k.label }}
            </label>
          </div>
        </fieldset>

        <!-- L'abandon : le semestre, puis les candidats que le serveur calcule pour ce semestre -->
        <template v-if="kind === 'abandon'">
          <div>
            <label for="od-term" class="text-caption font-semibold text-ln-gray-700">Semestre</label>
            <select id="od-term" v-model="term" :class="field" @change="loadCandidates">
              <option v-for="t in terms" :key="t.id" :value="t.id">{{ t.label }}</option>
            </select>
          </div>
          <div>
            <p class="text-caption font-semibold text-ln-gray-700">Candidats signalés pour ce semestre</p>
            <p class="mt-0.5 text-caption text-ln-gray-500">
              Un signal, pas une décision : figurer ici n'emporte rien. Le constat se motive par une catégorie du règlement.
            </p>
            <p v-if="candidatesState === 'loading'" class="mt-2 text-caption text-ln-gray-500">Chargement des candidats…</p>
            <p v-else-if="candidatesState === 'error'" class="mt-2 rounded-sm-ln bg-ln-error-bg p-3 text-caption text-ln-error">
              Les candidats de ce semestre ne se lisent pas. Le constat peut s'ouvrir sur un matricule saisi.
            </p>
            <p v-else-if="!candidates.length" class="mt-2 rounded-sm-ln bg-ln-gray-50 p-3 text-caption text-ln-gray-600">
              Aucun candidat signalé pour ce semestre. Un constat peut quand même s'ouvrir sur un matricule saisi.
            </p>
            <ul v-else class="mt-2 divide-y divide-ln-gray-100 rounded-sm-ln border border-ln-gray-200">
              <li v-for="c in candidates" :key="c.student" class="flex items-start gap-3 px-3 py-2">
                <input :id="'od-c-' + c.student" v-model="student" type="radio" name="od-candidate" :value="c.student"
                       class="mt-1 accent-ln-blue-900" />
                <label :for="'od-c-' + c.student" class="text-body-sm text-ln-gray-900">
                  <b class="font-mono text-[12px] font-semibold">{{ c.student }}</b>
                  <span class="ml-1.5 text-caption text-ln-gray-500">statut {{ c.status }}</span>
                  <span class="block text-caption text-ln-gray-600">{{ facts(c) }}</span>
                </label>
              </li>
            </ul>
          </div>
        </template>

        <!-- MANDAT-14 (C7) : l'étudiant se cherche par le serveur (nom, matricule), au lieu d'un matricule
             saisi à l'aveugle ; la portée (filière d'un RF) est celle du serveur. -->
        <div class="flex flex-col gap-2">
          <PeopleSearch id="od-student" kind="student" :initial="initialStudent" :selected="student"
                        label="Étudiant — obligatoire" placeholder="Nom ou matricule — trois caractères au moins"
                        @pick="student = $event.student" />
          <p v-if="student" class="text-caption text-ln-gray-700">Retenu : <b class="font-mono font-semibold">{{ student }}</b></p>
        </div>
        <div>
          <label for="od-ground" class="text-caption font-semibold text-ln-gray-700">Catégorie du motif <span class="text-ln-error">obligatoire</span></label>
          <select id="od-ground" v-model="ground" :class="field">
            <option value="" disabled>Choisir la catégorie</option>
            <option v-for="g in GROUNDS[kind]" :key="g" :value="g">{{ g }}</option>
          </select>
        </div>
        <div>
          <label for="od-details" class="text-caption font-semibold text-ln-gray-700">Exposé des faits <span class="text-ln-error">obligatoire</span></label>
          <textarea id="od-details" v-model="details" rows="4" class="mt-1 w-full rounded-sm-ln border border-ln-gray-300 p-2 text-body-sm" />
          <p class="mt-1 text-caption text-ln-gray-500">{{ kind === 'abandon' ? 'La mise en demeure le reprend : elle ne s\'adresse pas sans lui.' : 'La convocation du conseil le reprend : elle ne part pas sans lui.' }}</p>
        </div>
        <p v-if="error" class="rounded-sm-ln bg-ln-error-bg p-3 text-caption text-ln-error">{{ error }}</p>
      </div>

      <footer class="flex items-center gap-3 border-t border-ln-gray-200 bg-ln-gray-50 px-5 py-4">
        <p class="mr-auto text-caption text-ln-gray-500">{{ kind === 'abandon' ? 'Ouvert par l\'Education Manager.' : 'Instruit par l\'Education Manager.' }}</p>
        <button type="button" class="ln-btn-secondary" @click="emit('cancel')">Annuler</button>
        <button type="button" class="ln-btn-primary" :disabled="!complete || busy" @click="submit">
          {{ kind === 'abandon' ? 'Ouvrir le constat' : 'Ouvrir le dossier' }}
        </button>
      </footer>
    </section>
  </div>
</template>

<script setup>
/**
 * Props : terms — [{ id, label }] (le contexte académique) ; termId — le semestre ouvert ; busy ; error.
 * Événements : cancel ; submit({ kind, values }) — `values` porte la signature du verbe serveur.
 */
import { computed, onMounted, ref, watch } from 'vue';
import { listAbandonmentCandidates } from '../../api/dossiers.js';
import PeopleSearch from '../../components/PeopleSearch.vue';

const props = defineProps({
  terms: { type: Array, default: () => [] },   // [{ id, label }]
  termId: { type: String, default: null },
  busy: { type: Boolean, default: false },
  error: { type: String, default: '' },
});
const emit = defineEmits(['cancel', 'submit']);
const field = 'mt-1 h-10 w-full rounded-sm-ln border border-ln-gray-300 bg-white px-2 text-body-sm';

const KINDS = [
  { key: 'abandon', label: 'Constat d’abandon' },
  { key: 'discipline', label: 'Dossier disciplinaire' },
];
// Les options des doctypes (`ground_category`), telles quelles.
const GROUNDS = {
  abandon: [
    'Absence non justifiée à toutes les activités — 4 semaines consécutives',
    'Aucune participation à une évaluation du semestre',
    'Dépassement des 20 % assorti d\'une absence prolongée',
  ],
  discipline: [
    'Fraude ou tentative de fraude', 'Plagiat', 'Production par un tiers ou une IA non autorisée',
    'Faux certificats ou usurpation d\'identité', 'Absentéisme excessif', 'Comportement répréhensible',
    'Signalement répété (travail/assiduité/implication)',
  ],
};

const kind = ref(new URLSearchParams(location.search).get('nature') || 'abandon');
const term = ref(props.termId);
// MANDAT-14 (C7) : un étudiant désigné depuis la recherche du bandeau (`?ouvrir=`) arrive prérempli.
const initialStudent = new URLSearchParams(location.search).get('ouvrir')
  || new URLSearchParams((location.hash.split('?')[1]) || '').get('ouvrir') || '';
const student = ref(initialStudent);
const ground = ref('');
const details = ref('');
const candidates = ref([]);
const candidatesState = ref('idle');

const complete = computed(() => !!(student.value.trim() && ground.value && details.value.trim()
  && (kind.value !== 'abandon' || term.value)));

function facts(c) {
  const f = [];
  if (c.fact_1_four_consecutive_weeks) f.push('4 semaines consécutives sans présence');
  if (c.fact_2_no_evaluation_line) f.push('aucune évaluation');
  if (c.fact_3_over_20_percent_prolonged) f.push('plus de 20 % d’absences, absence prolongée');
  if (c.fact_4_leave_expired_no_return) f.push('congé échu sans demande de retour');
  if (c.term_absence_percent != null) f.push(c.term_absence_percent + ' % d’absences au semestre');
  return f.join(' · ') || 'signalé';
}
// Revue adversariale MANDAT-12 (M7, O-5) : garde de séquence ; un refus se dit, il ne passe pas pour « aucun candidat ».
let seq = 0;
async function loadCandidates() {
  if (!term.value) return;
  const mine = ++seq;
  candidatesState.value = 'loading';
  try {
    const out = (await listAbandonmentCandidates({ academic_term: term.value, limit: 50 }))?.candidates || [];
    if (mine === seq) { candidates.value = out; candidatesState.value = 'ready'; }
  } catch {
    if (mine === seq) { candidates.value = []; candidatesState.value = 'error'; }
  }
}
function submit() {
  const values = { student_id: student.value.trim(), ground_category: ground.value, ground_details: details.value.trim() };
  if (kind.value === 'abandon') values.academic_term = term.value;
  emit('submit', { kind: kind.value, values });
}
watch(kind, () => { ground.value = ''; });
onMounted(loadCandidates);
</script>
