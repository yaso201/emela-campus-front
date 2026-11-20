<script setup>
// AbandonPage — l'abandon d'études : la mise en demeure (MANDAT-14, E-M5 ; Art. 39). La procédure est ouverte par la
// scolarité, jamais par l'étudiant. La lecture rend le constat notifié, le délai de réponse (`deadlines`) et l'acte
// « répondre » tant que le serveur l'offre ; la réponse ne s'envoie qu'une fois. Le prononcé ou le classement sont lus.
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-vue-next';
import ActesServeur from '@/components/demarches/ActesServeur.vue';
import EcheanceServeur from '@/components/demarches/EcheanceServeur.vue';
import { formatDate, useDemarche } from '@/composables/useDemarche';

const { items, loading, error, load, perform } = useDemarche(
  'portal_app.api.academic.abandonment.get_my_abandonment_findings', 'findings');
const busy = ref('');
onMounted(load);

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
      <h1 class="text-2xl font-bold text-ln-gray-900">Abandon d’études</h1>
      <p class="text-sm text-ln-gray-500 mt-1">Quand la scolarité constate une absence prolongée, elle vous met en demeure de vous expliquer (Art. 39).</p>
    </header>

    <div v-if="error" class="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
      <AlertCircle class="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{{ error }}</span>
    </div>

    <p v-if="loading" class="text-sm text-ln-gray-500">Chargement…</p>
    <section v-else-if="!items.length" class="rounded-lg border border-ln-gray-200 bg-white p-6 text-center text-sm text-ln-gray-600">
      <ShieldCheck class="w-6 h-6 mx-auto mb-2 text-emerald-600" aria-hidden="true" />
      Aucune procédure d’abandon ne vous concerne.
    </section>

    <section v-for="row in items" :key="row.name" class="rounded-lg border border-ln-gray-200 bg-white p-4 space-y-3">
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="text-base font-semibold text-ln-gray-900">{{ row.name }}</h2>
        <span class="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900">{{ row.status }}</span>
      </div>
      <dl class="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
        <div><dt class="text-ln-gray-500">Semestre</dt><dd class="text-ln-gray-900">{{ row.academic_term }}</dd></div>
        <div><dt class="text-ln-gray-500">Motif</dt><dd class="text-ln-gray-900">{{ row.ground_category }}</dd></div>
        <div><dt class="text-ln-gray-500">Notifiée le</dt><dd class="text-ln-gray-900">{{ formatDate(row.notified_on) }}</dd></div>
      </dl>
      <p class="text-sm text-ln-gray-700">{{ row.ground_details }}</p>
      <EcheanceServeur v-for="d in row.deadlines" :key="d.kind" :deadline="d" />
      <div v-if="row.response_received_on" class="rounded-md bg-ln-gray-50 p-3 text-sm text-ln-gray-700">
        Votre réponse du {{ formatDate(row.response_received_on) }} : « {{ row.response_text }} »
      </div>
      <p v-if="row.pronounced_on" class="text-sm text-ln-gray-800">Abandon prononcé le {{ formatDate(row.pronounced_on) }} : {{ row.pronounce_reason }}</p>
      <p v-if="row.dismissed_on" class="text-sm text-ln-gray-800">Procédure classée le {{ formatDate(row.dismissed_on) }} : {{ row.dismiss_reason }}</p>
      <ActesServeur :available="row.available_acts" :blocked="row.blocked_acts" :busy="busy"
                    @act="(e) => act(row, e)" />
    </section>
  </div>
</template>
