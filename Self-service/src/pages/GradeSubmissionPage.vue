<script setup>
// GradeSubmissionPage — Soumission de notes (Zone B écriture)
// NRM-011 à NRM-020 — Soumission, brouillon, deadline
// Réf : D10-NRM-Enseignant.md §3
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { Download, Save, Send, AlertTriangle, Clock, CheckCircle } from 'lucide-vue-next';
import Card from '@/components/ui/Card.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import BlockError from '@/components/ui/BlockError.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';

const route = useRoute();
const courseId = ref(route.params.course);
const courseName = ref('');
const students = ref([]);
const grades = ref({});
const submissions = ref([]);
const deadline = ref(null);
const loading = ref(true);
const error = ref(null);
const saving = ref(false);
const submitting = ref(false);

onMounted(() => {
  loadData();
});

async function loadData() {
  loading.value = true;
  error.value = null;
  try {
    // Charger la liste des étudiants
    await loadClassList();
    // Charger les soumissions existantes
    await loadSubmissions();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function loadClassList() {
  const formData = new URLSearchParams();
  formData.append('course', courseId.value);

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
  const data = json.message;
  courseName.value = data.course_name;
  deadline.value = data.submission_deadline;
  students.value = data.students || [];
  // Initialiser les notes vides
  students.value.forEach((s) => {
    if (!grades.value[s.student_id]) {
      grades.value[s.student_id] = '';
    }
  });
}

async function loadSubmissions() {
  const formData = new URLSearchParams();
  formData.append('course', courseId.value);

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
  // Tous les étudiants doivent avoir une note
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

async function saveDraft() {
  saving.value = true;
  error.value = null;
  try {
    const formData = new URLSearchParams();
    formData.append('course', courseId.value);
    formData.append('action', 'save_draft');
    formData.append('grades', JSON.stringify(grades.value));

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
    formData.append('action', 'submit');
    formData.append('grades', JSON.stringify(grades.value));

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
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-ln-gray-900">Soumettre les notes</h1>
      <p class="text-lg text-ln-gray-700 mt-1">{{ courseName }}</p>
      
      <!-- Deadline -->
      <div class="flex items-center gap-2 mt-3">
        <Clock class="w-4 h-4" :class="isDeadlinePassed ? 'text-ln-error' : 'text-ln-gray-500'" />
        <span class="text-sm" :class="isDeadlinePassed ? 'text-ln-error font-medium' : 'text-ln-gray-600'">
          Date limite : {{ deadlineFormatted }}
          <span v-if="isDeadlinePassed" class="ml-1">(dépassée)</span>
        </span>
      </div>
    </div>

    <!-- Error -->
    <BlockError
      v-if="error"
      title="Erreur"
      :message="error"
    />

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <BlockSkeleton :lines="10" />
    </div>

    <!-- Formulaire -->
    <div v-else class="space-y-6">
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

        <span v-if="isDeadlinePassed" class="flex items-center gap-1 text-sm text-ln-error">
          <AlertTriangle class="w-4 h-4" />
          La date limite est dépassée
        </span>
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
              <CheckCircle v-if="sub.status === 'Submitted'" class="w-5 h-5 text-ln-success" />
              <Save v-else class="w-5 h-5 text-ln-gray-400" />
              <div>
                <div class="font-medium text-ln-gray-900">
                  {{ sub.evaluation_type }} — {{ sub.status === 'Submitted' ? 'Soumis' : 'Brouillon' }}
                </div>
                <div class="text-xs text-ln-gray-500">
                  {{ new Date(sub.submission_date).toLocaleDateString('fr-FR') }}
                  · {{ sub.student_count }} étudiants
                </div>
              </div>
            </div>
            <StatusBadge
              :status="sub.status === 'Submitted' ? 'validated' : 'pending'"
              :label="sub.status === 'Submitted' ? 'Soumis' : 'Brouillon'"
            />
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>
