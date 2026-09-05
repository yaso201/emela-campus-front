<template>
  <div>
    <header class="mb-4 flex flex-wrap items-start justify-between gap-5">
      <div>
        <p class="mb-2 text-caption text-ln-gray-500">Structure · <b class="font-semibold text-ln-gray-900">Maquette</b></p>
        <h1 class="text-h1 tracking-tight text-ln-gray-900">{{ selectedUe?.label || 'Maquette' }}</h1>
        <p class="mt-1 text-body-sm text-ln-gray-500">{{ subtitle }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <ProgramPicker />
        <button type="button" class="ln-btn-secondary" @click="openHistory">Historique</button>
        <button v-if="can('write:structure')" type="button" class="ln-btn-primary" :disabled="!dirty || busy" @click="save">Enregistrer</button>
      </div>
    </header>

    <StateBanner v-if="pending" variant="warning" lead="Acte non disponible." :text="pending" />
    <StateBanner v-if="actError" variant="error" lead="L'acte a échoué." :text="actError" />

    <UeForm v-if="createOpen" :program="program" :term-label="termLabel"
            :options="{ levels: tree.data.value?.levels || [] }" :error="createError" :busy="busy"
            @cancel="createOpen = false" @submit="submitUe" />

    <StateBanner v-if="maquetteState === 'valide'" variant="info"
                 lead="Maquette validée le 2 juillet 2026."
                 :text="lockSentence" />

    <div class="grid items-start gap-5 lg:grid-cols-[352px_1fr]">
      <TreeEditor :nodes="nodes" :selected-id="selectedId" :add-actions="addActions"
                  :state="treeState === 'denied' ? 'loading' : treeState"
                  state-title="Aucune structure pour cette année"
                  state-message="La maquette de cette filière n'a pas encore été créée. Elle se crée unité par unité."
                  max-height="560px"
                  @select="select" @toggle="toggle" @add="add" @expand-all="expandAll" @retry="loadTree" />

      <ObjectPanel :title="selectedUe?.label" :subtitle="panelSubtitle"
                   :warning="editWarning"
                   :state="selectedUeId ? 'ready' : 'empty'"
                   state-title="Choisissez une unité"
                   state-message="Sélectionnez une unité dans l'arbre pour en voir l'identité, ses modules et ses filières partenaires. Un semestre ne porte ni volume ni module.">
        <template #header-right>
          <StatusPill v-if="selectedUe?.status" :status="selectedUe.status" />
        </template>

        <!-- Identité -->
        <section class="mb-6">
          <h4 class="mb-3 border-b border-ln-gray-200 pb-2 text-micro font-bold uppercase tracking-wider text-ln-gray-500">Identité</h4>
          <div class="flex min-h-[44px] flex-wrap items-center gap-3 border-b border-ln-gray-100 py-2">
            <label for="ue-code" class="w-[104px] flex-shrink-0 text-body-sm font-medium text-ln-gray-700">Code</label>
            <input id="ue-code" v-model="form.code" type="text" :readonly="usageLocked"
                   class="h-8 w-[196px] rounded-sm-ln border border-ln-gray-300 px-3 font-mono text-body-sm text-ln-gray-900 outline-none read-only:bg-ln-gray-50 read-only:text-ln-gray-500 focus:border-ln-blue-600" />
            <!-- Le verrou n'est ni un succès ni une alerte : l'encart voisin
                 porte déjà l'explication et son ton. Une pastille verte ici
                 dirait le contraire de l'ambre à trois centimètres. -->
            <StatusPill :status="usageLocked ? 'echue' : 'propose'"
                        :label="usageLocked ? 'Verrouillé' : 'Modifiable'" />
          </div>
          <div class="flex min-h-[44px] flex-wrap items-center gap-3 py-2">
            <label for="ue-label" class="w-[104px] flex-shrink-0 text-body-sm font-medium text-ln-gray-700">Intitulé</label>
            <input id="ue-label" v-model="form.label" type="text"
                   class="h-8 min-w-0 flex-1 rounded-sm-ln border border-ln-gray-300 px-3 text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600" />
          </div>

          <!-- A6 : ce n'est pas la validation qui fige, c'est l'usage aval -->
          <div class="mt-3 flex gap-3 rounded-md-ln border p-3 text-caption leading-relaxed"
               :class="usageLocked ? 'border-[#F3D9A6] bg-ln-warning-bg text-[#6B4415]' : 'border-ln-blue-200 bg-ln-blue-50 text-ln-gray-700'">
            <svg class="mt-0.5 h-4 w-4 flex-shrink-0" :class="usageLocked ? 'text-ln-warning' : 'text-ln-blue-700'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.6v.2" /></svg>
            <p v-if="usageState === 'loading'">Vérification de l'usage aval de cette unité…</p>
            <p v-else-if="usageState === 'error'">
              L'usage aval n'a pas pu être lu. <b class="font-semibold">Le code est traité comme verrouillé</b> tant que
              la réponse manque : mieux vaut refuser une modification permise que d'en permettre une qui casse des notes.
              <button type="button" class="ml-1 font-semibold text-ln-blue-600 underline" @click="loadUsage">Réessayer</button>
            </p>
            <p v-else v-html="usageSentence"></p>
          </div>
        </section>

        <!-- Modules et volumes -->
        <section class="mb-6">
          <h4 class="mb-3 border-b border-ln-gray-200 pb-2 text-micro font-bold uppercase tracking-wider text-ln-gray-500">Modules et volumes</h4>
          <DenseTable :state="detailState === 'denied' ? 'loading' : detailState" :row-height="44"
                      :skeleton-widths="[220, 56, 56, 56, 64]" max-height="none"
                      state-title="Aucun module" state-message="Cette unité n'a pas encore de module.">
            <template #head>
              <tr>
                <th :class="headTh" class="!text-left">Module</th>
                <th v-for="c in ACTIVITIES" :key="c.key" :class="headTh">{{ c.label }}</th>
                <th :class="headTh">Total</th>
              </tr>
            </template>
            <template #body>
              <!-- Le module cliqué dans l'arbre est marqué ici : le clic conduit à
                   son unité, et il faut qu'il se voie — sinon il semble sans effet. -->
              <tr v-for="m in modules" :key="m.id"
                  :class="m.id === selectedModuleId ? 'bg-ln-blue-50 shadow-[inset_2px_0_0_var(--ln-blue-800)]' : ''">
                <td :class="bodyTd" class="!text-left">
                  <span class="font-mono text-[11.5px] text-ln-gray-500">{{ m.code }}</span> {{ m.label }}
                </td>
                <td v-for="c in ACTIVITIES" :key="c.key" :class="bodyTd">
                  <span :class="m.volumes[c.key] ? '' : 'text-ln-gray-400'">{{ m.volumes[c.key] || '—' }}</span>
                </td>
                <td :class="bodyTd" class="font-semibold">{{ moduleTotal(m) }}</td>
              </tr>
            </template>
            <template #footbar>
              <div class="flex items-center gap-4 border-t border-ln-gray-300 bg-ln-gray-50 px-3 py-2 text-caption">
                <span class="font-semibold text-ln-gray-900">Total de l'unité</span>
                <span class="tabular ml-auto font-semibold text-ln-gray-900">{{ ueTotal }} h</span>
              </div>
            </template>
            <template #legend>
              <span>Un volume à <b class="font-semibold text-ln-gray-900">zéro n'est pas un manque</b> : le type d'activité n'est simplement pas prévu à la maquette. C'est cette allocation qui fait foi pour la couverture de la répartition.</span>
            </template>
          </DenseTable>
        </section>

        <!-- A6 : les responsables des filières partenaires sont nommés -->
        <section>
          <h4 class="mb-3 border-b border-ln-gray-200 pb-2 text-micro font-bold uppercase tracking-wider text-ln-gray-500">
            Mutualisation — filières partenaires
          </h4>
          <DenseTable :state="partnersState" :row-height="44" :skeleton-widths="[240, 200, 96, 96]" max-height="none"
                      state-title="Unité non mutualisée"
                      state-message="Cette unité n'est servie que par cette filière. Une modification de volume n'engage personne d'autre.">
            <template #head>
              <tr>
                <th :class="headTh" class="!text-left">Filière</th>
                <th :class="headTh" class="!text-left">Responsable de formation</th>
                <th :class="headTh">Depuis</th>
                <th :class="headTh">État</th>
              </tr>
            </template>
            <template #body>
              <tr v-for="p in partners" :key="p.id">
                <td :class="bodyTd" class="!text-left">{{ p.program }}</td>
                <td :class="bodyTd" class="!text-left">
                  {{ p.owner || '—' }}
                  <span v-if="p.email" class="ml-1 font-mono text-[11.5px] text-ln-gray-500">{{ p.email }}</span>
                  <span v-else-if="p.owner === null" class="ml-1 text-caption text-ln-gray-500">responsable non renseigné</span>
                </td>
                <td :class="bodyTd">{{ p.since }}</td>
                <td :class="bodyTd"><StatusPill :status="p.active ? 'valide' : 'brouillon'" :label="p.active ? 'Active' : 'Retirée'" /></td>
              </tr>
            </template>
            <template #legend>
              <span>Ces responsables sont nommés parce qu'une modification de volume ou de code les concerne directement. Une filière <b class="font-semibold text-ln-gray-900">retirée reste visible</b> — elle a produit des inscriptions dans le passé.</span>
            </template>
          </DenseTable>
        </section>

        <template #actions>
          <ActionBar :actions="actions" :attribution="attribution" :hint="actionHint" @act="act" />
        </template>
      </ObjectPanel>
    </div>

    <!-- Renvoi au brouillon : un acte à motif, jamais un champ en bas de page -->
    <div v-if="reasonOpen" class="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-6">
      <ReasonStep class="w-full max-w-2xl" name="maquette-draft"
                  title="Renvoyer la maquette au brouillon"
                  subtitle="La maquette redevient modifiable. Les unités déjà servies en aval conservent leur verrou : un renvoi au brouillon ne déverrouille pas un code que des notes utilisent."
                  reason-label="Catégorie du motif"
                  :reason-groups="draftReasons"
                  detail-label="Précision"
                  detail-placeholder="Ce qui doit être revu avant une nouvelle proposition…"
                  detail-hint="Le motif reste attaché à la maquette et lisible par le responsable de formation."
                  confirm-label="Renvoyer au brouillon"
                  footnote="Un seul acte serveur : la catégorie oriente le travail, elle ne change pas la nature du renvoi."
                  @cancel="reasonOpen = false" @submit="submitDraft" />
    </div>
  </div>
</template>

<script setup>
/**
 * Grappe 2 · Structure — éditeur de maquette (lot 2 écran 1, amendé A6 du lot 8).
 *
 * Deux amendements portés ici :
 *  · le verrou du code suit l'USAGE AVAL, pas la validation. Une inscription
 *    suffit ; les deux comptes sont affichés pour dire d'où vient le verrou.
 *  · les responsables des filières partenaires sont NOMMÉS — la donnée existe,
 *    et une modification les concerne.
 *
 * L'usage aval est un appel distinct (get_ue_downstream_usage) : en attendre la
 * réponse pour rendre le champ serait un écran figé sur un détail. Le champ est
 * donc verrouillé PAR DÉFAUT et se libère à la réponse — l'inverse permettrait
 * une frappe qui casse des notes.
 */
import { computed, onMounted, reactive, ref, watch } from 'vue';
import {
  TreeEditor, ObjectPanel, DenseTable, StatusPill, StateBanner, ActionBar, ReasonStep,
  headTh, bodyTd,
} from '../components/index.js';
import { useSession } from '../composables/useSession.js';
import { useAcademicContext } from '../composables/useAcademicContext.js';
import { useProgramScope } from '../composables/useProgramScope.js';
import { useResource } from '../composables/useResource.js';
import {
  getStructureTree, getUe, getUeDownstreamUsage,
  createUe, updateUe, proposeMaquette, validateMaquette, returnMaquetteToDraft,
} from '../api/structure.js';
import ProgramPicker from './planning/ProgramPicker.vue';
import UeForm from './structure/UeForm.vue';

const { can } = useSession();
const { params, term } = useAcademicContext();
const { program, load: loadProgram } = useProgramScope();
const termLabel = computed(() => term.value?.label || params.value.term || '');

const ACTIVITIES = [
  { key: 'cm', label: 'CM' }, { key: 'td', label: 'TD' },
  { key: 'tp', label: 'TP' }, { key: 'pj', label: 'PJ' },
];

const tree = useResource(getStructureTree, { isEmpty: (d) => !d?.nodes?.length });
const detail = useResource((p) => getUe(p.ue), { isEmpty: (d) => !d });
const usage = useResource((p) => getUeDownstreamUsage(p.ue), { isEmpty: () => false });

const selectedId = ref(null);
const collapsed = reactive({});
const form = reactive({ code: '', label: '' });
const reasonOpen = ref(false);

/** Les états, exposés au patron comme refs de premier niveau. */
const treeState = tree.state;
const detailState = detail.state;
const usageState = usage.state;

/**
 * L'arbre arrive APLATI (level + parent) ; le composant 5 attend children pour
 * rendre le chevron. On le dérive ici plutôt que de le demander au serveur : la
 * paternité suffit à le savoir, et une liste aplatie reste plus simple à paginer.
 * Un nœud replié masque toute sa descendance, pas seulement ses enfants directs.
 */
const allNodes = computed(() => tree.data.value?.nodes || []);
const parentIds = computed(() => {
  const set = new Set();
  allNodes.value.forEach((n) => { if (n.parent) set.add(n.parent); });
  return set;
});
function hiddenByCollapse(node) {
  let p = node.parent;
  while (p) {
    if (collapsed[p]) return true;
    p = allNodes.value.find((n) => n.id === p)?.parent;
  }
  return false;
}
const nodes = computed(() =>
  allNodes.value
    .filter((n) => !hiddenByCollapse(n))
    .map((n) => ({ ...n, children: parentIds.value.has(n.id), expanded: !collapsed[n.id] })));

const selected = computed(() => (tree.data.value?.nodes || []).find((n) => n.id === selectedId.value) || null);

/**
 * L'unité PORTEUSE de la sélection.
 *
 * L'arbre rend cliquables douze lignes : un semestre, quatre unités, sept
 * modules. Seules les unités sont des sujets de `get_ue` — charger un
 * identifiant de module ou de semestre là où l'on attend une unité le fait
 * légitimement échouer. Ce n'est pas au point d'entrée de deviner quel objet on
 * lui passe : c'est à l'écran de remonter au bon sujet.
 *
 * Un module remonte d'un cran — son `parent` EST son unité. Un semestre ne porte
 * aucune unité : rien n'est chargé et le panneau reste sur son état vide. Un
 * état vide est la réponse juste à « rien à montrer ici » ; une erreur ne l'est
 * pas.
 */
const selectedUeId = computed(() => {
  let node = selected.value;
  while (node && node.level > 2) node = allNodes.value.find((n) => n.id === node.parent);
  return node && node.level === 2 ? node.id : null;
});
const selectedUe = computed(() => allNodes.value.find((n) => n.id === selectedUeId.value) || null);

/** Le module cliqué — pour que le clic ait un effet visible dans le panneau. */
const selectedModuleId = computed(() =>
  selected.value && selected.value.level === 3 ? selected.value.id : null);
const maquette = computed(() => tree.data.value?.maquette || { state: 'brouillon' });
const modules = computed(() => detail.data.value?.modules || []);
const partners = computed(() => detail.data.value?.partners || []);
const maquetteState = computed(() => maquette.value.state);
const partnersState = computed(() =>
  detail.state.value !== 'ready' ? 'loading' : (partners.value.length ? 'ready' : 'empty'));

const subtitle = computed(() => {
  const d = tree.data.value;
  if (!d) return 'Chargement de la maquette';
  // Le plafond se lit à côté du total déclaré : sans lui, « 27 crédits » ne dit
  // pas s'il reste de la place, et c'est précisément ce que le responsable
  // cherche à savoir en juillet.
  const credits = d.ects == null ? null
    : d.ects_cap ? d.ects + ' crédits déclarés sur ' + d.ects_cap
      : d.ects + ' crédits';
  return [d.program_label, credits,
    partners.value.length ? 'mutualisée avec ' + partners.value.filter((p) => p.active).length + ' filières' : null]
    .filter(Boolean).join(' · ');
});
const panelSubtitle = computed(() =>
  maquette.value.validated_on ? 'Validée le ' + maquette.value.validated_on : 'Brouillon');

/** Verrouillé par défaut : la réponse LIBÈRE, elle ne restreint pas. */
const usageLocked = computed(() => {
  if (usage.state.value !== 'ready') return true;
  return !!usage.data.value?.locked;
});
const usageSentence = computed(() => {
  const u = usage.data.value || {};
  const e = u.enrollments ?? 0, g = u.grades ?? 0;
  const counts = '<b class="font-semibold">' + e + ' inscription' + (e > 1 ? 's' : '') +
    '</b> et <b class="font-semibold">' + g + ' note' + (g > 1 ? 's' : '') + '</b>';
  if (u.locked) {
    return 'Le code est <b class="font-semibold">verrouillé</b> : cette unité compte ' + counts +
      '. Une seule inscription suffit — le renommer casserait des rattachements. L\'intitulé, lui, reste modifiable.';
  }
  return 'Le code reste modifiable tant qu\'aucun usage n\'existe en aval. Ce n\'est pas la validation qui le fige : ' +
    'ce sont les inscriptions et les notes. Cette unité compte ' + counts +
    ' — <b class="font-semibold">une seule inscription suffira à la verrouiller</b>.';
});
const lockSentence = computed(() =>
  'La validation n\'a rien figé par elle-même : ce sont les inscriptions et les notes qui verrouillent un code. ' +
  'Modifier une unité validée la repasse en brouillon et exige une nouvelle validation.');

const editWarning = computed(() =>
  maquetteState.value === 'valide' && dirty.value
    ? { lead: 'Cette modification repassera la maquette en brouillon.',
        text: 'Elle devra être proposée puis validée de nouveau avant de servir aux inscriptions.' }
    : null);

const dirty = computed(() =>
  !!selectedUeId.value && (form.code !== (detail.data.value?.code || '') || form.label !== (detail.data.value?.label || '')));

const ueTotal = computed(() => modules.value.reduce((sum, m) => sum + moduleTotal(m), 0));
function moduleTotal(m) { return ACTIVITIES.reduce((s, c) => s + (Number(m.volumes?.[c.key]) || 0), 0); }

/** Règle 3 : l'action n'est pas rendue. Aucun grisé, aucune fuite. */
const actions = computed(() => [
  { key: 'propose', label: 'Proposer à la validation', kind: 'primary',
    visible: can('write:structure') && maquetteState.value === 'brouillon' },
  { key: 'validate', label: 'Valider la maquette', kind: 'primary',
    visible: can('validate:structure') && maquetteState.value === 'propose' },
  { key: 'draft', label: 'Renvoyer au brouillon…', kind: 'secondary',
    visible: can('validate:structure') && maquetteState.value !== 'brouillon' },
]);
const attribution = computed(() =>
  maquette.value.proposed_by
    ? 'Proposée le ' + maquette.value.proposed_on + ' par <b class="font-semibold text-ln-gray-900">' + maquette.value.proposed_by + '</b>'
    // F3-FORMES arb.4 : l'existant n'est JAMAIS reconstitué — l'écran le dit,
    // plutôt qu'un vide qui ressemblerait à un oubli.
    : (maquetteState.value !== 'brouillon' ? 'Cycle antérieur à la trace — non tracé.' : ''));
const actionHint = computed(() =>
  maquetteState.value === 'valide'
    ? 'Une maquette validée sert de référence aux inscriptions, à la répartition et au planning.'
    : '');

const draftReasons = [{
  key: 'main',
  options: [
    { value: 'volumes', label: 'Volumes horaires à revoir' },
    { value: 'perimetre', label: 'Périmètre des unités ou des modules à revoir' },
    { value: 'mutualisation', label: 'Mutualisation à arbitrer avec une filière partenaire' },
    { value: 'autre', label: 'Autre — à préciser' },
  ],
}];

function select(id) { selectedId.value = id; }
function toggle(id) { collapsed[id] = !collapsed[id]; }
function expandAll() { Object.keys(collapsed).forEach((k) => { collapsed[k] = false; }); }
/**
 * ⚠️ AUCUN DE CES ACTES N'EST BRANCHÉ, ET ILS LE DISENT.
 *
 * Cinq d'entre eux étaient muets : `save` — le CTA primaire — et `openHistory`
 * avaient un corps vide ou réduit à un commentaire ; `submitDraft` ne faisait que
 * refermer le panneau de motif, ce qui ressemble à un succès après qu'on a rempli un
 * motif obligatoire ; `act` avalait en silence toute clé autre que `draft`.
 *
 * ⚠️ C'est la cinquième fois que cette classe se rejoue, et la règle était déjà
 * écrite dans trois vues : « un bouton muet est pire qu'un bouton absent :
 * l'utilisateur croit avoir agi. » Elle est maintenant gardée par l'audit.
 */
const pending = ref('');
const actError = ref('');
const busy = ref(false);
const createOpen = ref(false);
const createError = ref('');
function notBuilt(what) {
  pending.value = what + " — cet acte n'est pas encore branché au serveur. Rien n'a été enregistré.";
}

/* ── Actes BRANCHÉS (M2 g2) — création/édition d'UE + cycle de maquette. ── */
function add() { pending.value = ''; actError.value = ''; createError.value = ''; createOpen.value = true; }
/** La vue AJOUTE les clés de contexte (program, academic_term) — le formulaire n'en fabrique aucune. */
async function submitUe(values) {
  createError.value = '';
  try {
    busy.value = true;
    await createUe({ values: { ...values, program: program.value, academic_term: params.value.term } });
    createOpen.value = false;
    loadTree();
  } catch (e) { createError.value = e.message || 'Création refusée.'; }
  finally { busy.value = false; }
}

async function save() {
  actError.value = ''; pending.value = '';
  if (!selectedUeId.value) return;
  try {
    busy.value = true;
    await updateUe({ ue: selectedUeId.value, values: { ue_name: form.label } });
    loadTree();
  } catch (e) { actError.value = e.message || 'Enregistrement refusé.'; }
  finally { busy.value = false; }
}

async function act(key) {
  if (key === 'draft') { reasonOpen.value = true; return; }
  actError.value = ''; pending.value = '';
  const base = { program: program.value, academic_term: params.value.term };
  try {
    busy.value = true;
    if (key === 'propose') await proposeMaquette(base);
    else if (key === 'validate') await validateMaquette(base);
    loadTree();
  } catch (e) { actError.value = e.message || 'Transition refusée.'; }
  finally { busy.value = false; }
}

async function submitDraft({ reason, detail }) {
  reasonOpen.value = false;
  actError.value = '';
  const motif = [reason, detail].filter(Boolean).join(' — ');
  try {
    busy.value = true;
    await returnMaquetteToDraft({ program: program.value, academic_term: params.value.term, reason: motif });
    loadTree();
  } catch (e) { actError.value = e.message || 'Renvoi refusé.'; }
  finally { busy.value = false; }
}
function openHistory() { notBuilt('Historique de l’unité'); }

const addActions = [{ key: 'ue', label: 'Ajouter une unité' }];

function loadTree() { if (program.value) tree.load({ ...params.value, program: program.value }); }
function loadUsage() { if (selectedUeId.value) usage.load({ ue: selectedUeId.value }); }

onMounted(async () => { await loadProgram(); loadTree(); });
watch([params, program], loadTree);
watch(() => tree.data.value, (d) => {
  if (d?.nodes?.length && !selectedId.value) {
    selectedId.value = (d.nodes.find((n) => n.level === 2) || d.nodes[0]).id;
  }
});
// On observe l'unité PORTEUSE, pas le nœud cliqué : passer d'un module à l'autre
// dans la même unité ne recharge rien.
watch(selectedUeId, (id) => {
  if (!id) return;
  detail.load({ ue: id });
  usage.load({ ue: id });
}, { immediate: true });
watch(() => detail.data.value, (d) => {
  form.code = d?.code || '';
  form.label = d?.label || '';
});
</script>
