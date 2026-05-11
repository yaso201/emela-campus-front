<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { CheckCircle2, FilePlus2, RefreshCw, Search, TicketCheck, Upload, X, XCircle } from 'lucide-vue-next';
import AlertBlock from '@/components/ui/AlertBlock.vue';
import BlockError from '@/components/ui/BlockError.vue';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';

const today = new Date();
const filters = reactive({
  reference_date: toIsoDate(today),
  student: '',
  student_group: '',
  ticket_status: 'Submitted',
  limit: 100,
});

const teacherForm = reactive({ reason: '', pin: '' });
const adminForm = reactive({ requested_status: 'Present', reason: '' });
const ticketForm = reactive({
  attendance_session: '',
  student: '',
  requested_status: 'Present',
  reason: '',
  evidence_ref: '',
});

const loading = ref(false);
const acting = ref('');
const creatingTicket = ref(false);
const uploadingTicketEvidence = ref(false);
const ticketFileInput = ref(null);
const ticketUploadedFilename = ref('');
const error = ref('');
const success = ref('');
const dashboard = ref(null);

const teacherRows = computed(() => dashboard.value?.teacher_queue || []);
const adminRows = computed(() => dashboard.value?.admin_queue || []);
const tickets = computed(() => dashboard.value?.tickets || []);
const summary = computed(() => dashboard.value?.summary || {});
const capabilities = computed(() => dashboard.value?.capabilities || {});

const ticketStatusOptions = ['', 'Submitted', 'Under Review', 'Escalated', 'Approved', 'Rejected'];
const requestedStatusOptions = [
  { value: 'Present', label: 'Présent' },
  { value: 'Leave', label: 'Leave' },
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
    dashboard.value = await callApi('portal_app.api.attendance_corrections.get_attendance_correction_dashboard', filters);
  } catch (err) {
    dashboard.value = null;
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

function resetFilters() {
  filters.reference_date = toIsoDate(new Date());
  filters.student = '';
  filters.student_group = '';
  filters.ticket_status = 'Submitted';
  filters.limit = 100;
  loadDashboard();
}

function useRowForTicket(row) {
  ticketForm.attendance_session = row.attendance_session || '';
  ticketForm.student = row.student || '';
  ticketForm.requested_status = row.current_status === 'Absent' ? 'Present' : 'Leave';
  ticketForm.reason = '';
  ticketForm.evidence_ref = '';
  ticketUploadedFilename.value = '';
}

async function applyTeacherCorrection(row) {
  if (!teacherForm.reason.trim() || !teacherForm.pin.trim()) {
    error.value = 'Motif et PIN requis pour la correction enseignant.';
    return;
  }

  await runAction(`teacher:${row.student_attendance}`, async () => {
    const result = await callApi('portal_app.api.attendance_corrections.apply_teacher_correction', {
      attendance_session: row.attendance_session,
      student: row.student,
      reason: teacherForm.reason,
      pin: teacherForm.pin,
      reference_date: filters.reference_date,
    });
    teacherForm.pin = '';
    success.value = `${row.student_name} · ${result.status}`;
  });
}

async function applyAdminCorrection(row) {
  if (!adminForm.reason.trim()) {
    error.value = 'Motif requis pour la correction administrative.';
    return;
  }

  await runAction(`admin:${row.student_attendance}`, async () => {
    const result = await callApi('portal_app.api.attendance_corrections.apply_admin_correction', {
      attendance_session: row.attendance_session,
      student: row.student,
      requested_status: adminForm.requested_status,
      reason: adminForm.reason,
      reference_date: filters.reference_date,
    });
    success.value = `${row.student_name} · ${result.status}`;
  });
}

async function createTicket() {
  if (!ticketForm.attendance_session.trim() || !ticketForm.student.trim() || !ticketForm.reason.trim()) {
    error.value = 'Séance, étudiant et motif requis pour créer un ticket.';
    return;
  }
  if (!ticketForm.evidence_ref) {
    error.value = 'Justificatif requis pour créer un ticket.';
    return;
  }

  creatingTicket.value = true;
  error.value = '';
  success.value = '';
  try {
    const result = await callApi('portal_app.api.attendance_corrections.create_attendance_modification_request', ticketForm);
    success.value = `Ticket ${result.name} créé`;
    ticketForm.reason = '';
    ticketForm.evidence_ref = '';
    ticketUploadedFilename.value = '';
    await loadDashboard();
  } catch (err) {
    error.value = err.message;
  } finally {
    creatingTicket.value = false;
  }
}

function openTicketFilePicker() {
  ticketFileInput.value?.click();
}

async function uploadTicketEvidence(event) {
  const file = event.target?.files?.[0];
  if (!file) return;
  uploadingTicketEvidence.value = true;
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
    ticketForm.evidence_ref = uploaded.file_url || '';
    ticketUploadedFilename.value = uploaded.file_name || file.name;
  } catch (err) {
    error.value = err.message;
  } finally {
    uploadingTicketEvidence.value = false;
    if (ticketFileInput.value) ticketFileInput.value.value = '';
  }
}

function clearTicketEvidence() {
  ticketForm.evidence_ref = '';
  ticketUploadedFilename.value = '';
}

async function decideTicket(row, decision) {
  const reason = window.prompt(decision === 'Approved' ? 'Motif d’approbation' : 'Motif de rejet');
  if (!reason?.trim()) return;

  await runAction(`ticket:${row.name}:${decision}`, async () => {
    const result = await callApi('portal_app.api.attendance_corrections.decide_attendance_modification_request', {
      request_name: row.name,
      decision,
      decision_reason: reason,
    });
    success.value = `${row.name} · ${result.status}`;
  });
}

async function runAction(key, fn) {
  acting.value = key;
  error.value = '';
  success.value = '';
  try {
    await fn();
    await loadDashboard();
  } catch (err) {
    error.value = err.message;
  } finally {
    acting.value = '';
  }
}

function isActing(key) {
  return acting.value === key;
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

function ticketStatusVisual(status) {
  if (status === 'Approved') return 'validated';
  if (status === 'Rejected') return 'failed';
  if (status === 'Escalated') return 'compensated';
  return 'pending';
}
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-ln-gray-900">Corrections attendance</h1>
        <p class="mt-1 text-sm text-ln-gray-600">
          Files D+7, D+14 et tickets de modification.
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
      v-if="success"
      severity="success"
      title="Action enregistrée"
      :description="success"
    />

    <BlockError
      v-if="error"
      title="Corrections indisponibles"
      :message="error"
      :retry="loadDashboard"
    />

    <section class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
      <form class="grid gap-3 md:grid-cols-2 xl:grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)_160px_110px_auto]" @submit.prevent="loadDashboard">
        <label class="block">
          <span class="text-sm font-semibold text-ln-gray-900">Référence</span>
          <input
            v-model="filters.reference_date"
            type="date"
            class="mt-2 min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
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
            placeholder="GRP-..."
          />
        </label>
        <label class="block">
          <span class="text-sm font-semibold text-ln-gray-900">Tickets</span>
          <select
            v-model="filters.ticket_status"
            class="mt-2 min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          >
            <option v-for="option in ticketStatusOptions" :key="option || 'all'" :value="option">
              {{ option || 'Tous' }}
            </option>
          </select>
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
            aria-label="Filtrer les corrections"
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
        <div class="text-xs font-semibold uppercase text-ln-gray-500">D+7 enseignant</div>
        <div class="mt-2 text-2xl font-bold text-ln-gray-900">{{ formatCount(summary.teacher_queue) }}</div>
      </article>
      <article class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
        <div class="text-xs font-semibold uppercase text-ln-gray-500">D+14 service</div>
        <div class="mt-2 text-2xl font-bold text-ln-blue-800">{{ formatCount(summary.admin_queue) }}</div>
      </article>
      <article class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
        <div class="text-xs font-semibold uppercase text-ln-gray-500">Tickets</div>
        <div class="mt-2 text-2xl font-bold text-ln-warning">{{ formatCount(summary.tickets) }}</div>
      </article>
    </section>

    <section v-if="dashboard && capabilities.teacher_correction" class="overflow-hidden rounded-md-ln border border-ln-gray-200 bg-white">
      <div class="border-b border-ln-gray-100 px-4 py-3">
        <h2 class="text-sm font-semibold text-ln-gray-900">Correction enseignant D+7</h2>
      </div>
      <div class="grid gap-3 border-b border-ln-gray-100 p-4 md:grid-cols-[minmax(0,1fr)_180px]">
        <input
          v-model="teacherForm.reason"
          type="text"
          class="min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          placeholder="Motif"
        />
        <input
          v-model="teacherForm.pin"
          type="password"
          inputmode="numeric"
          class="min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          placeholder="PIN"
        />
      </div>
      <EmptyState
        v-if="teacherRows.length === 0"
        icon="CheckCircle2"
        label="Aucune correction D+7"
        description="Aucune absence corrigeable dans votre périmètre."
      />
      <div v-else class="divide-y divide-ln-gray-100">
        <article v-for="row in teacherRows" :key="row.student_attendance" class="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div class="min-w-0">
            <div class="text-sm font-semibold text-ln-gray-900">{{ row.student_name }}</div>
            <div class="mt-1 text-xs text-ln-gray-500">{{ row.student }} · {{ row.session_id }} · {{ formatDate(row.session_date) }} · {{ row.student_group }}</div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md-ln bg-ln-blue-800 px-3 py-2 text-sm font-semibold text-white hover:bg-ln-blue-900 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
              :disabled="!!acting"
              @click="applyTeacherCorrection(row)"
            >
              <CheckCircle2 class="h-4 w-4" />
              {{ isActing(`teacher:${row.student_attendance}`) ? 'Correction...' : 'Présent' }}
            </button>
            <button
              type="button"
              class="inline-flex min-h-[44px] items-center justify-center rounded-md-ln border border-ln-gray-200 bg-white px-3 py-2 text-sm font-semibold text-ln-gray-700 hover:border-ln-blue-500 hover:text-ln-blue-900 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
              @click="useRowForTicket(row)"
            >
              Ticket
            </button>
          </div>
        </article>
      </div>
    </section>

    <section v-if="dashboard && capabilities.admin_correction" class="overflow-hidden rounded-md-ln border border-ln-gray-200 bg-white">
      <div class="border-b border-ln-gray-100 px-4 py-3">
        <h2 class="text-sm font-semibold text-ln-gray-900">Correction Service pédagogique D+8 à D+14</h2>
      </div>
      <div class="grid gap-3 border-b border-ln-gray-100 p-4 md:grid-cols-[170px_minmax(0,1fr)]">
        <select
          v-model="adminForm.requested_status"
          class="min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
        >
          <option v-for="option in requestedStatusOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
        <input
          v-model="adminForm.reason"
          type="text"
          class="min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          placeholder="Motif"
        />
      </div>
      <EmptyState
        v-if="adminRows.length === 0"
        icon="CheckCircle2"
        label="Aucune correction D+14"
        description="Aucune absence corrigeable dans la fenêtre administrative."
      />
      <div v-else class="divide-y divide-ln-gray-100">
        <article v-for="row in adminRows" :key="row.student_attendance" class="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div class="min-w-0">
            <div class="text-sm font-semibold text-ln-gray-900">{{ row.student_name }}</div>
            <div class="mt-1 text-xs text-ln-gray-500">{{ row.student }} · {{ row.session_id }} · {{ formatDate(row.session_date) }} · {{ row.student_group }}</div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md-ln bg-ln-blue-800 px-3 py-2 text-sm font-semibold text-white hover:bg-ln-blue-900 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
              :disabled="!!acting"
              @click="applyAdminCorrection(row)"
            >
              <CheckCircle2 class="h-4 w-4" />
              {{ isActing(`admin:${row.student_attendance}`) ? 'Correction...' : 'Appliquer' }}
            </button>
            <button
              type="button"
              class="inline-flex min-h-[44px] items-center justify-center rounded-md-ln border border-ln-gray-200 bg-white px-3 py-2 text-sm font-semibold text-ln-gray-700 hover:border-ln-blue-500 hover:text-ln-blue-900 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
              @click="useRowForTicket(row)"
            >
              Ticket
            </button>
          </div>
        </article>
      </div>
    </section>

    <section v-if="dashboard && capabilities.ticket_create" class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
      <div class="mb-3 flex items-center gap-2">
        <FilePlus2 class="h-4 w-4 text-ln-blue-800" />
        <h2 class="text-sm font-semibold text-ln-gray-900">Créer un ticket</h2>
      </div>
      <form class="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px_minmax(0,1fr)_auto]" @submit.prevent="createTicket">
        <input
          v-model="ticketForm.attendance_session"
          type="text"
          class="min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          placeholder="Attendance Session"
        />
        <input
          v-model="ticketForm.student"
          type="text"
          class="min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          placeholder="Étudiant"
        />
        <select
          v-model="ticketForm.requested_status"
          class="min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
        >
          <option v-for="option in requestedStatusOptions" :key="`ticket-${option.value}`" :value="option.value">{{ option.label }}</option>
        </select>
        <input
          v-model="ticketForm.reason"
          type="text"
          class="min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          placeholder="Motif"
        />
        <button
          type="submit"
          class="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md-ln bg-ln-blue-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ln-blue-900 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          :disabled="creatingTicket || !ticketForm.evidence_ref"
        >
          <TicketCheck class="h-4 w-4" />
          Créer
        </button>
      </form>
      <div class="mt-3 flex flex-wrap items-center gap-2">
        <input ref="ticketFileInput" type="file" class="hidden" @change="uploadTicketEvidence" />
        <button
          type="button"
          class="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md-ln border border-ln-gray-200 bg-white px-3 py-2 text-sm font-semibold text-ln-gray-700 hover:border-ln-blue-500 hover:text-ln-blue-900 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          :disabled="uploadingTicketEvidence"
          @click="openTicketFilePicker"
        >
          <Upload class="h-4 w-4" />
          {{ uploadingTicketEvidence ? 'Envoi...' : 'Justificatif' }}
        </button>
        <span v-if="ticketForm.evidence_ref" class="text-xs text-ln-gray-500">{{ ticketUploadedFilename || ticketForm.evidence_ref }}</span>
        <button
          v-if="ticketForm.evidence_ref"
          type="button"
          class="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md-ln text-ln-gray-500 hover:bg-ln-gray-50 hover:text-ln-error focus:outline-none focus:ring-2 focus:ring-ln-error/25"
          aria-label="Retirer le justificatif"
          @click="clearTicketEvidence"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
    </section>

    <section v-if="dashboard" class="overflow-hidden rounded-md-ln border border-ln-gray-200 bg-white">
      <div class="border-b border-ln-gray-100 px-4 py-3">
        <h2 class="text-sm font-semibold text-ln-gray-900">Tickets attendance</h2>
      </div>
      <EmptyState
        v-if="tickets.length === 0"
        icon="Ticket"
        label="Aucun ticket"
        description="Aucun ticket ne correspond aux filtres."
      />
      <div v-else class="divide-y divide-ln-gray-100">
        <article v-for="ticket in tickets" :key="ticket.name" class="grid gap-3 p-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-sm font-semibold text-ln-gray-900">{{ ticket.name }}</h3>
              <StatusBadge :status="ticketStatusVisual(ticket.status)" :label="ticket.status" size="sm" />
            </div>
            <p class="mt-1 text-xs text-ln-gray-500">
              {{ ticket.student_name }} · {{ ticket.student }} · {{ ticket.session_id || ticket.attendance_session }} · {{ ticket.student_group || 'Sans groupe' }}
            </p>
            <p class="mt-2 text-sm text-ln-gray-700">{{ ticket.reason }}</p>
            <p v-if="ticket.evidence_ref" class="mt-1 text-xs text-ln-gray-500">{{ ticket.evidence_ref }}</p>
          </div>
          <div v-if="capabilities.ticket_decide && !['Approved', 'Rejected'].includes(ticket.status)" class="flex flex-wrap gap-2">
            <button
              type="button"
              class="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md-ln bg-ln-blue-800 px-3 py-2 text-sm font-semibold text-white hover:bg-ln-blue-900 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
              :disabled="!!acting"
              @click="decideTicket(ticket, 'Approved')"
            >
              <CheckCircle2 class="h-4 w-4" />
              Approuver
            </button>
            <button
              type="button"
              class="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md-ln border border-ln-error/30 bg-white px-3 py-2 text-sm font-semibold text-ln-error hover:bg-[#FEF2F2] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ln-error/25"
              :disabled="!!acting"
              @click="decideTicket(ticket, 'Rejected')"
            >
              <XCircle class="h-4 w-4" />
              Rejeter
            </button>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
