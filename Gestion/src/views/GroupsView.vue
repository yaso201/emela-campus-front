<template>
  <div>
    <header class="mb-4 flex flex-wrap items-start justify-between gap-5">
      <div>
        <p class="mb-2 text-caption text-ln-gray-500">Groupes · <b class="font-semibold text-ln-gray-900">Peuplement</b></p>
        <h1 class="text-h1 tracking-tight text-ln-gray-900">Groupes — {{ programLabel || '…' }}</h1>
        <p class="mt-1 text-body-sm text-ln-gray-500">{{ subtitle }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <ProgramPicker />
        <router-link :to="{ name: 'enrollment' }" class="ln-btn-secondary">Inscriptions</router-link>
        <button v-if="can('write:groups')" type="button" class="ln-btn-primary" @click="openCreate">
          + Créer un groupe
        </button>
      </div>
    </header>

    <StateBanner v-if="pending" variant="warning" lead="Acte non disponible." :text="pending" />
    <StateBanner v-if="actError" variant="error" lead="L'acte a échoué." :text="actError" />

    <div v-if="report" class="mb-4">
      <BatchReport title="Peuplement du groupe" :report="report"
                   ok-label="ajoutés" ko-label="non ajoutés" failures-first :retryable="false"
                   footnote="Un étudiant déjà membre compte réussi (idempotent) ; un inéligible échoue, motivé." />
      <button type="button" class="ln-btn-secondary mt-2" @click="report = null">Fermer le rapport</button>
    </div>

    <GroupForm v-if="createOpen" :program="program" :year-label="year?.label || ''"
               :error="createError" :busy="busy" @cancel="createOpen = false" @submit="submitGroup" />

    <div class="grid items-start gap-5 xl:grid-cols-[352px_1fr]">
      <WorkQueue title="Groupes de la filière" :items="queueItems" :selected-id="selectedId"
                 :total="queueItems.length"
                 :state="groupsState === 'denied' ? 'loading' : groupsState"
                 state-title="Aucun groupe"
                 state-message="Cette filière n'a pas encore de groupe. Un groupe se crée par promotion, par sous-groupe ou par module."
                 @select="selectedId = $event" @retry="loadGroups" />

      <section v-if="selected">
        <!-- Un effectif au-delà de la capacité n'est pas une erreur : le serveur
             l'accepte, et c'est parfois voulu. L'écran le signale. -->
        <StateBanner v-if="overCapacity" variant="warning"
                     :lead="'Effectif au-delà de la capacité déclarée : ' + selected.strength + ' pour ' + selected.max_strength + '.'">
          Rien n'est bloqué — un dépassement se constate, il ne se refuse pas. Mais un rattachement
          d'inscription peut échouer sur ce groupe : c'est la cause la plus fréquente d'un étudiant
          inscrit sans groupe (voir <router-link :to="{ name: 'enrollment' }" class="font-semibold text-ln-blue-600">les orphelins</router-link>).
        </StateBanner>

        <div class="mb-4 flex flex-wrap items-stretch gap-6 rounded-md-ln border border-ln-gray-200 bg-ln-gray-50 px-5 py-4">
          <div v-for="b in totals" :key="b.label" class="flex flex-col gap-0.5">
            <span class="tabular text-[20px] font-bold leading-tight" :class="b.tone">{{ b.value }}</span>
            <span class="text-caption text-ln-gray-500">{{ b.label }}</span>
          </div>
          <p class="ml-auto max-w-[320px] self-center text-caption leading-relaxed text-ln-gray-500">
            L'effectif compte les membres <b class="font-semibold">actifs</b>. Un étudiant désactivé
            reste membre du groupe — il est affiché, jamais retiré en silence.
          </p>
        </div>

        <h4 class="mb-2 text-micro font-bold uppercase tracking-wider text-ln-gray-500">Membres du groupe</h4>
        <DenseTable :state="detailState === 'denied' ? 'loading' : detailState" :row-height="40"
                    :skeleton-widths="[56, 240, 140, 110]" max-height="360px"
                    state-title="Groupe vide"
                    state-message="Aucun étudiant n'est rattaché à ce groupe. Le peuplement se fait depuis les inscriptions au programme."
                    @retry="loadDetail">
          <template #head>
            <tr>
              <th :class="headTh">N°</th>
              <th :class="headTh" class="!text-left">Étudiant</th>
              <th :class="headTh" class="!text-left">Matricule</th>
              <th :class="headTh" class="!text-left">État</th>
              <th :class="headTh"></th>
            </tr>
          </template>
          <template #body>
            <tr v-for="s in members" :key="s.student" :class="s.active ? '' : 'text-ln-gray-500'">
              <td :class="bodyTd">{{ s.group_roll_number }}</td>
              <td :class="bodyTd" class="!text-left">{{ s.student_name }}</td>
              <td :class="bodyTd" class="!text-left font-mono text-[11.5px] text-ln-gray-500">{{ s.student }}</td>
              <td :class="bodyTd" class="!text-left">
                <StatusPill :status="s.active ? 'valide' : 'brouillon'" :label="s.active ? 'Actif' : 'Désactivé'" />
              </td>
              <td :class="bodyTd">
                <!-- « Retirer du groupe » désactive (l'étudiant RESTE membre, historique) —
                     jamais « effacer ». Offert sur un membre actif seulement. -->
                <button v-if="can('write:groups') && s.active" type="button"
                        class="h-[26px] rounded-sm-ln border border-ln-gray-300 px-2 text-caption font-semibold text-ln-gray-700"
                        @click="deactivateMember(s)">Retirer</button>
              </td>
            </tr>
          </template>
          <template #legend>
            <span>Un étudiant <b class="font-semibold text-ln-gray-900">désactivé</b> reste dans la liste : il a
              produit des présences et des notes. Le masquer ferait disparaître son historique du groupe.</span>
          </template>
        </DenseTable>

        <h4 class="mb-2 mt-6 text-micro font-bold uppercase tracking-wider text-ln-gray-500">Enseignants affectés</h4>
        <div v-if="detailState === 'ready' && !instructors.length"
             class="flex items-start gap-3 rounded-md-ln border border-dashed border-ln-gray-300 bg-ln-warning-bg p-4 text-caption leading-relaxed text-[#6B4415]">
          <span class="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ln-warning"></span>
          <p>
            <b class="font-semibold">Aucun enseignant n'est affecté à ce groupe.</b> Les séances peuvent
            être planifiées quand même — l'enseignant se choisit à la séance — mais aucune feuille de
            présence n'a de titulaire. Ce groupe figure dans les orphelins.
          </p>
        </div>
        <div v-else class="flex flex-wrap gap-2">
          <span v-for="i in instructors" :key="i.instructor"
                class="inline-flex items-center gap-2 rounded-sm-ln border border-ln-gray-300 px-3 py-1.5 text-caption">
            {{ i.instructor_name }}
            <span class="font-mono text-[11px] text-ln-gray-500">{{ i.instructor }}</span>
          </span>
          <!-- ⏸ M2 : l'affectation existe côté serveur (assign_instructor) mais AUCUNE
               lecture ne rend la liste des enseignants assignables — sans source, pas
               d'identifiant à envoyer (rapport M2 §4, demande serveur). -->
          <button v-if="can('write:groups')" type="button"
                  class="inline-flex items-center rounded-sm-ln border border-dashed border-ln-gray-300 px-3 py-1.5 text-caption font-semibold text-ln-blue-600"
                  @click="notBuilt('Affectation d’un enseignant — en attente d’une lecture serveur des enseignants assignables (demande M2)')">+ Affecter</button>
        </div>

        <!-- Le peuplement : éligibles à gauche du geste, rapport ligne à ligne
             après. C'est le seul acte de cet écran qui écrit. -->
        <div class="mt-6 overflow-hidden rounded-md-ln border border-ln-gray-200">
          <header class="flex flex-wrap items-center gap-3 border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
            <div>
              <h3 class="text-[14px] font-semibold text-ln-gray-900">Peupler depuis les inscriptions</h3>
              <p class="mt-0.5 text-caption text-ln-gray-500">
                Les étudiants inscrits au programme, éligibles à ce groupe.
              </p>
            </div>
            <button v-if="can('write:groups')" type="button" class="ln-btn-primary ml-auto"
                    :disabled="!selectedStudents.length || busy"
                    @click="populate">
              Peupler · {{ selectedStudents.length || eligible.length }} candidats
            </button>
          </header>
          <BlockState v-if="eligibleState !== 'ready'" :state="eligibleState === 'denied' ? 'loading' : eligibleState"
                      title="Aucun étudiant éligible"
                      message="Aucune inscription au programme ne correspond à cette année et à ce découpage. Ce n'est pas une erreur : la liste est vide."
                      :rows="4" :skeleton-widths="[240, 140, 110]" :row-height="36" class="m-4"
                      @retry="loadEligible" />
          <div v-else class="px-4 py-3">
            <label v-for="s in eligible" :key="s.student"
                   class="flex cursor-pointer items-center gap-3 border-b border-ln-gray-100 py-2 text-caption last:border-0">
              <input type="checkbox" class="h-4 w-4 accent-ln-blue-800"
                     :value="s.student" :checked="picked.has(s.student)"
                     :disabled="memberIds.has(s.student)"
                     @change="togglePick(s.student, $event.target.checked)" />
              <span class="text-ln-gray-900">{{ s.student_name }}</span>
              <span class="font-mono text-[11px] text-ln-gray-500">{{ s.student }}</span>
              <StatusPill class="ml-auto" :status="s.active ? 'valide' : 'brouillon'"
                          :label="s.active ? 'Actif' : 'Désactivé'" />
              <StatusPill v-if="memberIds.has(s.student)" status="propose" label="Déjà membre" />
            </label>
          </div>
        </div>
      </section>

      <section v-else class="rounded-md-ln border border-dashed border-ln-gray-300 px-6 py-8 text-center">
        <h4 class="text-h3 text-ln-gray-900">Choisissez un groupe</h4>
        <p class="mx-auto mt-1.5 max-w-md text-body-sm leading-relaxed text-ln-gray-500">
          Un groupe porte ses membres, ses enseignants et sa capacité. Le peuplement se fait groupe par
          groupe, depuis les inscriptions au programme.
        </p>
      </section>
    </div>
  </div>
</template>

<script setup>
/**
 * Grappe 4 · Groupes et peuplement.
 *
 * ⚠️ LES NOMS D'APPEL SONT RÉELS, lus dans le code serveur (voir `api/groups.js`).
 * Le branchement a montré que quatre-vingt-seize noms inventés donnaient zéro
 * correspondance : cette grappe est écrite contre les vraies fonctions.
 *
 * Trois choses que cet écran refuse de taire :
 *   — un étudiant DÉSACTIVÉ reste membre : il a produit des présences et des
 *     notes, le masquer ferait disparaître son historique ;
 *   — un effectif au-delà de la capacité est SIGNALÉ, jamais refusé — mais il est
 *     la cause la plus fréquente d'un étudiant inscrit sans groupe ;
 *   — un groupe sans enseignant le dit en ambre : les séances se planifient quand
 *     même, aucune feuille de présence n'a de titulaire.
 */
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { WorkQueue, DenseTable, StatusPill, StateBanner, BatchReport, headTh, bodyTd } from '../components/index.js';
import BlockState from '../components/internal/BlockState.vue';
import GroupForm from './groupes/GroupForm.vue';
import { useSession } from '../composables/useSession.js';
import { useAcademicContext } from '../composables/useAcademicContext.js';
import { useResource } from '../composables/useResource.js';
import {
  listGroups, getGroup, listGroupCandidates,
  createGroup, addStudentsToGroup, deactivateStudentsInGroup,
} from '../api/groups.js';
import { useProgramScope } from '../composables/useProgramScope.js';
import ProgramPicker from './planning/ProgramPicker.vue';

const { can } = useSession();
const { params, year } = useAcademicContext();
const pending = ref('');
const actError = ref('');
const busy = ref(false);
const report = ref(null);
const createOpen = ref(false);
const picked = reactive(new Set());
const selectedId = ref(null);

/**
 * LE BOUCHON DE FILIÈRE EST RETIRÉ.
 *
 * Il portait un nom de filière écrit en dur, envoyé à un vrai point d'entrée —
 * de la même famille qu'un chemin inventé. La source existe et elle est double :
 * la portée du lecteur quand elle est fixée, les options de structure sinon.
 * `useProgramScope` porte les deux, et le sélecteur affiche un LIBELLÉ quand la
 * portée est verrouillée — jamais un sélecteur grisé.
 */
const { program, label: programLabel, load: loadProgram } = useProgramScope();

const groupsRes = useResource(listGroups, { isEmpty: (d) => !d?.length });
/**
 * ⚠️ UN SEUL APPEL DE DÉTAIL. La première version en faisait trois — le groupe,
 * ses membres, ses enseignants — et l'effectif d'en-tête pouvait cesser de
 * s'accorder avec la liste en dessous. `get_group` rend les trois ensemble, et
 * `active_count` est sommé sur `students` au serveur.
 */
const detailRes = useResource(getGroup, { isEmpty: (d) => !d });
const eligibleRes = useResource(listGroupCandidates, { isEmpty: (d) => !d?.length });

const groupsState = groupsRes.state;
const detailState = detailRes.state;
const eligibleState = eligibleRes.state;

const groups = computed(() => groupsRes.data.value || []);
const detail = computed(() => detailRes.data.value || null);
const members = computed(() => detail.value?.students || []);
const instructors = computed(() => detail.value?.instructors || []);
const eligible = computed(() => eligibleRes.data.value || []);
const memberIds = computed(() => new Set(members.value.map((s) => s.student)));

const selected = computed(() => groups.value.find((g) => g.name === selectedId.value) || null);
const overCapacity = computed(() =>
  !!selected.value && selected.value.max_strength > 0 && selected.value.active_count > selected.value.max_strength);

const queueItems = computed(() => groups.value.map((g) => ({
  id: g.name,
  title: g.group_name,
  subtitle: g.max_strength
    ? g.active_count + ' membres sur ' + g.max_strength + ' · ' + basis(g.group_based_on)
    : g.active_count + ' membres · ' + basis(g.group_based_on),
  // ⚠️ Vocabulaire de StatusPill, pas celui de la file de travail : un statut
  // hors vocabulaire retombe en gris et affiche sa propre clé — trois lignes
  // affichaient littéralement « ok ».
  status: g.max_strength && g.active_count > g.max_strength ? 'suspendue' : 'valide',
  statusLabel: g.max_strength && g.active_count > g.max_strength ? 'Au-delà de la capacité' : 'Dans la capacité',
})));

const BASIS = { Batch: 'par promotion', Course: 'par module', Activity: 'par activité' };
function basis(k) { return BASIS[k] || k; }

const subtitle = computed(() =>
  groupsState.value !== 'ready' ? 'Chargement des groupes'
    : groups.value.length + ' groupes · année ' + (year.value?.label || '—'));

const totals = computed(() => {
  const g = selected.value;
  if (!g) return [];
  return [
    { value: g.active_count, label: 'Membres actifs', tone: 'text-ln-gray-900' },
    { value: g.max_strength || '—', label: 'Capacité déclarée',
      tone: overCapacity.value ? 'text-ln-warning' : 'text-ln-gray-900' },
    { value: instructors.value.length, label: 'Enseignants affectés',
      tone: instructors.value.length ? 'text-ln-gray-900' : 'text-ln-warning' },
  ];
});

function notBuilt(what) { pending.value = what + " — cet acte n'est pas encore branché au serveur. Rien n'a été enregistré."; }

/* ── Actes BRANCHÉS (M2 g4) — création, peuplement, retrait de membre. ── */
const selectedStudents = computed(() => [...picked]);
function togglePick(student, on) { if (on) picked.add(student); else picked.delete(student); }
const createError = ref('');
function openCreate() { pending.value = ''; actError.value = ''; createError.value = ''; createOpen.value = true; }
/**
 * La vue-parente AJOUTE les clés de contexte (`program`, `academic_year`) aux
 * champs émis par le formulaire — le formulaire ne fabrique aucune clé de contexte.
 */
async function submitGroup(values) {
  createError.value = '';
  try {
    busy.value = true;
    await createGroup({ ...values, program: program.value, academic_year: params.value.academic_year });
    createOpen.value = false;
    loadGroups();
  } catch (e) { createError.value = e.message || 'Création refusée.'; }
  finally { busy.value = false; }
}

async function populate() {
  actError.value = ''; pending.value = '';
  const students = selectedStudents.value;
  if (!students.length) { pending.value = 'Cochez au moins un candidat à ajouter.'; return; }
  try {
    busy.value = true;
    report.value = await addStudentsToGroup({ group: selectedId.value, students });
    picked.clear();
    loadDetail(); loadEligible();
  } catch (e) { actError.value = e.message || 'Peuplement refusé.'; }
  finally { busy.value = false; }
}

async function deactivateMember(s) {
  actError.value = ''; pending.value = '';
  try {
    busy.value = true;
    await deactivateStudentsInGroup({ group: selectedId.value, students: [s.student] });
    loadDetail();
  } catch (e) { actError.value = e.message || 'Retrait refusé.'; }
  finally { busy.value = false; }
}

function loadGroups() { groupsRes.load({ ...params.value, program: program.value }); }
/**
 * ⚠️ `include_inactive: 1` : un membre désactivé RESTE au groupe, avec son rang.
 * Le masquer ferait croire qu'il a été retiré, et l'écran dit précisément le
 * contraire — « retirer du groupe », pas « effacer ».
 */
function loadDetail() {
  if (selectedId.value) detailRes.load({ name: selectedId.value, include_inactive: 1 });
}

/**
 * ⚠️ Signature EXACTE de `student_group.get_students` : `academic_year` et
 * `group_based_on` sont obligatoires, dans cet ordre. Passer autre chose fait
 * lever le serveur — et c'est ce genre d'écart que l'invention de noms cachait.
 *
 * ⚠️ `academic_year` VIENT DU CONTEXTE, jamais du libellé.
 *
 * La première version passait `year.label` (« 2026-2027 ») là où le contexte
 * envoie `year.id` (« AY-2026 ») : deux valeurs sous le même nom de paramètre,
 * dans la même application. Et le défaut aurait été SILENCIEUX — cette fonction
 * rend `[]` quand rien ne correspond, donc le panneau aurait affiché
 * « Aucun étudiant éligible », un état vide parfaitement crédible, sur l'écran
 * qui écrit.
 *
 * ⚠️ MAIS ON NE PEUT PAS ÉPANDRE `params` NON PLUS.
 *
 * Le contexte porte `{ academic_year, term }` ; cette signature n'a pas de
 * paramètre `term` — son optionnel s'appelle `academic_term`. Épandre envoyait
 * donc une clé hors signature : soit elle est filtrée et le semestre est perdu
 * en silence, soit c'est une erreur au branchement. Le nom se mappe, il ne se
 * devine pas.
 *
 * ⚠️ ET LE SEMESTRE N'EST PAS TRANSMIS, avec son motif.
 *
 * `academic_term` filtrerait les INSCRIPTIONS AU PROGRAMME par semestre — or une
 * inscription au programme est annuelle, comme le groupe et comme la répartition
 * (lot 6). Passer un semestre à un objet annuel ne rendrait rien, et rendrait
 * `[]` : le même vide crédible que ci-dessus, par l'autre bout. Si un groupe peut
 * être semestriel, c'est une question ouverte au relevé — pas un paramètre qu'on
 * ajoute pour voir.
 */
/**
 * ⚠️ UN SEUL PARAMÈTRE : le groupe. `list_group_candidates(group)` tranche
 * l'éligibilité au serveur — « source unique, indépendante des System Defaults
 * vendor ». La première version passait l'année et le découpage pour dériver
 * l'éligibilité elle-même : elle aurait divergé de la règle serveur dès le
 * premier cas de tronc commun.
 */
function loadEligible() {
  if (selectedId.value) eligibleRes.load({ group: selectedId.value });
}

onMounted(async () => { await loadProgram(); loadGroups(); });

/**
 * ⚠️ Même exposition qu'à l'écran des inscriptions : sans remise à zéro, un
 * groupe sélectionné survivait au changement d'année. Si son nom existe encore
 * dans la nouvelle, l'observateur ne se déclenche pas — et membres, enseignants
 * et éligibles restent ceux de l'année précédente, sans que rien ne le dise.
 */
watch([params, program], () => { selectedId.value = null; loadGroups(); });
watch(groups, (g) => { if (g.length && !selectedId.value) selectedId.value = g[0].name; });
watch(selectedId, () => { loadDetail(); loadEligible(); }, { immediate: true });
</script>
