<script setup>
// PlanningInstructorPage — Recherche planning collègues (Zone A lecture)
// NRM-001/002/003/004/005/006 — Recherche enseignants + planning
// Réf : D10-NRM-Enseignant.md §2, U03 §8.8
import { ref, watch } from 'vue';
import { Search, Calendar } from 'lucide-vue-next';
import Card from '@/components/ui/Card.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import BlockError from '@/components/ui/BlockError.vue';
import PlanningEntry from '@/components/ui/PlanningEntry.vue';

const searchQuery = ref('');
const searchResults = ref([]);
const selectedInstructor = ref(null);
const planning = ref([]);
const loading = ref(false);
const error = ref(null);
const minChars = 3;

// Recherche avec debounce simple
let debounceTimer = null;
watch(searchQuery, (newVal) => {
  clearTimeout(debounceTimer);
  if (newVal.length >= minChars) {
    debounceTimer = setTimeout(() => searchInstructors(newVal), 300);
  } else {
    searchResults.value = [];
  }
});

async function searchInstructors(query) {
  loading.value = true;
  error.value = null;
  try {
    const formData = new URLSearchParams();
    formData.append('query', query);

    const response = await fetch(
      '/api/method/portal_app.api.instructor_api.search_instructors',
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
    searchResults.value = json.message?.instructors || [];
  } catch (err) {
    error.value = err.message;
    searchResults.value = [];
  } finally {
    loading.value = false;
  }
}

async function selectInstructor(instructor) {
  selectedInstructor.value = instructor;
  searchResults.value = [];
  searchQuery.value = instructor.instructor_name;
  await loadPlanning(instructor.name);
}

async function loadPlanning(instructorName) {
  loading.value = true;
  error.value = null;
  try {
    const formData = new URLSearchParams();
    formData.append('instructor', instructorName);

    const response = await fetch(
      '/api/method/portal_app.api.instructor_api.get_instructor_planning_by_name',
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
    planning.value = json.message?.sessions || [];
  } catch (err) {
    error.value = err.message;
    planning.value = [];
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-ln-gray-900">Planning des collègues</h1>
      <p class="text-sm text-ln-gray-600 mt-1">
        Recherchez un enseignant pour consulter son planning (lecture seule)
      </p>
    </div>

    <!-- Search -->
    <Card>
      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ln-gray-500" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Nom de l'enseignant (min. 3 caractères)..."
          class="w-full pl-10 pr-4 py-3 border border-ln-gray-200 rounded-md-ln text-sm focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 focus:border-ln-blue-500"
        />
      </div>

      <!-- Résultats recherche -->
      <div v-if="loading && !selectedInstructor" class="mt-4">
        <BlockSkeleton :lines="3" />
      </div>

      <div v-else-if="error && !selectedInstructor" class="mt-4">
        <BlockError title="Erreur de recherche" :message="error" />
      </div>

      <div v-else-if="searchResults.length > 0" class="mt-4 space-y-2">
        <button
          v-for="instructor in searchResults"
          :key="instructor.name"
          class="w-full text-left px-4 py-3 rounded-md-ln border border-ln-gray-200 hover:border-ln-blue-500 hover:bg-ln-blue-50 transition-colors flex items-center justify-between"
          @click="selectInstructor(instructor)"
        >
          <div>
            <div class="font-medium text-ln-gray-900">{{ instructor.instructor_name }}</div>
            <div class="text-xs text-ln-gray-500">{{ instructor.department || 'Sans département' }}</div>
          </div>
          <Calendar class="w-4 h-4 text-ln-blue-600" />
        </button>
      </div>

      <div v-else-if="searchQuery.length >= minChars && !loading && !selectedInstructor" class="mt-4 text-center py-4">
        <EmptyState label="Aucun enseignant trouvé" />
      </div>
    </Card>

    <!-- Planning sélectionné -->
    <div v-if="selectedInstructor">
      <h2 class="text-lg font-semibold text-ln-gray-900 mb-4">
        Planning de {{ selectedInstructor.instructor_name }}
      </h2>

      <div v-if="loading" class="space-y-3">
        <BlockSkeleton v-for="i in 3" :key="i" :lines="2" />
      </div>

      <div v-else-if="error" class="space-y-3">
        <BlockError title="Erreur de chargement" :message="error" />
      </div>

      <div v-else-if="planning.length === 0" class="text-center py-8">
        <EmptyState label="Aucune séance planifiée sur la période" />
      </div>

      <div v-else class="space-y-3">
        <Card v-for="session in planning" :key="session.name" padding="sm">
          <PlanningEntry :session="session" />
        </Card>
      </div>
    </div>
  </div>
</template>
