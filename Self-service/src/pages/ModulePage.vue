<script setup>
// ModulePage — le module de l'enseignant (MANDAT-14, E-M10 ; ajout de la MOA à la PC1B, P26 ; validée à la PC1C).
// Depuis « Mes modules » : le planning du module (tous groupes, l'enseignant de chaque séance) et les enseignants du
// module ; le nom d'un collègue ouvre son planning (« Planning des collègues », lecture existante). La page lit
// `instructor_api.get_my_course(course)`, ouverte au seul enseignant affecté au module ; les séances sont celles que
// lit le planning d'un collègue (P28 : une seule sélection au serveur) et les comptes sont ceux des séances rendues.
// P27 : la barre du haut porte le nom du module.
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { AlertCircle, ArrowLeft, CalendarDays, Users } from 'lucide-vue-next';
import { callApi, plural } from '@/composables/useDemarche';
import { setPageTitle } from '@/composables/usePageTitle';

const route = useRoute();
const router = useRouter();
const data = ref(null);
const loading = ref(false);
const error = ref('');
const vue = computed(() => (route.query.onglet === 'enseignants' ? 'enseignants' : 'planning'));

onMounted(async () => {
  loading.value = true;
  try {
    data.value = await callApi('portal_app.api.academic.instructor_api.get_my_course', { course: route.params.course });
    setPageTitle(route.path, data.value?.course_name);
  } catch (err) {
    error.value = err.message || 'Impossible de charger ce module.';
  } finally {
    loading.value = false;
  }
});

const ACTIVITES = { CM: 'Cours magistral', TD: 'Travaux dirigés', TP: 'Travaux pratiques' };
// Le statut d'une SÉANCE (valeurs du serveur : Planifié, Confirmé, Annulé, Réalisé), accordé au féminin.
const STATUTS = { Planifié: 'Planifiée', Confirmé: 'Confirmée', Annulé: 'Annulée', Réalisé: 'Réalisée' };
// P16 : « 1er » le premier du mois ; heures « 8 h 00 » ; « A, B et C ».
const premier = (t) => t.replace(/(^|\s)1 /, '$11er ');
const jour = (iso) => premier(new Date(`${iso}T12:00:00`)
  .toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }));
const heure = (t) => { const [h, m] = (t || '').split(':'); return h ? `${Number(h)} h ${m}` : ''; };
const liste = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} et ${xs[xs.length - 1]}`);
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const lundi = (date) => { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; };

const semaines = computed(() => {
  const out = [];
  for (const s of data.value?.sessions || []) {
    if (!s.date) continue;
    const l = lundi(s.date);
    const cle = iso(l);
    let sem = out.find((x) => x.cle === cle);
    if (!sem) {
      sem = { cle, titre: `Semaine du ${premier(l.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }))}`, seances: [] };
      out.push(sem);
    }
    sem.seances.push(s);
  }
  return out;
});
const repere = computed(() => {
  const d = data.value;
  if (!d) return '';
  const groupes = d.student_groups || [];
  return [d.ue_label, d.academic_term && `semestre ${d.academic_term}`,
    groupes.length && `${groupes.length > 1 ? 'groupes' : 'groupe'} ${liste(groupes)}`].filter(Boolean).join(' · ');
});

function choisir(v) { router.replace({ query: { ...route.query, onglet: v === 'planning' ? undefined : v } }); }
const planningDe = (ins) => ({ path: '/planning/search', query: { enseignant: ins } });
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-6 space-y-6">
    <RouterLink to="/modules" class="inline-flex items-center gap-1 text-sm text-ln-blue-800 hover:underline min-h-[44px]">
      <ArrowLeft class="w-4 h-4" aria-hidden="true" /> Mes modules
    </RouterLink>

    <header>
      <h1 class="text-2xl font-bold text-ln-gray-900">{{ data?.course_name || 'Module' }}</h1>
      <p v-if="repere" class="text-sm text-ln-gray-500 mt-1">{{ repere }}</p>
    </header>

    <div v-if="error" class="flex items-start gap-2 rounded-md border border-ln-error/30 bg-ln-error-bg p-3 text-sm text-ln-error" role="alert">
      <AlertCircle class="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" /><span>{{ error }}</span>
    </div>
    <p v-if="loading" class="text-sm text-ln-gray-500">Chargement…</p>

    <template v-if="data">
      <div class="flex gap-1 border-b border-ln-gray-200" role="tablist">
        <button v-for="o in [{ k: 'planning', l: 'Planning du module', i: CalendarDays }, { k: 'enseignants', l: 'Enseignants du module', i: Users }]"
                :key="o.k" type="button" role="tab" :aria-selected="vue === o.k" @click="choisir(o.k)"
                class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold min-h-[44px] -mb-px border-b-2"
                :class="vue === o.k ? 'border-ln-blue-800 text-ln-blue-800' : 'border-transparent text-ln-gray-600 hover:text-ln-gray-900'">
          <component :is="o.i" class="w-4 h-4" aria-hidden="true" /> {{ o.l }}
        </button>
      </div>

      <!-- Le planning du module : toutes les séances, tous groupes, chacune avec son enseignant. -->
      <section v-if="vue === 'planning'" class="space-y-5">
        <p v-if="!semaines.length" class="rounded-lg border border-ln-gray-200 bg-white p-6 text-center text-sm text-ln-gray-600">
          Aucune séance de ce module dans les six mois passés ni à venir.
        </p>
        <div v-for="sem in semaines" :key="sem.cle" class="rounded-lg border border-ln-gray-200 bg-white overflow-hidden">
          <h2 class="border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-2 text-sm font-semibold text-ln-gray-900">{{ sem.titre }}</h2>
          <ul class="divide-y divide-ln-gray-100">
            <li v-for="s in sem.seances" :key="s.name" class="flex flex-wrap items-start gap-x-4 gap-y-1 px-4 py-3"
                :class="s.is_mine ? 'bg-ln-blue-50/40' : ''">
              <span class="w-28 flex-shrink-0 text-sm font-semibold text-ln-gray-900">{{ jour(s.date) }}</span>
              <span class="w-32 flex-shrink-0 text-sm text-ln-gray-700">{{ heure(s.from_time) }} – {{ heure(s.to_time) }}</span>
              <span class="min-w-0 flex-1 text-sm text-ln-gray-900">
                <span class="font-medium">{{ ACTIVITES[s.activity] || s.activity || 'Séance' }}</span>
                <template v-for="x in [s.student_group, s.room].filter(Boolean)" :key="x"> · {{ x }}</template>
                <span class="block text-ln-gray-600">
                  <template v-if="s.is_mine">Vous</template>
                  <RouterLink v-else-if="s.instructor" :to="planningDe(s.instructor)" class="text-ln-blue-800 hover:underline">{{ s.instructor_name }}</RouterLink>
                  <template v-else>Enseignant non affecté</template>
                </span>
              </span>
              <span v-if="s.status" class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
                    :class="s.status === 'Réalisé' || s.status === 'Annulé' ? 'border-ln-gray-300 text-ln-gray-600' : 'border-ln-blue-200 text-ln-blue-800'">
                {{ STATUTS[s.status] || s.status }}
              </span>
            </li>
          </ul>
        </div>
      </section>

      <!-- Les enseignants du module ; le nom d'un collègue ouvre son planning (lecture existante). -->
      <section v-else class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <article v-for="e in data.instructors" :key="e.instructor" class="rounded-lg border border-ln-gray-200 bg-white p-4 flex flex-col gap-2">
          <h2 class="text-base font-semibold text-ln-gray-900">
            {{ e.instructor_name }} <span v-if="e.is_me" class="text-sm font-normal text-ln-gray-500">(vous)</span>
          </h2>
          <p v-if="e.activities.length" class="text-sm text-ln-gray-700">{{ e.activities.map((a) => ACTIVITES[a] || a).join(', ') }}</p>
          <p v-if="e.student_groups.length" class="text-sm text-ln-gray-600">
            {{ e.student_groups.length > 1 ? 'Groupes' : 'Groupe' }} {{ liste(e.student_groups) }}
          </p>
          <p class="text-sm text-ln-gray-600">{{ plural(e.sessions_done, 'séance faite', 'séances faites') }} sur {{ e.sessions_total }}</p>
          <RouterLink :to="e.is_me ? '/planning' : planningDe(e.instructor)"
                      class="mt-auto inline-flex items-center gap-1 self-start text-sm font-semibold text-ln-blue-800 hover:underline min-h-[44px]">
            {{ e.is_me ? 'Mon planning' : 'Voir son planning' }} →
          </RouterLink>
        </article>
      </section>
    </template>
  </div>
</template>
