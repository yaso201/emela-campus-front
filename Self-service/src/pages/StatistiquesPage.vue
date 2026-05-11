<script setup>
// StatistiquesPage — Stats notes d'un module (Zone A lecture)
// NRM-036/037/038 — Moyenne, min, max, écart-type, distribution
// Réf : D10-NRM-Enseignant.md §2.4
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { BarChart3, Users, TrendingUp, TrendingDown, Sigma } from 'lucide-vue-next';
import Card from '@/components/ui/Card.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import BlockError from '@/components/ui/BlockError.vue';
import MetricCard from '@/components/ui/MetricCard.vue';

const route = useRoute();
const courseId = ref(route.params.course);
const stats = ref(null);
const loading = ref(true);
const error = ref(null);

onMounted(() => {
  loadStats();
});

async function loadStats() {
  loading.value = true;
  error.value = null;
  try {
    const formData = new URLSearchParams();
    formData.append('course', courseId.value);

    const response = await fetch(
      '/api/method/portal_app.api.instructor_api.get_grade_statistics',
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
    stats.value = json.message;
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
    <div>
      <h1 class="text-2xl font-bold text-ln-gray-900">
        {{ stats?.course_name || 'Statistiques du module' }}
      </h1>
      <p v-if="stats" class="text-sm text-ln-gray-600 mt-1">
        {{ stats.academic_term }} · {{ stats.student_count }} étudiants évalués
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <BlockSkeleton v-for="i in 4" :key="i" :lines="2" />
    </div>

    <!-- Error -->
    <BlockError
      v-else-if="error"
      title="Impossible de charger les statistiques"
      :message="error"
      :retry="loadStats"
    />

    <!-- Stats -->
    <div v-else-if="stats" class="space-y-6">
      <!-- Métriques clés -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon="average"
          :value="stats.average?.toFixed(2)"
          label="Moyenne"
          unit="/20"
        />
        <MetricCard
          icon="min"
          :value="stats.min"
          label="Minimum"
          unit="/20"
          variant="error"
        />
        <MetricCard
          icon="max"
          :value="stats.max"
          label="Maximum"
          unit="/20"
          variant="success"
        />
        <MetricCard
          icon="std"
          :value="stats.std_dev?.toFixed(2)"
          label="Écart-type"
        />
      </div>

      <!-- Détails -->
      <Card title="Taux de réussite">
          <div class="flex items-center justify-between py-2">
            <span class="text-sm text-ln-gray-600">Validé (≥10/20)</span>
            <span class="text-lg font-semibold text-ln-success">
              {{ stats.pass_rate?.toFixed(1) }}%
            </span>
          </div>
          <div class="flex items-center justify-between py-2 border-t border-ln-gray-100">
            <span class="text-sm text-ln-gray-600">Non validé</span>
            <span class="text-lg font-semibold text-ln-error">
              {{ (100 - (stats.pass_rate || 0)).toFixed(1) }}%
            </span>
          </div>
        </Card>
    </div>
  </div>
</template>
