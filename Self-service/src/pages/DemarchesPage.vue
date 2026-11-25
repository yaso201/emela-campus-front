<script setup>
// DemarchesPage — « Mes démarches » (MANDAT-14, E-M1). Six cartes, une par procédure de l'étudiant, chacune nourrie
// par SA lecture `get_my_*` (P1) : le dossier le plus récent, son statut (le libellé du serveur), la prochaine action
// et son délai tels que le serveur les rend — ou « aucune démarche », et ce que l'étudiant peut ouvrir.
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { ArrowRight, CalendarClock, FileText, GraduationCap, LogOut, RefreshCw, Scale, Shuffle, UserX } from 'lucide-vue-next';
import { callApi, formatDate, leavePeriod, plural } from '@/composables/useDemarche';
import { useProfileStore } from '@/stores/profile';

const A = 'portal_app.api.academic.';
const CARTES = [
  { key: 'coa', titre: 'Congé académique', icone: CalendarClock, to: '/account/leave-requests',
    method: 'portal_app.api.academic_leave_request.get_my_coa_requests', items: 'items',
    ouvrir: 'Demander un congé', vide: 'Aucune demande de congé.' },
  { key: 'retour', titre: 'Retour de congé', icone: GraduationCap, to: '/demarches/retour-conge',
    method: A + 'leave_return.get_my_leave_return_requests', items: 'items',
    ouvrir: 'Demander mon retour', vide: 'Aucune demande de retour.' },
  { key: 'reo', titre: 'Réorientation', icone: Shuffle, to: '/demarches/reorientation',
    method: A + 'reorientation.get_my_reorientation_requests', items: 'items',
    ouvrir: 'Demander une réorientation', vide: 'Aucune demande de réorientation.' },
  { key: 'dem', titre: 'Démission', icone: LogOut, to: '/demarches/demission',
    method: A + 'resignation.get_my_resignation_requests', items: 'requests',
    ouvrir: 'Préparer une démission', vide: 'Aucune démission.' },
  { key: 'abd', titre: 'Abandon d’études', icone: UserX, to: '/demarches/abandon',
    method: A + 'abandonment.get_my_abandonment_findings', items: 'findings',
    ouvrir: null, vide: 'Aucune procédure d’abandon ne vous concerne.' },
  { key: 'dis', titre: 'Discipline', icone: Scale, to: '/demarches/discipline',
    method: A + 'discipline.get_my_disciplinary_cases', items: 'cases',
    ouvrir: null, vide: 'Aucune procédure disciplinaire ne vous concerne.' },
];

// DEC-366 (E-M11) : l'étudiant à accès réduit. Ses lectures des congés et des réorientations sont fermées (DEC-333,
// participation) : la carte du congé se nourrit de la demande de retour, qui rend le congé repris et sa période
// (VERDICT-MANDAT-14-PC1C §5, voie b) ; elle n'existe que pour l'étudiant en congé. La réorientation n'est pas montrée.
const profile = useProfileStore();
const CARTE_CONGE_REDUIT = { key: 'coaR', titre: 'Congé académique', icone: CalendarClock, to: '/demarches/retour-conge',
  method: A + 'leave_return.get_my_leave_return_requests', items: 'items', ouvrir: null, vide: 'Aucun congé en cours.',
  viaRetour: true };
const cartes = computed(() => (profile.profile === 'dossier'
  ? [...(profile.dossier?.academic_status === 'COA' ? [CARTE_CONGE_REDUIT] : []),
    ...CARTES.filter((c) => !['coa', 'reo'].includes(c.key))]
  : CARTES));

const reponses = ref({});
const erreurs = ref({});
const loading = ref(false);

async function load() {
  loading.value = true;
  await Promise.all(cartes.value.map(async (c) => {
    try {
      reponses.value[c.key] = await callApi(c.method);
      delete erreurs.value[c.key];
    } catch (err) {
      erreurs.value[c.key] = err.message || 'Lecture impossible.';
    }
  }));
  loading.value = false;
}
onMounted(load);

const LABELS = {
  submitCoaRequest: 'Soumettre la demande', cancelCoaRequest: 'Annuler la demande',
  submitLeaveReturnRequest: 'Soumettre la demande de retour', cancelLeaveReturnRequest: 'Annuler la demande de retour',
  submitReorientationRequest: 'Soumettre la demande', depositResignation: 'Déposer la démission',
  cancelResignationRequest: 'Annuler le brouillon', retractResignation: 'Rétracter ma démission',
  recordAbandonmentResponse: 'Répondre à la mise en demeure', appealSuspension: 'Faire appel',
};

// P16 : un congé se nomme par sa période ; les autres dossiers, par leur référence.
function titre(c, dossier) {
  if (c.key === 'coa') return `Congé ${leavePeriod(dossier)}`;
  return dossier.name;
}

function reste(delai) {
  return delai.unit === 'jours ouvrables'
    ? plural(delai.days_remaining, 'jour ouvrable', 'jours ouvrables')
    : plural(delai.days_remaining, 'jour');
}

function vue(c) {
  const r = reponses.value[c.key];
  if (c.viaRetour) {
    const periode = r?.open?.leave_period || r?.items?.[0]?.leave_period || null;
    return { dossier: null, conge: periode, autres: 0, action: null, delai: null, open: null };
  }
  const items = (r && r[c.items]) || [];
  const dossier = items[0] || null;
  const action = dossier?.available_acts?.find((a) => !a.act.startsWith('cancel')) || dossier?.available_acts?.[0];
  const delai = dossier?.deadlines?.find((d) => d.state === 'en cours') || null;
  return {
    dossier,
    autres: Math.max(items.length - 1, 0),
    action: action ? LABELS[action.act] || action.act : null,
    delai,
    open: r?.open || null,
  };
}

const vues = computed(() => Object.fromEntries(cartes.value.map((c) => [c.key, vue(c)])));
const attendu = computed(() => cartes.value.filter((c) => vues.value[c.key].action));
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-6 space-y-6">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-ln-gray-900">Mes démarches</h1>
        <p class="text-sm text-ln-gray-500 mt-1">Vos procédures auprès de la scolarité, leur état et ce qui vous est demandé.</p>
      </div>
      <button type="button" :disabled="loading" @click="load"
              class="inline-flex items-center justify-center gap-2 rounded-md border border-ln-gray-300 px-3 py-2 text-sm font-medium text-ln-gray-700 hover:bg-ln-gray-50 min-h-[44px]">
        <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': loading }" /> Actualiser
      </button>
    </header>

    <section v-if="attendu.length" class="rounded-lg border border-ln-warning/40 bg-ln-warning-bg p-4" role="status">
      <h2 class="text-sm font-semibold text-ln-warning">Une action vous est demandée</h2>
      <ul class="mt-2 space-y-1 text-sm text-ln-warning">
        <li v-for="c in attendu" :key="c.key">
          <RouterLink :to="c.to" class="underline underline-offset-2">{{ c.titre }}</RouterLink> :
          {{ vues[c.key].action }}<template v-if="vues[c.key].delai">,
            avant le {{ formatDate(vues[c.key].delai.due_on) }}
            (reste {{ reste(vues[c.key].delai) }})</template>
        </li>
      </ul>
    </section>

    <div class="grid gap-4 md:grid-cols-2">
      <article v-for="c in cartes" :key="c.key" class="rounded-lg border border-ln-gray-200 bg-white p-4 flex flex-col gap-3">
        <div class="flex items-start gap-3">
          <component :is="c.icone" class="w-5 h-5 mt-0.5 text-ln-blue-800 flex-shrink-0" aria-hidden="true" />
          <div class="min-w-0 flex-1">
            <h2 class="text-base font-semibold text-ln-gray-900">{{ c.titre }}</h2>
            <p v-if="erreurs[c.key]" class="text-sm text-ln-error mt-1">{{ erreurs[c.key] }}</p>
            <!-- Conception (lot 7, D-3) : tant que la lecture n'a pas répondu, la carte le dit — pas « aucune démarche ». -->
            <p v-else-if="!(c.key in reponses)" class="text-sm text-ln-gray-500 mt-1" aria-live="polite">Chargement…</p>
            <template v-else-if="vues[c.key].dossier">
              <p class="text-sm text-ln-gray-700 mt-1">
                <span class="font-medium">{{ titre(c, vues[c.key].dossier) }}</span> ·
                <span class="inline-flex items-center rounded-full border border-ln-gray-300 px-2 py-0.5 text-xs font-medium">{{ vues[c.key].dossier.status }}</span>
              </p>
              <p v-if="vues[c.key].action" class="text-sm text-ln-gray-900 mt-2">
                Prochaine action : <span class="font-semibold">{{ vues[c.key].action }}</span>
              </p>
              <p v-else class="text-sm text-ln-gray-500 mt-2">Aucune action de votre part n’est attendue.</p>
              <p v-if="vues[c.key].delai" class="text-sm mt-1"
                 :class="vues[c.key].delai.days_remaining <= 3 ? 'text-ln-warning font-semibold' : 'text-ln-gray-700'">
                {{ vues[c.key].delai.label }} : jusqu’au {{ formatDate(vues[c.key].delai.due_on) }}
              </p>
              <p v-if="vues[c.key].autres" class="text-xs text-ln-gray-500 mt-1">
                et {{ plural(vues[c.key].autres, 'dossier antérieur', 'dossiers antérieurs') }}
              </p>
            </template>
            <template v-else-if="vues[c.key].conge">
              <p class="text-sm text-ln-gray-700 mt-1">
                <span class="font-medium">Congé {{ leavePeriod(vues[c.key].conge) }}</span> ·
                <span class="inline-flex items-center rounded-full border border-ln-gray-300 px-2 py-0.5 text-xs font-medium">En cours</span>
              </p>
              <p class="text-sm text-ln-gray-500 mt-2">Votre retour se demande dans « Retour de congé ».</p>
            </template>
            <template v-else>
              <p class="text-sm text-ln-gray-500 mt-1">{{ c.vide }}</p>
              <p v-if="vues[c.key].open && !vues[c.key].open.available && vues[c.key].open.blocked_reason"
                 class="text-xs text-ln-gray-500 mt-1">{{ vues[c.key].open.blocked_reason }}</p>
            </template>
          </div>
        </div>
        <RouterLink :to="c.to"
                    class="mt-auto inline-flex items-center gap-1 self-start text-sm font-semibold text-ln-blue-800 hover:underline min-h-[44px]">
          <template v-if="c.viaRetour">Mon retour de congé</template>
          <template v-else-if="vues[c.key].dossier">Voir le dossier</template>
          <template v-else-if="c.ouvrir && vues[c.key].open?.available">{{ c.ouvrir }}</template>
          <template v-else>Voir</template>
          <ArrowRight class="w-4 h-4" aria-hidden="true" />
        </RouterLink>
      </article>
    </div>

    <p class="flex items-start gap-2 text-xs text-ln-gray-500">
      <FileText class="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <span>Les demandes de relevés se font dans <RouterLink to="/documents?onglet=demandes" class="underline">Documents › Mes demandes</RouterLink>.</span>
    </p>
  </div>
</template>
