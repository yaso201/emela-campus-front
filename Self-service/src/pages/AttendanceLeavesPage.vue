<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { CheckCircle2, RefreshCw, Search, Upload, X, XCircle } from 'lucide-vue-next';
import AlertBlock from '@/components/ui/AlertBlock.vue';
import BlockError from '@/components/ui/BlockError.vue';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';

const today = new Date();
const filters = reactive({
  status: 'Submitted',
  student: '',
  student_group: '',
  limit: 100,
});

const requestForm = reactive({
  from_date: toIsoDate(today),
  to_date: toIsoDate(today),
  attendance_sessions: '',
  reason: '',
  evidence_ref: '',
});

const absenceForm = reactive({
  linked_attendance: '',
  reason: '',
  attachment: '',
});

const loading = ref(false);
const absenceLoading = ref(false);
const creating = ref(false);
const creatingAbsenceJustification = ref(false);
const deciding = ref('');
const uploading = ref(false);
const uploadingAbsence = ref(false);
const fileInput = ref(null);
const absenceFileInput = ref(null);
const uploadedFilename = ref('');
const absenceUploadedFilename = ref('');
const error = ref('');
const success = ref('');
const dashboard = ref(null);
const absenceDashboard = ref(null);

const rows = computed(() => dashboard.value?.rows || []);
const pendingAbsences = computed(() => absenceDashboard.value?.pending_absences || []);
const absenceJustifications = computed(() => absenceDashboard.value?.justifications || []);
const summary = computed(() => dashboard.value?.summary || {});
const absenceSummary = computed(() => absenceDashboard.value?.summary || {});
const capabilities = computed(() => dashboard.value?.capabilities || {});
const absenceCapabilities = computed(() => absenceDashboard.value?.capabilities || {});
const statusOptions = ['', 'Submitted', 'Approved', 'Rejected'];

onMounted(loadPage);

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
    dashboard.value = await callApi('portal_app.api.attendance_leaves.get_attendance_leave_dashboard', filters);
  } catch (err) {
    dashboard.value = null;
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function loadAbsenceDashboard() {
  absenceLoading.value = true;
  try {
    absenceDashboard.value = await callApi('portal_app.api.absence_justification.get_absence_justification_dashboard', {
      student: filters.student,
      student_group: filters.student_group,
      limit: filters.limit,
    });
  } catch (err) {
    absenceDashboard.value = null;
    error.value = err.message;
  } finally {
    absenceLoading.value = false;
  }
}

async function loadPage() {
  await Promise.all([loadDashboard(), loadAbsenceDashboard()]);
}

function resetFilters() {
  filters.status = 'Submitted';
  filters.student = '';
  filters.student_group = '';
  filters.limit = 100;
  loadPage();
}

function openFilePicker() {
  fileInput.value?.click();
}

function openAbsenceFilePicker() {
  absenceFileInput.value?.click();
}

async function uploadEvidence(event) {
  const file = event.target?.files?.[0];
  if (!file) return;
  uploading.value = true;
  error.value = '';
  success.value = '';
  try {
    const data = new FormData();
    data.append('file', file);
    data.append('is_private', '1');
    data.append('doctype', 'User');
    data.append('docname', window.user || '');

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
    requestForm.evidence_ref = uploaded.file_url || '';
    uploadedFilename.value = uploaded.file_name || file.name;
  } catch (err) {
    error.value = err.message;
  } finally {
    uploading.value = false;
    if (fileInput.value) fileInput.value.value = '';
  }
}

async function uploadAbsenceEvidence(event) {
  const file = event.target?.files?.[0];
  if (!file) return;
  uploadingAbsence.value = true;
  error.value = '';
  success.value = '';
  try {
    const data = new FormData();
    data.append('file', file);
    data.append('is_private', '1');
    data.append('doctype', absenceForm.linked_attendance ? 'Student Attendance' : 'User');
    data.append('docname', absenceForm.linked_attendance || window.user || '');

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
    absenceForm.attachment = uploaded.file_url || '';
    absenceUploadedFilename.value = uploaded.file_name || file.name;
  } catch (err) {
    error.value = err.message;
  } finally {
    uploadingAbsence.value = false;
    if (absenceFileInput.value) absenceFileInput.value.value = '';
  }
}

function clearEvidence() {
  requestForm.evidence_ref = '';
  uploadedFilename.value = '';
}

function clearAbsenceEvidence() {
  absenceForm.attachment = '';
  absenceUploadedFilename.value = '';
}

function selectAbsence(row) {
  absenceForm.linked_attendance = row.name;
  absenceForm.reason = '';
  clearAbsenceEvidence();
}

async function createLeave() {
  if (!requestForm.from_date || !requestForm.to_date || !requestForm.reason.trim()) {
    error.value = 'Période et motif requis pour la demande Leave.';
    return;
  }
  if (!requestForm.evidence_ref) {
    error.value = 'Justificatif requis pour la demande Leave.';
    return;
  }

  creating.value = true;
  error.value = '';
  success.value = '';
  try {
    const result = await callApi('portal_app.api.attendance_leaves.create_student_leave_request', requestForm);
    success.value = `Demande ${result.name} soumise`;
    requestForm.reason = '';
    requestForm.attendance_sessions = '';
    requestForm.evidence_ref = '';
    uploadedFilename.value = '';
    await loadPage();
  } catch (err) {
    error.value = err.message;
  } finally {
    creating.value = false;
  }
}

async function submitAbsenceJustification() {
  if (!absenceForm.linked_attendance) {
    error.value = 'Absence à justifier requise.';
    return;
  }
  if (!absenceForm.reason.trim()) {
    error.value = 'Motif requis pour la justification.';
    return;
  }
  if (!absenceForm.attachment) {
    error.value = 'Pièce justificative requise.';
    return;
  }

  creatingAbsenceJustification.value = true;
  error.value = '';
  success.value = '';
  try {
    const result = await callApi('portal_app.api.absence_justification.create_attendance_absence_justification', absenceForm);
    success.value = `Justification ${result.name} soumise`;
    absenceForm.linked_attendance = '';
    absenceForm.reason = '';
    clearAbsenceEvidence();
    await loadPage();
  } catch (err) {
    error.value = err.message;
  } finally {
    creatingAbsenceJustification.value = false;
  }
}

async function decideLeave(row, decision) {
  const reason = window.prompt(decision === 'Approved' ? 'Motif de validation' : 'Motif de rejet');
  if (!reason?.trim()) return;

  deciding.value = `${row.name}:${decision}`;
  error.value = '';
  success.value = '';
  try {
    const result = await callApi('portal_app.api.attendance_leaves.decide_student_leave_request', {
      leave_application: row.name,
      decision,
      decision_reason: reason,
    });
    success.value = `${row.name} · ${result.status}`;
    await loadPage();
  } catch (err) {
    error.value = err.message;
  } finally {
    deciding.value = '';
  }
}

function isDeciding(row, decision) {
  return deciding.value === `${row.name}:${decision}`;
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function formatCount(value) {
  return Number(value || 0).toLocaleString('fr-FR');
}

function formatDate(value) {
  if (!value) return 'N/A';
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' }).format(new Date(String(value).replace(' ', 'T')));
}

function statusVisual(status) {
  if (status === 'Approved') return 'validated';
  if (status === 'Rejected') return 'failed';
  return 'pending';
}
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-ln-gray-900">Leaves attendance</h1>
        <p class="mt-1 text-sm text-ln-gray-600">
          Demandes justifiées et décisions pédagogiques.
        </p>
      </div>
      <button
        type="button"
        class="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md-ln border border-ln-gray-200 bg-white px-4 py-2 text-sm font-semibold text-ln-gray-700 hover:border-ln-blue-500 hover:text-ln-blue-900 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
        :disabled="loading"
        @click="loadPage"
      >
        <RefreshCw class="h-4 w-4" :class="{ 'motion-safe:animate-spin': loading }" />
        Actualiser
      </button>
    </header>

    <AlertBlock
      v-if="success"
      severity="success"
      title="Leave mis à jour"
      :description="success"
    />

    <BlockError
      v-if="error"
      title="Leaves indisponibles"
      :message="error"
      :retry="loadPage"
    />

    <section class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
      <form class="grid gap-3 md:grid-cols-2 xl:grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)_110px_auto]" @submit.prevent="loadPage">
        <label class="block">
          <span class="text-sm font-semibold text-ln-gray-900">Statut</span>
          <select
            v-model="filters.status"
            class="mt-2 min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          >
            <option v-for="option in statusOptions" :key="option || 'all'" :value="option">
              {{ option || 'Tous' }}
            </option>
          </select>
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
            placeholder="GRP-..."
          />
        </label>
        <label class="block">
          <span class="text-sm font-semibold text-ln-gray-900">Limite</span>
          <input
            v-model="filters.limit"
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
            aria-label="Filtrer les leaves"
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

    <div v-if="loading" class="grid gap-4 md:grid-cols-3">
      <BlockSkeleton v-for="idx in 3" :key="idx" :lines="3" :show-title="false" />
    </div>

    <section v-else-if="dashboard" class="grid gap-4 md:grid-cols-3">
      <article class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
        <div class="text-xs font-semibold uppercase text-ln-gray-500">Total</div>
        <div class="mt-2 text-2xl font-bold text-ln-gray-900">{{ formatCount(summary.total) }}</div>
      </article>
      <article class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
        <div class="text-xs font-semibold uppercase text-ln-gray-500">Soumis</div>
        <div class="mt-2 text-2xl font-bold text-ln-warning">{{ formatCount(summary.submitted) }}</div>
      </article>
      <article class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
        <div class="text-xs font-semibold uppercase text-ln-gray-500">Validés</div>
        <div class="mt-2 text-2xl font-bold text-ln-success">{{ formatCount(summary.approved) }}</div>
      </article>
    </section>

    <section v-if="absenceDashboard" class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div class="overflow-hidden rounded-md-ln border border-ln-gray-200 bg-white">
        <div class="flex items-center justify-between gap-3 border-b border-ln-gray-100 px-4 py-3">
          <h2 class="text-sm font-semibold text-ln-gray-900">Absences à justifier</h2>
          <span class="text-xs font-semibold uppercase text-ln-gray-500">{{ formatCount(absenceSummary.pending_absences) }}</span>
        </div>
        <div v-if="absenceLoading" class="p-4">
          <BlockSkeleton :lines="4" :show-title="false" />
        </div>
        <EmptyState
          v-else-if="pendingAbsences.length === 0"
          icon="FileText"
          label="Aucune absence"
          description="Aucune absence en attente de justification."
        />
        <div v-else class="divide-y divide-ln-gray-100">
          <article v-for="row in pendingAbsences" :key="row.name" class="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-sm font-semibold text-ln-gray-900">{{ row.name }}</h3>
                <StatusBadge :status="row.expired ? 'failed' : 'pending'" :label="row.expired ? 'Délai expiré' : 'Pending'" size="sm" />
              </div>
              <p class="mt-1 text-xs text-ln-gray-500">
                {{ row.student_name || row.student }} · {{ row.student_group || 'Sans groupe' }} · {{ row.session_id || row.attendance_session || 'Sans séance' }} · {{ formatDate(row.date) }}
              </p>
              <p class="mt-1 text-xs text-ln-gray-500">Échéance {{ formatDate(row.deadline_date) }}</p>
            </div>
            <button
              v-if="absenceCapabilities.create_post_absence && !row.expired"
              type="button"
              class="inline-flex min-h-[44px] items-center justify-center rounded-md-ln border border-ln-gray-200 bg-white px-3 py-2 text-sm font-semibold text-ln-gray-700 hover:border-ln-blue-500 hover:text-ln-blue-900 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
              @click="selectAbsence(row)"
            >
              Justifier
            </button>
          </article>
        </div>
      </div>

      <div v-if="absenceCapabilities.create_post_absence" class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
        <h2 class="text-sm font-semibold text-ln-gray-900">Justification post-absence</h2>
        <form class="mt-3 space-y-3" @submit.prevent="submitAbsenceJustification">
          <label class="block">
            <span class="text-sm font-semibold text-ln-gray-900">Absence</span>
            <input
              v-model="absenceForm.linked_attendance"
              type="text"
              class="mt-2 min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
              placeholder="STUD-ATT-..."
            />
          </label>
          <label class="block">
            <span class="text-sm font-semibold text-ln-gray-900">Motif</span>
            <textarea
              v-model="absenceForm.reason"
              rows="3"
              class="mt-2 w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
            />
          </label>
          <div class="flex flex-wrap items-center gap-2">
            <input ref="absenceFileInput" type="file" class="hidden" @change="uploadAbsenceEvidence" />
            <button
              type="button"
              class="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md-ln border border-ln-gray-200 bg-white px-3 py-2 text-sm font-semibold text-ln-gray-700 hover:border-ln-blue-500 hover:text-ln-blue-900 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
              :disabled="uploadingAbsence || !absenceForm.linked_attendance"
              @click="openAbsenceFilePicker"
            >
              <Upload class="h-4 w-4" />
              {{ uploadingAbsence ? 'Envoi...' : 'Pièce' }}
            </button>
            <span v-if="absenceForm.attachment" class="text-xs text-ln-gray-500">{{ absenceUploadedFilename || absenceForm.attachment }}</span>
            <button
              v-if="absenceForm.attachment"
              type="button"
              class="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md-ln text-ln-gray-500 hover:bg-ln-gray-50 hover:text-ln-error focus:outline-none focus:ring-2 focus:ring-ln-error/25"
              aria-label="Retirer la pièce"
              @click="clearAbsenceEvidence"
            >
              <X class="h-4 w-4" />
            </button>
          </div>
          <button
            type="submit"
            class="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md-ln bg-ln-blue-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ln-blue-900 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
            :disabled="creatingAbsenceJustification || !absenceForm.linked_attendance || !absenceForm.attachment"
          >
            <CheckCircle2 class="h-4 w-4" />
            Soumettre
          </button>
        </form>
      </div>
    </section>

    <section v-if="dashboard && capabilities.create" class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
      <h2 class="text-sm font-semibold text-ln-gray-900">Nouvelle demande</h2>
      <form class="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-[150px_150px_minmax(0,1fr)_minmax(0,1fr)_auto]" @submit.prevent="createLeave">
        <input
          v-model="requestForm.from_date"
          type="date"
          class="min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
        />
        <input
          v-model="requestForm.to_date"
          type="date"
          class="min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
        />
        <input
          v-model="requestForm.attendance_sessions"
          type="text"
          class="min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          placeholder="Séances couvertes"
        />
        <input
          v-model="requestForm.reason"
          type="text"
          class="min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          placeholder="Motif"
        />
        <button
          type="submit"
          class="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md-ln bg-ln-blue-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ln-blue-900 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          :disabled="creating || !requestForm.evidence_ref"
        >
          <CheckCircle2 class="h-4 w-4" />
          Soumettre
        </button>
      </form>
      <div class="mt-3 flex flex-wrap items-center gap-2">
        <input ref="fileInput" type="file" class="hidden" @change="uploadEvidence" />
        <button
          type="button"
          class="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md-ln border border-ln-gray-200 bg-white px-3 py-2 text-sm font-semibold text-ln-gray-700 hover:border-ln-blue-500 hover:text-ln-blue-900 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          :disabled="uploading"
          @click="openFilePicker"
        >
          <Upload class="h-4 w-4" />
          {{ uploading ? 'Envoi...' : 'Justificatif' }}
        </button>
        <span v-if="requestForm.evidence_ref" class="text-xs text-ln-gray-500">{{ uploadedFilename || requestForm.evidence_ref }}</span>
        <button
          v-if="requestForm.evidence_ref"
          type="button"
          class="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md-ln text-ln-gray-500 hover:bg-ln-gray-50 hover:text-ln-error focus:outline-none focus:ring-2 focus:ring-ln-error/25"
          aria-label="Retirer le justificatif"
          @click="clearEvidence"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
    </section>

    <section v-if="absenceDashboard" class="overflow-hidden rounded-md-ln border border-ln-gray-200 bg-white">
      <div class="border-b border-ln-gray-100 px-4 py-3">
        <h2 class="text-sm font-semibold text-ln-gray-900">Justifications d'absence</h2>
      </div>
      <EmptyState
        v-if="absenceJustifications.length === 0"
        icon="FileText"
        label="Aucune justification"
        description="Aucune justification d'absence ne correspond au périmètre."
      />
      <div v-else class="divide-y divide-ln-gray-100">
        <article v-for="row in absenceJustifications" :key="row.name" class="p-4">
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="text-sm font-semibold text-ln-gray-900">{{ row.name }}</h3>
            <StatusBadge :status="statusVisual(row.status === 'Approuvée' ? 'Approved' : row.status === 'Rejetée' || row.status === 'Expirée' ? 'Rejected' : 'Submitted')" :label="row.status" size="sm" />
          </div>
          <p class="mt-1 text-xs text-ln-gray-500">
            {{ row.student_name || row.student }} · {{ row.student_group || 'Sans groupe' }} · {{ row.linked_attendance || 'Sans attendance' }} · {{ formatDate(row.from_date) }}
          </p>
          <p class="mt-2 text-sm text-ln-gray-700">{{ row.reason }}</p>
          <p v-if="row.attachment" class="mt-1 text-xs text-ln-gray-500">{{ row.attachment }}</p>
        </article>
      </div>
    </section>

    <section v-if="dashboard" class="overflow-hidden rounded-md-ln border border-ln-gray-200 bg-white">
      <div class="border-b border-ln-gray-100 px-4 py-3">
        <h2 class="text-sm font-semibold text-ln-gray-900">Demandes Leave</h2>
      </div>
      <EmptyState
        v-if="rows.length === 0"
        icon="FileText"
        label="Aucune demande"
        description="Aucune demande Leave ne correspond aux filtres."
      />
      <div v-else class="divide-y divide-ln-gray-100">
        <article v-for="row in rows" :key="row.name" class="grid gap-3 p-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-sm font-semibold text-ln-gray-900">{{ row.name }}</h3>
              <StatusBadge :status="statusVisual(row.status)" :label="row.status" size="sm" />
            </div>
            <p class="mt-1 text-xs text-ln-gray-500">
              {{ row.student_name }} · {{ row.student }} · {{ row.student_group || 'Sans groupe' }} · {{ formatDate(row.from_date) }} → {{ formatDate(row.to_date) }}
            </p>
            <p class="mt-2 text-sm text-ln-gray-700">{{ row.reason }}</p>
            <p v-if="row.evidence_ref" class="mt-1 text-xs text-ln-gray-500">{{ row.evidence_ref }}</p>
          </div>
          <div v-if="capabilities.decide && row.can_decide" class="flex flex-wrap gap-2">
            <button
              type="button"
              class="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md-ln bg-ln-blue-800 px-3 py-2 text-sm font-semibold text-white hover:bg-ln-blue-900 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
              :disabled="!!deciding"
              @click="decideLeave(row, 'Approved')"
            >
              <CheckCircle2 class="h-4 w-4" />
              {{ isDeciding(row, 'Approved') ? 'Validation...' : 'Valider' }}
            </button>
            <button
              type="button"
              class="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md-ln border border-ln-error/30 bg-white px-3 py-2 text-sm font-semibold text-ln-error hover:bg-[#FEF2F2] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ln-error/25"
              :disabled="!!deciding"
              @click="decideLeave(row, 'Rejected')"
            >
              <XCircle class="h-4 w-4" />
              {{ isDeciding(row, 'Rejected') ? 'Rejet...' : 'Rejeter' }}
            </button>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
