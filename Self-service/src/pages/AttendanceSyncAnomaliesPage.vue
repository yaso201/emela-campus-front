<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { CheckCircle2, Play, RefreshCw, RotateCcw, Search, XCircle } from 'lucide-vue-next';
import AlertBlock from '@/components/ui/AlertBlock.vue';
import BlockError from '@/components/ui/BlockError.vue';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';

const filters = reactive({
  status: 'Open',
  severity: '',
  anomaly_type: '',
  local_server_id: '',
  student_group: '',
  limit: 100,
});

const loading = ref(false);
const acting = ref('');
const error = ref('');
const success = ref('');
const dashboard = ref(null);

const rows = computed(() => dashboard.value?.rows || []);
const summary = computed(() => dashboard.value?.summary || {});
const hasCritical = computed(() => (summary.value.critical || 0) > 0);

const statusOptions = ['', 'Open', 'Resolved', 'Ignored', 'Replayed'];
const severityOptions = ['', 'Info', 'Warning', 'Critical'];
const typeOptions = [
  '',
  'planning_conflict',
  'missing_closure_event',
  'session_missing_consolidation',
  'missing_student_attendance',
  'status_event_mismatch',
  'duplicate_presence_event',
  'missing_source_event',
];

onMounted(loadDashboard);

async function callApi(method, params = {}) {
  const formData = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      formData.append(key, value);
    }
  });

  const response = await fetch(`/api/method/${method}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Frappe-CSRF-Token': window.csrf_token || '',
      Accept: 'application/json',
    },
    body: formData.toString(),
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

async function loadDashboard() {
  loading.value = true;
  error.value = '';
  success.value = '';
  try {
    dashboard.value = await callApi('portal_app.api.attendance_sync_reconciliation.get_attendance_sync_anomaly_dashboard', filters);
  } catch (err) {
    dashboard.value = null;
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

function resetFilters() {
  filters.status = 'Open';
  filters.severity = '';
  filters.anomaly_type = '';
  filters.local_server_id = '';
  filters.student_group = '';
  filters.limit = 100;
  loadDashboard();
}

async function act(row, action) {
  const notes = window.prompt('Notes de traitement');
  if (!notes?.trim()) return;
  acting.value = `${row.name}:${action}`;
  error.value = '';
  success.value = '';
  try {
    let result;
    if (action === 'Replay') {
      result = await callApi('portal_app.api.attendance_sync_reconciliation.replay_attendance_sync_anomaly', {
        anomaly: row.name,
        notes,
      });
    } else if (action === 'Request Local Replay') {
      result = await callApi('portal_app.api.attendance_sync_reconciliation.request_local_replay_for_anomaly', {
        anomaly: row.name,
        notes,
      });
    } else {
      result = await callApi('portal_app.api.attendance_sync_reconciliation.resolve_attendance_sync_anomaly', {
        anomaly: row.name,
        action,
        notes,
      });
    }
    success.value = `${row.name} · ${result.status || result.local_replay_status}`;
    await loadDashboard();
  } catch (err) {
    error.value = err.message;
  } finally {
    acting.value = '';
  }
}

function formatCount(value) {
  return Number(value || 0).toLocaleString('fr-FR');
}

function formatDate(value) {
  if (!value) return 'N/A';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value.replace(' ', 'T')));
}

function statusVisual(status) {
  if (status === 'Open') return 'open';
  if (status === 'Resolved' || status === 'Replayed') return 'validated';
  if (status === 'Ignored') return 'closed';
  return 'pending';
}

function severityVisual(severity) {
  if (severity === 'Critical') return 'failed';
  if (severity === 'Warning') return 'compensated';
  return 'pending';
}

function typeLabel(value) {
  return String(value || '').replaceAll('_', ' ');
}

function detailSummary(row) {
  const entries = Object.entries(row.details || {}).slice(0, 3);
  if (!entries.length) return 'Aucun détail';
  return entries.map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join(' · ');
}
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-ln-gray-900">Anomalies sync</h1>
        <p class="mt-1 text-sm text-ln-gray-600">
          Divergences local, central et états consolidés.
        </p>
      </div>
      <button
        type="button"
        class="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md-ln border border-ln-gray-200 bg-white px-4 py-2 text-sm font-semibold text-ln-gray-700 hover:border-ln-blue-500 hover:text-ln-blue-900 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
        :disabled="loading"
        @click="loadDashboard"
      >
        <RefreshCw class="h-4 w-4" :class="{ 'motion-safe:animate-spin': loading }" />
        Actualiser
      </button>
    </header>

    <AlertBlock
      v-if="hasCritical"
      severity="warning"
      title="Anomalies critiques"
      :description="`${formatCount(summary.critical)} anomalie(s) critique(s) dans le périmètre affiché.`"
    />

    <AlertBlock v-if="success" severity="success" title="Traitement enregistré" :description="success" />

    <BlockError
      v-if="error"
      title="Anomalies indisponibles"
      :message="error"
      :retry="loadDashboard"
    />

    <section class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
      <form class="grid gap-3 md:grid-cols-2 xl:grid-cols-[150px_150px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]" @submit.prevent="loadDashboard">
        <label class="block">
          <span class="text-sm font-semibold text-ln-gray-900">Statut</span>
          <select v-model="filters.status" class="mt-2 min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25">
            <option v-for="option in statusOptions" :key="option || 'all-status'" :value="option">{{ option || 'Tous' }}</option>
          </select>
        </label>
        <label class="block">
          <span class="text-sm font-semibold text-ln-gray-900">Sévérité</span>
          <select v-model="filters.severity" class="mt-2 min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25">
            <option v-for="option in severityOptions" :key="option || 'all-severity'" :value="option">{{ option || 'Toutes' }}</option>
          </select>
        </label>
        <label class="block">
          <span class="text-sm font-semibold text-ln-gray-900">Type</span>
          <select v-model="filters.anomaly_type" class="mt-2 min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25">
            <option v-for="option in typeOptions" :key="option || 'all-types'" :value="option">{{ option ? typeLabel(option) : 'Tous' }}</option>
          </select>
        </label>
        <label class="block">
          <span class="text-sm font-semibold text-ln-gray-900">Serveur local</span>
          <input v-model="filters.local_server_id" type="text" class="mt-2 min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25" placeholder="attendance-local" />
        </label>
        <label class="block">
          <span class="text-sm font-semibold text-ln-gray-900">Groupe</span>
          <input v-model="filters.student_group" type="text" class="mt-2 min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25" placeholder="GROUPE-..." />
        </label>
        <div class="flex items-end gap-2">
          <button type="submit" class="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md-ln bg-ln-blue-800 px-3 py-2 text-sm font-semibold text-white hover:bg-ln-blue-900 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25" :disabled="loading" aria-label="Filtrer les anomalies">
            <Search class="h-4 w-4" />
          </button>
          <button type="button" class="inline-flex min-h-[44px] items-center justify-center rounded-md-ln border border-ln-gray-200 bg-white px-3 py-2 text-sm font-semibold text-ln-gray-700 hover:border-ln-blue-500 hover:text-ln-blue-900 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25" :disabled="loading" @click="resetFilters">
            Réinitialiser
          </button>
        </div>
      </form>
    </section>

    <div v-if="loading" class="grid gap-4 lg:grid-cols-4">
      <BlockSkeleton v-for="idx in 4" :key="idx" :lines="3" :show-title="false" />
    </div>

    <section v-else-if="dashboard" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <article class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
        <div class="text-xs font-semibold uppercase text-ln-gray-500">Total</div>
        <div class="mt-2 text-2xl font-bold text-ln-gray-900">{{ formatCount(summary.total) }}</div>
      </article>
      <article class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
        <div class="text-xs font-semibold uppercase text-ln-gray-500">Ouvertes</div>
        <div class="mt-2 text-2xl font-bold text-ln-blue-800">{{ formatCount(summary.open) }}</div>
      </article>
      <article class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
        <div class="text-xs font-semibold uppercase text-ln-gray-500">Critiques</div>
        <div class="mt-2 text-2xl font-bold text-ln-error">{{ formatCount(summary.critical) }}</div>
      </article>
      <article class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
        <div class="text-xs font-semibold uppercase text-ln-gray-500">Rejouées</div>
        <div class="mt-2 text-2xl font-bold text-ln-success">{{ formatCount(summary.replayed) }}</div>
      </article>
      <article class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
        <div class="text-xs font-semibold uppercase text-ln-gray-500">Rejeu local</div>
        <div class="mt-2 text-2xl font-bold text-ln-warning">{{ formatCount(summary.local_replay_failed) }}</div>
      </article>
    </section>

    <section class="overflow-hidden rounded-md-ln border border-ln-gray-200 bg-white">
      <div class="border-b border-ln-gray-100 px-4 py-3">
        <h2 class="text-sm font-semibold text-ln-gray-900">File d'anomalies</h2>
      </div>

      <div v-if="loading" class="p-4">
        <BlockSkeleton :lines="6" :show-title="false" />
      </div>

      <EmptyState v-else-if="rows.length === 0" icon="RefreshCw" label="Aucune anomalie" description="Aucune anomalie de synchronisation ne correspond aux filtres." />

      <div v-else class="hidden overflow-x-auto md:block">
        <table class="min-w-full divide-y divide-ln-gray-200">
          <thead class="bg-ln-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-ln-gray-500">Anomalie</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-ln-gray-500">Séance</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-ln-gray-500">Statut</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-ln-gray-500">Détails</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-ln-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-ln-gray-100 bg-white">
            <tr v-for="row in rows" :key="row.name">
              <td class="px-4 py-3 align-top">
                <div class="text-sm font-semibold text-ln-gray-900">{{ row.name }}</div>
                <div class="text-xs text-ln-gray-500">{{ typeLabel(row.anomaly_type) }}</div>
                <div class="mt-1 text-xs text-ln-gray-500">{{ formatDate(row.detected_at) }}</div>
              </td>
              <td class="px-4 py-3 align-top">
                <div class="text-sm font-semibold text-ln-gray-900">{{ row.session_id || row.attendance_session }}</div>
                <div class="text-xs text-ln-gray-500">{{ row.local_server_id || 'Sans serveur' }}</div>
                <div class="text-xs text-ln-gray-500">{{ row.student_group || 'Sans groupe' }}</div>
              </td>
              <td class="px-4 py-3 align-top">
                <div class="space-y-2">
                  <StatusBadge :status="severityVisual(row.severity)" :label="row.severity" size="sm" />
                  <StatusBadge :status="statusVisual(row.status)" :label="row.status" size="sm" />
                  <StatusBadge v-if="row.local_replay_status && row.local_replay_status !== 'Not Requested'" status="compensated" :label="row.local_replay_status" size="sm" />
                </div>
              </td>
              <td class="max-w-[360px] px-4 py-3 align-top text-sm text-ln-gray-700">
                <div class="line-clamp-3">{{ detailSummary(row) }}</div>
                <div v-if="row.student_id" class="mt-1 text-xs text-ln-gray-500">Étudiant : {{ row.student_name || row.student_id }}</div>
              </td>
              <td class="px-4 py-3 align-top">
                <div v-if="row.status === 'Open'" class="flex justify-end gap-1.5">
                  <button type="button" class="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md-ln border border-ln-gray-200 bg-white text-ln-success hover:border-ln-success focus:outline-none focus:ring-2 focus:ring-ln-success/25" :disabled="!!acting" aria-label="Résoudre" @click="act(row, 'Resolve')">
                    <CheckCircle2 class="h-4 w-4" />
                  </button>
                  <button type="button" class="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md-ln border border-ln-gray-200 bg-white text-ln-gray-700 hover:border-ln-gray-500 focus:outline-none focus:ring-2 focus:ring-ln-gray-300" :disabled="!!acting" aria-label="Ignorer" @click="act(row, 'Ignore')">
                    <XCircle class="h-4 w-4" />
                  </button>
                  <button v-if="row.can_replay" type="button" class="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md-ln border border-ln-gray-200 bg-white text-ln-blue-800 hover:border-ln-blue-700 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25" :disabled="!!acting" aria-label="Rejouer" @click="act(row, 'Replay')">
                    <Play class="h-4 w-4" />
                  </button>
                  <button v-if="row.can_request_local_replay" type="button" class="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md-ln border border-ln-gray-200 bg-white text-ln-warning hover:border-ln-warning focus:outline-none focus:ring-2 focus:ring-ln-warning/25" :disabled="!!acting" aria-label="Demander rejeu local" @click="act(row, 'Request Local Replay')">
                    <RotateCcw class="h-4 w-4" />
                  </button>
                </div>
                <span v-else class="text-xs text-ln-gray-500">Traité</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="rows.length > 0" class="divide-y divide-ln-gray-100 md:hidden">
        <article v-for="row in rows" :key="row.name" class="space-y-3 p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h3 class="truncate text-sm font-semibold text-ln-gray-900">{{ row.name }}</h3>
              <p class="text-xs text-ln-gray-500">{{ typeLabel(row.anomaly_type) }}</p>
            </div>
            <div class="flex flex-col items-end gap-1">
              <StatusBadge :status="severityVisual(row.severity)" :label="row.severity" size="sm" />
              <StatusBadge :status="statusVisual(row.status)" :label="row.status" size="sm" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div class="text-xs text-ln-gray-500">Séance</div>
              <div class="font-semibold text-ln-gray-900">{{ row.session_id || row.attendance_session || 'N/A' }}</div>
            </div>
            <div>
              <div class="text-xs text-ln-gray-500">Serveur</div>
              <div class="font-semibold text-ln-gray-900">{{ row.local_server_id || 'N/A' }}</div>
            </div>
            <div class="col-span-2">
              <div class="text-xs text-ln-gray-500">Détails</div>
              <div class="text-ln-gray-700">{{ detailSummary(row) }}</div>
            </div>
          </div>
          <div v-if="row.status === 'Open'" class="grid grid-cols-4 gap-2">
            <button type="button" class="inline-flex min-h-[44px] items-center justify-center rounded-md-ln border border-ln-gray-200 text-ln-success" :disabled="!!acting" aria-label="Résoudre" @click="act(row, 'Resolve')">
              <CheckCircle2 class="h-4 w-4" />
            </button>
            <button type="button" class="inline-flex min-h-[44px] items-center justify-center rounded-md-ln border border-ln-gray-200 text-ln-gray-700" :disabled="!!acting" aria-label="Ignorer" @click="act(row, 'Ignore')">
              <XCircle class="h-4 w-4" />
            </button>
            <button type="button" class="inline-flex min-h-[44px] items-center justify-center rounded-md-ln border border-ln-gray-200 text-ln-blue-800 disabled:opacity-30" :disabled="!!acting || !row.can_replay" aria-label="Rejouer" @click="act(row, 'Replay')">
              <Play class="h-4 w-4" />
            </button>
            <button type="button" class="inline-flex min-h-[44px] items-center justify-center rounded-md-ln border border-ln-gray-200 text-ln-warning disabled:opacity-30" :disabled="!!acting || !row.can_request_local_replay" aria-label="Demander rejeu local" @click="act(row, 'Request Local Replay')">
              <RotateCcw class="h-4 w-4" />
            </button>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
