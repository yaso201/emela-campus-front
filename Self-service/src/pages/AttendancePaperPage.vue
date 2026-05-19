<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { CheckCircle2, Clock, FileText, Printer, RefreshCw, Save, Upload, X } from 'lucide-vue-next';
import AlertBlock from '@/components/ui/AlertBlock.vue';
import BlockError from '@/components/ui/BlockError.vue';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import { useProfileStore } from '@/stores/profile';

const profile = useProfileStore();
const pendingSessions = ref([]);
const candidateSessions = ref([]);
const detail = ref(null);
const entries = ref([]);
const selectedSessionName = ref('');
const manualSessionName = ref('');
const loadingList = ref(false);
const loadingCandidates = ref(false);
const loadingDetail = ref(false);
const saving = ref(false);
const printing = ref(false);
const uploadingScan = ref(false);
const scanFileInput = ref(null);
const scanFilename = ref('');
const error = ref('');
const success = ref('');

const form = reactive({
  reason: '',
  scan_file_url: '',
});

const statusOptions = [
  { value: 'Present', label: 'Présent' },
  { value: 'Absent', label: 'Absent' },
  { value: 'Leave', label: 'Congé' },
];

const punctualityOptions = [
  { value: 'On Time', label: "À l'heure" },
  { value: 'Late', label: 'Retard' },
  { value: 'N/A', label: 'N/A' },
];

const completedCount = computed(() => entries.value.filter((row) => row.status).length);
const canReenter = computed(() => profile.profile !== 'instructor' && profile.canAccessDesk);
const completionPercent = computed(() => {
  if (!entries.value.length) return 0;
  return Math.round((completedCount.value / entries.value.length) * 100);
});

const canSubmit = computed(
  () =>
    canReenter.value &&
    !!detail.value &&
    !!form.reason.trim() &&
    entries.value.length > 0 &&
    entries.value.every((row) => row.status) &&
    !saving.value,
);

const deadlineSeverity = computed(() => {
  if (!detail.value) return 'info';
  return detail.value.within_deadline ? 'success' : 'warning';
});

const selectedSession = computed(() => detail.value?.session || null);

onMounted(async () => {
  if (profile.status === 'idle') {
    await profile.fetchProfile();
  }
  await loadCandidateSessions();
  if (canReenter.value) {
    await loadPendingSessions();
  }
});

async function callApi(method, params = {}) {
  const formData = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
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

async function loadPendingSessions() {
  if (!canReenter.value) return;
  loadingList.value = true;
  error.value = '';
  try {
    const payload = await callApi('portal_app.api.attendance_paper_mode.list_pending_paper_sessions');
    pendingSessions.value = payload.sessions || [];
  } catch (err) {
    error.value = err.message;
    pendingSessions.value = [];
  } finally {
    loadingList.value = false;
  }
}

async function refreshAll() {
  await loadCandidateSessions();
  if (canReenter.value) {
    await loadPendingSessions();
  }
}

async function loadCandidateSessions() {
  loadingCandidates.value = true;
  error.value = '';
  try {
    const payload = await callApi('portal_app.api.attendance_paper_mode.list_paper_candidate_sessions');
    candidateSessions.value = payload.sessions || [];
  } catch (err) {
    candidateSessions.value = [];
    if (canReenter.value) {
      error.value = err.message;
    }
  } finally {
    loadingCandidates.value = false;
  }
}

async function loadManualSession() {
  const name = manualSessionName.value.trim();
  if (!name) return;
  await loadSession(name);
}

async function selectSession(session) {
  await loadSession(session.name);
}

async function loadSession(name) {
  loadingDetail.value = true;
  error.value = '';
  success.value = '';
  selectedSessionName.value = name;
  manualSessionName.value = name;
  try {
    const method = canReenter.value
      ? 'portal_app.api.attendance_paper_mode.get_paper_reentry_session'
      : 'portal_app.api.attendance_paper_mode.get_paper_sheet_session';
    const payload = await callApi(method, {
      attendance_session: name,
    });
    detail.value = payload;
    form.reason = payload.paper_mode?.reason || form.reason || '';
    form.scan_file_url = payload.existing_entries?.[0]?.scan_file_url || '';
    scanFilename.value = fileNameFromUrl(form.scan_file_url);
    entries.value = canReenter.value ? hydrateEntries(payload) : [];
  } catch (err) {
    detail.value = null;
    entries.value = [];
    error.value = err.message;
  } finally {
    loadingDetail.value = false;
  }
}

function hydrateEntries(payload) {
  const existingByStudent = new Map(
    (payload.existing_entries || []).map((row) => [row.student_id, row]),
  );
  return (payload.roster || []).map((student) => {
    const existing = existingByStudent.get(student.student_id) || {};
    return {
      student_id: student.student_id,
      student_name: student.student_name,
      status: existing.status || '',
      punctuality_status: existing.punctuality_status || 'N/A',
    };
  });
}

function setStatus(row, status) {
  row.status = status;
  if (status === 'Present' && row.punctuality_status === 'N/A') {
    row.punctuality_status = 'On Time';
  }
  if (status !== 'Present') {
    row.punctuality_status = 'N/A';
  }
}

function openScanPicker() {
  scanFileInput.value?.click();
}

async function handleScanFileChange(event) {
  const file = event.target?.files?.[0];
  if (!file || !selectedSessionName.value) return;
  uploadingScan.value = true;
  error.value = '';
  success.value = '';
  try {
    const data = new FormData();
    data.append('file', file);
    data.append('is_private', '1');
    data.append('doctype', 'Attendance Session');
    data.append('docname', selectedSessionName.value);

    const response = await fetch('/api/method/upload_file', {
      method: 'POST',
      headers: {
        'X-Frappe-CSRF-Token': window.csrf_token || '',
        Accept: 'application/json',
      },
      body: data,
      credentials: 'same-origin',
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?._server_messages || payload?.exc || payload?.message || `HTTP ${response.status}`);
    }
    const uploaded = payload.message || payload;
    form.scan_file_url = uploaded.file_url || '';
    scanFilename.value = uploaded.file_name || file.name;
  } catch (err) {
    error.value = err.message;
  } finally {
    uploadingScan.value = false;
    if (scanFileInput.value) {
      scanFileInput.value.value = '';
    }
  }
}

function clearScanReference() {
  form.scan_file_url = '';
  scanFilename.value = '';
}

async function printSheet() {
  if (!selectedSessionName.value) return;
  printing.value = true;
  error.value = '';
  success.value = '';
  try {
    const payload = await callApi('portal_app.api.attendance_paper_mode.generate_paper_sheet', {
      attendance_session: selectedSessionName.value,
      reason: form.reason || 'assistant_print',
      force: 1,
      local_timeout: profile.profile === 'instructor' ? 1 : 0,
    });
    openPrintableHtml(payload.printable_html);
    await loadSession(selectedSessionName.value);
  } catch (err) {
    error.value = err.message;
  } finally {
    printing.value = false;
  }
}

function openPrintableHtml(html) {
  const printWindow = window.open('', 'lanem-attendance-paper');
  if (!printWindow) {
    error.value = 'Fenêtre impression bloquée par le navigateur.';
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

async function submitRows() {
  if (!canSubmit.value) return;
  saving.value = true;
  error.value = '';
  success.value = '';
  try {
    const payloadEntries = entries.value.map((row) => ({
      student_id: row.student_id,
      status: row.status,
      punctuality_status: row.status === 'Present' ? row.punctuality_status : 'N/A',
    }));
    const result = await callApi('portal_app.api.attendance_paper_mode.submit_paper_attendance', {
      attendance_session: selectedSessionName.value,
      entries: JSON.stringify(payloadEntries),
      reason: form.reason.trim(),
      scan_file_url: form.scan_file_url.trim(),
    });
    success.value = `Ressaisie enregistrée: ${result.events_created} ligne(s), consolidation ${result.consolidation?.status || 'terminée'}.`;
    await loadPendingSessions();
    await loadCandidateSessions();
    await loadSession(selectedSessionName.value);
  } catch (err) {
    error.value = err.message;
  } finally {
    saving.value = false;
  }
}

function statusButtonClass(row, status) {
  if (row.status === status) {
    if (status === 'Present') return 'bg-ln-success text-white border-ln-success';
    if (status === 'Absent') return 'bg-ln-error text-white border-ln-error';
    return 'bg-ln-blue-800 text-white border-ln-blue-800';
  }
  return 'bg-white text-ln-gray-700 border-ln-gray-200 hover:border-ln-blue-500 hover:text-ln-blue-900';
}

function formatDateTime(value) {
  if (!value) return 'Non renseigné';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function fileNameFromUrl(value) {
  if (!value) return '';
  const parts = String(value).split('/').filter(Boolean);
  return parts[parts.length - 1] || String(value);
}
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-ln-gray-900">Présences papier</h1>
        <p class="text-sm text-ln-gray-600 mt-1">
          Feuilles préremplies et ressaisie administrative des séances basculées.
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-2 rounded-md-ln border border-ln-gray-200 bg-white px-4 py-2 text-sm font-semibold text-ln-gray-700 hover:border-ln-blue-500 hover:text-ln-blue-900 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px]"
        :disabled="loadingList || loadingCandidates"
        @click="refreshAll"
      >
        <RefreshCw class="w-4 h-4" :class="{ 'motion-safe:animate-spin': loadingList || loadingCandidates }" />
        Actualiser
      </button>
    </header>

    <AlertBlock
      v-if="success"
      severity="success"
      title="Mode papier"
      :description="success"
    />

    <BlockError
      v-if="error"
      title="Erreur mode papier"
      :message="error"
      :retry="selectedSessionName ? () => loadSession(selectedSessionName) : loadPendingSessions"
    />

    <div class="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside class="space-y-4">
        <section class="bg-white rounded-md-ln border border-ln-gray-200 p-4 space-y-3">
          <label for="paper-session-name" class="block text-sm font-semibold text-ln-gray-900">
            Séance
          </label>
          <div class="flex gap-2">
            <input
              id="paper-session-name"
              v-model="manualSessionName"
              type="text"
              class="min-w-0 flex-1 rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px]"
              placeholder="ATT-..."
              @keyup.enter="loadManualSession"
            />
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-md-ln bg-ln-blue-800 px-3 py-2 text-sm font-semibold text-white hover:bg-ln-blue-900 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px] min-w-[44px]"
              :disabled="loadingDetail"
              aria-label="Charger la séance"
              @click="loadManualSession"
            >
              <FileText class="w-4 h-4" />
            </button>
          </div>
        </section>

        <section class="bg-white rounded-md-ln border border-ln-gray-200 overflow-hidden">
          <div class="border-b border-ln-gray-100 px-4 py-3">
            <h2 class="text-sm font-semibold text-ln-gray-900">Séances imprimables</h2>
          </div>
          <div v-if="loadingCandidates" class="p-4">
            <BlockSkeleton :lines="4" :show-title="false" />
          </div>
          <EmptyState
            v-else-if="candidateSessions.length === 0"
            icon="FileText"
            label="Aucune séance disponible"
          />
          <div v-else class="divide-y divide-ln-gray-100">
            <button
              v-for="session in candidateSessions"
              :key="session.name"
              type="button"
              class="w-full px-4 py-3 text-left hover:bg-ln-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ln-blue-500/25"
              :class="selectedSessionName === session.name ? 'bg-ln-blue-50' : 'bg-white'"
              @click="selectSession(session)"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="truncate text-sm font-semibold text-ln-gray-900">
                    {{ session.session_id || session.name }}
                  </div>
                  <div class="mt-1 text-xs text-ln-gray-500">
                    {{ formatDateTime(session.planned_start || session.session_date) }}
                  </div>
                  <div class="mt-1 truncate text-xs text-ln-gray-500">
                    {{ session.student_group || 'Groupe non renseigné' }}
                  </div>
                </div>
                <span class="rounded-full bg-ln-gray-100 px-2 py-1 text-[11px] font-semibold text-ln-gray-600">
                  {{ session.paper_mode_used ? 'Papier' : session.status }}
                </span>
              </div>
            </button>
          </div>
        </section>

        <section v-if="canReenter" class="bg-white rounded-md-ln border border-ln-gray-200 overflow-hidden">
          <div class="border-b border-ln-gray-100 px-4 py-3">
            <h2 class="text-sm font-semibold text-ln-gray-900">Séances à ressaisir</h2>
          </div>
          <div v-if="loadingList" class="p-4">
            <BlockSkeleton :lines="4" :show-title="false" />
          </div>
          <EmptyState
            v-else-if="pendingSessions.length === 0"
            icon="FileText"
            label="Aucune séance papier en attente"
          />
          <div v-else class="divide-y divide-ln-gray-100">
            <button
              v-for="session in pendingSessions"
              :key="session.name"
              type="button"
              class="w-full px-4 py-3 text-left hover:bg-ln-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ln-blue-500/25"
              :class="selectedSessionName === session.name ? 'bg-ln-blue-50' : 'bg-white'"
              @click="selectSession(session)"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="truncate text-sm font-semibold text-ln-gray-900">
                    {{ session.session_id || session.name }}
                  </div>
                  <div class="mt-1 text-xs text-ln-gray-500">
                    {{ formatDateTime(session.planned_start || session.session_date) }}
                  </div>
                  <div class="mt-1 truncate text-xs text-ln-gray-500">
                    {{ session.student_group || 'Groupe non renseigné' }}
                  </div>
                </div>
                <span class="rounded-full bg-ln-gray-100 px-2 py-1 text-[11px] font-semibold text-ln-gray-600">
                  {{ session.status }}
                </span>
              </div>
            </button>
          </div>
        </section>
      </aside>

      <main class="min-w-0">
        <div v-if="loadingDetail" class="space-y-4">
          <BlockSkeleton :lines="5" />
          <BlockSkeleton :lines="6" :show-title="false" />
        </div>

        <section
          v-else-if="detail && selectedSession"
          class="bg-white rounded-md-ln border border-ln-gray-200 overflow-hidden"
        >
          <div class="border-b border-ln-gray-100 p-4 md:p-5">
            <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div class="min-w-0">
                <h2 class="truncate text-lg font-semibold text-ln-gray-900">
                  {{ selectedSession.session_id || selectedSession.name }}
                </h2>
                <div class="mt-2 grid gap-1 text-sm text-ln-gray-600 md:grid-cols-2">
                  <span>{{ formatDateTime(selectedSession.planned_start) }}</span>
                  <span>{{ selectedSession.student_group || 'Groupe non renseigné' }}</span>
                  <span>{{ selectedSession.room || 'Salle non renseignée' }}</span>
                  <span>{{ selectedSession.instructor || 'Enseignant non renseigné' }}</span>
                </div>
              </div>
              <div
                class="inline-flex items-center gap-2 rounded-md-ln px-3 py-2 text-sm font-semibold"
                :class="deadlineSeverity === 'success' ? 'bg-ln-success-bg text-ln-success' : 'bg-ln-warning-bg text-ln-warning'"
              >
                <Clock class="w-4 h-4" />
                Échéance {{ formatDateTime(detail.deadline_at) }}
              </div>
            </div>
          </div>

          <div class="space-y-5 p-4 md:p-5">
            <div class="grid gap-4" :class="canReenter ? 'md:grid-cols-2' : 'md:grid-cols-1'">
              <div>
                <label for="paper-reason" class="block text-sm font-semibold text-ln-gray-900">
                  Motif
                </label>
                <input
                  id="paper-reason"
                  v-model="form.reason"
                  type="text"
                  class="mt-2 w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px]"
                  placeholder="Panne réseau local"
                />
              </div>
              <div v-if="canReenter">
                <label for="paper-scan" class="block text-sm font-semibold text-ln-gray-900">
                  Référence scan
                </label>
                <div class="mt-2 flex gap-2">
                  <input
                    id="paper-scan"
                    v-model="form.scan_file_url"
                    type="text"
                    class="min-w-0 flex-1 rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px]"
                    placeholder="/private/files/..."
                  />
                  <input
                    ref="scanFileInput"
                    type="file"
                    class="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,image/*"
                    @change="handleScanFileChange"
                  />
                  <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-md-ln border border-ln-gray-200 bg-white px-3 py-2 text-sm font-semibold text-ln-gray-700 hover:border-ln-blue-500 hover:text-ln-blue-900 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px] min-w-[44px]"
                    :disabled="uploadingScan || !selectedSessionName"
                    aria-label="Joindre le scan"
                    @click="openScanPicker"
                  >
                    <Upload class="w-4 h-4" :class="{ 'motion-safe:animate-pulse': uploadingScan }" />
                  </button>
                  <button
                    v-if="form.scan_file_url"
                    type="button"
                    class="inline-flex items-center justify-center rounded-md-ln border border-ln-gray-200 bg-white px-3 py-2 text-sm font-semibold text-ln-gray-700 hover:border-ln-error hover:text-ln-error focus:outline-none focus:ring-2 focus:ring-ln-error/25 min-h-[44px] min-w-[44px]"
                    aria-label="Retirer le scan"
                    @click="clearScanReference"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
                <p v-if="scanFilename" class="mt-1 truncate text-xs text-ln-gray-500">
                  {{ scanFilename }}
                </p>
              </div>
            </div>

            <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div v-if="canReenter" class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-3 text-sm">
                  <span class="font-semibold text-ln-gray-900">
                    {{ completedCount }}/{{ entries.length }} lignes
                  </span>
                  <span class="text-ln-gray-500">{{ completionPercent }}%</span>
                </div>
                <div class="mt-2 h-2 rounded-full bg-ln-gray-100">
                  <div
                    class="h-2 rounded-full bg-ln-blue-800 transition-all"
                    :style="{ width: `${completionPercent}%` }"
                  />
                </div>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="inline-flex items-center justify-center gap-2 rounded-md-ln border border-ln-gray-200 bg-white px-4 py-2 text-sm font-semibold text-ln-gray-700 hover:border-ln-blue-500 hover:text-ln-blue-900 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px]"
                  :disabled="printing"
                  @click="printSheet"
                >
                  <Printer class="w-4 h-4" />
                  Imprimer
                </button>
                <button
                  v-if="canReenter"
                  type="button"
                  class="inline-flex items-center justify-center gap-2 rounded-md-ln bg-ln-blue-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ln-blue-900 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px]"
                  :disabled="!canSubmit"
                  @click="submitRows"
                >
                  <Save class="w-4 h-4" />
                  Enregistrer
                </button>
              </div>
            </div>

            <div v-if="canReenter" class="hidden overflow-x-auto rounded-md-ln border border-ln-gray-200 md:block">
              <table class="min-w-full divide-y divide-ln-gray-200">
                <thead class="bg-ln-gray-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-ln-gray-500">Étudiant</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-ln-gray-500">Statut</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-ln-gray-500">Ponctualité</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-ln-gray-100 bg-white">
                  <tr v-for="row in entries" :key="row.student_id">
                    <td class="px-4 py-3">
                      <div class="text-sm font-semibold text-ln-gray-900">{{ row.student_name }}</div>
                      <div class="text-xs text-ln-gray-500">{{ row.student_id }}</div>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex flex-wrap gap-2" role="group" :aria-label="`Statut ${row.student_name}`">
                        <button
                          v-for="option in statusOptions"
                          :key="option.value"
                          type="button"
                          class="rounded-md-ln border px-3 py-2 text-sm font-semibold transition-colors min-h-[40px]"
                          :class="statusButtonClass(row, option.value)"
                          @click="setStatus(row, option.value)"
                        >
                          {{ option.label }}
                        </button>
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <select
                        v-model="row.punctuality_status"
                        class="rounded-md-ln border border-ln-gray-200 bg-white px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 disabled:bg-ln-gray-50 disabled:text-ln-gray-500 min-h-[40px]"
                        :disabled="row.status !== 'Present'"
                      >
                        <option
                          v-for="option in punctualityOptions"
                          :key="option.value"
                          :value="option.value"
                        >
                          {{ option.label }}
                        </option>
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="canReenter" class="space-y-3 md:hidden">
              <article
                v-for="row in entries"
                :key="row.student_id"
                class="rounded-md-ln border border-ln-gray-200 p-3"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <h3 class="truncate text-sm font-semibold text-ln-gray-900">{{ row.student_name }}</h3>
                    <p class="text-xs text-ln-gray-500">{{ row.student_id }}</p>
                  </div>
                  <CheckCircle2
                    v-if="row.status"
                    class="w-5 h-5 text-ln-success"
                    aria-hidden="true"
                  />
                </div>
                <div class="mt-3 flex flex-wrap gap-2" role="group" :aria-label="`Statut ${row.student_name}`">
                  <button
                    v-for="option in statusOptions"
                    :key="option.value"
                    type="button"
                    class="rounded-md-ln border px-3 py-2 text-sm font-semibold transition-colors min-h-[40px]"
                    :class="statusButtonClass(row, option.value)"
                    @click="setStatus(row, option.value)"
                  >
                    {{ option.label }}
                  </button>
                </div>
                <select
                  v-model="row.punctuality_status"
                  class="mt-3 w-full rounded-md-ln border border-ln-gray-200 bg-white px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 disabled:bg-ln-gray-50 disabled:text-ln-gray-500 min-h-[44px]"
                  :disabled="row.status !== 'Present'"
                >
                  <option
                    v-for="option in punctualityOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </article>
            </div>

            <div v-else class="rounded-md-ln border border-ln-gray-200 overflow-hidden">
              <div class="border-b border-ln-gray-100 bg-ln-gray-50 px-4 py-3">
                <h3 class="text-sm font-semibold text-ln-gray-900">
                  Roster prérempli · {{ detail.roster?.length || 0 }} étudiant(s)
                </h3>
              </div>
              <div class="divide-y divide-ln-gray-100">
                <div
                  v-for="student in detail.roster"
                  :key="student.student_id"
                  class="px-4 py-3"
                >
                  <div class="text-sm font-semibold text-ln-gray-900">{{ student.student_name }}</div>
                  <div class="text-xs text-ln-gray-500">{{ student.student_id }}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section v-else class="bg-white rounded-md-ln border border-ln-gray-200">
          <EmptyState
            icon="FileText"
            label="Sélectionnez une séance papier"
            description="Les séances activées apparaissent dans la liste de gauche."
          />
        </section>
      </main>
    </div>
  </div>
</template>
