<script setup>
/**
 * ExamsBlock — Prochains examens dans les 14 jours
 * Référence : U07 §4.2, DEC-124, T03 F-portal-3
 * Profil : étudiant uniquement
 * 
 * Backend : portal_app.api.cockpit.get_upcoming_exams
 * Contrat API : { exams: [...] } avec horizon 14j, max 5 résultats
 */
import { computed } from 'vue';
import { useFrappeCall } from '@/composables/useFrappeCall';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import BlockError from '@/components/ui/BlockError.vue';
import { GraduationCap, Clock, MapPin } from 'lucide-vue-next';

// Appel API — student_id résolu automatiquement depuis session (DEC-124)
const { data, loading, error, reload } = useFrappeCall(
  'portal_app.api.cockpit.get_upcoming_exams'
);

// Le bloc ne s'affiche que s'il y a des examens (D05 §5.1 — pas de bloc fantôme)
const exams = computed(() => data?.exams ?? []);
const hasExams = computed(() => exams.value.length > 0);

// Afficher le bloc uniquement si : loading, error, ou hasExams
const shouldDisplay = computed(() => loading.value || error.value || hasExams.value);

// Libellés des types d'épreuves — custom_session_type (DEC-124)
const typeLabels = {
  DS: 'DS',
  CC: 'CC',
  TP: 'TP',
  PRJ: 'Projet',
  Colle: 'Colle',
  EXM: 'Examen',
  ORAL: 'Oral',
  Soutenance: 'Soutenance',
};

// Couleurs des badges selon le type
const typeColors = {
  DS: 'bg-amber-100 text-amber-800',
  CC: 'bg-blue-100 text-blue-800',
  TP: 'bg-green-100 text-green-800',
  PRJ: 'bg-purple-100 text-purple-800',
  Colle: 'bg-pink-100 text-pink-800',
  EXM: 'bg-ln-error-bg text-ln-error',
  ORAL: 'bg-ln-blue-100 text-ln-blue-800',
  Soutenance: 'bg-ln-blue-100 text-ln-blue-800',
};

function formatTime(time) {
  if (!time) return '';
  return time.substring(0, 5); // "08:00:00" → "08:00"
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function getExamTypeClass(type) {
  return typeColors[type] || 'bg-ln-gray-100 text-ln-gray-700';
}
</script>

<template>
  <!-- 
    ExamsBlock — masqué si aucun examen (D05 §5.1)
    Ne s'affiche que si loading, error, ou hasExams
  -->
  <section v-if="shouldDisplay" class="flex flex-col gap-3">
    <h2 class="text-sm font-semibold text-ln-gray-900 flex items-center gap-2">
      <GraduationCap class="w-4 h-4" aria-hidden="true" />
      Mes prochains examens
    </h2>

    <!-- État chargement -->
    <BlockSkeleton v-if="loading" :lines="3" :show-title="false" />

    <!-- État erreur -->
    <BlockError
      v-else-if="error"
      title="Examens indisponibles"
      :message="error.message || 'Erreur réseau'"
      :retry="reload"
    />

    <!-- État data -->
    <div v-else-if="hasExams" class="flex flex-col gap-2">
      <div
        v-for="exam in exams"
        :key="exam.name"
        class="bg-white rounded-lg border border-ln-gray-200 p-3 flex flex-col gap-2"
      >
        <!-- Type de l'examen (badge) -->
        <span 
          class="text-[10px] font-semibold px-2 py-0.5 rounded self-start"
          :class="getExamTypeClass(exam.custom_session_type)"
        >
          {{ typeLabels[exam.custom_session_type] || exam.custom_session_type }}
        </span>

        <!-- Intitulé du cours -->
        <div class="text-sm font-medium text-ln-gray-900 leading-tight">
          {{ exam.course }}
        </div>

        <!-- Métadonnées : date, heure, salle -->
        <div class="flex flex-wrap gap-3 text-xs text-ln-gray-500">
          <span class="flex items-center gap-1">
            <Clock class="w-3.5 h-3.5" aria-hidden="true" />
            {{ formatDate(exam.schedule_date) }} · 
            {{ formatTime(exam.from_time) }}–{{ formatTime(exam.to_time) }}
          </span>
          <span v-if="exam.room" class="flex items-center gap-1">
            <MapPin class="w-3.5 h-3.5" aria-hidden="true" />
            {{ exam.room }}
          </span>
        </div>
      </div>

      <!-- Lien vers planning complet -->
      <router-link
        to="/planning"
        class="text-xs font-medium text-ln-blue-900 hover:text-ln-blue-700 mt-1"
      >
        Voir le planning complet →
      </router-link>
    </div>

    <!-- État vide explicite (ne devrait pas arriver car v-if shouldDisplay) -->
    <div
      v-else
      class="bg-white rounded-lg border border-ln-gray-200 p-4 text-sm text-ln-gray-500"
    >
      Aucun examen dans les 14 prochains jours.
    </div>
  </section>
</template>
