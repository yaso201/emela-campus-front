<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { AlertCircle, ArrowLeft, CheckCircle2, RefreshCw, Send } from 'lucide-vue-next';
import { RouterLink } from 'vue-router';
// MANDAT-14 (C-3.2, P1) : la lecture rend `{student, items, open}` ; les actes de chaque demande et l'ouverture
// d'une nouvelle viennent du serveur — l'écran ne garde plus de machine (`canCancel` retiré).
import ActesServeur from '@/components/demarches/ActesServeur.vue';
// P16 (PC1B) : dates françaises, pluriels accordés ; le sigle « COA » ne s'affiche pas — un congé se nomme par sa période.
import { formatDate, leavePeriod, plural } from '@/composables/useDemarche';

const requests = ref([]);
const open = ref(null);
const loading = ref(false);
const submitting = ref(false);
const acting = ref('');
const error = ref('');
const success = ref('');

const form = reactive({
  from_date: '',
  to_date: '',
  reason: '',
  attachment: '',
});

const canSubmit = computed(() => (
  form.from_date.trim()
  && form.to_date.trim()
  && form.reason.trim().length >= 10
  && !submitting.value
));

onMounted(loadRequests);

async function callApi(method, params = {}) {
  const body = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      body.append(key, value);
    }
  });

  const response = await fetch(`/api/method/${method}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Frappe-CSRF-Token': window.csrf_token || '',
      Accept: 'application/json',
    },
    body: body.toString(),
    credentials: 'same-origin',
  });

  const text = await response.text();
  let payload = {};
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    let message = payload?._server_messages || payload?.exc || payload?.message || `HTTP ${response.status}`;
    try {
      message = JSON.parse(payload._server_messages).map((m) => JSON.parse(m).message).join(' ');
    } catch { /* message brut */ }
    throw new Error(Array.isArray(message) ? message.join(' ') : String(message));
  }

  return Object.prototype.hasOwnProperty.call(payload, 'message') ? payload.message : payload;
}

async function loadRequests() {
  loading.value = true;
  error.value = '';
  try {
    const out = await callApi('portal_app.api.academic_leave_request.get_my_coa_requests');
    requests.value = out?.items || [];
    open.value = out?.open || null;
  } catch (err) {
    requests.value = [];
    open.value = null;
    error.value = err.message || 'Impossible de charger les demandes.';
  } finally {
    loading.value = false;
  }
}

async function submitRequest() {
  if (!canSubmit.value) {
    error.value = 'Renseignez une période et un motif de 10 caractères minimum.';
    return;
  }

  submitting.value = true;
  error.value = '';
  success.value = '';
  try {
    const draft = await callApi('portal_app.api.academic_leave_request.create_coa_request', {
      from_date: form.from_date,
      to_date: form.to_date,
      reason: form.reason,
      attachment: form.attachment,
    });
    await callApi('portal_app.api.academic_leave_request.submit_coa_request', {
      name: draft.name,
    });
    form.from_date = '';
    form.to_date = '';
    form.reason = '';
    form.attachment = '';
    success.value = 'Demande de congé académique soumise.';
    await loadRequests();
  } catch (err) {
    error.value = err.message || 'Impossible de soumettre la demande.';
  } finally {
    submitting.value = false;
  }
}

// Un acte rendu par la lecture (soumettre, annuler) : son chemin vient du serveur.
async function act(row, { act: a }) {
  acting.value = a.act;
  error.value = '';
  success.value = '';
  try {
    await callApi(a.method, { name: row.name });
    success.value = a.act.startsWith('cancel') ? 'Demande annulée.' : 'Demande soumise.';
    await loadRequests();
  } catch (err) {
    error.value = err.message || 'Action impossible.';
  } finally {
    acting.value = '';
  }
}

function statusClass(status) {
  if (status === 'Approuvée' || status === 'Réactivée') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'Rejetée' || status === 'Annulée') return 'bg-red-50 text-red-700 border-red-200';
  if (status === 'En revue') return 'bg-blue-50 text-blue-700 border-blue-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}
</script>

<template>
  <!-- MANDAT-14 (P25) : un seul `main`, celui de la coquille. -->
  <div class="max-w-5xl mx-auto px-4 py-6 space-y-6">
    <RouterLink to="/demarches" class="inline-flex items-center gap-1 text-sm text-ln-blue-800 hover:underline min-h-[44px]">
      <ArrowLeft class="w-4 h-4" /> Mes démarches
    </RouterLink>
    <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-ln-gray-900">Congé académique</h1>
        <p class="text-sm text-ln-gray-500 mt-1">
          Demander une suspension de vos études et suivre votre demande (Art. 37).
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-2 rounded-md border border-ln-gray-300 px-3 py-2 text-sm font-medium text-ln-gray-700 hover:bg-ln-gray-50 min-h-[44px]"
        @click="loadRequests"
        :disabled="loading"
      >
        <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        Actualiser
      </button>
    </header>

    <div
      v-if="error"
      class="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
      role="alert"
    >
      <AlertCircle class="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{{ error }}</span>
    </div>

    <div
      v-if="success"
      class="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
      role="status"
    >
      <CheckCircle2 class="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{{ success }}</span>
    </div>

    <section class="rounded-lg border border-ln-gray-200 bg-white p-4">
      <h2 class="text-base font-semibold text-ln-gray-900 mb-4">Nouvelle demande</h2>
      <p v-if="open && !open.available" class="text-sm text-ln-gray-600">{{ open.blocked_reason }}</p>
      <form v-else class="grid gap-4 sm:grid-cols-2" @submit.prevent="submitRequest">
        <label class="space-y-1">
          <span class="text-sm font-medium text-ln-gray-700">Date de début</span>
          <input
            v-model="form.from_date"
            type="date"
            lang="fr"
            class="w-full rounded-md border border-ln-gray-300 px-3 py-2 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          />
        </label>

        <label class="space-y-1">
          <span class="text-sm font-medium text-ln-gray-700">Date de fin</span>
          <input
            v-model="form.to_date"
            type="date"
            lang="fr"
            class="w-full rounded-md border border-ln-gray-300 px-3 py-2 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          />
        </label>

        <label class="space-y-1 sm:col-span-2">
          <span class="text-sm font-medium text-ln-gray-700">Motif</span>
          <textarea
            v-model="form.reason"
            rows="4"
            class="w-full rounded-md border border-ln-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          />
        </label>

        <label class="space-y-1 sm:col-span-2">
          <span class="text-sm font-medium text-ln-gray-700">Pièce jointe (facultative)</span>
          <input
            v-model="form.attachment"
            type="text"
            placeholder="Lien vers votre justificatif déposé"
            class="w-full rounded-md border border-ln-gray-300 px-3 py-2 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          />
        </label>

        <div class="sm:col-span-2 flex justify-end">
          <button
            type="submit"
            class="inline-flex items-center justify-center gap-2 rounded-md bg-ln-blue-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ln-blue-900 disabled:cursor-not-allowed disabled:opacity-60 min-h-[44px]"
            :disabled="!canSubmit"
          >
            <Send class="w-4 h-4" />
            {{ submitting ? 'Soumission…' : 'Soumettre' }}
          </button>
        </div>
      </form>
    </section>

    <section class="rounded-lg border border-ln-gray-200 bg-white overflow-hidden">
      <div class="flex items-center justify-between border-b border-ln-gray-200 px-4 py-3">
        <h2 class="text-base font-semibold text-ln-gray-900">Mes demandes de congé</h2>
        <span class="text-sm text-ln-gray-500">{{ plural(requests.length, 'demande') }}</span>
      </div>

      <div v-if="loading" class="p-4 text-sm text-ln-gray-500">Chargement…</div>
      <div v-else-if="requests.length === 0" class="p-6 text-center text-sm text-ln-gray-500">
        Aucune demande de congé enregistrée.
      </div>
      <div v-else class="divide-y divide-ln-gray-100">
        <article
          v-for="row in requests"
          :key="row.name"
          class="p-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between"
        >
          <div class="min-w-0 space-y-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-medium text-ln-gray-900">Congé {{ leavePeriod(row) }}</span>
              <span
                class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
                :class="statusClass(row.status)"
              >
                {{ row.status }}
              </span>
            </div>
            <p class="text-sm text-ln-gray-500 line-clamp-2">{{ row.reason || 'Motif non renseigné' }}</p>
            <p v-if="row.decision_reason" class="text-sm text-ln-gray-500">
              Décision : {{ row.decision_reason }}
            </p>
            <p v-if="row.creation" class="text-xs text-ln-gray-500">Déposée le {{ formatDate(row.creation) }}</p>
          </div>

          <ActesServeur class="md:max-w-sm" :available="row.available_acts || []" :blocked="row.blocked_acts || []"
                        :busy="acting" @act="(e) => act(row, e)" />
        </article>
      </div>
    </section>
  </div>
</template>
