<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { AlertCircle, CheckCircle2, RefreshCw, Send, XCircle } from 'lucide-vue-next';

const requests = ref([]);
const loading = ref(false);
const submitting = ref(false);
const cancelling = ref('');
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
    const message = payload?._server_messages || payload?.exc || payload?.message || `HTTP ${response.status}`;
    throw new Error(Array.isArray(message) ? message.join(' ') : String(message));
  }

  return Object.prototype.hasOwnProperty.call(payload, 'message') ? payload.message : payload;
}

async function loadRequests() {
  loading.value = true;
  error.value = '';
  try {
    requests.value = await callApi('portal_app.api.academic_leave_request.get_my_coa_requests');
  } catch (err) {
    requests.value = [];
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

async function cancelRequest(row) {
  cancelling.value = row.name;
  error.value = '';
  success.value = '';
  try {
    await callApi('portal_app.api.academic_leave_request.cancel_coa_request', {
      name: row.name,
    });
    success.value = 'Demande annulée.';
    await loadRequests();
  } catch (err) {
    error.value = err.message || 'Impossible d’annuler la demande.';
  } finally {
    cancelling.value = '';
  }
}

function canCancel(row) {
  return ['Brouillon', 'Soumise'].includes(row.status);
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function statusClass(status) {
  if (status === 'Approuvée' || status === 'Réactivée') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'Rejetée' || status === 'Annulée') return 'bg-red-50 text-red-700 border-red-200';
  if (status === 'En revue') return 'bg-blue-50 text-blue-700 border-blue-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}
</script>

<template>
  <main class="max-w-5xl mx-auto px-4 py-6 space-y-6">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-ln-gray-900">Congé académique</h1>
        <p class="text-sm text-ln-gray-500 mt-1">
          Soumettre et suivre une demande COA.
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
      <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="submitRequest">
        <label class="space-y-1">
          <span class="text-sm font-medium text-ln-gray-700">Date de début</span>
          <input
            v-model="form.from_date"
            type="date"
            class="w-full rounded-md border border-ln-gray-300 px-3 py-2 text-sm min-h-[44px] focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          />
        </label>

        <label class="space-y-1">
          <span class="text-sm font-medium text-ln-gray-700">Date de fin</span>
          <input
            v-model="form.to_date"
            type="date"
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
          <span class="text-sm font-medium text-ln-gray-700">Pièce jointe</span>
          <input
            v-model="form.attachment"
            type="text"
            placeholder="/private/files/justificatif.pdf"
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
        <h2 class="text-base font-semibold text-ln-gray-900">Mes demandes COA</h2>
        <span class="text-sm text-ln-gray-500">{{ requests.length }} demande(s)</span>
      </div>

      <div v-if="loading" class="p-4 text-sm text-ln-gray-500">Chargement…</div>
      <div v-else-if="requests.length === 0" class="p-6 text-center text-sm text-ln-gray-500">
        Aucune demande COA enregistrée.
      </div>
      <div v-else class="divide-y divide-ln-gray-100">
        <article
          v-for="row in requests"
          :key="row.name"
          class="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
        >
          <div class="min-w-0 space-y-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-medium text-ln-gray-900">{{ row.name }}</span>
              <span
                class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
                :class="statusClass(row.status)"
              >
                {{ row.status }}
              </span>
            </div>
            <p class="text-sm text-ln-gray-600">
              {{ formatDate(row.from_date) }} → {{ formatDate(row.to_date) }}
            </p>
            <p class="text-sm text-ln-gray-500 line-clamp-2">{{ row.reason || 'Motif non renseigné' }}</p>
            <p v-if="row.decision_reason" class="text-sm text-ln-gray-500">
              Décision : {{ row.decision_reason }}
            </p>
          </div>

          <button
            v-if="canCancel(row)"
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 min-h-[44px]"
            :disabled="cancelling === row.name"
            @click="cancelRequest(row)"
          >
            <XCircle class="w-4 h-4" />
            {{ cancelling === row.name ? 'Annulation…' : 'Annuler' }}
          </button>
        </article>
      </div>
    </section>
  </main>
</template>
