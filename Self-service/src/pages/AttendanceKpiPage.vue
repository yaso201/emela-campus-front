<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { AlertTriangle, Download, RefreshCw, Search } from 'lucide-vue-next';
import AlertBlock from '@/components/ui/AlertBlock.vue';
import BlockError from '@/components/ui/BlockError.vue';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';

const today = new Date();
const filters = reactive({
  start_date: toIsoDate(new Date(today.getFullYear(), 0, 1)),
  end_date: toIsoDate(today),
  student: '',
  student_group: '',
});

const loading = ref(false);
const exporting = ref(false);
const error = ref('');
const dashboard = ref(null);

const rows = computed(() => dashboard.value?.rows || []);
const summary = computed(() => dashboard.value?.summary || {});
const hasThresholdAlerts = computed(
  () => (summary.value.warning_count || 0) + (summary.value.exceeded_count || 0) > 0,
);

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
  try {
    dashboard.value = await callApi('portal_app.api.attendance_kpi.get_attendance_kpi_dashboard', filters);
  } catch (err) {
    dashboard.value = null;
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function exportCsv() {
  exporting.value = true;
  error.value = '';
  try {
    const payload = await callApi('portal_app.api.attendance_kpi.export_attendance_kpis_csv', filters);
    downloadTextFile(payload.filename || 'attendance_kpis.csv', payload.content || '');
  } catch (err) {
    error.value = err.message;
  } finally {
    exporting.value = false;
  }
}

function resetFilters() {
  filters.start_date = toIsoDate(new Date(today.getFullYear(), 0, 1));
  filters.end_date = toIsoDate(new Date());
  filters.student = '';
  filters.student_group = '';
  loadDashboard();
}

function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function formatPercent(value) {
  const number = Number(value || 0);
  return `${number.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;
}

function formatCount(value) {
  return Number(value || 0).toLocaleString('fr-FR');
}

function thresholdStatus(row) {
  if (row.threshold_status === 'Exceeded') return 'failed';
  if (row.threshold_status === 'Warning') return 'compensated';
  return 'validated';
}

function thresholdLabel(row) {
  if (row.threshold_status === 'Exceeded') return 'Seuil dépassé';
  if (row.threshold_status === 'Warning') return 'À surveiller';
  return 'Normal';
}
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-ln-gray-900">KPI présences</h1>
        <p class="mt-1 text-sm text-ln-gray-600">
          Présence effective, absence et leave par étudiant.
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
          :disabled="exporting || loading || rows.length === 0"
          @click="exportCsv"
        >
          <Download class="h-4 w-4" />
          Export CSV
        </button>
      </div>
    </header>

    <AlertBlock
      v-if="hasThresholdAlerts"
      severity="warning"
      title="Seuil leave"
      :description="`${formatCount(summary.warning_count)} alerte(s) d'approche, ${formatCount(summary.exceeded_count)} dépassement(s).`"
    />

    <BlockError
      v-if="error"
      title="KPI indisponibles"
      :message="error"
      :retry="loadDashboard"
    />

    <section class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
      <form class="grid gap-3 md:grid-cols-2 xl:grid-cols-[160px_160px_minmax(0,1fr)_minmax(0,1fr)_auto]" @submit.prevent="loadDashboard">
        <label class="block">
          <span class="text-sm font-semibold text-ln-gray-900">Début</span>
          <input
            v-model="filters.start_date"
            type="date"
            class="mt-2 min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
            required
          />
        </label>
        <label class="block">
          <span class="text-sm font-semibold text-ln-gray-900">Fin</span>
          <input
            v-model="filters.end_date"
            type="date"
            class="mt-2 min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
            required
          />
        </label>
        <label class="block">
          <span class="text-sm font-semibold text-ln-gray-900">Étudiant</span>
          <input
            v-model="filters.student"
            type="text"
            class="mt-2 min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
            placeholder="ETU-..."
          />
        </label>
        <label class="block">
          <span class="text-sm font-semibold text-ln-gray-900">Groupe / formation</span>
          <input
            v-model="filters.student_group"
            type="text"
            class="mt-2 min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
            placeholder="GROUPE-..."
          />
        </label>
        <div class="flex items-end gap-2">
          <button
            type="submit"
            class="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md-ln bg-ln-blue-800 px-3 py-2 text-sm font-semibold text-white hover:bg-ln-blue-900 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
            :disabled="loading"
            aria-label="Filtrer les KPI"
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

    <section v-else-if="dashboard" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <article class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
        <div class="text-xs font-semibold uppercase text-ln-gray-500">Étudiants</div>
        <div class="mt-2 text-2xl font-bold text-ln-gray-900">{{ formatCount(summary.students) }}</div>
      </article>
      <article class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
        <div class="text-xs font-semibold uppercase text-ln-gray-500">Présence effective</div>
        <div class="mt-2 text-2xl font-bold text-ln-success">{{ formatPercent(summary.effective_presence_percent) }}</div>
        <div class="mt-1 text-xs text-ln-gray-500">{{ formatCount(summary.present_count) }} / {{ formatCount(summary.total_sessions) }}</div>
      </article>
      <article class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
        <div class="text-xs font-semibold uppercase text-ln-gray-500">Absence</div>
        <div class="mt-2 text-2xl font-bold text-ln-error">{{ formatPercent(summary.absence_percent) }}</div>
        <div class="mt-1 text-xs text-ln-gray-500">{{ formatCount(summary.absent_count) }} ligne(s)</div>
      </article>
      <article class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
        <div class="text-xs font-semibold uppercase text-ln-gray-500">Leave</div>
        <div class="mt-2 text-2xl font-bold text-ln-blue-800">{{ formatPercent(summary.leave_percent) }}</div>
        <div class="mt-1 text-xs text-ln-gray-500">{{ formatCount(summary.leave_count) }} ligne(s)</div>
      </article>
      <article class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
        <div class="flex items-center gap-2 text-xs font-semibold uppercase text-ln-gray-500">
          <AlertTriangle class="h-4 w-4" />
          Seuil
        </div>
        <div class="mt-2 text-2xl font-bold text-ln-gray-900">{{ formatPercent(dashboard.leave_threshold_percent) }}</div>
        <div class="mt-1 text-xs text-ln-gray-500">Alerte {{ formatPercent(dashboard.leave_warning_percent) }}</div>
      </article>
    </section>

    <section class="overflow-hidden rounded-md-ln border border-ln-gray-200 bg-white">
      <div class="border-b border-ln-gray-100 px-4 py-3">
        <h2 class="text-sm font-semibold text-ln-gray-900">Résultats</h2>
      </div>

      <div v-if="loading" class="p-4">
        <BlockSkeleton :lines="6" :show-title="false" />
      </div>

      <EmptyState
        v-else-if="rows.length === 0"
        icon="BarChart3"
        label="Aucun KPI disponible"
        description="Aucune présence consolidée ne correspond aux filtres."
      />

      <div v-else class="hidden overflow-x-auto md:block">
        <table class="min-w-full divide-y divide-ln-gray-200">
          <thead class="bg-ln-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-ln-gray-500">Étudiant</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-ln-gray-500">Séances</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-ln-gray-500">Présence</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-ln-gray-500">Absence</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-ln-gray-500">Leave</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-ln-gray-500">Seuil</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-ln-gray-100 bg-white">
            <tr v-for="row in rows" :key="row.student">
              <td class="px-4 py-3">
                <div class="text-sm font-semibold text-ln-gray-900">{{ row.student_name }}</div>
                <div class="text-xs text-ln-gray-500">{{ row.student }} · {{ row.student_group || 'Sans groupe' }}</div>
              </td>
              <td class="px-4 py-3 text-right text-sm font-semibold text-ln-gray-900">{{ formatCount(row.total_sessions) }}</td>
              <td class="px-4 py-3 text-right text-sm text-ln-success">{{ formatPercent(row.effective_presence_percent) }}</td>
              <td class="px-4 py-3 text-right text-sm text-ln-error">{{ formatPercent(row.absence_percent) }}</td>
              <td class="px-4 py-3 text-right text-sm text-ln-blue-800">{{ formatPercent(row.leave_percent) }}</td>
              <td class="px-4 py-3">
                <StatusBadge :status="thresholdStatus(row)" :label="thresholdLabel(row)" size="sm" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="rows.length > 0" class="divide-y divide-ln-gray-100 md:hidden">
        <article v-for="row in rows" :key="row.student" class="space-y-3 p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h3 class="truncate text-sm font-semibold text-ln-gray-900">{{ row.student_name }}</h3>
              <p class="text-xs text-ln-gray-500">{{ row.student }} · {{ row.student_group || 'Sans groupe' }}</p>
            </div>
            <StatusBadge :status="thresholdStatus(row)" :label="thresholdLabel(row)" size="sm" />
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div class="text-xs text-ln-gray-500">Présence</div>
              <div class="font-semibold text-ln-success">{{ formatPercent(row.effective_presence_percent) }}</div>
            </div>
            <div>
              <div class="text-xs text-ln-gray-500">Absence</div>
              <div class="font-semibold text-ln-error">{{ formatPercent(row.absence_percent) }}</div>
            </div>
            <div>
              <div class="text-xs text-ln-gray-500">Leave</div>
              <div class="font-semibold text-ln-blue-800">{{ formatPercent(row.leave_percent) }}</div>
            </div>
            <div>
              <div class="text-xs text-ln-gray-500">Séances</div>
              <div class="font-semibold text-ln-gray-900">{{ formatCount(row.total_sessions) }}</div>
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
