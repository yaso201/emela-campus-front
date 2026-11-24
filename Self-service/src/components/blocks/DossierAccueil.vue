<script setup>
// DossierAccueil — l'accueil de l'étudiant à accès réduit (MANDAT-14, E-M11 ; DEC-366 ; X8 ; validée à la PC1D).
// La facette « dossier » du profil (lue au point unique du serveur, `resolve_access_level`) dit le statut, son libellé,
// la date d'entrée, le dernier jour de l'accès — ou la période disciplinaire en cours. L'écran n'en calcule rien.
// P31 (PC1D) : l'étudiant en CONGÉ lit d'abord la fin de son congé et son retour, dans la demande de retour (la lecture
// que DEC-335 lui ouvre ; celle des congés lui est fermée, DEC-333) ; le dernier jour de l'accès, avec « au-delà, vos
// relevés s'obtiennent auprès de la scolarité », ne se dit qu'aux statuts de SORTIE (exclusion, démission, diplôme).
// Pendant une suspension, la période. Ce qui reste ouvert (DEC-366) est au menu ; l'accueil mène aux deux premiers.
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { ArrowRight, FileText, FolderOpen, Info } from 'lucide-vue-next';
import { useProfileStore } from '@/stores/profile';
import { callApi, formatDate, plural } from '@/composables/useDemarche';

const SORTIES = ['EXC', 'DEM', 'DIP'];
const profile = useProfileStore();
const f = computed(() => profile.dossier || {});
const periode = computed(() => f.value.disciplinary_period || null);
const enConge = computed(() => !periode.value && f.value.academic_status === 'COA');
const sortie = computed(() => !periode.value && SORTIES.includes(f.value.academic_status));

// Le congé et le retour, lus dans la demande de retour (seulement pour l'étudiant en congé).
const retour = ref(null);
const retourErreur = ref('');
onMounted(async () => {
  if (!enConge.value) return;
  try {
    retour.value = await callApi('portal_app.api.academic.leave_return.get_my_leave_return_requests');
  } catch (err) {
    retourErreur.value = err.message || 'Lecture de votre congé impossible.';
  }
});
const conge = computed(() => retour.value?.open?.leave_period || retour.value?.items?.[0]?.leave_period || null);
const demandeEnCours = computed(() => (retour.value?.items || [])
  .find((d) => !['Annulée', 'Rejetée', 'Refusée'].includes(d.status)) || null);

// La démarche que le statut appelle d'abord : le retour (congé), l'appel (suspension).
const premiere = computed(() => {
  if (periode.value) return { to: '/demarches/discipline', label: 'Voir ma procédure disciplinaire' };
  if (enConge.value) return { to: '/demarches/retour-conge', label: demandeEnCours.value ? 'Voir ma demande de retour' : 'Demander mon retour' };
  return null;
});
const OUVERT = [
  { to: '/demarches', titre: 'Mes démarches', texte: 'Retour de congé, démission, réponse à une procédure, appel.', icone: FolderOpen },
  { to: '/documents', titre: 'Documents', texte: 'Vos relevés, attestations et pièces financières.', icone: FileText },
];
</script>

<template>
  <div class="flex flex-col gap-6">
    <section class="rounded-lg border border-ln-warning/40 bg-ln-warning-bg p-4 space-y-2" role="status">
      <h2 class="flex items-center gap-2 text-base font-semibold text-ln-warning">
        <Info class="w-5 h-5 flex-shrink-0" aria-hidden="true" /> Votre espace est réduit à votre dossier et à vos démarches
      </h2>

      <!-- Suspension : la période. -->
      <p v-if="periode" class="text-sm text-ln-warning">
        Une suspension court du <span class="font-semibold">{{ formatDate(periode.period_start) }}</span>
        au <span class="font-semibold">{{ formatDate(periode.period_end) }}</span>.
        Pendant cette période, vous gardez votre dossier et vos démarches, dont l’appel.
      </p>

      <!-- P31 : en congé, la fin du congé et le retour, d'abord. -->
      <template v-else-if="enConge">
        <p v-if="conge" class="text-sm text-ln-warning">
          Vous êtes en congé académique du <span class="font-semibold">{{ formatDate(conge.from_date) }}</span>
          au <span class="font-semibold">{{ formatDate(conge.to_date) }}</span>.
        </p>
        <p v-else-if="retourErreur" class="text-sm text-ln-warning">{{ retourErreur }}</p>
        <p v-else-if="retour" class="text-sm text-ln-warning">Statut : <span class="font-semibold">{{ f.academic_status_label || f.academic_status }}</span>.</p>
        <p v-if="demandeEnCours" class="text-sm text-ln-warning">
          Votre demande de retour est <span class="font-semibold">{{ demandeEnCours.status.toLowerCase() }}</span>.
        </p>
        <p v-else-if="retour?.open?.available && retour.open.earliest_resume_date" class="text-sm text-ln-warning">
          Vous pouvez demander votre retour : reprise au plus tôt le
          <span class="font-semibold">{{ formatDate(retour.open.earliest_resume_date) }}</span>.
        </p>
      </template>

      <!-- Sortie (exclusion, démission, diplôme) : le statut, puis le dernier jour de l'accès. -->
      <template v-else>
        <p class="text-sm text-ln-warning">
          Statut : <span class="font-semibold">{{ f.academic_status_label || f.academic_status }}</span><template
            v-if="f.since">, depuis le {{ formatDate(f.since) }}</template>.
        </p>
        <p v-if="sortie && f.access_until" class="text-sm text-ln-warning">
          Votre accès reste ouvert jusqu’au <span class="font-semibold">{{ formatDate(f.access_until) }}</span>{{
            f.days_left ? ` (${plural(f.days_left, 'jour restant', 'jours restants')})` : '' }}.
          Au-delà, vos relevés s’obtiennent auprès de la scolarité.
        </p>
      </template>

      <RouterLink v-if="premiere" :to="premiere.to"
                  class="inline-flex items-center gap-1 text-sm font-semibold text-ln-blue-800 hover:underline min-h-[44px]">
        {{ premiere.label }} <ArrowRight class="w-4 h-4" aria-hidden="true" />
      </RouterLink>
    </section>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <RouterLink v-for="o in OUVERT" :key="o.to" :to="o.to"
                  class="flex items-start gap-3 rounded-lg border border-ln-gray-200 bg-white p-4 hover:border-ln-blue-200 min-h-[44px]">
        <component :is="o.icone" class="w-5 h-5 mt-0.5 flex-shrink-0 text-ln-blue-800" aria-hidden="true" />
        <span class="min-w-0">
          <span class="block text-sm font-semibold text-ln-gray-900">{{ o.titre }}</span>
          <span class="block text-sm text-ln-gray-600">{{ o.texte }}</span>
        </span>
      </RouterLink>
    </div>
  </div>
</template>
