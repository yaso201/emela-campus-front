<template>
  <div>
    <header class="mb-4 flex flex-wrap items-start justify-between gap-5">
      <div>
        <p class="mb-2 text-caption text-ln-gray-500">
          Planning · <b class="font-semibold text-ln-gray-900">Épreuves</b>
        </p>
        <h1 class="text-h1 tracking-tight text-ln-gray-900">
          {{ exam ? exam.course + ' — ' + exam.exam_type : 'Épreuves' }}
        </h1>
        <p class="mt-1 text-body-sm text-ln-gray-500">{{ subtitle }}</p>
      </div>
      <div v-if="exam" class="flex flex-wrap items-center gap-2">
        <button v-if="can('write:exams')" type="button" class="ln-btn-secondary"
                @click="populateOpen = true">Peupler depuis un groupe…</button>
        <!-- ⚠️ Le bouton dit PUBLIER, jamais « convoquer » — mais la phrase qui
             l'accompagne dit que publier convoque. L'acte a un nom, ses effets en
             ont un autre, et l'écran porte les deux. -->
        <button v-if="can('publish:planning') && exam.custom_planning_status !== 'Publié'"
                type="button" class="ln-btn-primary" @click="notBuilt('Publication de l’épreuve')">
          Publier l'épreuve
        </button>
      </div>
    </header>

    <StateBanner v-if="pending" variant="warning" lead="Acte non disponible." :text="pending" />

    <!-- LA PHRASE CENTRALE DE CET ÉCRAN -->
    <StateBanner variant="info" lead="Inscrire n'est pas convoquer.">
      Composer la liste des candidats ne prévient personne. C'est la
      <b class="font-semibold">publication</b> de l'épreuve qui vaut convocation : elle fait apparaître
      la séance dans l'emploi du temps des étudiants inscrits. Tant que l'épreuve est en brouillon, on
      peut ajouter, retirer et recomposer sans qu'aucun étudiant ne le sache.
    </StateBanner>

    <div class="grid items-start gap-5 xl:grid-cols-[368px_1fr]">
      <WorkQueue title="Épreuves de la filière" :items="queueItems" :selected-id="selectedId"
                 :total="queueItems.length"
                 :state="listState === 'denied' ? 'loading' : listState"
                 state-title="Aucune épreuve programmée"
                 state-message="Aucune épreuve n'est inscrite au registre pour cette filière et ce semestre."
                 @select="selectedId = $event" @retry="reload" />

      <section v-if="exam">
        <div class="mb-4 overflow-hidden rounded-md-ln border border-ln-gray-200">
          <header class="border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
            <h3 class="text-[14px] font-semibold text-ln-gray-900">L'épreuve</h3>
          </header>
          <dl class="px-4 py-3">
            <div v-for="row in examRows" :key="row.k"
                 class="flex items-baseline gap-3 border-b border-ln-gray-100 py-2 last:border-b-0">
              <dt class="w-[152px] flex-shrink-0 text-caption text-ln-gray-500">{{ row.k }}</dt>
              <dd class="text-body-sm text-ln-gray-900">
                <StatusPill v-if="row.pill" :status="row.pill" :label="row.v" />
                <template v-else>{{ row.v }}</template>
              </dd>
            </div>
          </dl>
          <!-- Deux états, deux phrases — et elles ne se ressemblent pas. -->
          <p v-if="published"
             class="border-t border-ln-gray-200 bg-ln-success-bg px-4 py-3 text-caption leading-relaxed text-[#0B5341]">
            <b class="font-semibold">Publiée le {{ exam.published_on }} — les {{ exam.student_count }} candidats
            inscrits ont été convoqués.</b> Ajouter un candidat maintenant le convoque à son tour ; en
            retirer un ne le décommande pas automatiquement. À partir d'ici, chaque modification de la
            liste a un effet visible pour un étudiant.
          </p>
          <!-- VIGILANCE F3-FORMES : deux FAITS distincts, deux affichages —
               une épreuve SANS séance liée n'est pas « non publiée » : son
               canal de convocation n'existe pas encore. -->
          <p v-else-if="exam.has_linked_schedule === false"
             class="border-t border-ln-gray-200 bg-ln-warning-bg px-4 py-3 text-caption leading-relaxed text-[#6B4415]">
            <b class="font-semibold">Aucune séance liée — le statut de publication n'existe pas.</b>
            La convocation passe par la publication d'une séance de planning ;
            cette épreuve n'en a pas encore. Lier une séance d'abord, publier
            ensuite.
          </p>
          <p v-else
             class="border-t border-ln-gray-200 bg-ln-gray-50 px-4 py-3 text-caption leading-relaxed text-ln-gray-600">
            <b class="font-semibold text-ln-gray-900">En brouillon — personne n'est convoqué.</b>
            La liste se compose librement. Le préavis de sept jours ouvrables s'appliquera
            <b class="font-semibold text-ln-gray-900">à la publication</b>, et il vaut pour les quatre
            types d'épreuve — écrit, pratique, mixte, autre : le type est une information au registre,
            pas un régime.
          </p>
        </div>

        <h4 class="mb-2 text-micro font-bold uppercase tracking-wider text-ln-gray-500">
          Candidats inscrits · {{ exam.student_count }}
        </h4>
        <DenseTable :state="candidatesState" :row-height="40"
                    :expected-count="exam.student_count" expected-label="candidats"
                    :skeleton-widths="[220, 160, 'auto']" max-height="320px"
                    state-title="Aucun candidat inscrit"
                    state-message="La liste est vide. Elle se compose à la main, ou depuis un groupe d'étudiants."
                    @retry="reload">
          <template #head>
            <tr>
              <th :class="headTh" class="!text-left">Étudiant</th>
              <th :class="headTh" class="!text-left">Matricule</th>
              <th :class="headTh" class="!text-left"></th>
            </tr>
          </template>
          <template #body>
            <tr v-for="s in candidates" :key="s.student" class="hover:bg-ln-gray-50">
              <td :class="bodyTd" class="!text-left">{{ s.student_name }}</td>
              <td :class="bodyTd" class="!text-left font-mono text-[11.5px] text-ln-gray-500">{{ s.student }}</td>
              <td :class="bodyTd" class="!text-left">
                <button v-if="can('write:exams')" type="button"
                        class="text-caption font-semibold text-ln-blue-600"
                        @click="notBuilt('Retrait d’un candidat')">Retirer</button>
              </td>
            </tr>
          </template>
          <template #legend>
            <span v-if="published">
              L'épreuve est publiée : retirer un candidat <b class="font-semibold text-ln-gray-900">ne le
              décommande pas</b> de lui-même. Prévenez-le.
            </span>
            <span v-else>
              L'épreuve est en brouillon : composer la liste n'a aucun effet visible pour les étudiants.
            </span>
          </template>
        </DenseTable>
      </section>

      <section v-else class="rounded-md-ln border border-dashed border-ln-gray-300 px-6 py-8 text-center">
        <h4 class="text-h3 text-ln-gray-900">Choisissez une épreuve</h4>
        <p class="mx-auto mt-1.5 max-w-md text-body-sm leading-relaxed text-ln-gray-500">
          Chaque épreuve porte sa liste de candidats et son état de publication. Les deux sont
          indépendants : on compose avant, on convoque en publiant.
        </p>
      </section>
    </div>

    <!-- Le peuplement : les déjà-inscrits sont MONTRÉS, non masqués -->
    <div v-if="populateOpen" class="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-6">
      <section class="w-full max-w-2xl overflow-hidden rounded-lg-ln border border-ln-gray-300 bg-white shadow-elevated"
               role="dialog" aria-modal="true" aria-label="Peupler depuis un groupe">
        <header class="border-b border-ln-gray-200 px-5 py-4">
          <h3 class="text-h3 text-ln-gray-900">Peupler depuis un groupe</h3>
          <p class="mt-1 text-body-sm leading-relaxed text-ln-gray-500">
            Les étudiants du groupe sont ajoutés à la liste des candidats.
            <template v-if="published">
              <b class="font-semibold text-[#6B4415]">L'épreuve est publiée : chaque ajout convoque.</b>
            </template>
            <template v-else>L'épreuve est en brouillon — personne ne sera prévenu.</template>
          </p>
        </header>

        <div v-if="report" class="px-5 py-4">
          <BatchReport title="Peuplement de la liste" :report="report"
                       ok-label="ajoutés" ko-label="non ajoutés" :retryable="false"
                       footnote="Un étudiant déjà inscrit compte comme un succès : la liste est dans l'état voulu, et c'est ce qui importe." />
        </div>

        <div v-else-if="!sourceGroup" class="px-5 py-4">
          <!-- RF-G-01 C1 (condition d'acceptation) : pas de groupe → AUCUN repli,
               aucun défaut — un message qui dit pourquoi, et le bouton reste inerte. -->
          <p class="text-body-sm leading-relaxed text-ln-gray-700">
            Cette épreuve n'est rattachée à <b class="font-semibold">aucun groupe</b> —
            le peuplement lit le groupe porté par l'épreuve, il n'en choisit pas un à sa
            place. Rattachez le groupe à l'épreuve (planning), puis rouvrez ce panneau.
            Rien n'a été envoyé.
          </p>
        </div>

        <div v-else class="px-5 py-4">
          <!-- ⚠️ Les déjà-inscrits sont marqués, non retirés : masquer les
               doublons laisse croire que tout le monde sera ajouté, et le rapport
               ligne à ligne surprend ensuite. -->
          <p class="mb-3 text-body-sm text-ln-gray-700">
            {{ plural(groupCandidates.length, 'étudiant') }} dans le groupe, dont
            <b class="font-semibold">{{ alreadyCount }} déjà inscrit{{ alreadyCount > 1 ? 's' : '' }}</b>.
          </p>
          <div class="max-h-[280px] overflow-auto rounded-md-ln border border-ln-gray-200">
            <p v-for="s in groupCandidates" :key="s.student"
               class="flex items-center gap-3 border-b border-ln-gray-100 px-3 py-2 text-body-sm last:border-b-0">
              <span class="text-ln-gray-900">{{ s.student_name }}</span>
              <span class="font-mono text-[11px] text-ln-gray-500">{{ s.student }}</span>
              <StatusPill v-if="s.already_registered" class="ml-auto" status="valide" label="Déjà inscrit" />
              <StatusPill v-else class="ml-auto" status="propose" label="Sera ajouté" />
            </p>
          </div>
        </div>

        <footer class="flex items-center gap-3 border-t border-ln-gray-200 bg-ln-gray-50 px-5 py-3">
          <span class="text-caption text-ln-gray-500">
            {{ report ? 'La liste des candidats est à jour.' : 'Un étudiant déjà inscrit ne sera pas dupliqué.' }}
          </span>
          <span class="ml-auto flex gap-2">
            <button type="button" class="ln-btn-secondary" @click="closePopulate">Fermer</button>
            <button v-if="!report" type="button" class="ln-btn-primary"
                    :disabled="!sourceGroup" @click="runPopulate">Ajouter</button>
          </span>
        </footer>
      </section>
    </div>
  </div>
</template>

<script setup>
/**
 * Grappe 6 · composer une liste d'épreuve, sans convoquer.
 *
 * ⚠️ « INSCRIRE N'EST PAS CONVOQUER » est la phrase centrale de cet écran, et
 * c'est aussi ce qui le rend contre-intuitif : le geste qui remplit la liste ne
 * prévient personne, et le geste qui prévient est un autre bouton, ailleurs.
 *
 * L'écran le porte à trois endroits, parce qu'une seule mention se lit une fois et
 * s'oublie :
 *
 *   — le bandeau, qui l'énonce ;
 *   — l'encart sous l'épreuve, qui change de phrase selon l'état de publication —
 *     « personne n'est convoqué » en brouillon, « les candidats ont été convoqués »
 *     après ;
 *   — la légende de la liste, qui dit ce qu'un retrait fait ET ne fait pas.
 *
 * ⚠️ Le bouton s'appelle « Publier l'épreuve », jamais « Convoquer » : l'acte a un
 * nom, ses effets en ont un autre. Nommer le bouton par son effet promettrait que
 * la convocation est l'acte, et un écran qui promet ce qu'il ne fait pas est le
 * défaut que la grappe 3 a nommé.
 */
import { computed, onMounted, ref, watch } from 'vue';
import {
  WorkQueue, DenseTable, StatusPill, StateBanner, BatchReport, headTh, bodyTd,
} from '../components/index.js';
import { useSession } from '../composables/useSession.js';
import { useAcademicContext } from '../composables/useAcademicContext.js';
import { useResource } from '../composables/useResource.js';
import {
  listExamSchedules, getExamSchedule, populateExamStudentsFromGroup,
} from '../api/planning.js';
import { getGroup } from '../api/groups.js';

const { can } = useSession();
const { params } = useAcademicContext();

const listRes = useResource(listExamSchedules, { isEmpty: (d) => !d?.length });
const examRes = useResource(getExamSchedule, { isEmpty: (d) => !d });
const listState = listRes.state;

const selectedId = ref(null);
const populateOpen = ref(false);
const report = ref(null);
const pending = ref('');

const exams = computed(() => listRes.data.value || []);
const exam = computed(() => examRes.data.value || null);
const candidates = computed(() => exam.value?.students || []);
const published = computed(() => exam.value?.custom_planning_status === 'Publié');

const candidatesState = computed(() => {
  if (examRes.state.value === 'denied') return 'loading';
  if (examRes.state.value !== 'ready') return examRes.state.value;
  return candidates.value.length ? 'ready' : 'empty';
});

const queueItems = computed(() => exams.value.map((e) => ({
  id: e.name,
  title: e.course + ' · ' + e.exam_type,
  subtitle: e.schedule_date + ' · ' + e.from_time + ' – ' + e.to_time + ' · ' + e.room,
  status: e.custom_planning_status === 'Publié' ? 'valide' : 'brouillon',
  statusLabel: e.custom_planning_status === 'Publié'
    ? plural(e.student_count, 'convoqué')
    : (e.student_count ? plural(e.student_count, 'inscrit') + ', non publiée' : 'liste vide'),
})));

const examRows = computed(() => {
  const e = exam.value;
  if (!e) return [];
  return [
    { k: 'Module', v: e.course + ' — ' + e.course_name },
    { k: 'Type d’épreuve', v: e.exam_type },
    { k: 'Date et horaire', v: e.schedule_date + ' · ' + e.from_time + ' – ' + e.to_time },
    { k: 'Salle', v: e.room },
    // Deux champs distincts, comme au planning : le cycle et la publication.
    { k: 'Séance', v: e.custom_status,
      pill: { Annulé: 'suspendue', Réalisé: 'valide', Confirmé: 'valide', Planifié: 'propose' }[e.custom_status] || 'propose' },
    { k: 'Publication', v: e.custom_planning_status,
      pill: e.custom_planning_status === 'Publié' ? 'valide' : 'brouillon' },
    { k: 'Candidats', v: plural(e.student_count, 'inscrit') },
  ];
});

const subtitle = computed(() => {
  if (listState.value !== 'ready') return 'Chargement des épreuves';
  const e = exam.value;
  if (!e) return plural(exams.value.length, 'épreuve') + ' au registre';
  return [e.course_name, e.schedule_date, e.room,
    published.value ? plural(e.student_count, 'candidat') + ' convoqué' + (e.student_count > 1 ? 's' : '')
      : plural(e.student_count, 'candidat') + ' inscrit' + (e.student_count > 1 ? 's' : '') + ', non convoqué' + (e.student_count > 1 ? 's' : ''),
  ].filter(Boolean).join(' · ');
});

/**
 * Les candidats qu'un groupe apporterait.
 *
 * ⚠️ LU DU VRAI POINT D'ENTRÉE — `groups.get_group(name)` rend le groupe avec ses
 * membres. Ma première version écrivait les huit étudiants à la main DANS LA VUE,
 * alors que la même liste vit déjà côté données : deux listes du même ensemble,
 * qui auraient divergé dès le premier changement de groupe. C'est la règle 6, et
 * je l'ai enfreinte dans l'écran où je l'énonce.
 *
 * ⚠️ `already_registered` est calculé contre la liste COURANTE des candidats, pas
 * déclaré : les déjà-inscrits sont marqués et non masqués, sinon le rapport ligne
 * à ligne surprend.
 */
const groupRes = useResource(getGroup, { isEmpty: (d) => !d });
const groupCandidates = computed(() => {
  const ids = new Set(candidates.value.map((s) => s.student));
  return (groupRes.data.value?.students || [])
    .map((s) => ({ ...s, already_registered: ids.has(s.student) ? 1 : 0 }));
});
const alreadyCount = computed(() => groupCandidates.value.filter((s) => s.already_registered).length);
// RF-G-01 C1 — le groupe source n'est PLUS une constante ('SG-L2GL-PROMO' en dur
// partait dans l'acte de masse) : il est LU de l'épreuve sélectionnée, qui porte
// son student_group côté serveur (planning_mgmt, champ des lectures d'épreuve).
const sourceGroup = computed(() => exam.value?.student_group || null);

async function runPopulate() {
  if (!sourceGroup.value) return; // défense en profondeur — le bouton est déjà inerte
  report.value = await populateExamStudentsFromGroup({
    exam_schedule: selectedId.value, student_group: sourceGroup.value,
  });
}
function closePopulate() {
  populateOpen.value = false;
  report.value = null;
}

function plural(n, w) { const v = Number(n) || 0; return v + ' ' + w + (v > 1 ? 's' : ''); }
function notBuilt(what) {
  pending.value = what + " — cet acte n'est pas encore branché au serveur. Rien n'a été enregistré.";
  populateOpen.value = false;
}

function reload() { listRes.load({ ...params.value }); }
function loadExam() { if (selectedId.value) examRes.load({ name: selectedId.value }); }

onMounted(reload);
watch(params, reload);
watch(exams, (e) => { if (e.length && !selectedId.value) selectedId.value = e[0].name; });
watch(selectedId, loadExam);
// Le groupe source n'est lu qu'à l'ouverture du peuplement : inutile avant.
watch(populateOpen, (open) => {
  if (open && sourceGroup.value) groupRes.load({ name: sourceGroup.value });
});
</script>
