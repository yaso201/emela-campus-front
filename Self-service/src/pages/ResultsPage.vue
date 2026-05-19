<script setup>
// ResultsPage — résultats officiels (Flux 2) + notes temporaires (Flux 3).
//
// Section 1 : résultats officiels via portal_app.api.academic_results.get_published_results
//   → is_official=true, Deliberation Clôturée uniquement.
// Section 2 : notes temporaires via portal_app.api.on_course_grades.get_student_on_course_grades
//   → is_official=false, status="temporary", warning permanent visible.
//
// L'ancien endpoint legacy (teaching_eval) a été supprimé dans cette vague.
import { computed, watch } from 'vue';
import { useFrappeCall } from '@/composables/useFrappeCall';
import { useProfileStore } from '@/stores/profile';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import BlockError from '@/components/ui/BlockError.vue';
import SemesterBlock from '@/components/results/SemesterBlock.vue';

const profile = useProfileStore();

// ── Section 1 : résultats officiels ──────────────────────────────────
const officialResource = useFrappeCall(
  'portal_app.api.academic_results.get_published_results',
  {},
  { auto: false },
);

// ── Section 2 : notes temporaires ────────────────────────────────────
const temporaryResource = useFrappeCall(
  'portal_app.api.on_course_grades.get_student_on_course_grades',
  {},
  { auto: false },
);

watch(
  () => [profile.status, profile.profile],
  ([status, currentProfile]) => {
    if (status === 'loaded' && currentProfile === 'student') {
      officialResource.reload();
      temporaryResource.reload();
    }
  },
  { immediate: true },
);

// ── Computed — officiel ──────────────────────────────────────────────
const semesters = computed(() => officialResource.data?.semesters || []);
const pendingPublication = computed(() => Boolean(officialResource.data?.pending_publication));
const isStudent = computed(() => profile.profile === 'student');
const showProfileGuard = computed(() => !profile.isLoading && !profile.isGuest && !isStudent.value);

const showPendingState = computed(() =>
  !officialResource.loading
  && !officialResource.error
  && pendingPublication.value
  && semesters.value.length === 0
);
const showEmptyOfficial = computed(() =>
  !officialResource.loading
  && !officialResource.error
  && !pendingPublication.value
  && semesters.value.length === 0
);

// ── Computed — temporaire ────────────────────────────────────────────
const tempItems = computed(() => temporaryResource.data?.items || []);
const tempWarning = computed(() =>
  temporaryResource.data?.warning
  || 'Notes temporaires en attente de validation du jury semestriel ou annuel.'
);
const tempLabel = computed(() =>
  temporaryResource.data?.label || 'Suivi temporaire des notes'
);
// Section visible si étudiant chargé (même items vide), sauf erreur propre.
const showTempSection = computed(() =>
  isStudent.value && !profile.isLoading && !profile.isGuest
);

// ── Helpers ──────────────────────────────────────────────────────────
function formatNote(note) {
  if (note === null || note === undefined || Number.isNaN(Number(note))) {
    return '—';
  }
  return `${Number(note).toFixed(1).replace('.', ',')} /20`;
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <header>
      <h1 class="text-2xl font-bold text-ln-gray-900 mb-1">Résultats</h1>
      <p class="text-sm text-ln-gray-600">Consultation de vos résultats officiels et suivi temporaire des notes.</p>
    </header>

    <!-- Guard : profil non étudiant -->
    <div
      v-if="showProfileGuard"
      class="bg-white rounded-lg border border-ln-gray-200 p-6 text-center"
    >
      <h2 class="text-base font-semibold text-ln-gray-900">Résultats réservés aux étudiants</h2>
      <p class="text-sm text-ln-gray-600 mt-2">
        Cette page est accessible uniquement depuis un profil étudiant.
      </p>
    </div>

    <div v-else>
      <!-- Guard : guest -->
      <div v-if="profile.isGuest" class="bg-white rounded-lg border border-ln-gray-200 p-6 text-center">
        <h2 class="text-base font-semibold text-ln-gray-900">Connexion requise</h2>
        <p class="text-sm text-ln-gray-600 mt-2">
          Connectez-vous avec votre compte étudiant pour consulter vos résultats.
        </p>
      </div>

      <!-- Guard : loading profil -->
      <div v-else-if="profile.isLoading" class="grid gap-4">
        <BlockSkeleton :lines="5" :show-title="false" />
      </div>

      <div v-else class="flex flex-col gap-6">

        <!-- ════════════════════════════════════════════════════════════ -->
        <!-- SECTION 1 — Résultats officiels (Flux 2)                   -->
        <!-- ════════════════════════════════════════════════════════════ -->
        <section>
          <h2 class="text-lg font-semibold text-ln-gray-900 mb-3">Résultats officiels</h2>

          <div v-if="officialResource.loading" class="grid gap-4">
            <BlockSkeleton :lines="5" :show-title="false" />
            <BlockSkeleton :lines="4" :show-title="false" />
          </div>

          <BlockError
            v-else-if="officialResource.error"
            title="Résultats officiels indisponibles"
            :message="officialResource.error.message || 'Erreur réseau'"
            :retry="() => officialResource.reload()"
          />

          <div
            v-else-if="showPendingState"
            class="bg-white rounded-lg border border-ln-gray-200 p-6 text-center"
          >
            <h3 class="text-base font-semibold text-ln-gray-900">Résultats en attente</h3>
            <p class="text-sm text-ln-gray-600 mt-2">
              Résultats disponibles après délibération.
            </p>
          </div>

          <div
            v-else-if="showEmptyOfficial"
            class="bg-white rounded-lg border border-ln-gray-200 p-6 text-center"
          >
            <h3 class="text-base font-semibold text-ln-gray-900">Aucun résultat officiel</h3>
            <p class="text-sm text-ln-gray-600 mt-2">
              Vos semestres publiés apparaîtront ici dès leur mise à disposition.
            </p>
          </div>

          <!-- Semestres publiés -->
          <div v-else class="flex flex-col gap-6">
            <SemesterBlock
              v-for="semester in semesters"
              :key="`${semester.academic_year}-${semester.academic_term}`"
              :semester="semester"
            />
          </div>
        </section>

        <!-- ════════════════════════════════════════════════════════════ -->
        <!-- SECTION 2 — Notes temporaires (Flux 3 on-course)           -->
        <!-- ════════════════════════════════════════════════════════════ -->
        <section v-if="showTempSection">
          <h2 class="text-lg font-semibold text-ln-gray-900 mb-3">{{ tempLabel }}</h2>

          <!-- Warning permanent — toujours visible -->
          <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p class="text-sm text-amber-800 font-medium">
              ⚠ {{ tempWarning }}
            </p>
            <p class="text-xs text-amber-700 mt-1">
              Ces données n'ont aucune valeur officielle et ne constituent pas un relevé de notes.
            </p>
          </div>

          <div v-if="temporaryResource.loading">
            <BlockSkeleton :lines="3" :show-title="false" />
          </div>

          <BlockError
            v-else-if="temporaryResource.error"
            title="Notes temporaires indisponibles"
            :message="temporaryResource.error.message || 'Erreur réseau'"
            :retry="() => temporaryResource.reload()"
          />

          <div
            v-else-if="tempItems.length === 0"
            class="bg-white rounded-lg border border-ln-gray-200 p-5 text-center"
          >
            <p class="text-sm text-ln-gray-600">
              Aucune note temporaire disponible pour le moment.
            </p>
          </div>

          <div v-else class="bg-white rounded-lg border border-ln-gray-200 overflow-x-auto">
            <table class="min-w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th class="px-3 py-2 text-left text-[11px] font-semibold text-ln-gray-500 uppercase tracking-wider border-b border-ln-gray-200">Module</th>
                  <th class="px-3 py-2 text-left text-[11px] font-semibold text-ln-gray-500 uppercase tracking-wider border-b border-ln-gray-200">UE</th>
                  <th class="px-3 py-2 text-left text-[11px] font-semibold text-ln-gray-500 uppercase tracking-wider border-b border-ln-gray-200">Type</th>
                  <th class="px-3 py-2 text-left text-[11px] font-semibold text-ln-gray-500 uppercase tracking-wider border-b border-ln-gray-200">Note</th>
                  <th class="px-3 py-2 text-left text-[11px] font-semibold text-ln-gray-500 uppercase tracking-wider border-b border-ln-gray-200">Date</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, idx) in tempItems"
                  :key="item.source_name || item.grade_submission || `temp-${idx}`"
                  class="align-top"
                >
                  <td class="px-3 py-3 border-b border-ln-gray-100">
                    <div class="text-sm font-medium text-ln-gray-900">{{ item.course_name || '—' }}</div>
                  </td>
                  <td class="px-3 py-3 border-b border-ln-gray-100">
                    <div class="text-xs text-ln-gray-500">{{ item.ue_code || '—' }}</div>
                    <div class="text-xs text-ln-gray-500">{{ item.ue_name || '' }}</div>
                  </td>
                  <td class="px-3 py-3 border-b border-ln-gray-100 text-xs text-ln-gray-600">
                    {{ item.evaluation_component || '—' }}
                  </td>
                  <td class="px-3 py-3 border-b border-ln-gray-100 text-sm text-ln-gray-700 whitespace-nowrap">
                    {{ formatNote(item.grade) }}
                  </td>
                  <td class="px-3 py-3 border-b border-ln-gray-100 text-xs text-ln-gray-500 whitespace-nowrap">
                    {{ item.integrated_at ? item.integrated_at.substring(0, 10) : '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Lien Moodle -->
        <div class="bg-white rounded-lg border border-ln-gray-200 p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-sm font-semibold text-ln-gray-900">Activités Moodle</h2>
            <p class="text-sm text-ln-gray-600 mt-1">
              Pour les détails pédagogiques complémentaires, consultez Moodle.
            </p>
          </div>
          <a
            href="/app-emela/moodle-launch"
            class="inline-flex items-center justify-center gap-2 text-xs font-semibold text-white bg-ln-blue-900 hover:bg-ln-blue-700 px-5 py-2.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px]"
          >
            Voir sur Moodle
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M3 9L9 3M9 3H4M9 3v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
