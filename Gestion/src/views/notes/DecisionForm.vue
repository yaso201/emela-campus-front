<template>
  <!-- Instruction d'une décision de jury (M3 g6). Vocabulaires = SELECTS SERVEUR
       (deliberation_decision.json) — jamais une clé courte front. Le motif est
       obligatoire ; la dérogation d'assiduité est exigée pour un étudiant en
       dépassement (add_decision la porte — c'est ICI qu'elle se pose). -->
  <div class="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-6">
    <div class="w-full max-w-xl overflow-hidden rounded-lg-ln border border-ln-gray-300 bg-white shadow-elevated"
         role="dialog" aria-modal="true" aria-label="Instruire une décision">
      <header class="border-b border-ln-gray-200 p-5">
        <h3 class="text-[17px] font-semibold text-ln-gray-900">Instruire la décision — {{ row.student_name || row.student }}</h3>
        <p class="mt-1 text-body-sm leading-normal text-ln-gray-500">
          La décision est <b class="font-semibold">proposée</b> au jury ; elle ne devient
          définitive qu'à la clôture. Les codes sont ceux du serveur (Art. 30).
        </p>
      </header>
      <div class="flex flex-col gap-4 p-5">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="df-decision" class="flex items-center gap-1.5 text-body-sm font-semibold text-ln-gray-900">
              Décision <span class="font-bold text-ln-error">obligatoire</span>
            </label>
            <select id="df-decision" v-model="form.decision"
                    class="mt-2 h-11 w-full rounded-sm-ln border border-ln-gray-300 bg-white px-3 font-mono text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600">
              <option value="" disabled>—</option>
              <option v-for="d in DECISIONS" :key="d" :value="d">{{ d }}</option>
            </select>
          </div>
          <div>
            <label for="df-status" class="flex items-center gap-1.5 text-body-sm font-semibold text-ln-gray-900">
              Nouveau statut <span class="font-bold text-ln-error">obligatoire</span>
            </label>
            <select id="df-status" v-model="form.new_academic_status"
                    class="mt-2 h-11 w-full rounded-sm-ln border border-ln-gray-300 bg-white px-3 font-mono text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600">
              <option value="" disabled>—</option>
              <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
        </div>
        <div>
          <label for="df-reason" class="flex items-center gap-1.5 text-body-sm font-semibold text-ln-gray-900">
            Motif de la décision <span class="font-bold text-ln-error">obligatoire</span>
          </label>
          <textarea id="df-reason" v-model="form.decision_reason" rows="3"
                    class="mt-2 w-full rounded-sm-ln border border-ln-gray-300 p-3 text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600"
                    placeholder="Ce qui fonde la décision du jury…" />
        </div>
        <div v-if="row.attendance_exceeded" class="rounded-md-ln border border-ln-warning bg-ln-warning-bg p-4">
          <p class="text-body-sm font-semibold text-[#6B4415]">Dépassement d'absences — dérogation exigée</p>
          <p class="mt-1 text-caption leading-relaxed text-[#6B4415]">
            Le jury reste souverain (Art. 31.2) : le dépassement ne refuse pas la décision,
            il refuse une décision <b class="font-semibold">sans motif de dérogation</b>.
          </p>
          <textarea v-model="form.attendance_derogation_reason" rows="2"
                    class="mt-3 w-full rounded-sm-ln border border-ln-gray-300 bg-white p-2.5 text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600"
                    placeholder="Ce qui justifie la décision malgré le dépassement…" />
        </div>
        <StateBanner v-if="error" variant="error" lead="L'acte a échoué." :text="error" />
      </div>
      <footer class="flex items-center gap-3 border-t border-ln-gray-200 bg-ln-gray-50 px-5 py-4">
        <p class="mr-auto text-caption text-ln-gray-500">Proposé ≠ décidé : la clôture seule propage.</p>
        <button type="button" class="ln-btn-secondary" @click="emit('cancel')">Annuler</button>
        <button type="button" class="ln-btn-primary" :disabled="!complete || busy" @click="submit">Instruire</button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue';
import { StateBanner } from '../../components/index.js';

/** Vocabulaires SERVEUR (deliberation_decision.json — Selects, prouvés carte 6). */
const DECISIONS = ['APD', 'PIN', 'PRE', 'PCO', 'RED', 'EXC', 'REO', 'COA'];
const STATUSES = ['ACT', 'RED', 'PCO', 'REO', 'COA', 'EXC', 'DIP', 'DEM'];

const props = defineProps({
  row: { type: Object, required: true },     // la ligne du tableau (student, semester_result, attendance_exceeded…)
  initial: { type: Object, default: null },  // pré-remplissage (« Suivre ») — jamais un défaut inventé
  error: { type: String, default: '' },
  busy: { type: Boolean, default: false },
});
const emit = defineEmits(['cancel', 'submit']);

const form = reactive({
  decision: props.initial?.decision || '',
  new_academic_status: props.initial?.new_academic_status || '',
  decision_reason: '',
  attendance_derogation_reason: '',
});
const complete = computed(() =>
  !!form.decision && !!form.new_academic_status && form.decision_reason.trim().length > 0
  && (!props.row.attendance_exceeded || form.attendance_derogation_reason.trim().length > 0));

function submit() {
  emit('submit', {
    decision: form.decision,
    new_academic_status: form.new_academic_status,
    decision_reason: form.decision_reason.trim(),
    ...(props.row.attendance_exceeded
      ? { attendance_derogation_reason: form.attendance_derogation_reason.trim() } : {}),
  });
}
</script>
