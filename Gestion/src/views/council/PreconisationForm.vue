<template>
  <!-- Ajouter une préconisation (M3 g8) — add_preconisation, garde DE. `kind` est un
       Select SERVEUR (VOCABULAIRES §5), jamais une clé de mon choix. Le contrat de
       remédiation porte en plus des objectifs et un plan d'accompagnement (Art. 30.1) ;
       les autres types n'en ont pas — l'écran ne montre ces champs que pour lui. -->
  <div class="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-6">
    <div class="w-full max-w-xl overflow-hidden rounded-lg-ln border border-ln-gray-300 bg-white shadow-elevated"
         role="dialog" aria-modal="true" aria-label="Ajouter une préconisation">
      <header class="border-b border-ln-gray-200 p-5">
        <h3 class="text-[17px] font-semibold text-ln-gray-900">Ajouter une préconisation</h3>
        <p class="mt-1 text-body-sm leading-normal text-ln-gray-500">
          Le conseil préconise, il ne décide pas. La préconisation est lue par le jury —
          elle ne lui est pas envoyée.
        </p>
      </header>
      <div class="flex flex-col gap-4 p-5">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="pf-student" class="flex items-center gap-1.5 text-body-sm font-semibold text-ln-gray-900">
              Étudiant (identifiant) <span class="font-bold text-ln-error">obligatoire</span>
            </label>
            <input id="pf-student" v-model="form.student" type="text" placeholder="ETU-…"
                   class="mt-2 h-11 w-full rounded-sm-ln border border-ln-gray-300 px-3 font-mono text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600" />
          </div>
          <div>
            <label for="pf-kind" class="flex items-center gap-1.5 text-body-sm font-semibold text-ln-gray-900">
              Type <span class="font-bold text-ln-error">obligatoire</span>
            </label>
            <select id="pf-kind" v-model="form.kind"
                    class="mt-2 h-11 w-full rounded-sm-ln border border-ln-gray-300 bg-white px-3 text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600">
              <option value="" disabled>—</option>
              <option v-for="k in KINDS" :key="k" :value="k">{{ k }}</option>
            </select>
          </div>
        </div>
        <div>
          <label for="pf-details" class="flex items-center gap-1.5 text-body-sm font-semibold text-ln-gray-900">
            Détails <span class="font-bold text-ln-error">obligatoire</span>
          </label>
          <textarea id="pf-details" v-model="form.details" rows="3"
                    class="mt-2 w-full rounded-sm-ln border border-ln-gray-300 p-3 text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600"
                    placeholder="Ce que le conseil préconise…"></textarea>
        </div>
        <!-- Le contrat de remédiation SEUL porte objectifs + accompagnement (Art. 30.1). -->
        <template v-if="form.kind === 'Contrat de remédiation'">
          <div>
            <label for="pf-obj" class="text-body-sm font-semibold text-ln-gray-900">Objectifs du contrat</label>
            <textarea id="pf-obj" v-model="form.objectives" rows="2"
                      class="mt-2 w-full rounded-sm-ln border border-ln-gray-300 p-3 text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600"
                      placeholder="Ce qui est attendu au semestre pair…"></textarea>
          </div>
          <div>
            <label for="pf-plan" class="text-body-sm font-semibold text-ln-gray-900">Plan d'accompagnement</label>
            <textarea id="pf-plan" v-model="form.support_plan" rows="2"
                      class="mt-2 w-full rounded-sm-ln border border-ln-gray-300 p-3 text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600"
                      placeholder="Le tutorat, le suivi prévus…"></textarea>
          </div>
        </template>
        <StateBanner v-if="error" variant="error" lead="L'ajout a échoué." :text="error" />
      </div>
      <footer class="flex items-center gap-3 border-t border-ln-gray-200 bg-ln-gray-50 px-5 py-4">
        <p class="mr-auto text-caption text-ln-gray-500">Préconiser ≠ décider : le jury reste souverain.</p>
        <button type="button" class="ln-btn-secondary" @click="emit('cancel')">Annuler</button>
        <button type="button" class="ln-btn-primary" :disabled="!complete || busy" @click="submit">Ajouter</button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue';
import { StateBanner } from '../../components/index.js';
import { PRECONISATION_KINDS } from '../../api/council.js';

/** Select serveur (Academic Preconisation.kind) — chaînes exactes, VOCABULAIRES §5. */
const KINDS = PRECONISATION_KINDS;

defineProps({
  error: { type: String, default: '' },
  busy: { type: Boolean, default: false },
});
const emit = defineEmits(['cancel', 'submit']);

const form = reactive({ student: '', kind: '', details: '', objectives: '', support_plan: '' });
const complete = computed(() =>
  form.student.trim().length > 0 && !!form.kind && form.details.trim().length > 0);

function submit() {
  const payload = {
    student: form.student.trim(), kind: form.kind, details: form.details.trim(),
  };
  if (form.kind === 'Contrat de remédiation') {
    if (form.objectives.trim()) payload.objectives = form.objectives.trim();
    if (form.support_plan.trim()) payload.support_plan = form.support_plan.trim();
  }
  emit('submit', payload);
}
</script>
