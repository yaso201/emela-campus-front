<template>
  <div>
    <header class="mb-4 flex flex-wrap items-start justify-between gap-5">
      <div>
        <p class="mb-2 text-caption text-ln-gray-500">Répartition · Charge · <b class="font-semibold text-ln-gray-900">{{ load.teacher_name || '…' }}</b></p>
        <h1 class="text-h1 tracking-tight text-ln-gray-900">{{ load.teacher_name || 'Bilan de charge' }}</h1>
        <p class="mt-1 text-body-sm text-ln-gray-500">{{ subtitle }}</p>
      </div>
      <button type="button" class="ln-btn-secondary" @click="notBuilt">Exporter</button>
    </header>

    <StateBanner v-if="pending" variant="warning" lead="Acte non disponible." :text="pending" />

    <section v-if="!teacherId" class="rounded-md-ln border border-dashed border-ln-gray-300 px-6 py-8 text-center">
      <h4 class="text-h3 text-ln-gray-900">Aucun enseignant choisi</h4>
      <p class="mx-auto mt-1.5 max-w-md text-body-sm leading-relaxed text-ln-gray-500">
        Un bilan de charge porte sur une personne. Ouvrez-le depuis une ligne de la répartition ou
        depuis un signal de dépassement — ce sont eux qui savent de qui il s'agit.
      </p>
      <router-link :to="{ name: 'service-signals' }" class="ln-btn-secondary mt-4 inline-flex">Voir les signaux</router-link>
    </section>

    <!-- L'erreur porte le MESSAGE DU SERVEUR quand il en rend un : « bilan
         indisponible » affirmerait une panne d'agrégation pour un sujet
         simplement introuvable. Et elle offre toujours une sortie — un écran
         d'erreur sans retour est une impasse. -->
    <BlockState v-else-if="loadState !== 'ready'" :state="loadState === 'denied' ? 'loading' : loadState"
                :title="errorTitle" :message="errorMessage" :safeguard="errorSafeguard"
                :rows="6" :skeleton-widths="[210, 110, 70, 78, 118]" :row-height="44"
                @retry="reload">
      <template #action>
        <router-link :to="{ name: 'service' }" class="ln-btn-secondary">Retour à la répartition</router-link>
      </template>
    </BlockState>

    <template v-else-if="teacherId">
      <!-- Le total est honnête, le détail est expurgé. -->
      <div class="mb-4 flex flex-wrap items-stretch gap-6 rounded-md-ln border border-ln-gray-200 bg-ln-gray-50 px-5 py-4">
        <div v-for="b in totals" :key="b.label" class="flex flex-col gap-0.5">
          <span class="tabular text-[20px] font-bold leading-tight" :class="b.tone">{{ b.value }}</span>
          <span class="text-caption text-ln-gray-500">{{ b.label }}</span>
        </div>
        <p class="ml-auto max-w-[330px] self-center text-caption leading-relaxed text-ln-gray-500">
          L'engagé additionne le validé et le proposé de <b class="font-semibold">toutes</b> les filières.
          Deux responsables à 250 h chacun franchissent la norme sans qu'aucun ne la voie seul.
        </p>
      </div>

      <!-- ⚠️ Un champ ABSENT, jamais un champ vide. Et l'écran DIT que le motif
           n'est pas communiqué : l'omettre silencieusement ferait croire qu'il
           n'y en a pas. -->
      <StateBanner v-if="derogation" variant="warning" :lead="derogationLead">
        <template v-if="derogation.reason">« {{ derogation.reason }} »</template>
        <template v-else-if="derogation.reason_withheld">
          Le motif <b class="font-semibold">ne vous est pas communiqué</b> : cette dérogation est née
          d'une autre filière que la vôtre. Vous savez qu'elle existe et qu'elle est motivée — c'est ce
          qui vous permet de lire le total sans le croire arbitraire.
        </template>
        <template v-else-if="!derogation.motivated">
          Le dépassement est acquis mais <b class="font-semibold">n'a pas encore été motivé</b>. Il le
          sera à la validation des lignes concernées — le système ne refuse jamais le dépassement, il
          refuse une dérogation sans motif.
        </template>
      </StateBanner>

      <div class="grid items-start gap-5 xl:grid-cols-[1fr_372px]">
        <section>
          <h4 class="mb-2 text-micro font-bold uppercase tracking-wider text-ln-gray-500">
            Vos lignes — {{ load.program_label }} · {{ load.own_hours }} h
          </h4>
          <DenseTable state="ready" :row-height="44" :skeleton-widths="[210, 110, 70, 78, 118]" max-height="none">
            <template #head>
              <tr>
                <th :class="headTh" class="!text-left">Module · activité</th>
                <th :class="headTh">Groupe</th>
                <th :class="headTh">Prévu</th>
                <th :class="headTh">Réalisé</th>
                <th :class="headTh" class="!text-left">État</th>
              </tr>
            </template>
            <template #body>
              <tr v-for="l in ownLines" :key="l.id" class="hover:bg-ln-gray-50">
                <td :class="bodyTd" class="!text-left">
                  <ActivityTag :kind="l.activity" />
                  <span class="ml-1.5 font-mono text-[11.5px] text-ln-gray-500">{{ l.module_code }}</span>
                  <span class="ml-1">{{ l.module_label }}</span>
                  <span v-if="l.shared_count" class="ml-1.5 inline-flex h-5 items-center rounded-[4px] bg-ln-blue-50 px-[7px] text-[11px] font-semibold text-ln-blue-700">
                    mutualisé · compté une fois
                  </span>
                </td>
                <td :class="bodyTd">{{ l.group || 'Promotion' }}</td>
                <td :class="bodyTd">{{ l.planned }} h</td>
                <td :class="bodyTd">{{ l.done }} h</td>
                <td :class="bodyTd" class="!text-left"><StatusPill :status="l.status" /></td>
              </tr>
            </template>
          </DenseTable>

          <h4 class="mb-2 mt-6 text-micro font-bold uppercase tracking-wider text-ln-gray-500">
            Hors de votre filière · {{ load.elsewhere_hours }} h
          </h4>
          <!-- Rien à masquer : on le dit, plutôt que d'annoncer une zone vide. -->
          <p v-if="!load.elsewhere_hours" class="rounded-md-ln border border-dashed border-ln-gray-300 bg-ln-gray-50 p-4 text-caption leading-relaxed text-ln-gray-600">
            Cet enseignant n'intervient que dans votre filière. Son engagé vous est donc
            <b class="font-semibold text-ln-gray-900">entièrement visible</b> — il n'y a aucune zone masquée.
          </p>
          <!-- Une zone masquée ANNONCÉE vaut mieux qu'un total inexpliqué. -->
          <div v-else class="flex items-start gap-3 rounded-md-ln border border-dashed border-ln-gray-300 bg-ln-gray-50 p-4 text-caption leading-relaxed text-ln-gray-600">
            <svg class="mt-0.5 h-[18px] w-[18px] flex-shrink-0 text-ln-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7.5a4 4 0 0 1 8 0V10" /></svg>
            <p>
              <b class="font-semibold text-ln-gray-900">{{ plural(load.elsewhere_programs, 'filière') }} · {{ plural(load.elsewhere_lines, 'ligne') }} · {{ plural(load.elsewhere_hours, 'heure') }} engagées.</b>
              Le détail ne vous est pas communiqué : il appartient aux responsables de ces filières et au
              directeur des études. Le total, lui, est complet — c'est lui qui vous dit si vous pouvez
              encore charger cet enseignant.
            </p>
          </div>
        </section>

        <section class="overflow-hidden rounded-md-ln border border-ln-gray-200">
          <header class="border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
            <h3 class="text-[14px] font-semibold text-ln-gray-900">Charge par type d'activité</h3>
            <p class="mt-0.5 text-caption text-ln-gray-500">Toutes filières · prévu</p>
          </header>
          <div class="px-4 py-3">
            <div v-for="a in byActivity" :key="a.activity" class="mb-3 last:mb-0">
              <p class="mb-1 flex items-baseline gap-2 text-caption">
                <span class="text-ln-gray-700">{{ ACTIVITY_LABELS[a.activity] || a.activity }}</span>
                <span class="tabular ml-auto font-semibold text-ln-gray-900">{{ a.hours }} h</span>
              </p>
              <div class="h-1.5 overflow-hidden rounded-full bg-ln-gray-100">
                <span class="block h-full rounded-full bg-ln-blue-800" :style="{ width: pct(a.hours) + '%' }"></span>
              </div>
            </div>
            <p class="mt-3 text-caption leading-relaxed text-ln-gray-500">
              Les épreuves n'apparaissent pas : la surveillance est réputée incluse dans l'heure
              d'enseignement, elle ne s'ajoute pas au service.
            </p>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup>
/**
 * Grappe 3 · Répartition — écran N3 du lot 6, le point délicat.
 *
 * Le total est honnête, le détail est expurgé. Un responsable de formation doit
 * voir qu'un vacataire est déjà chargé ailleurs — sinon il sur-planifie ; il n'a
 * pas à savoir QUOI il enseigne ailleurs.
 *
 * ⚠️ ARBITRAGE, tranché avant l'écran : un champ ABSENT, jamais un champ vide.
 * Le motif d'une dérogation née d'une AUTRE filière n'est pas rendu ;
 * `reason_withheld: true` dit qu'il existe et qu'il est retenu. L'écran l'écrit —
 * l'omettre silencieusement ferait croire qu'il n'y a pas de motif.
 *
 * C'est pourquoi le drapeau est nécessaire : sans lui, l'absence du champ ne se
 * distinguerait pas d'une dérogation non motivée, et l'écran mentirait par
 * omission dans les deux sens.
 */
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { DenseTable, StatusPill, StateBanner, headTh, bodyTd } from '../components/index.js';
import BlockState from '../components/internal/BlockState.vue';
import ActivityTag from './repartition/ActivityTag.vue';
import { useAcademicContext } from '../composables/useAcademicContext.js';
import { useResource } from '../composables/useResource.js';
import { getTeacherLoad } from '../api/service.js';

const route = useRoute();
const { params } = useAcademicContext();
const res = useResource(getTeacherLoad, { isEmpty: (d) => !d });
const loadState = res.state;
const pending = ref('');

/**
 * ⚠️ Le sujet vient de la ROUTE, jamais de la réponse.
 *
 * La première version lisait `load.value.teacher_id` pour appeler le serveur :
 * circulaire, donc toujours nul au montage, donc toujours le même enseignant
 * rendu quel que soit le lien cliqué. Sur l'écran dont les chiffres nourrissent
 * la paie des vacataires, un lien qui affiche la mauvaise personne est le pire
 * défaut possible — il ressemble à un succès.
 */
const teacherId = computed(() => route.params.teacher || null);

const ACTIVITY_LABELS = { cm: 'Cours magistral', td: 'Travaux dirigés', tp: 'Travaux pratiques', pj: 'Projet' };

const load = computed(() => res.data.value || {});
const ownLines = computed(() => load.value.own_lines || []);
const byActivity = computed(() => load.value.by_activity || []);
const derogation = computed(() => load.value.derogation || null);

const subtitle = computed(() =>
  loadState.value !== 'ready' ? 'Chargement du bilan'
    : [load.value.quality, load.value.discipline, 'année ' + load.value.year_label].filter(Boolean).join(' · '));

const totals = computed(() => {
  const l = load.value;
  const norm = l.norm_hours || 400;
  return [
    { value: l.validated_hours + ' h', label: 'Validé', tone: 'text-ln-gray-900' },
    { value: l.proposed_hours + ' h', label: 'Proposé', tone: 'text-ln-gray-900' },
    { value: l.engaged_hours + ' h', label: 'Engagé — norme ' + norm + ' h',
      tone: l.engaged_hours > norm ? 'text-ln-warning' : 'text-ln-gray-900' },
    // Le millésime est celui du serveur : aucun décompte n'est calculé ici.
    { value: l.done_hours + ' h', label: 'Réalisé au ' + (l.computed_at_label || '—'), tone: 'text-ln-gray-500' },
  ];
});

/**
 * Le message d'erreur vient du serveur quand il en rend un. « Bilan
 * indisponible » affirmerait une panne d'agrégation pour un sujet simplement
 * introuvable — deux causes, deux phrases.
 */
const errorTitle = computed(() =>
  res.error.value?.code === 'NOT_FOUND' ? 'Enseignant introuvable' : 'Bilan indisponible');
const errorMessage = computed(() =>
  res.error.value?.message
  || "La charge d'un enseignant additionne toutes les filières. Sans cette somme, le bilan n'a pas de sens — et un total partiel serait pire qu'aucun total.");
const errorSafeguard = computed(() =>
  res.error.value?.code === 'NOT_FOUND'
    ? 'Aucune donnée de service n’a été modifiée.'
    : '');

/** Une dérogation non motivée existe : la phrase ne doit pas affirmer l'inverse. */const derogationLead = computed(() => {
  const d = derogation.value;
  if (!d) return '';
  if (!d.motivated) return 'Dépassement de la norme — dérogation non motivée à ce jour.';
  const who = d.motivated_by ? ' par ' + d.motivated_by : '';
  const when = d.motivated_on ? ' le ' + d.motivated_on : '';
  return 'Dérogation motivée' + when + who + '.';
});

const maxActivity = computed(() => Math.max(1, ...byActivity.value.map((a) => Number(a.hours) || 0)));
function pct(hours) { return Math.round(((Number(hours) || 0) / maxActivity.value) * 100); }

/** L'accord du pluriel est du contenu, pas du détail : « 1 filières » est une faute. */
function plural(n, word) {
  const v = Number(n) || 0;
  return v + ' ' + word + (v > 1 ? 's' : '');
}

function notBuilt() { pending.value = "L'export n'est pas encore branché au serveur. Rien n'a été produit."; }
function reload() { if (teacherId.value && params.value.academic_year) res.load({ ...params.value, teacher: teacherId.value }); }  // sujet ET contexte (§5)

onMounted(() => { if (params.value.academic_year) reload(); });  // pas d'appel sans contexte (§5)
watch([params, teacherId], reload);
</script>
