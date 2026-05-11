<script setup>
// DossierEtudiantPage — Dossier étudiant lecture seule (Zone A)
// NRM-007/008/009/010 — Accès restreint, pas de données financières/RH
// Réf : D10-NRM-Enseignant.md §2.3
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { User, BookOpen, Award, AlertCircle } from 'lucide-vue-next';
import Card from '@/components/ui/Card.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import BlockError from '@/components/ui/BlockError.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';

const route = useRoute();
const studentId = ref(route.params.id);
const dossier = ref(null);
const loading = ref(true);
const error = ref(null);

onMounted(() => {
  loadDossier();
});

async function loadDossier() {
  loading.value = true;
  error.value = null;
  try {
    const formData = new URLSearchParams();
    formData.append('student', studentId.value);

    const response = await fetch(
      '/api/method/portal_app.api.instructor_api.get_student_dossier_for_instructor',
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
    dossier.value = json.message;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <div class="w-12 h-12 rounded-full bg-ln-blue-50 flex items-center justify-center">
        <User class="w-6 h-6 text-ln-blue-800" />
      </div>
      <div>
        <h1 class="text-2xl font-bold text-ln-gray-900">
          {{ dossier?.identity?.student_name || 'Dossier étudiant' }}
        </h1>
        <p v-if="dossier" class="text-sm text-ln-gray-600">
          {{ dossier.identity?.program }} · {{ dossier.identity?.academic_level }}
          · {{ dossier.identity?.student_group }}
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <BlockSkeleton :lines="6" />
    </div>

    <!-- Error -->
    <BlockError
      v-else-if="error"
      title="Impossible de charger le dossier"
      :message="error"
      :retry="loadDossier"
    />

    <!-- Dossier -->
    <div v-else-if="dossier" class="space-y-6">
      <!-- Modules inscrits -->
      <Card title="Modules inscrits">
        <div v-if="dossier.modules?.length === 0" class="py-4">
          <EmptyState label="Aucun module inscrit" />
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="mod in dossier.modules"
            :key="mod.course"
            class="flex items-center justify-between py-2 border-b border-ln-gray-100 last:border-0"
          >
            <div class="flex items-center gap-2">
              <BookOpen class="w-4 h-4 text-ln-gray-400" />
              <span class="text-sm text-ln-gray-900">{{ mod.course_name }}</span>
            </div>
          </div>
        </div>
      </Card>

      <!-- Résultats académiques -->
      <Card title="Résultats académiques">
        <div v-if="dossier.results?.length === 0" class="py-4">
          <div class="flex items-center gap-2 text-ln-warning">
            <AlertCircle class="w-5 h-5" />
            <span class="text-sm">
              Les résultats ne sont pas encore publiés (délibération en cours)
            </span>
          </div>
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="result in dossier.results"
            :key="result.ue"
            class="flex items-center justify-between py-3 px-4 bg-ln-gray-50 rounded-md-ln"
          >
            <div>
              <div class="font-medium text-ln-gray-900">{{ result.ue_name }}</div>
              <div class="text-xs text-ln-gray-500">{{ result.academic_term }}</div>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-lg font-semibold" :class="result.is_validated ? 'text-ln-success' : 'text-ln-error'">
                {{ result.ue_average }}/20
              </span>
              <StatusBadge
                :status="result.is_validated ? 'success' : 'error'"
                :label="result.is_validated ? 'Validé' : 'Non validé'"
              />
            </div>
          </div>
        </div>
      </Card>

      <!-- Statut académique -->
      <Card title="Statut académique">
        <div class="flex items-center justify-between">
          <span class="text-sm text-ln-gray-600">Statut actuel</span>
          <StatusBadge
            :status="dossier.academic_status === 'ACT' ? 'success' : 'warning'"
            :label="dossier.academic_status_label || dossier.academic_status"
          />
        </div>
      </Card>
    </div>
  </div>
</template>
