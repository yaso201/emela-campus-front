<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { RefreshCw, Search, ShieldAlert } from 'lucide-vue-next';
import AlertBlock from '@/components/ui/AlertBlock.vue';
import BlockError from '@/components/ui/BlockError.vue';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';

const filters = reactive({
  freshness_minutes: 15,
  heartbeat_prolonged_minutes: 60,
  sync_failed_hours: 4,
  local_server_id: '',
  limit: 100,
});

const loading = ref(false);
const alerting = ref(false);
const error = ref('');
const success = ref('');
const dashboard = ref(null);

const summary = computed(() => dashboard.value?.summary || {});
const servers = computed(() => dashboard.value?.servers || []);
const prolongedHeartbeats = computed(() => dashboard.value?.prolonged_heartbeats || []);
const prolongedSyncFailures = computed(() => dashboard.value?.prolonged_sync_failures || []);

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
    dashboard.value = await callApi('portal_app.api.attendance_observability.get_attendance_observability_dashboard', filters);
  } catch (err) {
    dashboard.value = null;
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function runChecks() {
  alerting.value = true;
  error.value = '';
  success.value = '';
  try {
    const result = await callApi('portal_app.api.attendance_observability.run_attendance_observability_checks', filters);
    const n16 = result.notifications?.heartbeat_prolonged?.created || 0;
    const n17 = result.notifications?.sync_failed_prolonged?.created || 0;
    success.value = `${n16} alerte(s) N-16 et ${n17} alerte(s) N-17 créées.`;
    await loadDashboard();
  } catch (err) {
    error.value = err.message;
  } finally {
    alerting.value = false;
  }
}

function resetFilters() {
  filters.freshness_minutes = 15;
  filters.heartbeat_prolonged_minutes = 60;
  filters.sync_failed_hours = 4;
  filters.local_server_id = '';
  filters.limit = 100;
  loadDashboard();
}

function formatCount(value) {
  return Number(value || 0).toLocaleString('fr-FR');
}

function formatMetric(value, suffix = '') {
  const number = Number(value || 0);
  return `${number.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}${suffix}`;
}

function freshnessStatus(row) {
  if (row.status === 'Failed') return 'failed';
  return row.freshness_status === 'Fresh' ? 'validated' : 'compensated';
}

function freshnessLabel(row) {
  if (row.status === 'Failed') return 'Failed';
  return row.freshness_status === 'Fresh' ? 'Frais' : 'Stale';
}
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-ln-gray-900">Santé attendance</h1>
        <p class="mt-1 text-sm text-ln-gray-600">
          Heartbeats, queues de synchronisation et anomalies techniques.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md-ln border border-ln-gray-200 bg-white px-4 py-2 text-sm font-semibold text-ln-gray-700 hover:border-ln-blue-500 hover:text-ln-blue-900 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          :disabled="loading"
          @click="loadDashboard"
        >
          <RefreshCw class="h-4 w-4" :class="{ 'motion-safe:animate-spin': loading }" />
          Actualiser
        </button>
        <button
          type="button"
          class="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md-ln bg-ln-blue-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ln-blue-900 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          :disabled="alerting || loading"
          @click="runChecks"
        >
          <ShieldAlert class="h-4 w-4" />
          Vérifier alertes
        </button>
      </div>
    </header>

    <AlertBlock v-if="success" severity="success" title="Contrôles lancés" :description="success" />
    <AlertBlock
      v-if="prolongedHeartbeats.length || prolongedSyncFailures.length"
      severity="warning"
      title="Incidents prolongés"
      :description="`${formatCount(prolongedHeartbeats.length)} heartbeat(s) prolongé(s), ${formatCount(prolongedSyncFailures.length)} sync(s) bloquée(s).`"
    />
    <BlockError v-if="error" title="Observabilité indisponible" :message="error" :retry="loadDashboard" />

    <section class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
      <form class="grid gap-3 md:grid-cols-2 xl:grid-cols-[180px_220px_160px_minmax(0,1fr)_120px_auto]" @submit.prevent="loadDashboard">
        <label class="block">
          <span class="text-sm font-semibold text-ln-gray-900">Fraîcheur min.</span>
          <input
            v-model.number="filters.freshness_minutes"
            type="number"
            min="1"
            max="120"
            class="mt-2 min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          />
        </label>
        <label class="block">
          <span class="text-sm font-semibold text-ln-gray-900">Heartbeat prolongé</span>
          <input
            v-model.number="filters.heartbeat_prolonged_minutes"
            type="number"
            min="15"
            max="1440"
            class="mt-2 min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          />
        </label>
        <label class="block">
          <span class="text-sm font-semibold text-ln-gray-900">Sync bloquée h</span>
          <input
            v-model.number="filters.sync_failed_hours"
            type="number"
            min="1"
            max="48"
            class="mt-2 min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          />
        </label>
        <label class="block">
          <span class="text-sm font-semibold text-ln-gray-900">Serveur</span>
          <input
            v-model="filters.local_server_id"
            type="text"
            class="mt-2 min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
            placeholder="attendance-local"
          />
        </label>
        <label class="block">
          <span class="text-sm font-semibold text-ln-gray-900">Limite</span>
          <input
            v-model.number="filters.limit"
            type="number"
            min="1"
            max="500"
            class="mt-2 min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          />
        </label>
        <div class="flex items-end gap-2">
          <button
            type="submit"
            class="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md-ln bg-ln-blue-800 px-3 py-2 text-sm font-semibold text-white hover:bg-ln-blue-900 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
            :disabled="loading"
            aria-label="Filtrer la santé attendance"
          >
            <Search class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="inline-flex min-h-[44px] items-center justify-center rounded-md-ln border border-ln-gray-200 bg-white px-3 py-2 text-sm font-semibold text-ln-gray-700 hover:border-ln-blue-500 hover:text-ln-blue-900 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
            :disabled="loading"
            @click="resetFilters"
          >
            Réinitialiser
          </button>
        </div>
      </form>
    </section>

    <div v-if="loading" class="grid gap-4 lg:grid-cols-4">
      <BlockSkeleton v-for="idx in 4" :key="idx" :lines="3" :show-title="false" />
    </div>

    <section v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
        <div class="text-xs font-semibold uppercase text-ln-gray-500">Serveurs</div>
        <div class="mt-2 text-2xl font-bold text-ln-gray-900">{{ formatCount(summary.servers_total) }}</div>
        <div class="mt-1 text-xs text-ln-gray-500">{{ formatCount(summary.servers_fresh) }} frais · {{ formatCount(summary.servers_stale) }} stale</div>
      </article>
      <article class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
        <div class="text-xs font-semibold uppercase text-ln-gray-500">Queue sync</div>
        <div class="mt-2 text-2xl font-bold text-ln-blue-800">{{ formatCount(summary.queue_depth_total) }}</div>
        <div class="mt-1 text-xs text-ln-gray-500">Max {{ formatCount(summary.queue_depth_max) }}</div>
      </article>
      <article class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
        <div class="text-xs font-semibold uppercase text-ln-gray-500">Anomalies ouvertes</div>
        <div class="mt-2 text-2xl font-bold text-ln-warning">{{ formatCount(summary.sync_anomalies_open) }}</div>
        <div class="mt-1 text-xs text-ln-gray-500">{{ formatCount(summary.sync_anomalies_critical) }} critiques</div>
      </article>
      <article class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
        <div class="text-xs font-semibold uppercase text-ln-gray-500">Latence moyenne</div>
        <div class="mt-2 text-2xl font-bold text-ln-gray-900">{{ formatMetric(summary.latency_avg_ms, ' ms') }}</div>
      </article>
    </section>

    <section class="overflow-hidden rounded-md-ln border border-ln-gray-200 bg-white">
      <div class="border-b border-ln-gray-100 px-4 py-3">
        <h2 class="text-sm font-semibold text-ln-gray-900">Serveurs locaux</h2>
      </div>

      <EmptyState
        v-if="!loading && servers.length === 0"
        icon="Activity"
        label="Aucun heartbeat"
        description="Aucun serveur local attendance n'a encore envoyé de heartbeat."
      />

      <div v-else class="hidden overflow-x-auto md:block">
        <table class="min-w-full divide-y divide-ln-gray-200">
          <thead class="bg-ln-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-ln-gray-500">Serveur</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-ln-gray-500">Heartbeat</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-ln-gray-500">Sync</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-ln-gray-500">Queue</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-ln-gray-100 bg-white">
            <tr v-for="row in servers" :key="row.local_server_id">
              <td class="px-4 py-3">
                <div class="text-sm font-semibold text-ln-gray-900">{{ row.local_server_id }}</div>
                <div class="text-xs text-ln-gray-500">{{ row.host_name || row.site_name || 'Serveur local' }}</div>
              </td>
              <td class="px-4 py-3">
                <StatusBadge :status="freshnessStatus(row)" :label="freshnessLabel(row)" size="sm" />
                <div class="mt-1 text-xs text-ln-gray-500">{{ formatMetric(row.heartbeat_age_minutes, ' min') }}</div>
              </td>
              <td class="px-4 py-3 text-sm text-ln-gray-700">
                <div>{{ row.last_sync_at || 'Aucune sync' }}</div>
                <div class="text-xs text-ln-gray-500">{{ row.last_sync_age_hours === null ? 'N/A' : formatMetric(row.last_sync_age_hours, ' h') }}</div>
              </td>
              <td class="px-4 py-3 text-right text-sm font-semibold text-ln-gray-900">{{ formatCount(row.queue_depth) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="servers.length > 0" class="divide-y divide-ln-gray-100 md:hidden">
        <article v-for="row in servers" :key="row.local_server_id" class="space-y-3 p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h3 class="truncate text-sm font-semibold text-ln-gray-900">{{ row.local_server_id }}</h3>
              <p class="text-xs text-ln-gray-500">{{ row.host_name || row.site_name || 'Serveur local' }}</p>
            </div>
            <StatusBadge :status="freshnessStatus(row)" :label="freshnessLabel(row)" size="sm" />
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div class="text-xs text-ln-gray-500">Heartbeat</div>
              <div class="font-semibold text-ln-gray-900">{{ formatMetric(row.heartbeat_age_minutes, ' min') }}</div>
            </div>
            <div>
              <div class="text-xs text-ln-gray-500">Queue</div>
              <div class="font-semibold text-ln-gray-900">{{ formatCount(row.queue_depth) }}</div>
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
