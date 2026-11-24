<script setup>
// MesModulesPage — « Mes modules » de l'enseignant (MANDAT-14, E-M9 ; P7 du verdict PC1).
// Le chemin PERMANENT vers la saisie des notes (/modules/:course/submit, classe A) et les statistiques
// (/modules/:course/stats) : une entrée de menu, puis un clic. La page lit `instructor_api.list_my_courses()`
// (Q16, X7) : les modules du service de l'enseignant, avec leur identifiant.
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { AlertCircle, BarChart3, BookOpen, Clock3, FilePen } from 'lucide-vue-next';
import { callApi, plural } from '@/composables/useDemarche';

const data = ref(null);
const loading = ref(false);
const error = ref('');

// P16 : des pluriels accordés, sans « (s) » ; la date en clair, en minuscules, « 1er ».
const seances = (m) => `${plural(m.sessions_done, 'séance faite', 'séances faites')} sur ${m.sessions_total}`;
const notes = (m) => {
  const s = m.submissions.submitted;
  const faite = s === 0 ? 'aucune note soumise' : plural(s, 'note soumise', 'notes soumises');
  return m.submissions.pending ? `${faite} · ${m.submissions.pending} à soumettre` : faite;
};
const prochaine = (iso) => new Date(`${iso}T12:00:00`)
  .toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  .replace(/(^|\s)1 /, '$11er ');
const repere = (m) => [m.course, m.academic_term, (m.student_groups || []).join(', ')].filter(Boolean).join(' · ');

onMounted(async () => {
  loading.value = true;
  try { data.value = await callApi('portal_app.api.academic.instructor_api.list_my_courses'); }
  catch (err) { error.value = err.message || 'Impossible de charger vos modules.'; }
  finally { loading.value = false; }
});
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-6 space-y-6">
    <header>
      <h1 class="text-2xl font-bold text-ln-gray-900">Mes modules</h1>
      <p class="text-sm text-ln-gray-500 mt-1">Les modules de votre service : saisir et soumettre les notes, revenir sur une note soumise, voir les statistiques.</p>
    </header>
    <div v-if="error" class="flex items-start gap-2 rounded-md border border-ln-error/30 bg-ln-error-bg p-3 text-sm text-ln-error" role="alert">
      <AlertCircle class="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{{ error }}</span>
    </div>
    <p v-if="loading" class="text-sm text-ln-gray-500">Chargement…</p>
    <p v-else-if="data && !data.items.length"
       class="rounded-lg border border-ln-gray-200 bg-white p-6 text-center text-sm text-ln-gray-600">
      Aucun module dans votre service : aucune séance publiée à votre nom ces douze derniers mois ni à venir.
    </p>
    <div v-else-if="data" class="grid gap-4 md:grid-cols-2">
      <article v-for="m in data.items" :key="m.course" class="rounded-lg border border-ln-gray-200 bg-white p-4 flex flex-col gap-3">
        <div class="flex items-start gap-3">
          <BookOpen class="w-5 h-5 mt-0.5 text-ln-blue-800 flex-shrink-0" aria-hidden="true" />
          <div class="min-w-0">
            <h2 class="text-base font-semibold text-ln-gray-900">{{ m.course_name }}</h2>
            <p class="text-xs text-ln-gray-500">{{ repere(m) }}</p>
          </div>
        </div>
        <dl class="grid grid-cols-2 gap-2 text-sm">
          <div><dt class="text-ln-gray-500">Séances</dt><dd class="text-ln-gray-900">{{ seances(m) }}</dd></div>
          <div><dt class="text-ln-gray-500">Notes</dt><dd class="text-ln-gray-900">{{ notes(m) }}</dd></div>
        </dl>
        <p v-if="m.next_session" class="flex items-center gap-1 text-xs text-ln-gray-600">
          <Clock3 class="w-3.5 h-3.5" aria-hidden="true" /> Prochaine séance : {{ prochaine(m.next_session) }}
        </p>
        <div class="mt-auto flex flex-wrap gap-2">
          <RouterLink :to="`/modules/${encodeURIComponent(m.course)}/submit`"
                      class="inline-flex items-center gap-2 rounded-md bg-ln-blue-800 px-3 py-2 text-sm font-semibold text-white min-h-[44px]">
            <FilePen class="w-4 h-4" aria-hidden="true" /> Notes du module
          </RouterLink>
          <RouterLink :to="`/modules/${encodeURIComponent(m.course)}/stats`"
                      class="inline-flex items-center gap-2 rounded-md border border-ln-gray-300 px-3 py-2 text-sm font-medium text-ln-gray-700 min-h-[44px]">
            <BarChart3 class="w-4 h-4" aria-hidden="true" /> Statistiques
          </RouterLink>
        </div>
        <!-- E-M10 (P26, PC1C) : le planning du module, tous groupes, et ses enseignants. -->
        <div class="flex flex-wrap gap-x-4 gap-y-1 border-t border-ln-gray-100 pt-2 text-sm">
          <RouterLink :to="`/modules/${encodeURIComponent(m.course)}`"
                      class="font-semibold text-ln-blue-800 hover:underline min-h-[44px] inline-flex items-center">
            Planning du module
          </RouterLink>
          <RouterLink :to="{ path: `/modules/${encodeURIComponent(m.course)}`, query: { onglet: 'enseignants' } }"
                      class="font-semibold text-ln-blue-800 hover:underline min-h-[44px] inline-flex items-center">
            Enseignants du module
          </RouterLink>
        </div>
      </article>
    </div>
  </div>
</template>
