<script setup>
// DisciplinePage — la sanction et l'appel (MANDAT-14, E-M6 ; Art. 18). La lecture rend la sanction notifiée, le
// délai d'appel et la période (`deadlines`), et l'acte « faire appel » tant que le serveur l'offre : une fois, dans le
// délai, avec ses moyens ; l'effet suspensif est dit avant l'envoi. La décision d'appel est lue.
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-vue-next';
import ActesServeur from '@/components/demarches/ActesServeur.vue';
import EcheanceServeur from '@/components/demarches/EcheanceServeur.vue';
import { formatDate, plural, useDemarche } from '@/composables/useDemarche';

const { items, loading, error, load, perform } = useDemarche(
  'portal_app.api.academic.discipline.get_my_disciplinary_cases', 'cases');
const busy = ref('');
onMounted(load);

async function act(row, { act: a, params }) {
  busy.value = a.act;
  error.value = '';
  try { await perform(a, { name: row.name, ...params }); await load(); }
  catch (err) { error.value = err.message; } finally { busy.value = ''; }
}

// La sanction telle que la procédure l'a prononcée — rien n'est dit avant le conseil, ni quand il n'en prononce pas.
function sanction(row) {
  if (row.status === 'Convoquée') return 'À prononcer par le conseil de discipline';
  if (row.status === 'Sans sanction' || !row.duration_weeks) return 'Aucune sanction';
  return `Exclusion de ${plural(row.duration_weeks, 'semaine')}${row.is_suspended_sentence ? ' avec sursis' : ''}`;
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-6 space-y-6">
    <RouterLink to="/demarches" class="inline-flex items-center gap-1 text-sm text-ln-blue-800 hover:underline min-h-[44px]">
      <ArrowLeft class="w-4 h-4" /> Mes démarches
    </RouterLink>
    <header>
      <h1 class="text-2xl font-bold text-ln-gray-900">Discipline</h1>
      <p class="text-sm text-ln-gray-500 mt-1">Les procédures disciplinaires qui vous concernent, la sanction notifiée et votre droit d’appel (Art. 18).</p>
    </header>

    <div v-if="error" class="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
      <AlertCircle class="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{{ error }}</span>
    </div>

    <p v-if="loading" class="text-sm text-ln-gray-500">Chargement…</p>
    <section v-else-if="!items.length" class="rounded-lg border border-ln-gray-200 bg-white p-6 text-center text-sm text-ln-gray-600">
      <ShieldCheck class="w-6 h-6 mx-auto mb-2 text-emerald-600" aria-hidden="true" />
      Aucune procédure disciplinaire ne vous concerne.
    </section>

    <section v-for="row in items" :key="row.name" class="rounded-lg border border-ln-gray-200 bg-white p-4 space-y-3">
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="text-base font-semibold text-ln-gray-900">{{ row.name }}</h2>
        <span class="inline-flex items-center rounded-full border border-ln-gray-300 px-2 py-0.5 text-xs font-medium">{{ row.status }}</span>
      </div>
      <dl class="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
        <div><dt class="text-ln-gray-500">Motif</dt><dd class="text-ln-gray-900">{{ row.ground_category }}</dd></div>
        <div><dt class="text-ln-gray-500">Conseil de discipline</dt><dd class="text-ln-gray-900">{{ formatDate(row.council_date) }}</dd></div>
        <div><dt class="text-ln-gray-500">Sanction</dt><dd class="text-ln-gray-900">{{ sanction(row) }}</dd></div>
        <div><dt class="text-ln-gray-500">Notifiée le</dt><dd class="text-ln-gray-900">{{ formatDate(row.notified_on) }}</dd></div>
      </dl>
      <p v-if="row.period_start" class="text-sm text-ln-gray-700">Période prononcée : du {{ formatDate(row.period_start) }} au {{ formatDate(row.period_end) }}.</p>
      <EcheanceServeur v-for="d in row.deadlines" :key="d.kind" :deadline="d" />
      <div v-if="row.appealed_on" class="rounded-md bg-ln-gray-50 p-3 text-sm text-ln-gray-700">
        Appel formé le {{ formatDate(row.appealed_on) }}<span v-if="row.appeal_decision"> — décision : {{ row.appeal_decision }}</span><span v-else> — en attente de décision ; la sanction est suspendue.</span>
      </div>
      <ActesServeur :available="row.available_acts" :blocked="row.blocked_acts" :busy="busy"
                    @act="(e) => act(row, e)" />
    </section>
  </div>
</template>
