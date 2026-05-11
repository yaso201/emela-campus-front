<script setup>
// HeuresPage — Heures effectuées par période (Zone A lecture)
// NRM-039/040/041/042 — Sélection période et calcul total
// Réf : D10-NRM-Enseignant.md §2.5
import { ref, onMounted, watch } from 'vue';
import { Clock, Calendar, ChevronLeft, ChevronRight } from 'lucide-vue-next';
import Card from '@/components/ui/Card.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import BlockError from '@/components/ui/BlockError.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import { toLocalIsoDate } from '@/utils/planning';

const periods = [
  { value: 'week', label: 'Semaine' },
  { value: 'month', label: 'Mois' },
  { value: 'year', label: 'Année' },
];

const selectedPeriod = ref('month');
const referenceDate = ref(toLocalIsoDate(new Date()));
const hours = ref(null);
const sessions = ref([]);
const loading = ref(true);
const error = ref(null);

onMounted(() => {
  loadHours();
});

watch([selectedPeriod, referenceDate], () => {
  loadHours();
});

async function loadHours() {
  loading.value = true;
  error.value = null;
  try {
    const formData = new URLSearchParams();
    formData.append('period', selectedPeriod.value);
    formData.append('reference_date', referenceDate.value);

    const response = await fetch(
      '/api/method/portal_app.api.instructor_api.get_instructor_hours',
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
    hours.value = json.message;
    sessions.value = json.message?.details || [];
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

function navigatePeriod(direction) {
  const date = new Date(referenceDate.value);
  if (selectedPeriod.value === 'week') {
    date.setDate(date.getDate() + (direction * 7));
  } else if (selectedPeriod.value === 'month') {
    date.setMonth(date.getMonth() + direction);
  } else if (selectedPeriod.value === 'year') {
    date.setFullYear(date.getFullYear() + direction);
  }
  referenceDate.value = toLocalIsoDate(date);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

function formatTime(timeStr) {
  if (!timeStr) return '--:--';
  return timeStr.slice(0, 5);
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-ln-gray-900">Mes heures</h1>
      <p class="text-sm text-ln-gray-600 mt-1">
        Suivi de mes heures d'enseignement par période
      </p>
    </div>

    <!-- Contrôles période -->
    <Card>
      <div class="flex flex-wrap items-center gap-4">
        <!-- Sélecteur période -->
        <div class="flex rounded-md-ln border border-ln-gray-200 overflow-hidden">
          <button
            v-for="period in periods"
            :key="period.value"
            type="button"
            class="px-4 py-2 text-sm font-medium transition-colors"
            :class="selectedPeriod === period.value 
              ? 'bg-ln-blue-600 text-white' 
              : 'bg-white text-ln-gray-700 hover:bg-ln-gray-50'"
            @click="selectedPeriod = period.value"
          >
            {{ period.label }}
          </button>
        </div>

        <!-- Navigation -->
        <div class="flex items-center gap-2 ml-auto">
          <button
            type="button"
            class="p-2 rounded-md-ln border border-ln-gray-200 hover:bg-ln-gray-50 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
            @click="navigatePeriod(-1)"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <span class="text-sm font-medium text-ln-gray-900 min-w-[120px] text-center">
            {{ hours?.period_label || '...' }}
          </span>
          <button
            type="button"
            class="p-2 rounded-md-ln border border-ln-gray-200 hover:bg-ln-gray-50 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
            @click="navigatePeriod(1)"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>

    <!-- Loading -->
    <div v-if="loading" class="grid md:grid-cols-3 gap-4">
      <BlockSkeleton v-for="i in 3" :key="i" :lines="2" />
    </div>

    <!-- Error -->
    <BlockError
      v-else-if="error"
      title="Impossible de charger les heures"
      :message="error"
      :retry="loadHours"
    />

    <!-- Heures -->
    <div v-else-if="hours" class="space-y-6">
      <!-- Résumé -->
      <div class="grid md:grid-cols-3 gap-4">
        <Card class="bg-ln-blue-50 border-ln-blue-200">
          <div class="flex items-center gap-3">
            <Clock class="w-8 h-8 text-ln-blue-600" />
            <div>
              <div class="text-2xl font-bold text-ln-blue-900">{{ hours?.total_hours?.toFixed(1) ?? '0.0' }}h</div>
              <div class="text-xs text-ln-blue-600">Total heures</div>
            </div>
          </div>
        </Card>

        <Card>
          <div class="flex items-center gap-3">
            <Calendar class="w-8 h-8 text-ln-gray-400" />
            <div>
              <div class="text-2xl font-bold text-ln-gray-900">{{ hours?.session_count ?? 0 }}</div>
              <div class="text-xs text-ln-gray-500">Séances</div>
            </div>
          </div>
        </Card>

        <Card>
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-ln-success-bg flex items-center justify-center">
              <span class="text-ln-success font-bold">≈</span>
            </div>
            <div>
              <div class="text-2xl font-bold text-ln-gray-900">
                {{ ((hours?.total_hours ?? 0) / (hours?.session_count || 1)).toFixed(1) }}h
              </div>
              <div class="text-xs text-ln-gray-500">Moyenne/séance</div>
            </div>
          </div>
        </Card>
      </div>

      <!-- Liste des séances -->
      <Card title="Détail des séances">
        <div v-if="sessions.length === 0" class="py-8">
          <EmptyState label="Aucune séance sur cette période" />
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="session in sessions"
            :key="session.name"
            class="flex items-center justify-between py-3 px-4 border border-ln-gray-200 rounded-md-ln hover:bg-ln-gray-50 transition-colors"
          >
            <div>
              <div class="font-medium text-ln-gray-900">{{ session.course_name }}</div>
              <div class="text-xs text-ln-gray-500">
                {{ formatDate(session.date) }} · {{ session.student_group }}
              </div>
            </div>
            <div class="text-right">
              <div class="font-medium text-ln-gray-900">
                {{ formatTime(session.from_time) }} – {{ formatTime(session.to_time) }}
              </div>
              <div class="text-xs text-ln-gray-500">{{ session.duration_hours }}h</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>
