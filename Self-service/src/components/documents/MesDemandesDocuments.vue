<script setup>
// MesDemandesDocuments — demander un relevé, suivre ses demandes (MANDAT-14, E-M7 ; étape 12, C2).
// Tout vient de `get_my_document_requests` : ce qui se demande MAINTENANT et l'éligibilité au dépôt (`requestable`),
// le catalogue qui dit pourquoi une pièce ne se demande pas ici, les libellés, la catégorie d'un refus et si l'on peut
// reformuler, le code de vérification de la pièce émise. L'écran n'invente aucun libellé ni aucune règle. Une pièce
// déjà demandée et en file n'est pas offerte : le serveur refuserait le doublon (Q17).
import { computed, onMounted, ref } from 'vue';
import { AlertCircle, BadgeCheck, CheckCircle2, Clock3, FileText, RotateCcw, XCircle } from 'lucide-vue-next';
import { callApi, formatDate, plural } from '@/composables/useDemarche';

const M = 'portal_app.api.academic.document_requests.';
const data = ref(null);
const loading = ref(false);
const error = ref('');
const success = ref('');
const choix = ref('');
const busy = ref(false);

async function load() {
  loading.value = true;
  error.value = '';
  try { data.value = await callApi(M + 'get_my_document_requests'); }
  catch (err) { error.value = err.message; } finally { loading.value = false; }
}
onMounted(load);

const cle = (r) => `${r.document_type}|${r.academic_year}|${r.academic_term || ''}`;
const periode = (r) => (r.academic_term ? r.academic_term : `année ${r.academic_year}`);
const selection = computed(() => data.value?.requestable?.find((r) => cle(r) === choix.value) || null);
const nonDemandables = computed(() => (data.value?.catalogue || []).filter((c) => !c.requestable));

async function demander() {
  const r = selection.value;
  if (!r) return;
  busy.value = true;
  error.value = '';
  success.value = '';
  try {
    const out = await callApi(M + 'create_document_request', {
      document_type: r.document_type, academic_year: r.academic_year, academic_term: r.academic_term });
    success.value = out.eligibility.ready
      ? `Demande ${out.name} enregistrée : la scolarité la traite.`
      : `Demande ${out.name} enregistrée. ${out.eligibility.note}`;
    choix.value = '';
    await load();
  } catch (err) { error.value = err.message; } finally { busy.value = false; }
}

const ton = (s) => (s === 'Émise' ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
  : s === 'Refusée' ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-900');
</script>

<template>
  <div class="flex flex-col gap-6">
    <div v-if="error" class="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
      <AlertCircle class="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{{ error }}</span>
    </div>
    <div v-if="success" class="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700" role="status">
      <CheckCircle2 class="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{{ success }}</span>
    </div>

    <section class="rounded-lg border border-ln-gray-200 bg-white p-4 space-y-4">
      <h2 class="text-base font-semibold text-ln-gray-900">Demander un relevé</h2>
      <p v-if="loading" class="text-sm text-ln-gray-500">Chargement…</p>
      <template v-else-if="data">
        <p v-if="!data.requestable.length" class="text-sm text-ln-gray-600">Aucun relevé ne se demande pour l’instant.</p>
        <fieldset v-else class="grid gap-2">
          <legend class="sr-only">Le relevé à demander</legend>
          <label v-for="r in data.requestable" :key="cle(r)"
                 class="flex items-start gap-3 rounded-md border p-3 text-sm cursor-pointer"
                 :class="[choix === cle(r) ? 'border-ln-blue-500 bg-ln-blue-50/40' : 'border-ln-gray-200',
                          r.pending_request ? 'opacity-70 cursor-not-allowed' : '']">
            <input v-model="choix" type="radio" name="releve" :value="cle(r)" :disabled="Boolean(r.pending_request)" class="mt-1" />
            <span class="min-w-0 flex-1">
              <span class="font-medium text-ln-gray-900">{{ r.doc_label }}</span>
              <span class="text-ln-gray-600"> — {{ periode(r) }}</span>
              <span v-if="r.pending_request" class="block text-xs text-ln-gray-600 mt-0.5">Déjà demandé : {{ r.pending_request }}, en attente.</span>
              <span v-else class="flex items-start gap-1 text-xs mt-0.5" :class="r.ready ? 'text-emerald-700' : 'text-amber-800'">
                <BadgeCheck v-if="r.ready" class="w-3.5 h-3.5 mt-px flex-shrink-0" aria-hidden="true" />
                <Clock3 v-else class="w-3.5 h-3.5 mt-px flex-shrink-0" aria-hidden="true" />
                {{ r.note }}
              </span>
            </span>
          </label>
        </fieldset>
        <div class="flex justify-end">
          <button type="button" :disabled="!selection || busy" @click="demander"
                  class="rounded-md bg-ln-blue-800 px-4 py-2 text-sm font-semibold text-white min-h-[44px] disabled:opacity-60">
            {{ selection && !selection.ready ? 'Déposer la demande (elle restera en file)' : 'Déposer la demande' }}
          </button>
        </div>
        <details v-if="nonDemandables.length" class="text-sm text-ln-gray-600">
          <summary class="cursor-pointer select-none">Les autres documents ne se demandent pas ici</summary>
          <ul class="mt-2 space-y-1">
            <li v-for="c in nonDemandables" :key="c.document_type"><span class="font-medium text-ln-gray-800">{{ c.label }}</span> — {{ c.reason }}</li>
          </ul>
        </details>
      </template>
    </section>

    <section class="rounded-lg border border-ln-gray-200 bg-white overflow-hidden">
      <div class="flex items-center justify-between border-b border-ln-gray-200 px-4 py-3">
        <h2 class="text-base font-semibold text-ln-gray-900">Mes demandes</h2>
        <span class="text-sm text-ln-gray-500">{{ plural(data?.items?.length || 0, 'demande') }}</span>
      </div>
      <p v-if="data && !data.items.length" class="p-6 text-center text-sm text-ln-gray-500">Aucune demande.</p>
      <ul v-else class="divide-y divide-ln-gray-100">
        <li v-for="d in data?.items || []" :key="d.name" class="p-4 space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <FileText class="w-4 h-4 text-ln-gray-500" aria-hidden="true" />
            <span class="font-medium text-ln-gray-900">{{ d.doc_label }}</span>
            <span class="text-sm text-ln-gray-600">— {{ periode(d) }}</span>
            <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium" :class="ton(d.status)">{{ d.status_label }}</span>
          </div>
          <p class="text-xs text-ln-gray-500">
            {{ d.name }} · demandée le {{ formatDate(d.requested_on) }}<template v-if="d.program_label"> · {{ d.program_label }}</template>
          </p>
          <p v-if="d.status === 'Demandée' && d.eligibility_note" class="text-sm text-ln-gray-700">{{ d.eligibility_note }}</p>
          <div v-if="d.status === 'Émise'" class="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            Émise le {{ formatDate(d.issued_on) }}. Code de vérification : <span class="font-mono font-semibold tracking-wide">{{ d.verification_code }}</span>
            <span class="block text-xs mt-1">La pièce est dans l’onglet « Mes documents ».</span>
          </div>
          <div v-if="d.status === 'Refusée'" class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900 space-y-1">
            <p class="flex items-center gap-1 font-semibold"><XCircle class="w-4 h-4" aria-hidden="true" /> {{ d.refusal_label }} — le {{ formatDate(d.refused_on) }}</p>
            <p>{{ d.refusal_reason }}</p>
            <p v-if="d.reformulable" class="flex items-center gap-1 text-xs font-medium"><RotateCcw class="w-3.5 h-3.5" aria-hidden="true" /> Vous pourrez reformuler cette demande.</p>
            <p v-else class="text-xs">Cette demande ne peut pas être reformulée telle quelle.</p>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>
