<script setup>
// RetourCongePage — le retour de congé (MANDAT-14, E-M2 ; Art. 37.6). La lecture dit le congé approuvé à reprendre
// (par sa période, P16) et la date de reprise la plus proche (`open.earliest_resume_date`) ; elle rend les actes de
// chaque demande (soumettre, annuler) ou la phrase qui les refuse. Les décisions sont lues, jamais calculées.
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-vue-next';
import ActesServeur from '@/components/demarches/ActesServeur.vue';
import { formatDate, leavePeriod, useDemarche } from '@/composables/useDemarche';

const { data, items, loading, error, load, perform } = useDemarche(
  'portal_app.api.academic.leave_return.get_my_leave_return_requests');
const busy = ref('');
const success = ref('');
const form = reactive({ resume_date: '', message: '' });
const open = computed(() => data.value?.open || null);
// Revue adversariale (lot 7, A-7) : le serveur exige un message, pas une longueur — l'écran n'ajoute pas de règle.
const canCreate = computed(() => open.value?.available && form.resume_date && form.message.trim().length > 0);

onMounted(load);

async function create() {
  busy.value = 'create';
  error.value = '';
  try {
    const draft = await perform(open.value, { leave_request: open.value.leave_request,
      resume_date: form.resume_date, message: form.message });
    success.value = `Demande de retour ${draft.name} créée : vérifiez-la, puis soumettez-la.`;
    form.resume_date = '';
    form.message = '';
    await load();
  } catch (err) { error.value = err.message; } finally { busy.value = ''; }
}
async function act({ act: a, params }) {
  busy.value = a.act;
  error.value = '';
  try {
    await perform(a, { name: params.name, ...params });
    await load();
  } catch (err) { error.value = err.message; } finally { busy.value = ''; }
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-6 space-y-6">
    <RouterLink to="/demarches" class="inline-flex items-center gap-1 text-sm text-ln-blue-800 hover:underline min-h-[44px]">
      <ArrowLeft class="w-4 h-4" /> Mes démarches
    </RouterLink>
    <header>
      <h1 class="text-2xl font-bold text-ln-gray-900">Retour de congé</h1>
      <p class="text-sm text-ln-gray-500 mt-1">Demander à reprendre vos études à la fin, ou avant la fin, de votre congé académique (Art. 37.6).</p>
    </header>

    <div v-if="error" class="flex items-start gap-2 rounded-md border border-ln-error/30 bg-ln-error-bg p-3 text-sm text-ln-error" role="alert">
      <AlertCircle class="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{{ error }}</span>
    </div>
    <div v-if="success" class="flex items-start gap-2 rounded-md border border-ln-success/30 bg-ln-success-bg p-3 text-sm text-ln-success" role="status">
      <CheckCircle2 class="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{{ success }}</span>
    </div>

    <section v-for="row in items" :key="row.name" class="rounded-lg border border-ln-gray-200 bg-white p-4 space-y-3">
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="text-base font-semibold text-ln-gray-900">{{ row.name }}</h2>
        <span class="inline-flex items-center rounded-full border border-ln-gray-300 px-2 py-0.5 text-xs font-medium">{{ row.status }}</span>
      </div>
      <dl class="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
        <div><dt class="text-ln-gray-500">Congé repris</dt><dd class="text-ln-gray-900">Congé {{ leavePeriod(row.leave_period) }}</dd></div>
        <div><dt class="text-ln-gray-500">Date de reprise demandée</dt><dd class="text-ln-gray-900">{{ formatDate(row.resume_date) }}</dd></div>
        <div><dt class="text-ln-gray-500">Déposée le</dt><dd class="text-ln-gray-900">{{ formatDate(row.creation) }}</dd></div>
      </dl>
      <p class="text-sm text-ln-gray-700">{{ row.message }}</p>
      <div v-if="row.instructed_on || row.decision_on" class="rounded-md bg-ln-gray-50 p-3 text-sm text-ln-gray-700 space-y-1">
        <!-- Q18 : la personne par son nom, jamais par son compte. -->
        <p v-if="row.instructed_on">Instruite par {{ row.instructed_by_name || 'la scolarité' }} le {{ formatDate(row.instructed_on) }}.</p>
        <p v-if="row.decision_on">Décision du {{ formatDate(row.decision_on) }} : {{ row.decision_reason }}</p>
      </div>
      <p v-else-if="row.status === 'Soumise'" class="text-sm text-ln-gray-500">En attente d’instruction par la scolarité.</p>
      <ActesServeur :available="row.available_acts" :blocked="row.blocked_acts" :busy="busy"
                    @act="(e) => act({ act: e.act, params: { ...e.params, name: row.name } })" />
    </section>

    <section class="rounded-lg border border-ln-gray-200 bg-white p-4 space-y-4">
      <h2 class="text-base font-semibold text-ln-gray-900">Nouvelle demande de retour</h2>
      <p v-if="loading" class="text-sm text-ln-gray-500">Chargement…</p>
      <p v-else-if="open && !open.available" class="text-sm text-ln-gray-600">{{ open.blocked_reason }}</p>
      <form v-else-if="open" class="grid gap-4 sm:grid-cols-2" @submit.prevent="create">
        <div class="sm:col-span-2 rounded-md bg-ln-blue-50/50 border border-ln-blue-100 p-3 text-sm text-ln-gray-900">
          Congé repris : <span class="font-semibold">{{ leavePeriod(open.leave_period) }}</span>.
          Reprise possible au plus tôt le <span class="font-semibold">{{ formatDate(open.earliest_resume_date) }}</span>.
        </div>
        <label class="space-y-1">
          <span class="text-sm font-medium text-ln-gray-700">Date de reprise <span class="font-normal text-ln-gray-500">(obligatoire)</span></span>
          <input v-model="form.resume_date" type="date" lang="fr" :min="open.earliest_resume_date"
                 class="w-full rounded-md border border-ln-gray-300 px-3 py-2 text-sm min-h-[44px]" />
        </label>
        <label class="space-y-1 sm:col-span-2">
          <span class="text-sm font-medium text-ln-gray-700">Message à la scolarité <span class="font-normal text-ln-gray-500">(obligatoire)</span></span>
          <textarea v-model="form.message" rows="3" class="w-full rounded-md border border-ln-gray-300 px-3 py-2 text-sm" />
        </label>
        <div class="sm:col-span-2 flex justify-end">
          <button type="submit" :disabled="!canCreate || busy === 'create'"
                  class="rounded-md bg-ln-blue-800 px-4 py-2 text-sm font-semibold text-white min-h-[44px] disabled:opacity-60">
            Créer la demande (brouillon)
          </button>
        </div>
      </form>
    </section>
  </div>
</template>
