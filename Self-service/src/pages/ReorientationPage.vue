<script setup>
// ReorientationPage — la réorientation (MANDAT-14, E-M3 ; Art. 41-42). Le formulaire est nourri par la lecture :
// les cas (options du doctype) et les filières visables (`open.cases`, `open.target_programs`). Le taux de
// mutualisation, établi au passage en commission, est MONTRÉ, jamais bloquant ; la décision est lue.
// Q18 : une filière s'affiche par son libellé (`origin_program_label`, `target_program_label`), jamais par son code.
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { AlertCircle, ArrowLeft, ArrowRight, Info } from 'lucide-vue-next';
import ActesServeur from '@/components/demarches/ActesServeur.vue';
import { formatDate, useDemarche } from '@/composables/useDemarche';

const { data, items, loading, error, load, perform } = useDemarche(
  'portal_app.api.academic.reorientation.get_my_reorientation_requests');
const busy = ref('');
const form = reactive({ case: '', target_program: '', motivation: '', notification_event_date: '' });
const open = computed(() => data.value?.open || null);
const canCreate = computed(() => open.value?.available && form.case && form.target_program
  && form.motivation.trim().length >= 20);
const taux = (v) => String(v).replace('.', ',');

onMounted(load);

async function create() {
  busy.value = 'create';
  error.value = '';
  try {
    await perform(open.value, { ...form });
    Object.assign(form, { case: '', target_program: '', motivation: '', notification_event_date: '' });
    await load();
  } catch (err) { error.value = err.message; } finally { busy.value = ''; }
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
      <h1 class="text-2xl font-bold text-ln-gray-900">Réorientation</h1>
      <p class="text-sm text-ln-gray-500 mt-1">Changer de filière : la demande est examinée par une commission, qui peut reconnaître vos acquis (Art. 42).</p>
    </header>

    <div v-if="error" class="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
      <AlertCircle class="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{{ error }}</span>
    </div>

    <section v-for="row in items" :key="row.name" class="rounded-lg border border-ln-gray-200 bg-white p-4 space-y-3">
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="text-base font-semibold text-ln-gray-900">{{ row.name }}</h2>
        <span class="inline-flex items-center rounded-full border border-ln-gray-300 px-2 py-0.5 text-xs font-medium">{{ row.status }}</span>
      </div>
      <p class="flex flex-wrap items-center gap-2 text-sm text-ln-gray-900">
        <span>{{ row.origin_program_label }}</span>
        <ArrowRight class="w-4 h-4 text-ln-gray-400" aria-hidden="true" />
        <span class="font-semibold">{{ row.target_program_label }}</span>
      </p>
      <dl class="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
        <div><dt class="text-ln-gray-500">Cas</dt><dd class="text-ln-gray-900">{{ row.case }}</dd></div>
        <div><dt class="text-ln-gray-500">Date de l’événement</dt><dd class="text-ln-gray-900">{{ formatDate(row.notification_event_date) }}</dd></div>
        <div><dt class="text-ln-gray-500">Déposée le</dt><dd class="text-ln-gray-900">{{ formatDate(row.creation) }}</dd></div>
      </dl>
      <p class="text-sm text-ln-gray-700">{{ row.motivation }}</p>
      <div v-if="row.mutualization_rate !== null && row.mutualization_rate !== undefined"
           class="flex items-start gap-2 rounded-md border border-ln-blue-100 bg-ln-blue-50/50 p-3 text-sm text-ln-gray-800">
        <Info class="w-4 h-4 mt-0.5 flex-shrink-0 text-ln-blue-800" aria-hidden="true" />
        <span>Taux de mutualisation entre les deux filières : <span class="font-semibold">{{ taux(row.mutualization_rate) }} %</span>.
          Il éclaire la commission ; il ne décide pas de la demande.</span>
      </div>
      <p v-if="row.status === 'En commission'" class="text-sm text-ln-gray-600">La commission examine votre demande. Sa décision vous sera notifiée.</p>
      <div v-if="row.decided_on" class="rounded-md bg-ln-gray-50 p-3 text-sm text-ln-gray-700">
        Décision du {{ formatDate(row.decided_on) }} : {{ row.decision_reason }}
        <span v-if="row.enrollment_created"> — votre inscription dans la nouvelle filière est créée.</span>
      </div>
      <ActesServeur :available="row.available_acts" :blocked="row.blocked_acts" :busy="busy" @act="(e) => act(row, e)" />
    </section>

    <section class="rounded-lg border border-ln-gray-200 bg-white p-4 space-y-4">
      <h2 class="text-base font-semibold text-ln-gray-900">Nouvelle demande</h2>
      <p v-if="loading" class="text-sm text-ln-gray-500">Chargement…</p>
      <p v-else-if="open && !open.available" class="text-sm text-ln-gray-600">{{ open.blocked_reason }}</p>
      <form v-else-if="open" class="grid gap-4 sm:grid-cols-2" @submit.prevent="create">
        <p v-if="open.origin_program_label" class="sm:col-span-2 text-sm text-ln-gray-700">
          Votre filière actuelle : <span class="font-semibold">{{ open.origin_program_label }}</span>.
        </p>
        <label class="space-y-1">
          <span class="text-sm font-medium text-ln-gray-700">Cas (Art. 41-42)</span>
          <select v-model="form.case" class="w-full rounded-md border border-ln-gray-300 px-3 py-2 text-sm min-h-[44px]">
            <option value="" disabled>Choisir…</option>
            <option v-for="c in open.cases" :key="c" :value="c">{{ c }}</option>
          </select>
        </label>
        <label class="space-y-1">
          <span class="text-sm font-medium text-ln-gray-700">Filière visée</span>
          <select v-model="form.target_program" class="w-full rounded-md border border-ln-gray-300 px-3 py-2 text-sm min-h-[44px]">
            <option value="" disabled>Choisir…</option>
            <option v-for="t in open.target_programs" :key="t.name" :value="t.name">{{ t.label }}</option>
          </select>
        </label>
        <label class="space-y-1">
          <span class="text-sm font-medium text-ln-gray-700">Date de l’événement (le cas échéant)</span>
          <input v-model="form.notification_event_date" type="date" lang="fr"
                 class="w-full rounded-md border border-ln-gray-300 px-3 py-2 text-sm min-h-[44px]" />
        </label>
        <label class="space-y-1 sm:col-span-2">
          <span class="text-sm font-medium text-ln-gray-700">Motivation</span>
          <textarea v-model="form.motivation" rows="4" class="w-full rounded-md border border-ln-gray-300 px-3 py-2 text-sm" />
          <span class="text-xs text-ln-gray-500">20 caractères au moins.</span>
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
