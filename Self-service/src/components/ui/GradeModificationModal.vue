<script setup>
// GradeModificationModal — Demande de modification de note (DEC-INSTR-05)
// Réf : D10-NRM-Enseignant.md §4, F-NRM-008/F-NRM-010
import { ref, computed, watch } from 'vue';
import { X, AlertCircle } from 'lucide-vue-next';

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  courseId: { type: String, required: true },
  submission: { type: Object, default: null }, // {student_group, evaluation_component, ...}
});

const emit = defineEmits(['close', 'submitted']);

const students = ref([]);
const selectedStudent = ref('');
const currentGrade = ref('');
const requestedGrade = ref('');
const reason = ref('');
const loading = ref(false);
const rosterLoading = ref(false);
const error = ref('');

const currentGradeDisplay = computed(() => {
  if (!selectedStudent.value) return '—';
  const s = students.value.find((s) => s.student_id === selectedStudent.value);
  const g = s?.proposed_grade;
  return g !== '' && g !== null && g !== undefined ? `${g}/20` : 'Non saisie';
});

const reasonValid = computed(() => reason.value.trim().length >= 20);

const canSubmit = computed(() => {
  const grade = parseFloat(requestedGrade.value);
  return (
    selectedStudent.value &&
    !isNaN(grade) && grade >= 0 && grade <= 20 &&
    reasonValid.value &&
    !loading.value
  );
});

watch(() => props.isOpen, async (open) => {
  if (!open) { resetForm(); return; }
  if (props.submission) await loadRoster();
});

async function loadRoster() {
  if (!props.submission) return;
  rosterLoading.value = true;
  error.value = '';
  try {
    const formData = new URLSearchParams();
    formData.append('course', props.courseId);
    formData.append('student_group', props.submission.student_group);
    formData.append('evaluation_component', props.submission.evaluation_component);

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
    students.value = json.message?.students || [];
  } catch (e) {
    error.value = e.message;
  } finally {
    rosterLoading.value = false;
  }
}

async function submit() {
  error.value = '';
  const student = students.value.find((s) => s.student_id === selectedStudent.value);
  loading.value = true;
  try {
    const formData = new URLSearchParams();
    formData.append('student', selectedStudent.value);
    formData.append('course', props.courseId);
    formData.append('evaluation_component', props.submission?.evaluation_component || '');
    formData.append('current_grade', student?.proposed_grade ?? '');
    formData.append('requested_grade', requestedGrade.value);
    formData.append('reason', reason.value.trim());
    formData.append('case_type', 'Correction');

    const response = await fetch(
      '/api/method/portal_app.api.grade_modification_api.create_grade_modification_request',
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

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.exc) {
      const msg = data._server_messages || data.exception || data.exc || 'Erreur lors de la soumission.';
      throw new Error(String(msg).replace(/^\["|"\]$/g, ''));
    }

    emit('submitted', data.message);
    emit('close');
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  students.value = [];
  selectedStudent.value = '';
  currentGrade.value = '';
  requestedGrade.value = '';
  reason.value = '';
  error.value = '';
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/50" @click="$emit('close')" />

      <!-- Panel -->
      <div class="relative bg-white rounded-xl shadow-xl w-full max-w-lg">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-ln-gray-200">
          <h2 class="text-lg font-semibold text-ln-gray-900">Demander une modification de note</h2>
          <button
            type="button"
            class="p-1.5 text-ln-gray-400 hover:text-ln-gray-600 rounded-md"
            @click="$emit('close')"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Body -->
        <div class="px-6 py-5 space-y-4">
          <p v-if="submission" class="text-sm text-ln-gray-600">
            Soumission : <strong>{{ submission.evaluation_component }}</strong>
            · {{ submission.student_group }}
          </p>

          <!-- Chargement roster -->
          <div v-if="rosterLoading" class="text-sm text-ln-gray-500 py-2">
            Chargement des étudiants…
          </div>

          <template v-else>
            <!-- Étudiant -->
            <div>
              <label class="block text-sm font-medium text-ln-gray-700 mb-1.5">Étudiant</label>
              <select
                v-model="selectedStudent"
                class="w-full border border-ln-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
              >
                <option value="">— Choisir un étudiant —</option>
                <option v-for="s in students" :key="s.student_id" :value="s.student_id">
                  {{ s.student_name }} ({{ s.student_id }})
                </option>
              </select>
            </div>

            <!-- Note actuelle -->
            <div>
              <label class="block text-sm font-medium text-ln-gray-700 mb-1.5">Note actuelle</label>
              <div class="px-3 py-2 border border-ln-gray-200 rounded-lg bg-ln-gray-50 text-sm text-ln-gray-700">
                {{ currentGradeDisplay }}
              </div>
            </div>

            <!-- Note demandée -->
            <div>
              <label class="block text-sm font-medium text-ln-gray-700 mb-1.5">Note demandée</label>
              <input
                v-model="requestedGrade"
                type="number"
                min="0"
                max="20"
                step="0.5"
                placeholder="Ex : 14.5"
                class="w-full border border-ln-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
              />
            </div>

            <!-- Motif -->
            <div>
              <label class="block text-sm font-medium text-ln-gray-700 mb-1.5">
                Motif
                <span class="text-ln-gray-400 font-normal">(20 caractères minimum)</span>
              </label>
              <textarea
                v-model="reason"
                rows="3"
                placeholder="Décrivez la raison de la demande de modification…"
                class="w-full border border-ln-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 resize-none"
                :class="reason && !reasonValid ? 'border-ln-warning' : ''"
              />
              <p class="mt-1 text-xs text-ln-gray-400">
                {{ reason.trim().length }} / 20 caractères minimum
              </p>
            </div>
          </template>

          <!-- Erreur -->
          <div
            v-if="error"
            class="p-3 rounded-lg text-sm flex items-start gap-2 bg-red-50 text-red-700"
          >
            <AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{{ error }}</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-ln-gray-200">
          <button
            type="button"
            class="px-4 py-2 text-sm border border-ln-gray-200 rounded-lg text-ln-gray-600 hover:bg-ln-gray-50"
            @click="$emit('close')"
          >
            Annuler
          </button>
          <button
            type="button"
            :disabled="!canSubmit"
            class="px-4 py-2 text-sm bg-ln-blue-800 text-white rounded-lg hover:bg-ln-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            @click="submit"
          >
            {{ loading ? 'Soumission…' : 'Soumettre la demande' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
