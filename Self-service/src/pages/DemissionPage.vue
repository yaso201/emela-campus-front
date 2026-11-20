<script setup>
// DemissionPage — la démission (MANDAT-14, E-M4 ; Art. 38). L'information préalable est dite AVANT tout dépôt ; le
// délai d'effet et le terme de rétractation viennent du serveur (`deadlines`) ; « Rétracter » n'est offert que tant
// que le serveur l'admet (Art. 38.5). Un brouillon s'annule ; un dépôt passe par une confirmation qui dit l'effet.
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { AlertCircle, ArrowLeft, Info } from 'lucide-vue-next';
import ActesServeur from '@/components/demarches/ActesServeur.vue';
import EcheanceServeur from '@/components/demarches/EcheanceServeur.vue';
import { formatDate, useDemarche } from '@/composables/useDemarche';

const { data, items, loading, error, load, perform } = useDemarche(
  'portal_app.api.academic.resignation.get_my_resignation_requests', 'requests');
const busy = ref('');
const lu = ref(false);
const open = computed(() => data.value?.open || null);

onMounted(load);

async function create() {
  busy.value = 'create';
  error.value = '';
  try { await perform(open.value, {}); lu.value = false; await load(); }
  catch (err) { error.value = err.message; } finally { busy.value = ''; }
}
async function act(row, { act: a, params }) {
  busy.value = a.act;
  error.value = '';
  try { await perform(a, { name: row.name, ...params }); await load(); }
  catch (err) { error.value = err.message; } finally { busy.value = ''; }
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-6 space-y-6">
    <RouterLink to="/demarches" class="inline-flex items-center gap-1 text-sm text-ln-blue-800 hover:underline min-h-[44px]">
      <ArrowLeft class="w-4 h-4" /> Mes démarches
    </RouterLink>
    <header>
      <h1 class="text-2xl font-bold text-ln-gray-900">Démission</h1>
      <p class="text-sm text-ln-gray-500 mt-1">Mettre fin à votre cursus. La démission devient définitive au terme d’un délai pendant lequel vous pouvez la rétracter (Art. 38).</p>
    </header>

    <div v-if="error" class="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
      <AlertCircle class="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{{ error }}</span>
    </div>

    <section v-for="row in items" :key="row.name" class="rounded-lg border border-ln-gray-200 bg-white p-4 space-y-3">
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="text-base font-semibold text-ln-gray-900">{{ row.name }}</h2>
        <span class="inline-flex items-center rounded-full border border-ln-gray-300 px-2 py-0.5 text-xs font-medium">{{ row.status }}</span>
      </div>
      <dl class="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
        <div><dt class="text-ln-gray-500">Déposée le</dt><dd class="text-ln-gray-900">{{ formatDate(row.deposited_on) }}</dd></div>
        <div><dt class="text-ln-gray-500">Information reçue le</dt><dd class="text-ln-gray-900">{{ formatDate(row.info_given_on) }}</dd></div>
        <div><dt class="text-ln-gray-500">Enregistrée le</dt><dd class="text-ln-gray-900">{{ formatDate(row.registered_on) }}</dd></div>
        <div><dt class="text-ln-gray-500">Prise d’effet</dt><dd class="text-ln-gray-900">{{ formatDate(row.effective_due_on) }}</dd></div>
      </dl>
      <EcheanceServeur v-for="d in row.deadlines" :key="d.kind" :deadline="d" />
      <p v-if="row.refusal_reason" class="text-sm text-ln-gray-700">Refus : {{ row.refusal_reason }}</p>
      <ActesServeur :available="row.available_acts" :blocked="row.blocked_acts" :busy="busy"
                    @act="(e) => act(row, e)" />
    </section>

    <section v-if="!loading && open" class="rounded-lg border border-ln-gray-200 bg-white p-4 space-y-4">
      <h2 class="text-base font-semibold text-ln-gray-900">Préparer une démission</h2>
      <p v-if="!open.available" class="text-sm text-ln-gray-600">{{ open.blocked_reason }}</p>
      <template v-else>
        <div class="flex items-start gap-2 rounded-md border border-ln-blue-100 bg-ln-blue-50/50 p-3 text-sm text-ln-gray-800">
          <Info class="w-4 h-4 mt-0.5 flex-shrink-0 text-ln-blue-800" aria-hidden="true" />
          <div class="space-y-1">
            <p class="font-semibold">Avant de déposer (Art. 38)</p>
            <p>La scolarité vous informe des conséquences : fin du cursus, situation financière, réadmission par une nouvelle admission seulement.</p>
            <p>Après l’enregistrement, vous disposez de 15 jours ouvrables pour rétracter votre démission ; au-delà, elle est définitive.</p>
          </div>
        </div>
        <label class="flex items-start gap-2 text-sm text-ln-gray-800">
          <input v-model="lu" type="checkbox" class="mt-1" /> J’ai lu ces informations.
        </label>
        <div class="flex justify-end">
          <button type="button" :disabled="!lu || busy === 'create'" @click="create"
                  class="rounded-md bg-ln-blue-800 px-4 py-2 text-sm font-semibold text-white min-h-[44px] disabled:opacity-60">
            Créer le brouillon de démission
          </button>
        </div>
      </template>
    </section>
  </div>
</template>
