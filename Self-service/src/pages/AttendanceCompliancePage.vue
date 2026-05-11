<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { FileJson, RefreshCw, ShieldCheck } from 'lucide-vue-next';
import AlertBlock from '@/components/ui/AlertBlock.vue';
import BlockError from '@/components/ui/BlockError.vue';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';

const today = new Date();
const form = reactive({
  start_date: toIsoDate(new Date(today.getFullYear(), 0, 1)),
  end_date: toIsoDate(today),
  student_group: '',
  purpose: '',
  format: 'csv',
  minimum_group_size: 3,
  limit: 5000,
});

const logs = ref(null);
const loadingLogs = ref(false);
const exporting = ref('');
const error = ref('');
const success = ref('');

const rows = computed(() => logs.value?.rows || []);
const summary = computed(() => logs.value?.summary || {});

onMounted(loadLogs);

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

async function loadLogs() {
  loadingLogs.value = true;
  error.value = '';
  try {
    logs.value = await callApi('portal_app.api.attendance_compliance.get_attendance_compliance_export_logs', {
      limit: 50,
    });
  } catch (err) {
    logs.value = null;
    error.value = err.message;
  } finally {
    loadingLogs.value = false;
  }
}

async function exportAudit() {
  await runExport('audit', 'portal_app.api.attendance_compliance.export_attendance_audit_package');
}

async function exportAnonymized() {
  await runExport('anonymized', 'portal_app.api.attendance_compliance.export_anonymized_attendance_reporting');
}

async function runExport(kind, method) {
  exporting.value = kind;
  error.value = '';
  success.value = '';
  try {
    const payload = await callApi(method, {
      start_date: form.start_date,
      end_date: form.end_date,
      student_group: form.student_group,
      purpose: form.purpose,
      format: form.format,
      minimum_group_size: form.minimum_group_size,
      limit: form.limit,
    });
    downloadTextFile(payload.filename || `attendance-${kind}.${form.format}`, payload.content || '', payload.format);
    success.value = `${payload.export_id} généré et journalisé (${payload.row_count || 0} ligne(s), SHA-256 ${shortHash(payload.content_sha256)}).`;
    await loadLogs();
  } catch (err) {
    error.value = err.message;
  } finally {
    exporting.value = '';
  }
}

function resetForm() {
  form.start_date = toIsoDate(new Date(today.getFullYear(), 0, 1));
  form.end_date = toIsoDate(new Date());
  form.student_group = '';
  form.purpose = '';
  form.format = 'csv';
  form.minimum_group_size = 3;
  form.limit = 5000;
}

function downloadTextFile(filename, content, format) {
  const type = format === 'json' ? 'application/json;charset=utf-8' : 'text/csv;charset=utf-8';
  const blob = new Blob([content], { type });
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

function shortHash(value) {
  return String(value || '').slice(0, 12);
}

function formatCount(value) {
  return Number(value || 0).toLocaleString('fr-FR');
}

function formatDate(value) {
  if (!value) return 'N/A';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(String(value).replace(' ', 'T')));
}

function exportStatus(row) {
  return row.status === 'Success' ? 'validated' : 'failed';
}
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-ln-gray-900">Conformité attendance</h1>
        <p class="mt-1 text-sm text-ln-gray-600">
          Exports auditeur tracés et reporting institutionnel anonymisé.
        </p>
      </div>
      <button
        type="button"
        class="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md-ln border border-ln-gray-200 bg-white px-4 py-2 text-sm font-semibold text-ln-gray-700 hover:border-ln-blue-500 hover:text-ln-blue-900 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
        :disabled="loadingLogs"
        @click="loadLogs"
      >
        <RefreshCw class="h-4 w-4" :class="{ 'motion-safe:animate-spin': loadingLogs }" />
        Actualiser
      </button>
    </header>

    <AlertBlock v-if="success" severity="success" title="Export généré" :description="success" />
    <BlockError v-if="error" title="Conformité indisponible" :message="error" :retry="loadLogs" />

    <section class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
      <form class="grid gap-3 lg:grid-cols-[160px_160px_minmax(0,1fr)_120px_120px_120px] xl:grid-cols-[160px_160px_minmax(0,1fr)_minmax(0,1.6fr)_120px_120px_120px]" @submit.prevent="exportAnonymized">
        <label class="block">
          <span class="text-sm font-semibold text-ln-gray-900">Début</span>
          <input
            v-model="form.start_date"
            type="date"
            class="mt-2 min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
            required
          />
        </label>
        <label class="block">
          <span class="text-sm font-semibold text-ln-gray-900">Fin</span>
          <input
            v-model="form.end_date"
            type="date"
            class="mt-2 min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
            required
          />
        </label>
        <label class="block">
          <span class="text-sm font-semibold text-ln-gray-900">Groupe</span>
          <input
            v-model="form.student_group"
            type="text"
            class="mt-2 min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
            placeholder="GROUPE-..."
          />
        </label>
        <label class="block lg:col-span-3 xl:col-span-1">
          <span class="text-sm font-semibold text-ln-gray-900">Motif</span>
          <input
            v-model="form.purpose"
            type="text"
            class="mt-2 min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
            placeholder="Audit externe, rapport CA..."
            required
          />
        </label>
        <label class="block">
          <span class="text-sm font-semibold text-ln-gray-900">Format</span>
          <select
            v-model="form.format"
            class="mt-2 min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          >
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
        </label>
        <label class="block">
          <span class="text-sm font-semibold text-ln-gray-900">Seuil anon.</span>
          <input
            v-model.number="form.minimum_group_size"
            type="number"
            min="2"
            max="100"
            class="mt-2 min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          />
        </label>
        <label class="block">
          <span class="text-sm font-semibold text-ln-gray-900">Limite</span>
          <input
            v-model.number="form.limit"
            type="number"
            min="1"
            max="10000"
            class="mt-2 min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          />
        </label>
        <div class="flex flex-col gap-2 sm:flex-row lg:col-span-6 xl:col-span-7">
          <button
            type="button"
            class="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md-ln bg-ln-blue-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ln-blue-900 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
            :disabled="!!exporting"
            @click="exportAnonymized"
          >
            <ShieldCheck class="h-4 w-4" />
            {{ exporting === 'anonymized' ? 'Export...' : 'Reporting anonymisé' }}
          </button>
          <button
            type="button"
            class="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md-ln border border-ln-blue-200 bg-white px-4 py-2 text-sm font-semibold text-ln-blue-900 hover:border-ln-blue-700 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
            :disabled="!!exporting"
            @click="exportAudit"
          >
            <FileJson class="h-4 w-4" />
            {{ exporting === 'audit' ? 'Export...' : 'Paquet auditeur' }}
          </button>
          <button
            type="button"
            class="inline-flex min-h-[44px] items-center justify-center rounded-md-ln border border-ln-gray-200 bg-white px-4 py-2 text-sm font-semibold text-ln-gray-700 hover:border-ln-blue-500 hover:text-ln-blue-900 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
            :disabled="!!exporting"
            @click="resetForm"
          >
            Réinitialiser
          </button>
        </div>
      </form>
    </section>

    <section class="grid gap-4 sm:grid-cols-3">
      <article class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
        <div class="text-xs font-semibold uppercase text-ln-gray-500">Exports</div>
        <div class="mt-2 text-2xl font-bold text-ln-gray-900">{{ formatCount(summary.total) }}</div>
      </article>
      <article class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
        <div class="text-xs font-semibold uppercase text-ln-gray-500">Auditeur</div>
        <div class="mt-2 text-2xl font-bold text-ln-blue-800">{{ formatCount(summary.audit_exports) }}</div>
      </article>
      <article class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
        <div class="text-xs font-semibold uppercase text-ln-gray-500">Anonymisés</div>
        <div class="mt-2 text-2xl font-bold text-ln-success">{{ formatCount(summary.anonymized_exports) }}</div>
      </article>
    </section>

    <section class="overflow-hidden rounded-md-ln border border-ln-gray-200 bg-white">
      <div class="border-b border-ln-gray-100 px-4 py-3">
        <h2 class="text-sm font-semibold text-ln-gray-900">Journal des exports</h2>
      </div>

      <div v-if="loadingLogs" class="p-4">
        <BlockSkeleton :lines="6" :show-title="false" />
      </div>

      <EmptyState
        v-else-if="rows.length === 0"
        icon="FileText"
        label="Aucun export"
        description="Aucun export conformité attendance n'est encore journalisé."
      />

      <div v-else class="hidden overflow-x-auto md:block">
        <table class="min-w-full divide-y divide-ln-gray-200">
          <thead class="bg-ln-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-ln-gray-500">Export</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-ln-gray-500">Période</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-ln-gray-500">Trace</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-ln-gray-500">Lignes</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-ln-gray-100 bg-white">
            <tr v-for="row in rows" :key="row.export_id">
              <td class="px-4 py-3">
                <div class="text-sm font-semibold text-ln-gray-900">{{ row.export_id }}</div>
                <div class="mt-1 flex flex-wrap items-center gap-2">
                  <StatusBadge :status="exportStatus(row)" :label="row.export_type" size="sm" />
                  <span class="text-xs text-ln-gray-500">{{ row.format }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-ln-gray-700">
                <div>{{ row.start_date }} → {{ row.end_date }}</div>
                <div class="text-xs text-ln-gray-500">{{ row.student_group || 'Tous groupes autorisés' }}</div>
              </td>
              <td class="px-4 py-3">
                <div class="font-mono text-xs text-ln-gray-700">{{ shortHash(row.content_sha256) }}...</div>
                <div class="text-xs text-ln-gray-500">{{ formatDate(row.requested_at) }} · {{ row.requested_by }}</div>
              </td>
              <td class="px-4 py-3 text-right text-sm font-semibold text-ln-gray-900">{{ formatCount(row.row_count) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="rows.length > 0" class="divide-y divide-ln-gray-100 md:hidden">
        <article v-for="row in rows" :key="row.export_id" class="space-y-3 p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h3 class="truncate text-sm font-semibold text-ln-gray-900">{{ row.export_id }}</h3>
              <p class="text-xs text-ln-gray-500">{{ row.start_date }} → {{ row.end_date }}</p>
            </div>
            <StatusBadge :status="exportStatus(row)" :label="row.export_type" size="sm" />
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div class="text-xs text-ln-gray-500">Hash</div>
              <div class="font-mono text-xs font-semibold text-ln-gray-900">{{ shortHash(row.content_sha256) }}...</div>
            </div>
            <div>
              <div class="text-xs text-ln-gray-500">Lignes</div>
              <div class="font-semibold text-ln-gray-900">{{ formatCount(row.row_count) }}</div>
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
