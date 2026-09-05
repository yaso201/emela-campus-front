<template>
  <div>
    <header class="mb-4 flex flex-wrap items-start justify-between gap-5">
      <div>
        <p class="mb-2 text-caption text-ln-gray-500">
          Planning · <b class="font-semibold text-ln-gray-900">Séances</b>
        </p>
        <h1 class="text-h1 tracking-tight text-ln-gray-900">Semaine du 14 au 18 septembre 2026</h1>
        <p class="mt-1 text-body-sm text-ln-gray-500">{{ subtitle }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <ProgramPicker />
        <button v-if="can('publish:planning')" type="button" class="ln-btn-primary"
                :disabled="!draftCount" @click="publishOpen = true">
          Publier la semaine<span v-if="draftCount"> · {{ draftCount }}</span>
        </button>
      </div>
    </header>

    <StateBanner v-if="pending" variant="warning" lead="Acte non disponible." :text="pending" />

    <StateBanner variant="info" lead="La répartition propose, le planificateur dispose.">
      L'enseignant vient de la ligne de service du <b class="font-semibold">type d'activité</b> — une
      séance de travaux dirigés reçoit l'enseignant des travaux dirigés. Le remplacement n'est jamais
      refusé : il produit un signal. Et la provenance n'est pas stockée, elle est
      <b class="font-semibold">recalculée à chaque lecture</b> — elle reste donc vraie après un
      remplacement.
    </StateBanner>

    <div class="grid items-start gap-5 xl:grid-cols-[1fr_372px]">
      <div>
        <TimeGrid :days="week.days" :hours="week.hours" :slot-height="44"
                  :items="gridItems" :legend="legend" :selected-id="selectedId"
                  :state="gridState" :expected-count="expected"
                  state-title="Aucune séance cette semaine"
                  :state-message="emptyMessage"
                  @select="selectedId = $event" @retry="reload" />

        <p class="mt-3 text-caption leading-relaxed text-ln-gray-500">
          La grille ne calcule ni les conflits ni les chevauchements : elle reçoit des séances placées.
          Ce qui fait autorité reste la vérification du serveur à l'enregistrement — la vue des conflits
          est un confort, jamais une garde.
        </p>
      </div>

      <div class="flex flex-col gap-4">
        <!-- Une séance choisie — deux statuts, jamais un seul -->
        <section v-if="detail" class="overflow-hidden rounded-md-ln border border-ln-gray-200">
          <header class="border-b border-ln-gray-200 px-4 py-3">
            <h3 class="text-[14px] font-semibold text-ln-gray-900">
              {{ detail.course }} — {{ detail.course_name }}
            </h3>
            <p class="mt-0.5 text-caption text-ln-gray-500">
              {{ dayLabel(detail.day) }} · {{ detail.from_time }} – {{ detail.to_time }} · {{ detail.room }}
            </p>
          </header>
          <div class="px-4 py-3">
            <!-- ⚠️ DEUX CHAMPS, DEUX PASTILLES. Le modèle porte le cycle de la
                 séance et sa publication séparément : « annulée reste publiée »
                 se lit ici, et l'écran ne doit jamais montrer l'un à la place de
                 l'autre. -->
            <dl class="mb-3 flex flex-col gap-2">
              <div class="flex items-baseline gap-3">
                <dt class="w-[86px] flex-shrink-0 text-caption text-ln-gray-500">Séance</dt>
                <dd><StatusPill :status="cycleTone(detail)" :label="detail.custom_status" /></dd>
              </div>
              <div class="flex items-baseline gap-3">
                <dt class="w-[86px] flex-shrink-0 text-caption text-ln-gray-500">Publication</dt>
                <dd><StatusPill :status="publishTone(detail)" :label="detail.custom_planning_status" /></dd>
              </div>
            </dl>

            <p v-if="detail.custom_status === 'Annulé' && detail.custom_planning_status === 'Publié'"
               class="mb-3 rounded-sm-ln bg-ln-warning-bg p-3 text-caption leading-snug text-[#6B4415]">
              <b class="font-semibold">Annulée, et toujours publiée.</b> Les étudiants la voient, barrée :
              retirer la séance de leur emploi du temps effacerait la trace de l'annulation. Ce sont deux
              états distincts, portés par deux champs.
            </p>

            <div class="border-t border-ln-gray-100 pt-3">
              <p class="text-caption text-ln-gray-500">Enseignant</p>
              <p class="mt-0.5 text-body-sm font-semibold text-ln-gray-900">{{ detail.instructor }}</p>
              <!-- Trois issues, et la troisième n'est pas la deuxième. -->
              <p v-if="detail.instructor_service_source === 'répartition'"
                 class="mt-1 inline-flex h-[18px] items-center rounded-[3px] bg-ln-blue-100 px-[6px] text-[10px] font-bold uppercase tracking-wide text-ln-blue-800">
                proposé par la répartition
              </p>
              <template v-else-if="detail.instructor_service_source === 'choisi'">
                <p class="mt-1 inline-flex h-[18px] items-center rounded-[3px] bg-ln-warning-bg px-[6px] text-[10px] font-bold uppercase tracking-wide text-ln-warning">
                  choisi au planning
                </p>
                <p class="mt-1.5 text-caption leading-snug text-ln-gray-600">
                  La ligne de service nomme <b class="font-semibold text-ln-gray-900">{{ expectedInstructor(detail) }}</b>
                  pour ce module et ce type d'activité. La séance compte au réalisé de l'enseignant tenu —
                  un enseignant choisi gagne toujours. L'écart est enregistré, il n'est pas contesté.
                </p>
              </template>
              <p v-else class="mt-1.5 text-caption leading-snug text-ln-gray-500">
                <b class="font-semibold text-ln-gray-700">Aucune ligne de service</b> sur ce module et ce
                type d'activité : personne n'a été contourné. Ce n'est pas un signal — c'est un manque de
                répartition.
              </p>
            </div>

            <div v-if="can('write:planning')" class="mt-4 flex flex-wrap gap-2">
              <!-- ⏸ M2 : modifier une séance suppose la liste des salles et des créneaux
                   valides (aucune lecture serveur ne les rend) — demande S-9. -->
              <button type="button" class="ln-btn-secondary"
                      @click="notBuilt('Modification de la séance — en attente d’une lecture serveur des salles et créneaux (demande M2)')">Modifier…</button>
              <button v-if="detail.custom_status !== 'Annulé'" type="button" class="ln-btn-secondary"
                      @click="openCancel(detail)">Annuler la séance…</button>
            </div>
          </div>
        </section>

        <section v-else class="rounded-md-ln border border-dashed border-ln-gray-300 px-5 py-6 text-center">
          <h4 class="text-[14px] font-semibold text-ln-gray-900">Choisissez une séance</h4>
          <p class="mx-auto mt-1.5 max-w-xs text-caption leading-relaxed text-ln-gray-500">
            La grille montre la semaine ; le détail d'une séance porte ses deux statuts et la provenance
            de son enseignant.
          </p>
        </section>

        <!-- Les épreuves : inscrire n'est pas convoquer -->
        <section class="overflow-hidden rounded-md-ln border border-ln-gray-200">
          <header class="flex items-center gap-3 border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
            <div>
              <h3 class="text-[14px] font-semibold text-ln-gray-900">Épreuves de la filière</h3>
              <p class="mt-0.5 text-caption text-ln-gray-500">Le préavis de sept jours ouvrables ne concerne qu'elles.</p>
            </div>
          </header>
          <BlockState v-if="examsState !== 'ready'" :state="examsState === 'denied' ? 'loading' : examsState"
                      title="Aucune épreuve programmée" :rows="2" :row-height="52" class="m-4"
                      @retry="loadExams" />
          <div v-else>
            <article v-for="e in exams" :key="e.name"
                     class="border-b border-ln-gray-100 px-4 py-3 last:border-b-0">
              <p class="text-body-sm font-semibold text-ln-gray-900">{{ e.course }} — {{ e.exam_type }}</p>
              <p class="mt-0.5 text-caption text-ln-gray-500">
                {{ e.schedule_date }} · {{ e.from_time }} – {{ e.to_time }} · {{ e.room }}
              </p>
              <p class="mt-1.5 flex flex-wrap items-center gap-2">
                <StatusPill :status="publishTone(e)" :label="e.custom_planning_status" />
                <span class="text-caption text-ln-gray-600">{{ plural(e.student_count, 'candidat') }} inscrit{{ e.student_count > 1 ? 's' : '' }}</span>
              </p>
              <!-- ⚠️ Inscrire n'est pas convoquer : la convocation naît de la
                   publication, pas de la composition de la liste. -->
              <p v-if="e.custom_planning_status !== 'Publié'"
                 class="mt-1.5 text-caption leading-snug text-ln-gray-500">
                La liste des candidats se compose avant publication. <b class="font-semibold text-ln-gray-700">Inscrire
                ne convoque personne</b> — c'est la publication de l'épreuve qui vaut convocation.
              </p>
            </article>
          </div>
        </section>
      </div>
    </div>

    <StateBanner v-if="actError" variant="error" lead="L'acte a échoué." :text="actError" class="mt-4" />

    <!-- Annuler une séance — motif EXIGÉ À L'ÉCRAN (règle d'interface, pas serveur :
         le motif est facultatif côté serveur ; l'écran l'impose pour l'annulation). -->
    <div v-if="cancelOpen" class="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-6">
      <ReasonStep class="w-full max-w-xl" name="cancel-schedule"
                  title="Annuler la séance"
                  subtitle="Annuler ne dépublie pas : la séance reste visible, marquée annulée. Le motif est exigé par cet écran — il n'est pas imposé par le serveur."
                  reason-label="Motif de l'annulation"
                  :reason-groups="cancelReasons"
                  detail-label="Précision"
                  detail-hint="Le motif est tracé sur la séance."
                  confirm-label="Annuler la séance"
                  confirm-kind="danger"
                  footnote="Une séance annulée reste publiée — les étudiants la voient barrée, jamais disparue."
                  @cancel="cancelOpen = false" @submit="submitCancel" />
    </div>

    <!-- La publication, et sa dérogation par séance -->
    <div v-if="publishOpen" class="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-6">
      <section class="w-full max-w-3xl overflow-hidden rounded-lg-ln border border-ln-gray-300 bg-white shadow-elevated"
               role="dialog" aria-modal="true" aria-label="Publier la semaine">
        <header class="border-b border-ln-gray-200 px-5 py-4">
          <h3 class="text-h3 text-ln-gray-900">Publier la semaine</h3>
          <p class="mt-1 text-body-sm leading-relaxed text-ln-gray-500">
            Publier vaut <b class="font-semibold">convocation</b> : les étudiants voient la séance dans
            leur emploi du temps. La garde du préavis mord <b class="font-semibold">par séance</b>, non
            par lot — une épreuve peut être retenue tandis que les cours passent.
          </p>
        </header>

        <div v-if="report" class="px-5 py-4">
          <BatchReport title="Publication de la semaine" :report="report"
                       ok-label="publiées" ko-label="non publiées"
                       :retryable="report.retry_ids.length > 0"
                       retry-label="Publier avec dérogation…"
                       footnote="Seules les séances rejouables reparaissent : une dérogation peut être accordée, une séance introuvable restera introuvable."
                       @retry="derogationOpen = true" />

          <!-- La dérogation : le motif, pas le bouton -->
          <div v-if="derogationOpen" class="mt-4 rounded-md-ln border border-ln-warning bg-ln-warning-bg p-4">
            <p class="text-body-sm font-semibold text-[#6B4415]">Dérogation au préavis</p>
            <p class="mt-1 text-caption leading-relaxed text-[#6B4415]">
              <template v-if="can('derogate:planning')">
                Le motif est enregistré sur chaque séance publiée par dérogation et reste lisible.
              </template>
              <template v-else>
                Cette dérogation appartient au <b class="font-semibold">directeur des études</b>. Votre rôle
                permet de publier, non de déroger : demandez-lui la publication de ces séances.
              </template>
            </p>
            <div v-if="can('derogate:planning')" class="mt-3">
              <textarea v-model="overrideReason" rows="3"
                        class="min-h-[60px] w-full rounded-sm-ln border border-ln-gray-300 bg-white p-2.5 text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600"
                        placeholder="Ce qui justifie de publier cette épreuve à moins de sept jours…" />
              <div class="mt-3 flex justify-end gap-2">
                <button type="button" class="ln-btn-secondary" @click="derogationOpen = false">Renoncer</button>
                <button type="button" class="ln-btn-primary" :disabled="!overrideReason.trim() || busy"
                        @click="runPublishDerogation">Publier avec dérogation</button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="px-5 py-4">
          <p class="text-body-sm text-ln-gray-700">
            {{ plural(draftCount, 'séance') }} en brouillon {{ draftCount > 1 ? 'seront publiées' : 'sera publiée' }}.
          </p>
        </div>

        <footer class="flex items-center gap-3 border-t border-ln-gray-200 bg-ln-gray-50 px-5 py-3">
          <span class="text-caption text-ln-gray-500">Une séance déjà publiée est laissée telle quelle.</span>
          <span class="ml-auto flex gap-2">
            <button type="button" class="ln-btn-secondary" @click="closePublish">Fermer</button>
            <button v-if="!report" type="button" class="ln-btn-primary" @click="runPublish">Publier</button>
          </span>
        </footer>
      </section>
    </div>
  </div>
</template>

<script setup>
/**
 * Grappe 5 · planning — la grille temporelle sort de l'atelier.
 *
 * Les quatre contraintes du mandat, et où elles vivent :
 *
 * 1. L'ENSEIGNANT EST PROPOSÉ PAR TYPE D'ACTIVITÉ, et sa provenance est visible.
 *    Le serveur la DÉRIVE (`instructor_service_source`), il ne la stocke pas :
 *    l'écran n'a rien à déduire ni à mémoriser. Trois issues, distinguées —
 *    « répartition », « choisi », et AUCUNE ligne de service, qui n'est pas un
 *    contournement.
 *
 * 2. UNE SÉANCE ANNULÉE RESTE PUBLIÉE. Deux champs indépendants,
 *    `custom_status` et `custom_planning_status` : deux pastilles, jamais une.
 *
 * 3. INSCRIRE N'EST PAS CONVOQUER. La liste des candidats se compose ; la
 *    convocation naît de la publication.
 *
 * 4. LES TRAVAUX PRATIQUES SONT HORS TYPES D'ÉPREUVE. Ils se publient sans
 *    préavis, comme un cours — le préavis ne concerne que les épreuves, et la
 *    garde mord PAR SÉANCE.
 */
import { computed, onMounted, ref, watch } from 'vue';
import {
  TimeGrid, StatusPill, StateBanner, BatchReport, ReasonStep,
} from '../components/index.js';
import BlockState from '../components/internal/BlockState.vue';
import ProgramPicker from './planning/ProgramPicker.vue';
import { useSession } from '../composables/useSession.js';
import { useAcademicContext } from '../composables/useAcademicContext.js';
import { useProgramScope } from '../composables/useProgramScope.js';
import { useResource } from '../composables/useResource.js';
import { listSchedules, listExamSchedules, publishSchedules, setScheduleStatus } from '../api/planning.js';

const { can } = useSession();
const { params } = useAcademicContext();
const { program, label: programLabel, load: loadProgram } = useProgramScope();

const weekRes = useResource(listSchedules, { isEmpty: (d) => !d?.length });
const examsRes = useResource(listExamSchedules, { isEmpty: (d) => !d?.length });
const gridStateRaw = weekRes.state;
const examsState = examsRes.state;

const selectedId = ref(null);
const publishOpen = ref(false);
const derogationOpen = ref(false);
const report = ref(null);
const pending = ref('');
const actError = ref('');
const busy = ref(false);
const cancelOpen = ref(false);
const cancelTarget = ref(null);
const overrideReason = ref('');

const cancelReasons = [{
  key: 'main',
  options: [
    { value: 'indisponibilite', label: 'Indisponibilité de l’enseignant' },
    { value: 'salle', label: 'Salle indisponible' },
    { value: 'ferie', label: 'Jour férié ou fermeture' },
    { value: 'autre', label: 'Autre — à préciser' },
  ],
}];

const DAYS = [
  { key: 'mon', label: 'Lundi', dayNumber: 14 },
  { key: 'tue', label: 'Mardi', dayNumber: 15 },
  { key: 'wed', label: 'Mercredi', dayNumber: 16, today: true },
  { key: 'thu', label: 'Jeudi', dayNumber: 17 },
  { key: 'fri', label: 'Vendredi', dayNumber: 18 },
];

/**
 * ⚠️ Les demi-heures sont RÉELLES : « les séances durent un multiple de trente
 * minutes et s'alignent sur la demi-heure — c'est une validation serveur ». La
 * grille reçoit donc `step: 0.5`, elle ne le devine pas.
 */
const week = computed(() => ({ days: DAYS, hours: { from: 8, to: 18, step: 0.5 } }));

const sessions = computed(() => weekRes.data.value || []);
const exams = computed(() => examsRes.data.value || []);
const expected = computed(() => weekRes.expected.value);

// Le refus n'est pas un état de composant : la coquille rend le refus expliqué.
const gridState = computed(() => (gridStateRaw.value === 'denied' ? 'loading' : gridStateRaw.value));

const draftCount = computed(() =>
  sessions.value.filter((s) => s.custom_planning_status === 'Brouillon').length);

const subtitle = computed(() => {
  if (gridStateRaw.value !== 'ready') return 'Chargement des séances';
  const off = sessions.value.filter((s) => s.instructor_service_source === 'choisi').length;
  return [programLabel.value,
    plural(sessions.value.length, 'séance'),
    draftCount.value ? plural(draftCount.value, 'brouillon') : null,
    off ? plural(off, 'enseignant') + ' hors répartition' : null].filter(Boolean).join(' · ');
});

/**
 * ⚠️ Le vide de cette liste a DEUX causes, et le serveur ne les distingue pas :
 * rien n'est planifié, ou le groupe est hors du périmètre du lecteur — « scope
 * fail-closed SILENCIEUX en liste : rend [] sans erreur ». L'écran doit donc
 * nommer les deux, sinon un responsable de formation croit sa semaine vide.
 */
const emptyMessage = computed(() =>
  'Aucune séance n’est planifiée pour ' + (programLabel.value || 'cette filière')
  + ' sur cette semaine. Si vous attendiez des séances, vérifiez la filière : le serveur ne'
  + ' rend que celles de votre périmètre, et une semaine hors périmètre se lit comme une semaine vide.');

const TONE_BY_PLANNING = { Publié: 'published', Brouillon: 'draft', Modifié: 'modified' };

const gridItems = computed(() => sessions.value.map((s) => ({
  id: s.name,
  day: s.day,
  start: toDecimal(s.from_time),
  end: toDecimal(s.to_time),
  code: s.course + (s.student_group ? ' · ' + shortGroup(s.student_group) : ''),
  lines: [s.custom_session_type + ' · ' + s.room, s.instructor],
  // ⚠️ L'annulation prime sur la publication DANS LE TON, parce que c'est elle
  // qu'on doit voir d'un coup d'œil sur une grille — mais les deux statuts sont
  // écrits en clair au panneau. Le ton résume ; il ne remplace pas.
  tone: s.custom_status === 'Annulé' ? 'cancelled'
    : s.is_exam ? 'exam'
      : (TONE_BY_PLANNING[s.custom_planning_status] || 'draft'),
  origin: s.instructor_service_source === 'répartition' ? 'repartition'
    : s.instructor_service_source === 'choisi' ? 'choisi' : null,
  stateLabel: s.custom_status === 'Annulé'
    ? 'Annulée · reste publiée'
    : s.custom_planning_status,
})));

const detail = computed(() => sessions.value.find((s) => s.name === selectedId.value) || null);

const legend = [
  { label: 'Publiée', color: 'var(--ln-blue-800)' },
  { label: 'Brouillon', color: 'var(--ln-gray-300)' },
  { label: 'Modifiée', color: 'var(--ln-warning)' },
  { label: 'Annulée', color: 'var(--ln-error)' },
  { label: 'Épreuve', color: '#5B21B6' },
];

const SERVICE_EXPECTED = {
  'INF-204|CM': 'Pr. Léonard Hounkpatin', 'INF-204|TD': 'M. Firmin Dossou',
  'RES-102|CM': 'M. Firmin Dossou', 'RES-102|TP': 'M. Cyrille Adjovi',
  'MAT-118|CM': 'Pr. Célestine Ahouandjinou', 'MAT-118|TD': 'Pr. Célestine Ahouandjinou',
  'MAT-121|TP': 'Pr. Célestine Ahouandjinou', 'TRA-110|TD': 'Mme Estelle Lawson',
  'INF-207|TD': 'Pr. Bernard Soglo', 'INF-201|PJ': 'Pr. Bernard Soglo',
};
/**
 * ⚠️ MANQUE NOMMÉ — l'enseignant que la répartition PROPOSAIT.
 *
 * `instructor_service_source` dit qu'il y a eu contournement, pas QUI a été
 * contourné. Cette table est un pis-aller lisible et elle est marquée comme tel :
 * elle divergera de la répartition dès la première modification de ligne — règle
 * 6, deux listes du même ensemble. Il faut que `get_schedule` rende le nom
 * proposé à côté de la provenance.
 */
function expectedInstructor(s) {
  return SERVICE_EXPECTED[s.course + '|' + s.custom_session_type] || 'un autre enseignant';
}

function toDecimal(hhmm) {
  const [h, m] = String(hhmm || '0:0').split(':').map(Number);
  return h + (m || 0) / 60;
}
function shortGroup(name) {
  return String(name).replace(/^SG-L2GL-/, '');
}
function dayLabel(key) {
  const d = DAYS.find((x) => x.key === key);
  return d ? d.label + ' ' + d.dayNumber : '';
}
function plural(n, word) {
  const v = Number(n) || 0;
  return v + ' ' + word + (v > 1 ? 's' : '');
}
function cycleTone(s) {
  return { Annulé: 'suspendue', Réalisé: 'valide', Confirmé: 'valide', Planifié: 'propose' }[s.custom_status] || 'propose';
}
function publishTone(s) {
  return { Publié: 'valide', Modifié: 'suspendue', Brouillon: 'brouillon' }[s.custom_planning_status] || 'brouillon';
}

function notBuilt(what) {
  pending.value = what + " — cet acte n'est pas encore branché au serveur. Rien n'a été enregistré.";
}

/**
 * La publication est un ACTE : elle ne part que d'un geste, jamais d'un cycle de
 * vie. Le rapport qu'elle rend est celui du serveur — l'écran ne le fabrique pas.
 */
async function runPublish() {
  actError.value = '';
  const names = sessions.value
    .filter((s) => s.custom_planning_status === 'Brouillon')
    .map((s) => s.name);
  try {
    busy.value = true;
    report.value = await publishSchedules({ schedules: names });
    reload();
  } catch (e) { actError.value = e.message || 'Publication refusée.'; }
  finally { busy.value = false; }
}

/* ── Dérogation au préavis — republier les rejouables AVEC un motif (DE seul). ── */
async function runPublishDerogation() {
  actError.value = '';
  const names = (report.value && report.value.retry_ids) || [];
  if (!names.length || !overrideReason.value.trim()) return;
  try {
    busy.value = true;
    report.value = await publishSchedules({ schedules: names, override_reason: overrideReason.value.trim() });
    derogationOpen.value = false;
    overrideReason.value = '';
    reload();
  } catch (e) { actError.value = e.message || 'Dérogation refusée.'; }
  finally { busy.value = false; }
}

/* ── Annulation d'une séance — motif exigé À L'ÉCRAN (règle d'interface). ── */
function openCancel(s) { actError.value = ''; pending.value = ''; cancelTarget.value = s; cancelOpen.value = true; }
async function submitCancel({ reason, detail }) {
  cancelOpen.value = false;
  actError.value = '';
  const motif = [reason, detail].filter(Boolean).join(' — ');
  try {
    busy.value = true;
    await setScheduleStatus({ name: cancelTarget.value.name, status: 'Annulé', reason: motif });
    reload();
  } catch (e) { actError.value = e.message || 'Annulation refusée.'; }
  finally { busy.value = false; }
}

function closePublish() {
  publishOpen.value = false;
  derogationOpen.value = false;
  report.value = null;
}

function reload() {
  weekRes.load({ ...params.value, program: program.value, date_from: '2026-09-14', date_to: '2026-09-18' });
}
function loadExams() {
  examsRes.load({ ...params.value, program: program.value });
}

onMounted(async () => {
  await loadProgram();
  reload();
  loadExams();
});
watch([params, program], () => { reload(); loadExams(); });
</script>
