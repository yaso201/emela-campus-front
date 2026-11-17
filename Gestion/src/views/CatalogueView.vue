<template>
  <div>
    <StructureTabs />
    <header class="mb-4 flex flex-wrap items-start justify-between gap-5">
      <div>
        <p class="mb-2 text-caption text-ln-gray-500">Structure · <b class="font-semibold text-ln-gray-900">Catalogue des filières</b></p>
        <h1 class="text-h1 tracking-tight text-ln-gray-900">Catalogue des filières</h1>
        <p class="mt-1 text-body-sm text-ln-gray-500">{{ subtitle }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <!-- Revue de design : la bascule n'apparaît que s'il y a des programmes de catalogue à montrer. -->
        <label v-if="all.some((p) => p.custom_catalogue_only)" class="inline-flex items-center gap-2 text-body-sm text-ln-gray-700">
          <input v-model="showCatalogue" type="checkbox" class="h-4 w-4" />
          Programmes de catalogue
        </label>
        <button v-if="can('write:charpente')" type="button" class="ln-btn-primary" @click="open('program')">
          + Créer une filière
        </button>
      </div>
    </header>

    <StateBanner v-if="done" variant="success" lead="Enregistré." :text="done" />
    <StateBanner v-if="formError && !form" variant="error" lead="L'acte a échoué." :text="formError" />

    <CharpenteForm v-if="form === 'program'" name="cat-program" title="Créer une filière"
                   subtitle="Une filière porte ses niveaux et ses parcours ; ses unités se composent ensuite dans l'éditeur de maquette."
                   :fields="PROGRAM_FIELDS" confirm-label="Créer la filière" :error="formError" :busy="busy"
                   footnote="Une filière utilisée ne se supprime pas : elle se désactive."
                   @cancel="close" @submit="submit(createProgram, $event)" />
    <CharpenteForm v-if="form === 'edit'" name="cat-edit" :title="'Modifier — ' + (program?.program_name || '')"
                   :fields="editFields" confirm-label="Enregistrer" refusal-lead="Modification refusée." :error="formError" :busy="busy"
                   footnote="Le sigle et le type sont figés dès qu'une unité ou un étudiant s'y rattache."
                   @cancel="close" @submit="submit(updateProgram, { name: program.name, values: $event })" />
    <CharpenteForm v-if="form === 'level'" name="cat-level" :title="'Ajouter un niveau — ' + (program?.program_name || '')"
                   :fields="LEVEL_FIELDS" confirm-label="Ajouter le niveau" :error="formError" :busy="busy"
                   footnote="Le nombre de semestres borne la maquette du niveau."
                   @cancel="close" @submit="submit(createAcademicLevel, { ...$event, program: program.name })" />
    <CharpenteForm v-if="form === 'parcours'" name="cat-parcours" :title="'Créer un parcours — ' + (program?.program_name || '')"
                   :fields="PARCOURS_FIELDS" confirm-label="Créer le parcours" :error="formError" :busy="busy"
                   footnote="Le parcours naît en Brouillon ; ses unités se composent dans l'éditeur de maquette, puis il suit le cycle de validation."
                   @cancel="close" @submit="submitParcours($event)" />

    <div class="grid items-start gap-5 xl:grid-cols-[352px_1fr]">
      <WorkQueue title="Filières" :items="queueItems" :selected-id="selectedId" :total="queueItems.length"
                 :state="listState === 'denied' ? 'loading' : listState" state-title="Aucune filière"
                 state-message="Le catalogue est vide. Une filière se crée ici ; ses niveaux et ses parcours s'y ajoutent ensuite."
                 @select="selectedId = $event" @retry="loadList" />

      <section v-if="program">
        <StateBanner v-if="program.custom_catalogue_only" variant="info" lead="Programme de catalogue."
                     :text="catalogueSentence" />
        <StateBanner v-else-if="!program.custom_is_active" variant="warning" lead="Filière inactive."
                     text="Elle n'apparaît plus dans les sélecteurs des autres écrans ; son historique reste lisible." />

        <div class="mb-4 overflow-hidden rounded-md-ln border border-ln-gray-200">
          <header class="flex flex-wrap items-center gap-3 border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
            <div>
              <h3 class="text-[14px] font-semibold text-ln-gray-900">{{ program.program_name }}</h3>
              <p class="mt-0.5 text-caption text-ln-gray-500">{{ [program.custom_filiere_acronym, program.custom_program_type || 'type non renseigné'].filter(Boolean).join(' · ') }}</p>
            </div>
            <button v-if="editable" type="button" class="ln-btn-secondary ml-auto" @click="open('edit')">Modifier…</button>
            <button v-if="editable" type="button" class="ln-btn-secondary" :disabled="busy" @click="toggleActive">
              {{ program.custom_is_active ? 'Désactiver la filière' : 'Réactiver la filière' }}
            </button>
          </header>
          <dl class="grid grid-cols-2 gap-x-6 gap-y-3 px-4 py-3 text-body-sm md:grid-cols-4">
            <div v-for="f in identity" :key="f.label">
              <dt class="text-caption text-ln-gray-500">{{ f.label }}</dt>
              <dd class="font-semibold text-ln-gray-900">{{ f.value }}</dd>
            </div>
          </dl>
        </div>

        <div class="mb-2 flex items-center gap-3">
          <h4 class="text-micro font-bold uppercase tracking-wider text-ln-gray-500">Niveaux</h4>
          <!-- K3 (décision e) : le niveau appartient à la MAQUETTE — Responsable de formation (sa filière) et
               Education Manager ; le Gestionnaire académique ne le voit pas (règle 3). -->
          <button v-if="maquetteWritable" type="button" class="ln-btn-secondary ml-auto" @click="open('level')">+ Ajouter un niveau</button>
        </div>
        <DenseTable :state="detailRows('levels')" :row-height="40" max-height="280px"
                    state-title="Aucun niveau"
                    :state-message="maquetteWritable
                      ? 'Sans niveau, la filière n’accueille ni inscription ni maquette.'
                      : 'Sans niveau, la filière n’accueille ni inscription ni maquette. Ses niveaux sont ajoutés par son responsable de formation ou par l’Education Manager.'">
          <template #head>
            <tr>
              <th :class="headTh" class="!text-left">Code</th>
              <th :class="headTh" class="!text-left">Niveau</th>
              <th :class="headTh">Ordre</th>
              <th :class="headTh">Semestres</th>
              <th :class="headTh">Durée max.</th>
            </tr>
          </template>
          <template #body>
            <tr v-for="l in levels" :key="l.name">
              <td :class="bodyTd" class="!text-left font-mono text-[11.5px]">{{ l.level_code }}</td>
              <td :class="bodyTd" class="!text-left">{{ l.level_name }}</td>
              <td :class="bodyTd">{{ l.level_order }}</td>
              <td :class="bodyTd">{{ l.max_semesters }}</td>
              <td :class="bodyTd">{{ l.max_duration_years }} ans</td>
            </tr>
          </template>
        </DenseTable>

        <div class="mb-2 mt-6 flex items-center gap-3">
          <h4 class="text-micro font-bold uppercase tracking-wider text-ln-gray-500">Parcours</h4>
          <router-link :to="{ name: 'structure' }" class="text-caption font-semibold text-ln-blue-600">Composer dans l'éditeur de maquette</router-link>
          <button v-if="maquetteWritable" type="button" class="ln-btn-secondary ml-auto"
                  @click="openParcours">+ Créer un parcours</button>
        </div>
        <DenseTable :state="detailRows('parcours')" :row-height="40" max-height="280px"
                    state-title="Aucun parcours"
                    state-message="Un parcours (majeure, mineure, option) regroupe des unités au choix ; la filière peut s'en passer.">
          <template #head>
            <tr>
              <th :class="headTh" class="!text-left">Code</th>
              <th :class="headTh" class="!text-left">Parcours</th>
              <th :class="headTh" class="!text-left">Nature</th>
              <th :class="headTh">Choix</th>
              <th :class="headTh">ECTS</th>
              <th :class="headTh" class="!text-left">État</th>
            </tr>
          </template>
          <template #body>
            <tr v-for="p in parcours" :key="p.name">
              <td :class="bodyTd" class="!text-left font-mono text-[11.5px]">{{ p.parcours_code }}</td>
              <td :class="bodyTd" class="!text-left">{{ p.parcours_name }}</td>
              <td :class="bodyTd" class="!text-left">{{ p.parcours_type }}</td>
              <td :class="bodyTd">{{ p.choice_count }}</td>
              <td :class="bodyTd">{{ p.total_ects }}</td>
              <td :class="bodyTd" class="!text-left">
                <StatusPill :status="STATUS[p.validation_status] || 'brouillon'" :label="p.validation_status" />
              </td>
            </tr>
          </template>
        </DenseTable>
      </section>
    </div>
  </div>
</template>

<script setup>
/**
 * Étape 2 de la boucle · le CATALOGUE DES FILIÈRES (MANDAT-10, E3', maquette).
 *
 * Les filières, leurs niveaux et leurs parcours : ce que l'éditeur de maquette PRÉSUPPOSE (Lot 2 : « Licence 2 ·
 * Semestre 1 » existe avant qu'on y ajoute une unité). Sans cet écran, une filière ou un niveau ne naît qu'au Desk.
 *
 * Droits : lecture `read:structure` ; filières et niveaux `write:charpente` (Gestionnaire académique) ; parcours
 * `write:structure` (responsable de formation, Education Manager) — le parcours appartient à la maquette.
 * Les programmes de CATALOGUE (Bachelor, double diplôme : `custom_catalogue_only`) sont masqués par défaut et en
 * lecture seule (Q1-bis c, choix de la MOA).
 */
import { computed, onMounted, ref, watch } from 'vue';
import { WorkQueue, DenseTable, StatusPill, StateBanner, headTh, bodyTd } from '../components/index.js';
import CharpenteForm from './structure/CharpenteForm.vue';
import StructureTabs from './structure/StructureTabs.vue';
import { useSession } from '../composables/useSession.js';
import { useResource } from '../composables/useResource.js';
import {
  listProgramCatalogue, getProgramDetail, createProgram, updateProgram, setProgramActive,
  createAcademicLevel, createParcours,
} from '../api/charpente.js';
import { getStructureTree } from '../api/structure.js';
import { useAcademicContext } from '../composables/useAcademicContext.js';

const { can, scope } = useSession();
const { params } = useAcademicContext();
const listRes = useResource(listProgramCatalogue, { isEmpty: (d) => !d?.length });
const detailRes = useResource(getProgramDetail, { isEmpty: (d) => !d });
const listState = listRes.state;
const showCatalogue = ref(false);
const selectedId = ref(null);
const form = ref('');
const formError = ref('');
const done = ref('');
const busy = ref(false);

const all = computed(() => listRes.data.value || []);
const programs = computed(() => all.value.filter((p) => showCatalogue.value || !p.custom_catalogue_only));
const program = computed(() => all.value.find((p) => p.name === selectedId.value) || null);
const detail = computed(() => detailRes.data.value || null);
const levels = computed(() => detail.value?.levels || []);
const parcours = computed(() => detail.value?.parcours || []);
const editable = computed(() => can('write:charpente') && !!program.value && !program.value.custom_catalogue_only);

/**
 * La portée du lecteur, telle que la session la rend (`scope.programs` : la liste des filières liées, ou null pour
 * une visibilité globale). Un bouton d'acte hors de la portée serait un bouton mort : il n'est pas rendu.
 */
function inScope(programName) {
  const s = scope.value || {};
  if (Array.isArray(s.programs)) return s.programs.includes(programName);
  if (s.program) return s.program === programName;          // forme du simulacre
  return true;
}
/** Niveaux et parcours relèvent de la maquette (K3, décision e) : RF dans sa filière, EM. */
const maquetteWritable = computed(() => can('write:structure') && !!program.value
  && !program.value.custom_catalogue_only && inScope(program.value.name));

const STATUS = { Brouillon: 'brouillon', 'Proposé': 'propose', 'Validé': 'valide' };

function programStatus(p) {
  if (p.custom_catalogue_only) return { status: 'propose', label: 'Catalogue seul' };
  if (!p.custom_is_active) return { status: 'echue', label: 'Inactive' };
  return { status: 'valide', label: 'Active' };
}
const queueItems = computed(() => programs.value.map((p) => ({
  id: p.name,
  title: p.program_name,
  // Revue MANDAT-10 (constat 2) : `list_programs` ne compte pas les niveaux — la liste affichait « undefined
  // niveau » en branché. Le nombre de niveaux se lit à la fiche (`get_program`).
  subtitle: [p.custom_filiere_acronym, p.custom_program_type, p.custom_nb_annees ? p.custom_nb_annees + ' ans' : null]
    .filter(Boolean).join(' · '),
  status: programStatus(p).status,
  statusLabel: programStatus(p).label,
})));

const subtitle = computed(() => {
  if (listState.value !== 'ready') return 'Chargement du catalogue';
  const n = all.value.filter((p) => !p.custom_catalogue_only).length;
  const c = all.value.length - n;
  return n + (n > 1 ? ' filières' : ' filière')
    + (c ? ' · ' + c + (c > 1 ? ' programmes de catalogue' : ' programme de catalogue') + (showCatalogue.value ? '' : (c > 1 ? ' masqués' : ' masqué')) : '');
});

const identity = computed(() => {
  const p = program.value;
  if (!p) return [];
  return [
    { label: 'Sigle', value: p.custom_filiere_acronym || 'non renseigné' },
    { label: 'Durée', value: p.custom_nb_annees ? p.custom_nb_annees + ' ans' : 'non renseignée' },
    { label: 'Crédits requis', value: p.custom_total_ects_required ? p.custom_total_ects_required + ' ECTS' : 'non renseignés' },
    // Le nom du responsable vient de la FICHE (`get_program`) ; la liste ne porte que l'identifiant.
    { label: 'Responsable', value: detail.value?.responsable_name || p.custom_responsable_programme || 'non désigné' },
    { label: 'Unités rattachées', value: detail.value?.counters?.ues ?? '…' },
    { label: 'Étudiants inscrits', value: detail.value?.counters?.students ?? '…' },
  ];
});
// La composition d'un double diplôme vient de la FICHE (`get_program`) : la liste ne la porte pas.
const catalogueSentence = computed(() => (detail.value?.custom_dd_enabled
  ? 'Double diplôme : il assemble ' + detail.value.custom_dd_component_1 + ' et ' + detail.value.custom_dd_component_2
    + '. Il se lit ici ; il se modifie avec ses deux composantes.'
  : 'Programme présenté au catalogue d’admission, porté par un partenaire. Il se lit ici ; aucune maquette n’y est rattachée.'));

function detailRows(key) {
  if (detailRes.state.value !== 'ready') return detailRes.state.value === 'denied' ? 'loading' : detailRes.state.value;
  return (detail.value?.[key] || []).length ? 'ready' : 'empty';
}

/* Champs — au contrat proposé au serveur. */
const TYPES = ['Licence', 'Cycle Préparatoire', 'Master', 'Bachelor', 'Double-Diplomation'];
const PROGRAM_FIELDS = [
  { key: 'program_name', label: 'Intitulé', required: true, placeholder: 'Ex. Licence Informatique et Systèmes' },
  // La règle est celle du serveur (contrôleur Program) : trois majuscules, rien d'autre — dite à la saisie.
  { key: 'custom_filiere_acronym', label: 'Sigle', required: true, placeholder: 'Ex. LIS',
    live: (f) => (f.custom_filiere_acronym && !/^[A-Z]{3}$/.test(f.custom_filiere_acronym)
      ? { text: 'Trois lettres majuscules exactement (ex. LIS) : le sigle préfixe les codes d’unité.', tone: 'error' } : null) },
  { key: 'custom_program_type', label: 'Type', type: 'select', required: true, options: TYPES.slice(0, 3) },
  { key: 'custom_nb_annees', label: 'Durée (années)', type: 'number', min: 1, required: true },
  { key: 'custom_total_ects_required', label: 'Crédits requis (ECTS)', type: 'number', min: 0 },
];
const editFields = computed(() => [
  { key: 'program_name', label: 'Intitulé', required: true, initial: program.value?.program_name },
  { key: 'custom_nb_annees', label: 'Durée (années)', type: 'number', min: 1, initial: program.value?.custom_nb_annees },
  { key: 'custom_total_ects_required', label: 'Crédits requis (ECTS)', type: 'number', min: 0,
    initial: program.value?.custom_total_ects_required },
]);

/** Activer ou désactiver : un acte à part (`set_program_active`), pas un champ du formulaire. */
async function toggleActive() {
  formError.value = '';
  try {
    busy.value = true;
    await setProgramActive({ program: program.value.name, is_active: program.value.custom_is_active ? 0 : 1 });
    done.value = program.value.custom_is_active ? 'La filière est désactivée.' : 'La filière est réactivée.';
    loadList();
  } catch (e) { done.value = ''; formError.value = e.message || 'Refusé.'; }
  finally { busy.value = false; }
}
const LEVEL_FIELDS = [
  { key: 'level_code', label: 'Code', required: true, placeholder: 'Ex. LIS-L1' },
  { key: 'level_name', label: 'Intitulé', required: true, placeholder: 'Ex. Licence 1' },
  { key: 'level_order', label: 'Ordre', type: 'number', min: 1, required: true },
  { key: 'max_semesters', label: 'Semestres', type: 'number', min: 1, required: true, initial: 2 },
  { key: 'max_duration_years', label: 'Durée maximale (années)', type: 'number', min: 1, required: true, initial: 2 },
];
/**
 * Un parcours naît AVEC ses unités : le contrôleur refuse un nombre de choix supérieur au nombre d'unités, donc un
 * parcours vide. Les unités proposées sont celles de la filière pour l'année du contexte (arbre de structure).
 */
const ueOptions = ref([]);
const PARCOURS_FIELDS = computed(() => [
  { key: 'parcours_code', label: 'Code', placeholder: 'Ex. LIS-M1' },
  { key: 'parcours_name', label: 'Intitulé', required: true },
  { key: 'parcours_type', label: 'Nature', type: 'select', required: true, options: ['Majeure', 'Mineure', 'Option'] },
  { key: 'ues', label: 'Unités du parcours', type: 'multiselect', required: true, options: ueOptions.value,
    hint: ueOptions.value.length ? 'Plusieurs choix possibles (Ctrl ou Cmd).' : 'Aucune unité pour cette filière sur l’année du contexte : composez d’abord la maquette.' },
  { key: 'choice_count', label: 'Unités à choisir', type: 'number', min: 1, required: true, initial: 1,
    live: (f) => (Number(f.choice_count) > (f.ues || []).length
      ? { text: 'Le nombre de choix ne peut pas dépasser le nombre d’unités du parcours.', tone: 'error' } : null) },
]);
async function openParcours() {
  ueOptions.value = [];
  try {
    const tree = await getStructureTree({ program: program.value.name, academic_year: params.value.academic_year });
    ueOptions.value = (tree?.nodes || []).filter((n) => n.level === 2).map((n) => ({ value: n.id, label: n.label }));
  } catch { /* la liste vide le dit */ }
  open('parcours');
}
function submitParcours(values) {
  return submit(createParcours, { ...values, ues: (values.ues || []).map((course_ue) => ({ course_ue })), program: program.value.name });
}

function open(which) { form.value = which; formError.value = ''; done.value = ''; }
function close() { form.value = ''; }
async function submit(act, payload) {
  formError.value = '';
  try {
    busy.value = true;
    await act(payload);
    form.value = '';
    done.value = 'La modification est enregistrée.';
    loadList();
    if (selectedId.value) detailRes.load({ program: selectedId.value });
  } catch (e) { formError.value = e.message || 'Refusé.'; }
  finally { busy.value = false; }
}

async function loadList() {
  await listRes.load({});
  if (!program.value) selectedId.value = programs.value[0]?.name || null;
}
watch(selectedId, (id) => { done.value = ''; if (id) detailRes.load({ program: id }); });
watch(showCatalogue, () => { if (!programs.value.some((p) => p.name === selectedId.value)) selectedId.value = programs.value[0]?.name || null; });
onMounted(loadList);
</script>
