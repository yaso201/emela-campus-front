<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { Download, GitBranch, RefreshCw, Search, ShieldCheck } from 'lucide-vue-next';
import AlertBlock from '@/components/ui/AlertBlock.vue';
import BlockError from '@/components/ui/BlockError.vue';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';

const filters = reactive({
  pdf_document_id: '',
  attendance_session: '',
  student: '',
  student_group: '',
  limit: 50,
});

const loading = ref(false);
const chainLoading = ref(false);
const verifying = ref('');
const error = ref('');
const success = ref('');
const dashboard = ref(null);
const selectedChain = ref(null);

const rows = computed(() => dashboard.value?.rows || []);
const summary = computed(() => dashboard.value?.summary || {});

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
    dashboard.value = await callApi('portal_app.api.attendance_pdf.get_attendance_pdf_dashboard', filters);
    selectedChain.value = null;
  } catch (err) {
    dashboard.value = null;
    selectedChain.value = null;
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

function resetFilters() {
  filters.pdf_document_id = '';
  filters.attendance_session = '';
  filters.student = '';
  filters.student_group = '';
  filters.limit = 50;
  loadDashboard();
}

async function loadChain(row) {
  chainLoading.value = true;
  error.value = '';
  success.value = '';
  try {
    selectedChain.value = await callApi('portal_app.api.attendance_pdf.get_attendance_pdf_chain', {
      pdf_document_id: row.pdf_document_id,
    });
  } catch (err) {
    selectedChain.value = null;
    error.value = err.message;
  } finally {
    chainLoading.value = false;
  }
}

async function verifyPdf(row) {
  verifying.value = row.pdf_document_id;
  error.value = '';
  success.value = '';
  try {
    const integrity = await callApi('portal_app.api.attendance_pdf.verify_pdf_document_integrity', {
      pdf_document_id: row.pdf_document_id,
    });
    updateRowIntegrity(row.pdf_document_id, integrity);
    success.value =
      integrity.integrity_status === 'Valid'
        ? `${row.pdf_document_id} vérifié`
        : `${row.pdf_document_id} non conforme`;
  } catch (err) {
    error.value = err.message;
  } finally {
    verifying.value = '';
  }
}

function updateRowIntegrity(pdfDocumentId, integrity) {
  if (!dashboard.value?.rows) return;
  dashboard.value.rows = dashboard.value.rows.map((row) =>
    row.pdf_document_id === pdfDocumentId ? { ...row, integrity_status: integrity.integrity_status, integrity } : row,
  );
  if (selectedChain.value?.versions) {
    selectedChain.value.versions = selectedChain.value.versions.map((row) =>
      row.pdf_document_id === pdfDocumentId ? { ...row, integrity_status: integrity.integrity_status, integrity } : row,
    );
  }
}

function pdfStatus(row) {
  return row.status === 'Current' ? 'validated' : 'closed';
}

function integrityStatus(status) {
  if (status === 'Valid') return 'validated';
  if (status === 'Mismatch' || status === 'Missing File') return 'failed';
  return 'pending';
}

function integrityLabel(status) {
  if (status === 'Valid') return 'Intègre';
  if (status === 'Mismatch') return 'Hash différent';
  if (status === 'Missing File') return 'Fichier absent';
  return 'Non vérifié';
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
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-ln-gray-900">PDF attendance</h1>
        <p class="mt-1 text-sm text-ln-gray-600">
          Intégrité et versions des feuilles officielles.
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

    <AlertBlock v-if="success" severity="success" title="Contrôle enregistré" :description="success" />
    <BlockError v-if="error" title="PDF indisponibles" :message="error" :retry="loadDashboard" />

    <section class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
      <form
        class="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_100px_auto]"
        @submit.prevent="loadDashboard"
      >
        <label class="block">
          <span class="text-sm font-semibold text-ln-gray-900">PDF</span>
          <input
            v-model="filters.pdf_document_id"
            type="text"
            class="mt-2 min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
            placeholder="ATT-PDF-..."
          />
        </label>
        <label class="block">
          <span class="text-sm font-semibold text-ln-gray-900">Séance</span>
          <input
            v-model="filters.attendance_session"
            type="text"
            class="mt-2 min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
            placeholder="ATT-..."
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
          <span class="text-sm font-semibold text-ln-gray-900">Groupe</span>
          <input
            v-model="filters.student_group"
            type="text"
            class="mt-2 min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
            placeholder="GROUPE-..."
          />
        </label>
        <label class="block">
          <span class="text-sm font-semibold text-ln-gray-900">Limite</span>
          <input
            v-model.number="filters.limit"
            type="number"
            min="1"
            max="200"
            class="mt-2 min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          />
        </label>
        <div class="flex items-end gap-2">
          <button
            type="submit"
            class="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md-ln bg-ln-blue-800 px-3 py-2 text-sm font-semibold text-white hover:bg-ln-blue-900 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
            :disabled="loading"
            aria-label="Filtrer les PDF"
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

    <section v-else-if="dashboard" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
        <div class="text-xs font-semibold uppercase text-ln-gray-500">Documents</div>
        <div class="mt-2 text-2xl font-bold text-ln-gray-900">{{ formatCount(summary.total) }}</div>
      </article>
      <article class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
        <div class="text-xs font-semibold uppercase text-ln-gray-500">Courants</div>
        <div class="mt-2 text-2xl font-bold text-ln-success">{{ formatCount(summary.current) }}</div>
      </article>
      <article class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
        <div class="text-xs font-semibold uppercase text-ln-gray-500">Remplacés</div>
        <div class="mt-2 text-2xl font-bold text-ln-gray-700">{{ formatCount(summary.superseded) }}</div>
      </article>
      <article class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
        <div class="text-xs font-semibold uppercase text-ln-gray-500">Fichiers</div>
        <div class="mt-2 text-2xl font-bold text-ln-blue-800">{{ formatCount(summary.with_file) }}</div>
      </article>
    </section>

    <section class="overflow-hidden rounded-md-ln border border-ln-gray-200 bg-white">
      <div class="border-b border-ln-gray-100 px-4 py-3">
        <h2 class="text-sm font-semibold text-ln-gray-900">Registre PDF</h2>
      </div>

      <div v-if="loading" class="p-4">
        <BlockSkeleton :lines="6" :show-title="false" />
      </div>

      <EmptyState
        v-else-if="rows.length === 0"
        icon="FileText"
        label="Aucun PDF"
        description="Aucun document ne correspond aux filtres."
      />

      <div v-else class="hidden overflow-x-auto md:block">
        <table class="min-w-full divide-y divide-ln-gray-200">
          <thead class="bg-ln-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-ln-gray-500">Document</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-ln-gray-500">Séance</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-ln-gray-500">Hash</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-ln-gray-500">Statut</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-ln-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-ln-gray-100 bg-white">
            <tr v-for="row in rows" :key="row.name">
              <td class="px-4 py-3">
                <div class="text-sm font-semibold text-ln-gray-900">{{ row.pdf_document_id }}</div>
                <div class="text-xs text-ln-gray-500">{{ row.version_label }} · {{ formatDate(row.generated_at) }}</div>
              </td>
              <td class="px-4 py-3">
                <div class="text-sm font-semibold text-ln-gray-900">{{ row.session?.session_id || row.attendance_session }}</div>
                <div class="text-xs text-ln-gray-500">{{ row.session?.student_group || 'Sans groupe' }}</div>
              </td>
              <td class="px-4 py-3">
                <div class="font-mono text-xs text-ln-gray-700">{{ row.short_hash }}...</div>
                <div class="mt-1">
                  <StatusBadge :status="integrityStatus(row.integrity_status)" :label="integrityLabel(row.integrity_status)" size="sm" />
                </div>
              </td>
              <td class="px-4 py-3">
                <StatusBadge :status="pdfStatus(row)" :label="row.status === 'Current' ? 'Courant' : 'Remplacé'" size="sm" />
                <div class="mt-1 text-xs text-ln-gray-500">{{ row.institutional_stamp_mode }}</div>
              </td>
              <td class="px-4 py-3">
                <div class="flex justify-end gap-2">
                  <button
                    type="button"
                    class="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md-ln border border-ln-gray-200 bg-white text-ln-blue-800 hover:border-ln-blue-700 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
                    :disabled="chainLoading"
                    aria-label="Afficher la chaîne"
                    @click="loadChain(row)"
                  >
                    <GitBranch class="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    class="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md-ln border border-ln-gray-200 bg-white text-ln-success hover:border-ln-success focus:outline-none focus:ring-2 focus:ring-ln-success/25"
                    :disabled="!!verifying"
                    aria-label="Vérifier le hash"
                    @click="verifyPdf(row)"
                  >
                    <ShieldCheck class="h-4 w-4" :class="{ 'motion-safe:animate-pulse': verifying === row.pdf_document_id }" />
                  </button>
                  <a
                    v-if="row.file_url"
                    :href="row.file_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md-ln border border-ln-gray-200 bg-white text-ln-gray-700 hover:border-ln-gray-500 focus:outline-none focus:ring-2 focus:ring-ln-gray-300"
                    aria-label="Ouvrir le PDF"
                  >
                    <Download class="h-4 w-4" />
                  </a>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="rows.length > 0" class="divide-y divide-ln-gray-100 md:hidden">
        <article v-for="row in rows" :key="row.name" class="space-y-3 p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h3 class="truncate text-sm font-semibold text-ln-gray-900">{{ row.pdf_document_id }}</h3>
              <p class="text-xs text-ln-gray-500">{{ row.session?.session_id || row.attendance_session }}</p>
            </div>
            <StatusBadge :status="pdfStatus(row)" :label="row.status === 'Current' ? 'Courant' : 'Remplacé'" size="sm" />
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div class="text-xs text-ln-gray-500">Hash</div>
              <div class="font-mono text-xs font-semibold text-ln-gray-900">{{ row.short_hash }}...</div>
            </div>
            <div>
              <div class="text-xs text-ln-gray-500">Intégrité</div>
              <StatusBadge :status="integrityStatus(row.integrity_status)" :label="integrityLabel(row.integrity_status)" size="sm" />
            </div>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <button type="button" class="inline-flex min-h-[44px] items-center justify-center rounded-md-ln border border-ln-gray-200 text-ln-blue-800" :disabled="chainLoading" aria-label="Afficher la chaîne" @click="loadChain(row)">
              <GitBranch class="h-4 w-4" />
            </button>
            <button type="button" class="inline-flex min-h-[44px] items-center justify-center rounded-md-ln border border-ln-gray-200 text-ln-success" :disabled="!!verifying" aria-label="Vérifier le hash" @click="verifyPdf(row)">
              <ShieldCheck class="h-4 w-4" />
            </button>
            <a v-if="row.file_url" :href="row.file_url" target="_blank" rel="noopener noreferrer" class="inline-flex min-h-[44px] items-center justify-center rounded-md-ln border border-ln-gray-200 text-ln-gray-700" aria-label="Ouvrir le PDF">
              <Download class="h-4 w-4" />
            </a>
          </div>
        </article>
      </div>
    </section>

    <section v-if="selectedChain" class="overflow-hidden rounded-md-ln border border-ln-gray-200 bg-white">
      <div class="border-b border-ln-gray-100 px-4 py-3">
        <h2 class="text-sm font-semibold text-ln-gray-900">Chaîne de versions</h2>
      </div>
      <div class="divide-y divide-ln-gray-100">
        <article
          v-for="version in selectedChain.versions"
          :key="version.name"
          class="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_180px_160px]"
        >
          <div class="min-w-0">
            <h3 class="truncate text-sm font-semibold text-ln-gray-900">{{ version.pdf_document_id }}</h3>
            <p class="mt-1 text-xs text-ln-gray-500">
              {{ formatDate(version.generated_at) }} · {{ version.generated_by }} · {{ version.generation_source }}
            </p>
            <p class="mt-2 break-all font-mono text-xs text-ln-gray-600">{{ version.sha256_hash }}</p>
          </div>
          <div>
            <div class="text-xs text-ln-gray-500">Version précédente</div>
            <div class="mt-1 text-sm font-semibold text-ln-gray-900">{{ version.previous_pdf_document || 'Aucune' }}</div>
          </div>
          <div class="flex items-start justify-start md:justify-end">
            <StatusBadge :status="pdfStatus(version)" :label="version.status === 'Current' ? 'Courant' : 'Remplacé'" size="sm" />
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
