<template>
  <div>
    <header class="mb-4 flex flex-wrap items-start justify-between gap-5">
      <div>
        <p class="mb-2 text-caption text-ln-gray-500">Répartition · <b class="font-semibold text-ln-gray-900">Ma filière</b></p>
        <h1 class="text-h1 tracking-tight text-ln-gray-900">Répartition de service — {{ plan.program_label || '…' }}</h1>
        <p class="mt-1 text-body-sm text-ln-gray-500">{{ subtitle }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <router-link :to="{ name: 'service-signals' }" class="ln-btn-secondary">Signaux</router-link>
        <router-link :to="{ name: 'service-progress' }" class="ln-btn-secondary">Prévu / réalisé</router-link>
        <!-- La reconduction est l'un des neuf ajustements : le bouton n'est
             rendu que si le serveur l'annonce possible. Il ne se grise pas,
             il n'existe pas. -->
        <button v-if="can('write:service') && plan.can_carry_over" type="button" class="ln-btn-secondary" @click="carry">
          Reprendre {{ plan.previous_year_label }}…
        </button>
        <button v-if="can('write:service')" type="button" class="ln-btn-secondary" @click="addLine">+ Ajouter une ligne</button>
        <button v-if="can('write:service')" type="button" class="ln-btn-primary" :disabled="!draftCount" @click="propose">
          Proposer à la validation<span v-if="draftCount"> · {{ draftCount }} lignes</span>
        </button>
      </div>
    </header>

    <StateBanner v-if="pending" variant="warning" lead="Acte non disponible." :text="pending" />

    <StateBanner variant="info" lead="Un module se partage.">
      Le cours magistral à l'un, les travaux dirigés à l'autre : plusieurs lignes par module sont la
      règle. Une heure vaut une heure — aucune conversion. La couverture se lit
      <b class="font-semibold">en heures contre le volume de la maquette</b>, jamais en nombre de lignes.
    </StateBanner>

    <div class="grid items-start gap-5 xl:grid-cols-[1fr_356px]">
      <section>
        <div class="mb-3 flex flex-wrap items-center gap-2">
          <button v-for="f in filters" :key="f.key" type="button"
                  class="inline-flex h-[30px] items-center gap-1.5 rounded-sm-ln border px-3 text-caption font-medium"
                  :class="f.key === filter ? 'border-ln-blue-900 bg-ln-blue-900 font-semibold text-white' : 'border-ln-gray-300 text-ln-gray-700'"
                  @click="filter = f.key">
            {{ f.label }} <span class="tabular opacity-70">{{ f.count }}</span>
          </button>
          <p class="ml-auto text-caption text-ln-gray-500">{{ stateNote }}</p>
        </div>

        <DenseTable :state="planState === 'denied' ? 'loading' : planState" :row-height="36"
                    :expected-count="plan.count" expected-label="lignes"
                    :skeleton-widths="[216, 150, 118, 74, 150, 44]" max-height="720px"
                    state-title="Aucune ligne de service"
                    state-message="La répartition de cette filière n'a pas commencé. Chaque ligne nomme un module, un type d'activité, un groupe et un volume."
                    @retry="loadAll">
          <template #empty-action>
            <button v-if="plan.can_carry_over" type="button" class="ln-btn-secondary" @click="carry">
              Reprendre les lignes de {{ plan.previous_year_label }}
            </button>
          </template>

          <template #head>
            <tr>
              <th :class="stuckTh" class="!px-3 !py-2 !text-micro !font-semibold !uppercase !tracking-wide !text-ln-gray-500">Module · activité</th>
              <th :class="headTh" class="!text-left">Enseignant</th>
              <th :class="headTh">Groupe</th>
              <th :class="headTh">Heures</th>
              <th :class="headTh">Engagé (toutes filières)</th>
              <th :class="headTh"></th>
            </tr>
          </template>

          <template #body>
            <template v-for="ue in visibleGroups" :key="ue.id">
              <tr>
                <td :class="stuckTd" class="!h-[30px] !bg-ln-blue-50 !px-3 !text-[11.5px] !font-bold !uppercase !tracking-wide !text-ln-blue-900">
                  {{ ue.code }}
                </td>
                <td colspan="5" class="h-[30px] border-b border-ln-blue-200 bg-ln-blue-50 px-3 text-[11.5px] font-bold uppercase tracking-wide text-ln-blue-900">
                  {{ ue.label }} · {{ ue.ects }} ECTS
                  <span v-if="ue.shared" class="normal-case tracking-normal text-ln-blue-700">— mutualisée avec {{ ue.shared }} filières</span>
                </td>
              </tr>

              <template v-for="mod in ue.modules" :key="mod.id">
                <tr v-for="line in mod.lines" :key="line.id"
                    :class="line.over_norm ? 'bg-ln-warning-bg' : 'hover:bg-ln-gray-50'">
                  <td :class="stuckTd" class="!px-3">
                    <ActivityTag :kind="line.activity" />
                    <span class="ml-1.5 font-mono text-[11.5px] text-ln-gray-500">{{ mod.code }}</span>
                    <span class="ml-1">{{ mod.label }}</span>
                  </td>
                  <td :class="bodyTd" class="!text-left">
                    <span v-if="line.teacher">{{ line.teacher }}</span>
                    <!-- F3-PROV : la ligne sans enseignant EST un brouillon réel
                         (enregistrée — l'enseignant est exigé à la PROPOSITION,
                         plus à la création). L'état inventé du front a disparu. -->
                    <span v-else class="text-ln-warning">à attribuer</span>
                  </td>
                  <td :class="bodyTd">{{ line.group || 'Promotion' }}</td>
                  <td :class="bodyTd">{{ line.hours }} h</td>
                  <td :class="bodyTd">
                    <template v-if="line.teacher">
                      <b v-if="line.over_norm" class="font-semibold">{{ line.engaged }} h</b>
                      <span v-else>{{ line.engaged }} h</span>
                      <StatusPill v-if="line.over_norm" status="suspendue" label="norme" class="ml-1" />
                    </template>
                    <span v-else class="text-ln-gray-400">—</span>
                  </td>
                  <td :class="bodyTd">
                    <button type="button" class="h-[26px] rounded-sm-ln border border-ln-gray-300 px-2 text-caption font-semibold text-ln-gray-700"
                            aria-label="Actions sur la ligne" @click="notBuilt('Actions sur la ligne')">···</button>
                  </td>
                </tr>

                <tr v-if="mod.over_norm_note" class="bg-ln-warning-bg">
                  <td :class="stuckTd" class="!h-auto !bg-ln-warning-bg"></td>
                  <td colspan="5" class="border-b border-ln-gray-100 px-3 pb-3 text-caption leading-relaxed text-[#6B4415]">
                    {{ mod.over_norm_note }}
                  </td>
                </tr>

                <!-- Un type d'activité prévu à la maquette dont les heures ne sont
                     pas toutes réparties. La phrase distingue le manque total du
                     manque partiel : « aucune heure répartie » sur un module où 18 h
                     le sont déjà est faux, et c'est le genre de faux qui fait
                     rouvrir une répartition déjà faite. -->
                <tr v-for="gap in mod.uncovered" :key="mod.id + '-' + gap.activity" class="text-ln-gray-500">
                  <td :class="stuckTd" class="!px-3 italic">
                    <ActivityTag :kind="gap.activity" muted />
                    <span class="ml-1.5 font-mono text-[11.5px] not-italic">{{ mod.code }}</span>
                    <span class="ml-1">{{ mod.label }}</span>
                  </td>
                  <td colspan="4" class="h-9 border-b border-ln-gray-100 px-3 text-left italic">
                    <template v-if="gap.assigned">{{ gap.assigned }} h réparties sur {{ gap.expected }} h prévues — il manque {{ gap.expected - gap.assigned }} h.</template>
                    <template v-else>{{ gap.expected }} h prévues à la maquette, aucune heure répartie.</template>
                    <button type="button" class="ml-1 font-semibold not-italic text-ln-blue-600" @click="addLine()">Attribuer</button>
                  </td>
                  <td :class="bodyTd"></td>
                </tr>
              </template>
            </template>
          </template>

          <template #legend>
            <span>Un type d'activité à <b class="font-semibold text-ln-gray-900">zéro heure de maquette n'est pas un manque</b> : il n'est simplement pas prévu, et n'apparaît pas ici.</span>
            <span><b class="font-semibold text-ln-gray-900">Engagé</b> — validé + proposé, toutes filières confondues. Norme annuelle {{ plan.norm_hours || 400 }} h.</span>
          </template>
        </DenseTable>
      </section>

      <aside class="flex flex-col gap-4">
        <CoveragePanel :state="coverageState === 'denied' ? 'loading' : coverageState"
                       :modules="coverage.modules || []" @retry="loadCoverage" />

        <section class="overflow-hidden rounded-md-ln border border-ln-gray-200">
          <header class="border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
            <h3 class="text-[14px] font-semibold text-ln-gray-900">Charge des enseignants servis</h3>
            <p class="mt-0.5 text-caption text-ln-gray-500">Engagé toutes filières · norme {{ plan.norm_hours || 400 }} h</p>
          </header>
          <div class="px-4 py-3">
            <div v-for="t in teachers" :key="t.id" class="mb-3 last:mb-0">
              <p class="mb-1 flex items-baseline gap-2 text-caption">
                <router-link :to="{ name: 'service-charge', params: { teacher: t.id } }"
                             class="min-w-0 truncate text-ln-gray-700">{{ t.name }}</router-link>
                <span class="tabular ml-auto flex-shrink-0" :class="t.engaged > (plan.norm_hours || 400) ? 'text-ln-warning' : 'text-ln-gray-500'">
                  <b class="font-semibold">{{ t.engaged }} h</b> / {{ plan.norm_hours || 400 }}
                </span>
              </p>
              <div class="h-1.5 overflow-hidden rounded-full bg-ln-gray-100">
                <span class="block h-full rounded-full"
                      :class="t.engaged > (plan.norm_hours || 400) ? 'bg-ln-warning' : 'bg-ln-blue-800'"
                      :style="{ width: Math.min(100, Math.round((t.engaged / (plan.norm_hours || 400)) * 100)) + '%' }"></span>
              </div>
            </div>
            <p class="mt-3 text-caption leading-relaxed text-ln-gray-500">
              Ces totaux comptent toutes les filières. Le détail hors de la vôtre ne vous est pas
              communiqué. Le nom de chaque enseignant ouvre <b class="font-semibold">son</b> bilan de charge —
              un bilan porte sur une personne, et le lien doit dire laquelle.
            </p>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>

<script setup>
/**
 * Grappe 3 · Répartition — écran N1 du lot 6 corrigé.
 *
 * L'axe de l'écran est « un module se partage » : les lignes sont GROUPÉES par
 * unité puis par module, et le manque se lit comme une ligne absente, pas comme
 * un chiffre qui ne tombe pas juste.
 *
 * ⚠️ CORRECTION DU LOT 6 : la couverture se calcule sur les HEURES contre le
 * volume de maquette, jamais sur le nombre de lignes. Deux lignes de 9 h pour
 * 18 h de maquette sont un PARTAGE légitime. Le front ne calcule rien : il
 * reçoit `covered_hours` / `expected_hours` et affiche. Un zéro de maquette
 * n'est pas un manque et n'apparaît pas.
 */
import { computed, onMounted, ref, watch } from 'vue';
import {
  DenseTable, StatusPill, StateBanner, stuckTh, stuckTd, headTh, bodyTd,
} from '../components/index.js';
import ActivityTag from './repartition/ActivityTag.vue';
import CoveragePanel from './repartition/CoveragePanel.vue';
import { useSession } from '../composables/useSession.js';
import { useAcademicContext } from '../composables/useAcademicContext.js';
import { useResource } from '../composables/useResource.js';
import { getServicePlan, getServiceCoverage } from '../api/service.js';

const { can } = useSession();
const { params } = useAcademicContext();

const planRes = useResource(getServicePlan, { isEmpty: (d) => !d?.groups?.length });
const coverageRes = useResource(getServiceCoverage, { isEmpty: (d) => !d?.modules?.length });

const planState = planRes.state;
const coverageState = coverageRes.state;
const filter = ref('all');

const plan = computed(() => planRes.data.value || {});
const coverage = computed(() => coverageRes.data.value || {});
const groups = computed(() => plan.value.groups || []);
const teachers = computed(() => plan.value.teachers || []);

const allLines = computed(() =>
  groups.value.flatMap((ue) => (ue.modules || []).flatMap((m) => m.lines || [])));
const draftCount = computed(() => allLines.value.filter((l) => l.status === 'brouillon' && l.teacher).length);
const moduleCount = computed(() => groups.value.reduce((n, ue) => n + (ue.modules?.length || 0), 0));
const incompleteCount = computed(() =>
  groups.value.reduce((n, ue) => n + (ue.modules || []).filter((m) => m.uncovered?.length).length, 0));

/**
 * Les trois pastilles comptent LA MÊME CHOSE : des modules. Le premier jet
 * comptait des modules, des modules, puis des lignes — « 7 · 4 · 13 » côte à
 * côte, un ordre de grandeur d'écart, et un clic qui filtrait quand même des
 * modules. Sur un écran où trois totaux doivent s'accorder, un compteur qui
 * change d'unité en cours de rangée suffit à perdre la confiance.
 */
const draftModuleCount = computed(() =>
  groups.value.reduce((n, ue) =>
    n + (ue.modules || []).filter((m) => (m.lines || []).some((l) => l.status === 'brouillon')).length, 0));

const filters = computed(() => [
  { key: 'all', label: 'Tous les modules', count: moduleCount.value },
  { key: 'incomplete', label: 'Modules incomplets', count: incompleteCount.value },
  { key: 'draft', label: 'Modules en brouillon', count: draftModuleCount.value },
]);

const visibleGroups = computed(() => {
  if (filter.value === 'all') return groups.value;
  return groups.value
    .map((ue) => ({
      ...ue,
      modules: (ue.modules || []).filter((m) =>
        filter.value === 'incomplete'
          ? m.uncovered?.length
          : (m.lines || []).some((l) => l.status === 'brouillon')),
    }))
    .filter((ue) => ue.modules.length);
});

const subtitle = computed(() => {
  const p = plan.value;
  if (planState.value !== 'ready') return 'Chargement de la répartition';
  return [p.year_label, (p.module_count || 0) + ' modules', (p.count || 0) + ' lignes',
    p.covered_modules != null ? p.covered_modules + ' modules couverts sur ' + p.module_count : null,
    // F3-PROV : le total « posé sans titulaire » se DIT (données serveur)
    p.unassigned_draft_hours > 0
      ? p.unassigned_draft_hours + ' h posées sans titulaire' : null]
    .filter(Boolean).join(' · ');
});
const stateNote = computed(() =>
  plan.value.state === 'brouillon'
    ? "Aucune ligne n'est encore proposée — tout est modifiable."
    : plan.value.state_note || '');

/**
 * Ces trois actes ne sont pas branchés. Tant qu'ils ne le sont pas, ils le
 * DISENT : un bouton qui ne fait rien au clic est pire qu'un bouton absent —
 * l'utilisateur croit avoir agi. Le bandeau tombe au prochain chargement.
 */
const pending = ref('');
function notBuilt(what) {
  pending.value = what + " — cet acte n'est pas encore branché au serveur. Rien n'a été enregistré.";
}
function addLine() { notBuilt('Ajout d’une ligne'); }
function propose() { notBuilt('Proposition à la validation'); }
function carry() { notBuilt('Reconduction de la répartition'); }

function loadPlan() { planRes.load(params.value); }
function loadCoverage() { coverageRes.load(params.value); }
function loadAll() { loadPlan(); loadCoverage(); }

onMounted(() => { if (params.value.academic_year) loadAll(); });  // pas d'appel sans contexte (§5)
watch(params, loadAll);
</script>
