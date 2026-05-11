<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  RefreshCw,
  Save,
  Search,
  Send,
  ShieldAlert,
  SlidersHorizontal,
  XCircle,
} from 'lucide-vue-next';
import AlertBlock from '@/components/ui/AlertBlock.vue';
import BlockError from '@/components/ui/BlockError.vue';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';

const filters = reactive({
  status: 'Open',
  severity: '',
  pattern_type: '',
  student: '',
  student_group: '',
  instructor: '',
  limit: 100,
});

const loading = ref(false);
const statsLoading = ref(false);
const settingsLoading = ref(false);
const savingSettings = ref(false);
const deciding = ref('');
const error = ref('');
const success = ref('');
const dashboard = ref(null);
const statistics = ref(null);
const settingsPayload = ref(null);
const settingsForm = reactive({
  many_devices_same_student_threshold: 3,
  shared_device_many_students_threshold: 2,
  manual_corrections_threshold: 10,
  early_signature_min_count: 3,
  early_signature_ratio: 0.8,
  early_signature_seconds: 5,
  late_signature_min_count: 3,
  late_signature_ratio: 0.8,
  late_signature_window_minutes: 3,
  repeated_late_openings_threshold: 3,
  late_opening_delay_minutes: 15,
  recurrent_paper_mode_threshold: 3,
});

const rows = computed(() => dashboard.value?.rows || []);
const summary = computed(() => dashboard.value?.summary || {});
const statSummary = computed(() => statistics.value?.summary || {});
const canUpdateSettings = computed(() => Boolean(settingsPayload.value?.can_update));
const hasCritical = computed(() => (summary.value.critical || 0) > 0);

const statusOptions = ['', 'Open', 'Escalated', 'Warning Issued', 'False Positive', 'Closed'];
const severityOptions = ['', 'Info', 'Warning', 'Critical'];
const patternOptions = [
  '',
  'many_devices_same_student',
  'new_device_for_student',
  'shared_device_many_students',
  'early_signature_statistical',
  'late_window_ratio',
  'double_signature_same_session',
  'out_of_window_signature',
  'overlapping_sessions',
  'abnormal_manual_corrections',
  'repeated_late_openings',
  'recurrent_paper_mode',
];

const settingItems = [
  { key: 'many_devices_same_student_threshold', label: 'Appareils par étudiant', min: 1, max: 20, step: 1 },
  { key: 'shared_device_many_students_threshold', label: 'Étudiants par appareil', min: 1, max: 50, step: 1 },
  { key: 'manual_corrections_threshold', label: 'Corrections manuelles', min: 1, max: 200, step: 1 },
  { key: 'early_signature_min_count', label: 'Signatures précoces min.', min: 1, max: 200, step: 1 },
  { key: 'early_signature_ratio', label: 'Ratio signatures précoces', min: 0.1, max: 1, step: 0.05 },
  { key: 'early_signature_seconds', label: 'Fenêtre précoce (sec.)', min: 1, max: 120, step: 1 },
  { key: 'late_signature_min_count', label: 'Signatures tardives min.', min: 1, max: 200, step: 1 },
  { key: 'late_signature_ratio', label: 'Ratio signatures tardives', min: 0.1, max: 1, step: 0.05 },
  { key: 'late_signature_window_minutes', label: 'Fenêtre fin séance (min.)', min: 1, max: 60, step: 1 },
  { key: 'repeated_late_openings_threshold', label: 'Ouvertures tardives répétées', min: 1, max: 100, step: 1 },
  { key: 'late_opening_delay_minutes', label: 'Retard ouverture (min.)', min: 1, max: 240, step: 1 },
  { key: 'recurrent_paper_mode_threshold', label: 'Mode papier récurrent', min: 1, max: 100, step: 1 },
];

onMounted(refreshAll);

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
    dashboard.value = await callApi('portal_app.api.attendance_antifraud.get_antifraud_review_dashboard', filters);
  } catch (err) {
    dashboard.value = null;
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function loadStatistics() {
  statsLoading.value = true;
  try {
    statistics.value = await callApi('portal_app.api.attendance_antifraud.get_antifraud_statistics', {
      days: 30,
      student_group: filters.student_group,
    });
  } catch (err) {
    statistics.value = null;
    error.value = err.message;
  } finally {
    statsLoading.value = false;
  }
}

async function loadSettings() {
  settingsLoading.value = true;
  try {
    const result = await callApi('portal_app.api.attendance_antifraud.get_antifraud_detection_settings');
    settingsPayload.value = result;
    Object.entries(result.settings || {}).forEach(([key, value]) => {
      if (Object.prototype.hasOwnProperty.call(settingsForm, key)) {
        settingsForm[key] = value;
      }
    });
  } catch (err) {
    settingsPayload.value = null;
    error.value = err.message;
  } finally {
    settingsLoading.value = false;
  }
}

async function refreshAll() {
  await Promise.all([loadDashboard(), loadStatistics(), loadSettings()]);
}

function resetFilters() {
  filters.status = 'Open';
  filters.severity = '';
  filters.pattern_type = '';
  filters.student = '';
  filters.student_group = '';
  filters.instructor = '';
  filters.limit = 100;
  refreshAll();
}

function resetSettingsToDefaults() {
  Object.entries(settingsPayload.value?.defaults || {}).forEach(([key, value]) => {
    if (Object.prototype.hasOwnProperty.call(settingsForm, key)) {
      settingsForm[key] = value;
    }
  });
}

async function saveSettings() {
  savingSettings.value = true;
  error.value = '';
  success.value = '';
  try {
    const result = await callApi('portal_app.api.attendance_antifraud.update_antifraud_detection_settings', {
      settings_json: JSON.stringify(settingsForm),
    });
    settingsPayload.value = result;
    success.value = 'Seuils antifraude enregistrés.';
    await Promise.all([loadDashboard(), loadStatistics()]);
  } catch (err) {
    error.value = err.message;
  } finally {
    savingSettings.value = false;
  }
}

async function decide(row, action) {
  const notes = window.prompt('Notes de décision');
  if (!notes?.trim()) return;
  let escalatedTo = '';
  if (action === 'Escalate') {
    escalatedTo = window.prompt('Utilisateur Responsable Formation') || '';
    if (!escalatedTo.trim()) return;
  }

  deciding.value = `${row.name}:${action}`;
  error.value = '';
  success.value = '';
  try {
    const result = await callApi('portal_app.api.attendance_antifraud.decide_antifraud_review', {
      review: row.name,
      action,
      notes,
      escalated_to: escalatedTo,
    });
    success.value = `${row.name} · ${result.status}`;
    await loadDashboard();
  } catch (err) {
    error.value = err.message;
  } finally {
    deciding.value = '';
  }
}

function canAct(row) {
  return row.status === 'Open' || row.status === 'Escalated';
}

function isDeciding(row, action) {
  return deciding.value === `${row.name}:${action}`;
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
  if (status === 'Escalated') return 'compensated';
  if (status === 'Warning Issued') return 'compensated';
  if (status === 'False Positive') return 'validated';
  if (status === 'Closed') return 'closed';
  return 'pending';
}

function severityVisual(severity) {
  if (severity === 'Critical') return 'failed';
  if (severity === 'Warning') return 'compensated';
  return 'pending';
}

function patternLabel(value) {
  return String(value || '').replaceAll('_', ' ');
}

function rowsOrEmpty(value) {
  return Array.isArray(value) ? value : [];
}

function detailSummary(row) {
  const details = row.details || {};
  const entries = Object.entries(details).slice(0, 3);
  if (!entries.length) return 'Aucun détail';
  return entries.map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join(' · ');
}
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-ln-gray-900">Revue antifraude</h1>
        <p class="mt-1 text-sm text-ln-gray-600">
          Anomalies détectées, tri opérationnel et escalade Responsable Formation.
        </p>
      </div>
      <button
        type="button"
        class="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md-ln border border-ln-gray-200 bg-white px-4 py-2 text-sm font-semibold text-ln-gray-700 hover:border-ln-blue-500 hover:text-ln-blue-900 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
        :disabled="loading"
        @click="refreshAll"
      >
        <RefreshCw class="h-4 w-4" :class="{ 'motion-safe:animate-spin': loading }" />
        Actualiser
      </button>
    </header>

    <AlertBlock
      v-if="hasCritical"
      severity="warning"
      title="Anomalies critiques"
      :description="`${formatCount(summary.critical)} revue(s) critique(s) dans le périmètre affiché.`"
    />

    <AlertBlock
      v-if="success"
      severity="success"
      title="Décision enregistrée"
      :description="success"
    />

    <BlockError
      v-if="error"
      title="Revue antifraude indisponible"
      :message="error"
      :retry="refreshAll"
    />

    <section class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
      <form class="grid gap-3 md:grid-cols-2 xl:grid-cols-[150px_150px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]" @submit.prevent="refreshAll">
        <label class="block">
          <span class="text-sm font-semibold text-ln-gray-900">Statut</span>
          <select
            v-model="filters.status"
            class="mt-2 min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          >
            <option v-for="option in statusOptions" :key="option || 'all-status'" :value="option">
              {{ option || 'Tous' }}
            </option>
          </select>
        </label>
        <label class="block">
          <span class="text-sm font-semibold text-ln-gray-900">Sévérité</span>
          <select
            v-model="filters.severity"
            class="mt-2 min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          >
            <option v-for="option in severityOptions" :key="option || 'all-severity'" :value="option">
              {{ option || 'Toutes' }}
            </option>
          </select>
        </label>
        <label class="block">
          <span class="text-sm font-semibold text-ln-gray-900">Pattern</span>
          <select
            v-model="filters.pattern_type"
            class="mt-2 min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          >
            <option v-for="option in patternOptions" :key="option || 'all-patterns'" :value="option">
              {{ option ? patternLabel(option) : 'Tous' }}
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
            placeholder="GROUPE-..."
          />
        </label>
        <div class="flex items-end gap-2">
          <button
            type="submit"
            class="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md-ln bg-ln-blue-800 px-3 py-2 text-sm font-semibold text-white hover:bg-ln-blue-900 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
            :disabled="loading"
            aria-label="Filtrer les revues"
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
        <div class="text-xs font-semibold uppercase text-ln-gray-500">Escaladées</div>
        <div class="mt-2 text-2xl font-bold text-ln-warning">{{ formatCount(summary.escalated) }}</div>
      </article>
      <article class="rounded-md-ln border border-ln-gray-200 bg-white p-4">
        <div class="text-xs font-semibold uppercase text-ln-gray-500">Clôturées</div>
        <div class="mt-2 text-2xl font-bold text-ln-success">{{ formatCount(summary.closed) }}</div>
      </article>
    </section>

    <section class="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
      <div class="overflow-hidden rounded-md-ln border border-ln-gray-200 bg-white">
        <div class="flex items-center gap-2 border-b border-ln-gray-100 px-4 py-3">
          <BarChart3 class="h-4 w-4 text-ln-blue-800" />
          <h2 class="text-sm font-semibold text-ln-gray-900">Statistiques 30 jours</h2>
        </div>
        <div v-if="statsLoading" class="p-4">
          <BlockSkeleton :lines="4" :show-title="false" />
        </div>
        <div v-else-if="statistics" class="grid gap-4 p-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <article class="rounded-md-ln border border-ln-gray-200 p-3">
              <div class="text-xs font-semibold uppercase text-ln-gray-500">Total période</div>
              <div class="mt-1 text-2xl font-bold text-ln-gray-900">{{ formatCount(statSummary.total) }}</div>
            </article>
            <article class="rounded-md-ln border border-ln-gray-200 p-3">
              <div class="text-xs font-semibold uppercase text-ln-gray-500">Faux positifs</div>
              <div class="mt-1 text-2xl font-bold text-ln-success">{{ statSummary.false_positive_percent || 0 }}%</div>
            </article>
            <article class="rounded-md-ln border border-ln-gray-200 p-3">
              <div class="text-xs font-semibold uppercase text-ln-gray-500">Signaux fingerprint</div>
              <div class="mt-1 text-2xl font-bold text-ln-warning">{{ formatCount(statSummary.fingerprint_signal_reviews) }}</div>
            </article>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <h3 class="text-xs font-semibold uppercase text-ln-gray-500">Par pattern</h3>
              <div class="mt-2 divide-y divide-ln-gray-100">
                <div v-for="item in rowsOrEmpty(statistics.by_pattern).slice(0, 6)" :key="item.key" class="flex items-center justify-between gap-3 py-2 text-sm">
                  <span class="truncate text-ln-gray-700">{{ patternLabel(item.key) }}</span>
                  <span class="font-semibold text-ln-gray-900">{{ formatCount(item.count) }}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 class="text-xs font-semibold uppercase text-ln-gray-500">Par statut</h3>
              <div class="mt-2 divide-y divide-ln-gray-100">
                <div v-for="item in rowsOrEmpty(statistics.by_status)" :key="item.key" class="flex items-center justify-between gap-3 py-2 text-sm">
                  <span class="truncate text-ln-gray-700">{{ item.key }}</span>
                  <span class="font-semibold text-ln-gray-900">{{ formatCount(item.count) }}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 class="text-xs font-semibold uppercase text-ln-gray-500">Étudiants récurrents</h3>
              <div class="mt-2 divide-y divide-ln-gray-100">
                <div v-for="item in rowsOrEmpty(statistics.top_students)" :key="item.key" class="flex items-center justify-between gap-3 py-2 text-sm">
                  <span class="truncate text-ln-gray-700">{{ item.key }}</span>
                  <span class="font-semibold text-ln-gray-900">{{ formatCount(item.count) }}</span>
                </div>
                <div v-if="rowsOrEmpty(statistics.top_students).length === 0" class="py-2 text-sm text-ln-gray-500">Aucun étudiant récurrent</div>
              </div>
            </div>
            <div>
              <h3 class="text-xs font-semibold uppercase text-ln-gray-500">Enseignants récurrents</h3>
              <div class="mt-2 divide-y divide-ln-gray-100">
                <div v-for="item in rowsOrEmpty(statistics.top_instructors)" :key="item.key" class="flex items-center justify-between gap-3 py-2 text-sm">
                  <span class="truncate text-ln-gray-700">{{ item.key }}</span>
                  <span class="font-semibold text-ln-gray-900">{{ formatCount(item.count) }}</span>
                </div>
                <div v-if="rowsOrEmpty(statistics.top_instructors).length === 0" class="py-2 text-sm text-ln-gray-500">Aucun enseignant récurrent</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-md-ln border border-ln-gray-200 bg-white">
        <div class="flex items-center gap-2 border-b border-ln-gray-100 px-4 py-3">
          <SlidersHorizontal class="h-4 w-4 text-ln-blue-800" />
          <h2 class="text-sm font-semibold text-ln-gray-900">Seuils de détection</h2>
        </div>
        <div v-if="settingsLoading" class="p-4">
          <BlockSkeleton :lines="6" :show-title="false" />
        </div>
        <form v-else class="space-y-4 p-4" @submit.prevent="saveSettings">
          <AlertBlock
            severity="info"
            title="Signal faible"
            description="Le fingerprint sert uniquement au tri manuel des revues. Aucune sanction automatique n'est déclenchée par ces seuils."
          />
          <div class="grid gap-3 sm:grid-cols-2">
            <label v-for="item in settingItems" :key="item.key" class="block">
              <span class="text-sm font-semibold text-ln-gray-900">{{ item.label }}</span>
              <input
                v-model.number="settingsForm[item.key]"
                type="number"
                :min="item.min"
                :max="item.max"
                :step="item.step"
                :disabled="!canUpdateSettings"
                class="mt-2 min-h-[44px] w-full rounded-md-ln border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-900 disabled:bg-ln-gray-50 disabled:text-ln-gray-500 focus:border-ln-blue-500 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
              />
            </label>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              class="inline-flex min-h-[44px] items-center justify-center rounded-md-ln border border-ln-gray-200 bg-white px-4 py-2 text-sm font-semibold text-ln-gray-700 hover:border-ln-blue-500 hover:text-ln-blue-900 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
              :disabled="!canUpdateSettings || savingSettings"
              @click="resetSettingsToDefaults"
            >
              Réinitialiser
            </button>
            <button
              type="submit"
              class="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md-ln bg-ln-blue-800 px-4 py-2 text-sm font-semibold text-white hover:bg-ln-blue-900 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 disabled:opacity-60"
              :disabled="!canUpdateSettings || savingSettings"
            >
              <Save class="h-4 w-4" />
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </section>

    <section class="overflow-hidden rounded-md-ln border border-ln-gray-200 bg-white">
      <div class="flex items-center gap-2 border-b border-ln-gray-100 px-4 py-3">
        <ShieldAlert class="h-4 w-4 text-ln-blue-800" />
        <h2 class="text-sm font-semibold text-ln-gray-900">File de revue</h2>
      </div>

      <div v-if="loading" class="p-4">
        <BlockSkeleton :lines="6" :show-title="false" />
      </div>

      <EmptyState
        v-else-if="rows.length === 0"
        icon="ShieldAlert"
        label="Aucune revue"
        description="Aucune anomalie antifraude ne correspond aux filtres."
      />

      <div v-else class="hidden overflow-x-auto md:block">
        <table class="min-w-full divide-y divide-ln-gray-200">
          <thead class="bg-ln-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-ln-gray-500">Revue</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-ln-gray-500">Cible</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-ln-gray-500">Statut</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-ln-gray-500">Détails</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-ln-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-ln-gray-100 bg-white">
            <tr v-for="row in rows" :key="row.name">
              <td class="px-4 py-3 align-top">
                <div class="text-sm font-semibold text-ln-gray-900">{{ row.name }}</div>
                <div class="text-xs text-ln-gray-500">{{ patternLabel(row.pattern_type) }}</div>
                <div class="mt-1 text-xs text-ln-gray-500">{{ formatDate(row.detected_at) }}</div>
              </td>
              <td class="px-4 py-3 align-top">
                <div class="text-sm font-semibold text-ln-gray-900">{{ row.student_name || row.student_id || 'Sans étudiant' }}</div>
                <div class="text-xs text-ln-gray-500">{{ row.session_id || row.attendance_session || 'Sans séance' }}</div>
                <div class="text-xs text-ln-gray-500">{{ row.student_group || 'Sans groupe' }}</div>
              </td>
              <td class="px-4 py-3 align-top">
                <div class="space-y-2">
                  <StatusBadge :status="severityVisual(row.severity)" :label="row.severity" size="sm" />
                  <StatusBadge :status="statusVisual(row.status)" :label="row.status" size="sm" />
                </div>
              </td>
              <td class="max-w-[360px] px-4 py-3 align-top text-sm text-ln-gray-700">
                <div class="line-clamp-3">{{ detailSummary(row) }}</div>
                <div v-if="row.escalated_to" class="mt-1 text-xs text-ln-gray-500">Escalade : {{ row.escalated_to }}</div>
              </td>
              <td class="px-4 py-3 align-top">
                <div v-if="canAct(row)" class="flex justify-end gap-1.5">
                  <button
                    type="button"
                    class="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md-ln border border-ln-gray-200 bg-white text-ln-success hover:border-ln-success focus:outline-none focus:ring-2 focus:ring-ln-success/25"
                    :disabled="!!deciding"
                    aria-label="Faux positif"
                    @click="decide(row, 'False Positive')"
                  >
                    <XCircle class="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    class="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md-ln border border-ln-gray-200 bg-white text-ln-warning hover:border-ln-warning focus:outline-none focus:ring-2 focus:ring-ln-warning/25"
                    :disabled="!!deciding"
                    aria-label="Warning"
                    @click="decide(row, 'Warning')"
                  >
                    <AlertTriangle class="h-4 w-4" :class="{ 'motion-safe:animate-pulse': isDeciding(row, 'Warning') }" />
                  </button>
                  <button
                    type="button"
                    class="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md-ln border border-ln-gray-200 bg-white text-ln-blue-800 hover:border-ln-blue-700 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
                    :disabled="!!deciding"
                    aria-label="Escalader"
                    @click="decide(row, 'Escalate')"
                  >
                    <Send class="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    class="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md-ln border border-ln-gray-200 bg-white text-ln-gray-700 hover:border-ln-gray-500 focus:outline-none focus:ring-2 focus:ring-ln-gray-300"
                    :disabled="!!deciding"
                    aria-label="Clôturer"
                    @click="decide(row, 'Close')"
                  >
                    <CheckCircle2 class="h-4 w-4" />
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
              <p class="text-xs text-ln-gray-500">{{ patternLabel(row.pattern_type) }}</p>
            </div>
            <div class="flex flex-col items-end gap-1">
              <StatusBadge :status="severityVisual(row.severity)" :label="row.severity" size="sm" />
              <StatusBadge :status="statusVisual(row.status)" :label="row.status" size="sm" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div class="text-xs text-ln-gray-500">Étudiant</div>
              <div class="font-semibold text-ln-gray-900">{{ row.student_name || row.student_id || 'N/A' }}</div>
            </div>
            <div>
              <div class="text-xs text-ln-gray-500">Séance</div>
              <div class="font-semibold text-ln-gray-900">{{ row.session_id || row.attendance_session || 'N/A' }}</div>
            </div>
            <div class="col-span-2">
              <div class="text-xs text-ln-gray-500">Détails</div>
              <div class="text-ln-gray-700">{{ detailSummary(row) }}</div>
            </div>
          </div>
          <div v-if="canAct(row)" class="grid grid-cols-4 gap-2">
            <button
              type="button"
              class="inline-flex min-h-[44px] items-center justify-center rounded-md-ln border border-ln-gray-200 text-ln-success"
              :disabled="!!deciding"
              aria-label="Faux positif"
              @click="decide(row, 'False Positive')"
            >
              <XCircle class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="inline-flex min-h-[44px] items-center justify-center rounded-md-ln border border-ln-gray-200 text-ln-warning"
              :disabled="!!deciding"
              aria-label="Warning"
              @click="decide(row, 'Warning')"
            >
              <AlertTriangle class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="inline-flex min-h-[44px] items-center justify-center rounded-md-ln border border-ln-gray-200 text-ln-blue-800"
              :disabled="!!deciding"
              aria-label="Escalader"
              @click="decide(row, 'Escalate')"
            >
              <Send class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="inline-flex min-h-[44px] items-center justify-center rounded-md-ln border border-ln-gray-200 text-ln-gray-700"
              :disabled="!!deciding"
              aria-label="Clôturer"
              @click="decide(row, 'Close')"
            >
              <CheckCircle2 class="h-4 w-4" />
            </button>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
