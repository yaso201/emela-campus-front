<script setup>
// GradeSubmissionPage — Soumission de notes (Zone B écriture)
// NRM-011 à NRM-020 — Soumission, brouillon, deadline
// DEC-INSTR-02 (2 endpoints JSON/CSV) · DEC-INSTR-03 (sélection groupe)
// Réf : D10-NRM-Enseignant.md §3
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { Download, Upload, Save, Send, AlertTriangle, Clock, CheckCircle, FilePen } from 'lucide-vue-next';
import Card from '@/components/ui/Card.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import BlockError from '@/components/ui/BlockError.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import GradeModificationModal from '@/components/ui/GradeModificationModal.vue';

const route = useRoute();
const courseId = ref(route.params.course);
const courseName = ref('');

// Sélection groupe et composante (DEC-INSTR-03)
const groups = ref([]);
const selectedGroup = ref('');
const selectedComponent = ref('CC');
const EVALUATION_COMPONENTS = ['CC', 'TP', 'PJ', 'DE'];
const groupsLoading = ref(false);
const groupsError = ref(null);

// Liste de classe
const students = ref([]);
const grades = ref({});
const deadline = ref(null);
const loading = ref(false);
const error = ref(null);

// Soumissions
const submissions = ref([]);
const saving = ref(false);
const submitting = ref(false);

// Demandes de modification (DEC-INSTR-05)
const modRequests = ref([]);
const showModModal = ref(false);
const modTarget = ref(null);

// Import CSV
const csvImportError = ref(null);
const csvImporting = ref(false);

onMounted(() => {
  loadGroups();
  loadSubmissions();
  loadModRequests();
});

async function loadGroups() {
  groupsLoading.value = true;
  groupsError.value = null;
  try {
    const formData = new URLSearchParams();
    formData.append('course', courseId.value);

    const response = await fetch(
      '/api/method/portal_app.api.instructor_api.list_my_groups_for_course',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Frappe-CSRF-Token': window.csrf_token || '',
          'Accept': 'application/json',
        },
        body: formData.toString(),
        credentials: 'same-origin',
      },
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    groups.value = json.message || [];

    // Sélection automatique si un seul groupe
    if (groups.value.length === 1) {
      selectedGroup.value = groups.value[0].name;
      await loadClassList();
    }
  } catch (err) {
    groupsError.value = err.message;
  } finally {
    groupsLoading.value = false;
  }
}

async function loadClassList() {
  if (!selectedGroup.value) return;
  loading.value = true;
  error.value = null;
  try {
    const formData = new URLSearchParams();
    formData.append('course', courseId.value);
    formData.append('student_group', selectedGroup.value);
    formData.append('evaluation_component', selectedComponent.value);

    const response = await fetch(
      '/api/method/portal_app.api.grade_submission_api.get_class_roster',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Frappe-CSRF-Token': window.csrf_token || '',
          'Accept': 'application/json',
        },
        body: formData.toString(),
        credentials: 'same-origin',
      },
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    const data = json.message;
    courseName.value = data.course_name;
    deadline.value = data.submission_deadline;
    students.value = data.students || [];
    grades.value = {};
    students.value.forEach((s) => {
      grades.value[s.student_id] = s.proposed_grade || '';
    });
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function loadSubmissions() {
  const formData = new URLSearchParams();
  formData.append('course', courseId.value);

  try {
    const response = await fetch(
      '/api/method/portal_app.api.grade_submission_api.get_my_grade_submissions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Frappe-CSRF-Token': window.csrf_token || '',
          'Accept': 'application/json',
        },
        body: formData.toString(),
        credentials: 'same-origin',
      },
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    submissions.value = json.message?.submissions || [];
  } catch {
    // Ne pas bloquer l'affichage si les soumissions échouent à charger
  }
}

const isDeadlinePassed = computed(() => {
  if (!deadline.value) return false;
  return new Date(deadline.value) < new Date();
});

const deadlineFormatted = computed(() => {
  if (!deadline.value) return '';
  return new Date(deadline.value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
});

const hasDraftData = computed(() => {
  return Object.values(grades.value).some((g) => g !== '');
});

const canSubmit = computed(() => {
  if (isDeadlinePassed.value) return false;
  return students.value.every((s) => {
    const grade = parseFloat(grades.value[s.student_id]);
    return !isNaN(grade) && grade >= 0 && grade <= 20;
  });
});

function validateGrade(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return '';
  return Math.min(20, Math.max(0, num)).toFixed(1);
}

function _gradePayload() {
  return JSON.stringify(
    Object.entries(grades.value).map(([student_id, grade]) => ({
      student: student_id,
      proposed_grade: grade !== '' ? parseFloat(grade) : null,
    }))
  );
}

async function saveDraft() {
  saving.value = true;
  error.value = null;
  try {
    const formData = new URLSearchParams();
    formData.append('course', courseId.value);
    formData.append('student_group', selectedGroup.value);
    formData.append('evaluation_component', selectedComponent.value);
    formData.append('action', 'save_draft');
    formData.append('grades', _gradePayload());

    const response = await fetch(
      '/api/method/portal_app.api.grade_submission_api.submit_grades',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Frappe-CSRF-Token': window.csrf_token || '',
          'Accept': 'application/json',
        },
        body: formData.toString(),
        credentials: 'same-origin',
      },
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    await loadSubmissions();
  } catch (err) {
    error.value = err.message;
  } finally {
    saving.value = false;
  }
}

async function submitGrades() {
  if (!canSubmit.value) return;
  submitting.value = true;
  error.value = null;
  try {
    const formData = new URLSearchParams();
    formData.append('course', courseId.value);
    formData.append('student_group', selectedGroup.value);
    formData.append('evaluation_component', selectedComponent.value);
    formData.append('action', 'submit');
    formData.append('grades', _gradePayload());

    const response = await fetch(
      '/api/method/portal_app.api.grade_submission_api.submit_grades',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Frappe-CSRF-Token': window.csrf_token || '',
          'Accept': 'application/json',
        },
        body: formData.toString(),
        credentials: 'same-origin',
      },
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    await loadSubmissions();
  } catch (err) {
    error.value = err.message;
  } finally {
    submitting.value = false;
  }
}

async function loadModRequests() {
  const formData = new URLSearchParams();
  formData.append('course', courseId.value);
  try {
    const response = await fetch(
      '/api/method/portal_app.api.grade_modification_api.get_my_modification_requests',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Frappe-CSRF-Token': window.csrf_token || '',
          'Accept': 'application/json',
        },
        body: formData.toString(),
        credentials: 'same-origin',
      },
    );
    if (!response.ok) return;
    const json = await response.json();
    modRequests.value = Array.isArray(json.message) ? json.message : [];
  } catch {
    // Ne pas bloquer l'affichage
  }
}

function openModModal(sub) {
  modTarget.value = sub;
  showModModal.value = true;
}

async function onModSubmitted() {
  await loadModRequests();
}

async function downloadCsv() {
  try {
    const formData = new URLSearchParams();
    formData.append('course', courseId.value);
    formData.append('student_group', selectedGroup.value);
    formData.append('evaluation_component', selectedComponent.value);

    const response = await fetch(
      '/api/method/portal_app.api.grade_submission_api.download_class_list',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Frappe-CSRF-Token': window.csrf_token || '',
          'Accept': 'application/json',
        },
        body: formData.toString(),
        credentials: 'same-origin',
      },
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    const { filename, content } = json.message;

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'notes.csv';
    link.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    error.value = err.message;
  }
}

async function importCsv(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  csvImporting.value = true;
  csvImportError.value = null;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const csvContent = e.target.result;
      const formData = new URLSearchParams();
      formData.append('course', courseId.value);
      formData.append('student_group', selectedGroup.value);
      formData.append('evaluation_component', selectedComponent.value);
      formData.append('csv_content', csvContent);
      formData.append('action', 'save_draft');

      const response = await fetch(
        '/api/method/portal_app.api.grade_submission_api.import_grades_from_csv',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Frappe-CSRF-Token': window.csrf_token || '',
            'Accept': 'application/json',
          },
          body: formData.toString(),
          credentials: 'same-origin',
        },
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      const result = json.message;

      if (!result.ok) {
        csvImportError.value = result.errors.join('\n');
      } else {
        await loadClassList();
        await loadSubmissions();
      }
    } catch (err) {
      csvImportError.value = err.message;
    } finally {
      csvImporting.value = false;
      event.target.value = '';
    }
  };
  reader.readAsText(file, 'UTF-8');
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-ln-gray-900">Soumettre les notes</h1>
      <p class="text-lg text-ln-gray-700 mt-1">{{ courseName }}</p>

      <!-- Deadline -->
      <div v-if="deadline" class="flex items-center gap-2 mt-3">
        <Clock class="w-4 h-4" :class="isDeadlinePassed ? 'text-ln-error' : 'text-ln-gray-500'" />
        <span class="text-sm" :class="isDeadlinePassed ? 'text-ln-error font-medium' : 'text-ln-gray-600'">
          Date limite : {{ deadlineFormatted }}
          <span v-if="isDeadlinePassed" class="ml-1">(dépassée)</span>
        </span>
      </div>
    </div>

    <!-- Sélection groupe et composante (DEC-INSTR-03) -->
    <div v-if="groupsLoading">
      <BlockSkeleton :lines="2" />
    </div>
    <BlockError
      v-else-if="groupsError"
      title="Impossible de charger les groupes"
      :message="groupsError"
      :retry="loadGroups"
    />
    <Card v-else-if="groups.length === 0" class="py-8">
      <EmptyState label="Vous n'enseignez aucun groupe pour ce module" />
    </Card>
    <Card v-else title="Sélection">
      <div class="flex flex-wrap gap-4 items-end">
        <div class="flex-1 min-w-[200px]">
          <label class="block text-xs font-semibold text-ln-gray-600 uppercase mb-1">Groupe</label>
          <select
            v-model="selectedGroup"
            class="w-full border border-ln-gray-200 rounded-md-ln py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
            @change="loadClassList"
          >
            <option value="">— Choisir un groupe —</option>
            <option v-for="g in groups" :key="g.name" :value="g.name">
              {{ g.label }} ({{ g.student_count }} étudiants)
            </option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-ln-gray-600 uppercase mb-1">Composante</label>
          <select
            v-model="selectedComponent"
            class="border border-ln-gray-200 rounded-md-ln py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
            @change="loadClassList"
          >
            <option v-for="c in EVALUATION_COMPONENTS" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
      </div>
    </Card>

    <!-- Error liste de classe -->
    <BlockError
      v-if="error"
      title="Erreur"
      :message="error"
    />

    <!-- Loading liste de classe -->
    <div v-if="loading" class="space-y-4">
      <BlockSkeleton :lines="10" />
    </div>

    <!-- Formulaire (visible quand groupe sélectionné et étudiants chargés) -->
    <div v-else-if="selectedGroup && students.length > 0" class="space-y-6">
      <Card>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-ln-gray-200">
                <th class="text-left py-3 px-4 text-xs font-semibold text-ln-gray-600 uppercase">Étudiant</th>
                <th class="text-left py-3 px-4 text-xs font-semibold text-ln-gray-600 uppercase">ID</th>
                <th class="text-center py-3 px-4 text-xs font-semibold text-ln-gray-600 uppercase w-32">Note /20</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="student in students"
                :key="student.student_id"
                class="border-b border-ln-gray-100 last:border-0"
              >
                <td class="py-3 px-4">
                  <div class="font-medium text-ln-gray-900">{{ student.student_name }}</div>
                </td>
                <td class="py-3 px-4 text-sm text-ln-gray-500">{{ student.student_id }}</td>
                <td class="py-3 px-4">
                  <input
                    v-model="grades[student.student_id]"
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    :disabled="isDeadlinePassed"
                    class="w-full text-center border border-ln-gray-200 rounded-md-ln py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 focus:border-ln-blue-500 disabled:bg-ln-gray-100 disabled:cursor-not-allowed"
                    placeholder="—"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <!-- Actions -->
      <div class="flex flex-wrap items-center gap-3">
        <button
          type="button"
          :disabled="saving || !hasDraftData || isDeadlinePassed"
          class="inline-flex items-center gap-2 px-4 py-2 border border-ln-gray-200 rounded-md-ln text-sm font-medium text-ln-gray-700 hover:bg-ln-gray-50 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="saveDraft"
        >
          <Save class="w-4 h-4" />
          <span v-if="saving">Enregistrement...</span>
          <span v-else>Enregistrer le brouillon</span>
        </button>

        <button
          type="button"
          :disabled="submitting || !canSubmit || isDeadlinePassed"
          class="inline-flex items-center gap-2 px-4 py-2 bg-ln-blue-900 text-white rounded-md-ln text-sm font-medium hover:bg-ln-blue-700 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="submitGrades"
        >
          <Send class="w-4 h-4" />
          <span v-if="submitting">Soumission...</span>
          <span v-else>Soumettre les notes</span>
        </button>

        <button
          type="button"
          class="inline-flex items-center gap-2 px-4 py-2 border border-ln-gray-200 rounded-md-ln text-sm font-medium text-ln-gray-700 hover:bg-ln-gray-50 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          @click="downloadCsv"
        >
          <Download class="w-4 h-4" />
          Télécharger CSV
        </button>

        <label class="inline-flex items-center gap-2 px-4 py-2 border border-ln-gray-200 rounded-md-ln text-sm font-medium text-ln-gray-700 hover:bg-ln-gray-50 focus:outline-none cursor-pointer">
          <Upload class="w-4 h-4" />
          <span v-if="csvImporting">Import en cours...</span>
          <span v-else>Importer CSV</span>
          <input
            type="file"
            accept=".csv"
            class="hidden"
            :disabled="csvImporting"
            @change="importCsv"
          />
        </label>

        <span v-if="isDeadlinePassed" class="flex items-center gap-1 text-sm text-ln-error">
          <AlertTriangle class="w-4 h-4" />
          La date limite est dépassée
        </span>
      </div>

      <!-- Erreurs import CSV -->
      <div v-if="csvImportError" class="p-3 bg-red-50 border border-red-200 rounded-md-ln text-sm text-red-700">
        <p class="font-medium mb-1">Erreurs d'import :</p>
        <pre class="text-xs whitespace-pre-wrap">{{ csvImportError }}</pre>
      </div>
    </div>

    <!-- Mes soumissions -->
    <Card title="Mes soumissions" v-if="submissions.length > 0">
      <div class="space-y-3">
        <div
          v-for="sub in submissions"
          :key="sub.name"
          class="flex items-center justify-between py-3 px-4 border border-ln-gray-200 rounded-md-ln"
        >
          <div class="flex items-center gap-3">
            <CheckCircle v-if="sub.status === 'Soumise'" class="w-5 h-5 text-ln-success" />
            <Save v-else class="w-5 h-5 text-ln-gray-400" />
            <div>
              <div class="font-medium text-ln-gray-900">
                {{ sub.evaluation_component }} — {{ sub.status }}
              </div>
              <div class="text-xs text-ln-gray-500">
                {{ sub.student_group }} · {{ sub.student_count }} étudiants
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <StatusBadge
              :status="sub.status === 'Soumise' ? 'validated' : 'pending'"
              :label="sub.status"
            />
            <button
              v-if="sub.status === 'Soumise' || sub.status === 'Approuvée'"
              type="button"
              class="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-ln-gray-200 rounded-md text-ln-gray-600 hover:bg-ln-gray-50"
              @click="openModModal(sub)"
            >
              <FilePen class="w-3.5 h-3.5" />
              Demander modification
            </button>
          </div>
        </div>
      </div>
    </Card>

    <!-- Demandes de modification en cours -->
    <Card title="Demandes de modification" v-if="modRequests.length > 0">
      <div class="space-y-2">
        <div
          v-for="req in modRequests"
          :key="req.name"
          class="flex items-center justify-between py-2 px-3 bg-ln-gray-50 rounded-md-ln text-sm"
        >
          <div>
            <span class="font-medium text-ln-gray-900">{{ req.student_name }}</span>
            <span class="text-ln-gray-500 ml-2">
              {{ req.evaluation_component }} · {{ req.current_grade }}/20 → {{ req.requested_grade }}/20
            </span>
          </div>
          <StatusBadge
            :status="req.status === 'Approuvée' ? 'success' : req.status === 'Refusée' ? 'error' : 'pending'"
            :label="req.status"
          />
        </div>
      </div>
    </Card>

    <!-- Modal modification de note -->
    <GradeModificationModal
      :is-open="showModModal"
      :course-id="courseId"
      :submission="modTarget"
      @close="showModModal = false"
      @submitted="onModSubmitted"
    />
  </div>
</template>
