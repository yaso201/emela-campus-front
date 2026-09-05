<template>
  <div>
    <header class="mb-4 flex flex-wrap items-start justify-between gap-5">
      <div>
        <p class="mb-2 text-caption text-ln-gray-500">
          À traiter · <b class="font-semibold text-ln-gray-900">Contrôle des notes</b>
        </p>
        <h1 class="text-h1 tracking-tight text-ln-gray-900">
          {{ current ? current.course + ' ' + current.course_name : 'Contrôle des notes' }}
        </h1>
        <p class="mt-1 text-body-sm text-ln-gray-500">{{ subtitle }}</p>
      </div>
      <div v-if="current" class="flex flex-wrap items-center gap-2">
        <!-- M3 g6 : le CTA suit la MACHINE serveur (Reçue → En traitement →
             Intégrée/Rejetée) — le renvoi n'est possible qu'en traitement. -->
        <button v-if="can('control:grades') && current.status === 'En traitement'" type="button"
                class="ln-btn-secondary" :disabled="busy" @click="returnOpen = true">
          Renvoyer…
        </button>
        <button v-if="can('control:grades') && current.status === 'Reçue'" type="button"
                class="ln-btn-primary" :disabled="busy" @click="runProcess">
          Prendre en traitement
        </button>
        <button v-if="can('control:grades') && current.status === 'En traitement'" type="button"
                class="ln-btn-primary" :disabled="busy" @click="runIntegrate">
          Intégrer {{ plural(current.student_count, 'note') }}
        </button>
      </div>
    </header>

    <StateBanner v-if="pending" variant="warning" lead="Acte non disponible." :text="pending" />
    <StateBanner v-if="actError" variant="error" lead="L'acte a échoué." :text="actError" />

    <div class="grid items-start gap-5 xl:grid-cols-[368px_1fr]">
      <WorkQueue title="Soumissions en attente" :items="queueItems" :selected-id="selectedId"
                 :total="queueItems.length"
                 :state="queueState === 'denied' ? 'loading' : queueState"
                 state-title="Aucune soumission à contrôler"
                 state-message="Les enseignants n'ont rien soumis, ou tout a été intégré. Ce n'est pas un écran vide : c'est une file vide."
                 @select="selectedId = $event" @retry="reload" />

      <section v-if="current">
        <!-- ⚠️ L'échéance a DEUX règles, et l'écran dit laquelle s'applique. -->
        <StateBanner :variant="late ? 'warning' : 'info'"
                     :lead="late ? 'Soumise après l’échéance.' : 'Soumise dans les délais.'">
          Échéance du <b class="font-semibold">{{ current.submission_deadline }}</b>, posée explicitement
          sur la composante. Sans échéance explicite, elle retomberait sur la
          <b class="font-semibold">dernière séance planifiée</b> du module — une échéance absente n'est
          donc pas une absence d'échéance.
        </StateBanner>

        <div class="mb-4 flex flex-wrap items-stretch gap-6 rounded-md-ln border border-ln-gray-200 bg-ln-gray-50 px-5 py-4">
          <div v-for="s in stats" :key="s.label" class="flex flex-col gap-0.5">
            <span class="tabular text-[20px] font-bold leading-tight" :class="s.tone">{{ s.value }}</span>
            <span class="text-caption text-ln-gray-500">{{ s.label }}</span>
          </div>
          <p class="ml-auto max-w-[300px] self-center text-caption leading-relaxed text-ln-gray-500">
            L'assiduité affichée porte les absences <b class="font-semibold">non justifiées</b> de
            l'étudiant sur ce <b class="font-semibold">module</b>, toutes séances confondues — pas sur la
            seule composante soumise.
          </p>
        </div>

        <DenseTable :state="detailState === 'denied' ? 'loading' : detailState" :row-height="40"
                    :expected-count="current.student_count" expected-label="notes"
                    :skeleton-widths="[186, 74, 150, 'auto']" max-height="380px"
                    state-title="Aucune note dans cette soumission"
                    state-message="La soumission existe mais ne porte aucune ligne. L'enseignant l'a peut-être envoyée par erreur."
                    @retry="reload">
          <template #head>
            <tr>
              <th :class="headTh" class="!text-left">Étudiant</th>
              <th :class="headTh">Note</th>
              <th :class="headTh">Absences · module entier</th>
              <th :class="headTh" class="!text-left">Signalement</th>
            </tr>
          </template>
          <template #body>
            <tr v-for="l in lines" :key="l.student"
                :class="flagOf(l) ? 'bg-ln-warning-bg' : 'hover:bg-ln-gray-50'">
              <td :class="bodyTd" class="!text-left">
                {{ l.student_name }}
                <span class="ml-1.5 font-mono text-[11px] text-ln-gray-500">{{ l.student }}</span>
              </td>
              <td :class="[bodyTd, 'font-semibold',
                           l.proposed_grade === null ? 'italic text-ln-error' : '']">
                {{ l.proposed_grade === null ? 'absent' : l.proposed_grade.toFixed(2) }}
              </td>
              <td :class="bodyTd">{{ l.unexcused_absences }} / {{ l.attendance_rows }} séances</td>
              <td :class="bodyTd" class="!text-left !whitespace-normal !leading-snug text-[12.5px] text-[#6B4415]">
                {{ flagOf(l) }}
              </td>
            </tr>
          </template>
          <template #legend>
            <span>
              Le croisement se lit sur le <b class="font-semibold text-ln-gray-900">module entier</b> : la
              correspondance entre une composante notée et un type de séance n'est pas fiable. C'est
              pourquoi le signalement dit <b class="font-semibold text-ln-gray-900">« probable »</b> — c'est
              un indice à confirmer avec l'enseignant, jamais une conclusion.
            </span>
          </template>
        </DenseTable>

        <ReasonStep v-if="returnOpen" class="mt-4" name="grade-return"
                    title="Renvoyer la soumission"
                    subtitle="Un seul acte : la soumission repart chez l'enseignant, qui retrouve sa saisie ouverte. La catégorie oriente son travail — elle ne change pas la nature du renvoi."
                    reason-label="Catégorie du motif"
                    :reason-groups="returnReasons"
                    detail-label="Précision"
                    detail-hint="L'enseignant reçoit la catégorie et la précision."
                    confirm-label="Renvoyer"
                    :modal="false"
                    footnote="Renvoyer et rejeter sont le même acte serveur : un point d'entrée, un motif obligatoire."
                    @cancel="returnOpen = false" @submit="submitReturn" />
      </section>

      <section v-else class="rounded-md-ln border border-dashed border-ln-gray-300 px-6 py-8 text-center">
        <h4 class="text-h3 text-ln-gray-900">Choisissez une soumission</h4>
        <p class="mx-auto mt-1.5 max-w-md text-body-sm leading-relaxed text-ln-gray-500">
          Le contrôle croise chaque note avec l'assiduité de l'étudiant sur le module : un zéro
          d'évaluation et un zéro d'absence ne se lisent pas de la même façon.
        </p>
      </section>
    </div>
  </div>
</template>

<script setup>
/**
 * Grappe 6 · contrôle des notes — l'amendement A7 du lot 8, qui existait déjà.
 *
 * `list_submissions_for_control(include_attendance=1)` croise chaque ligne de note
 * avec l'assiduité. La docstring serveur porte la phrase de la maquette :
 *
 *   « au contrôle, un zéro d'évaluation ne se lit pas comme un zéro d'absence
 *     (Art. 12.3) »
 *
 * ⚠️ Le croisement porte sur LE MODULE, toutes séances confondues. La
 * correspondance composante ↔ type d'activité n'est pas fiable — d'où
 * « probable », et jamais une conclusion.
 *
 * ⚠️ UN SEUL APPEL pour la file ET le détail. `include_attendance=1` rend les
 * lignes de toutes les soumissions : demander la file puis le détail séparément
 * ferait deux lectures du même ensemble, et le compte d'en-tête pourrait cesser de
 * s'accorder avec la liste — règle 6.
 */
import { computed, onMounted, ref, watch } from 'vue';
import {
  WorkQueue, DenseTable, StateBanner, ReasonStep, headTh, bodyTd,
} from '../components/index.js';
import { useSession } from '../composables/useSession.js';
import { useAcademicContext } from '../composables/useAcademicContext.js';
import { useResource } from '../composables/useResource.js';
import { listSubmissionsForControl, processSubmission, integrateSubmission, rejectSubmission } from '../api/grades.js';

const { can } = useSession();
const { params } = useAcademicContext();
const res = useResource(listSubmissionsForControl, { isEmpty: (d) => !d?.length });
const queueState = res.state;

const selectedId = ref(null);
const returnOpen = ref(false);
const pending = ref('');

const submissions = computed(() => res.data.value || []);
const current = computed(() => submissions.value.find((s) => s.name === selectedId.value) || null);
const lines = computed(() => current.value?.lines || []);
// Le détail vient du même appel : son état est celui de la file.
const detailState = computed(() =>
  queueState.value !== 'ready' ? queueState.value : (lines.value.length ? 'ready' : 'empty'));

/**
 * ⚠️ LES CLÉS SONT CELLES DE StatusPill, pas des mots de mon choix. Une clé hors
 * vocabulaire retombe en gris neutre — j'avais écrit `refuse`, qui n'existe pas,
 * et la soumission rejetée sortait grise dans la file. Le ton rouge s'appelle
 * `renvoyee`.
 */
const STATUS_TONE = {
  Reçue: 'propose', 'En traitement': 'brouillon', Intégrée: 'valide', Rejetée: 'renvoyee',
};

const queueItems = computed(() => submissions.value.map((s) => ({
  id: s.name,
  title: s.course + ' · ' + component(s.evaluation_component),
  subtitle: s.instructor + ' · ' + plural(s.student_count, 'note'),
  status: flagCount(s) ? 'suspendue' : (STATUS_TONE[s.status] || 'brouillon'),
  statusLabel: flagCount(s) ? plural(flagCount(s), 'signalement') : s.status,
  due: s.submitted_at ? 'soumise le ' + s.submitted_at.slice(8, 10) + '/' + s.submitted_at.slice(5, 7) : null,
  overdue: isLate(s),
})));

const COMPONENTS = { CC: 'contrôle continu', TP: 'travaux pratiques', PJ: 'projet', DE: 'épreuve écrite' };
function component(c) { return COMPONENTS[c] || c; }

const late = computed(() => current.value && isLate(current.value));
function isLate(s) {
  if (!s.submission_deadline || !s.submitted_at) return false;
  return s.submitted_at.slice(0, 10) > s.submission_deadline;
}

/**
 * Le signalement — un INDICE, formulé comme tel.
 *
 * ⚠️ Le même zéro reçoit deux lectures selon l'assiduité, et c'est tout l'objet du
 * croisement. Le mot « probable » n'est pas une précaution de style : le système ne
 * peut pas distinguer les deux, et le prétendre ferait rejeter des notes justes.
 */
function flagOf(l) {
  if (l.proposed_grade === null) {
    return 'Note manquante' + (l.unexcused_absences ? ' et assiduité faible' : '')
      + ' — à confirmer avec l’enseignant';
  }
  if (l.proposed_grade !== 0) return '';
  const half = (l.attendance_rows || 0) / 2;
  return l.unexcused_absences > half
    ? 'Zéro sur un module où l’étudiant a manqué plus de la moitié des séances — zéro d’absence probable'
    : 'Zéro sur un module suivi sans absence — zéro d’évaluation probable';
}
function flagCount(s) { return (s.lines || []).filter((l) => flagOf(l)).length; }

/** Tous dérivés des lignes : trois totaux qui divergent perdent la confiance. */
const stats = computed(() => {
  const s = current.value;
  if (!s) return [];
  const graded = lines.value.filter((l) => l.proposed_grade !== null);
  const avg = graded.length
    ? graded.reduce((a, l) => a + l.proposed_grade, 0) / graded.length : null;
  return [
    { value: s.student_count, label: 'Notes soumises', tone: 'text-ln-gray-900' },
    { value: avg === null ? '—' : avg.toFixed(2), label: 'Moyenne', tone: 'text-ln-gray-900' },
    { value: flagCount(s), label: 'Lignes signalées',
      tone: flagCount(s) ? 'text-ln-warning' : 'text-ln-gray-900' },
    { value: lines.value.filter((l) => l.proposed_grade === 0).length, label: 'Zéros',
      tone: 'text-ln-gray-900' },
  ];
});

const subtitle = computed(() => {
  const s = current.value;
  if (queueState.value !== 'ready') return 'Chargement des soumissions';
  if (!s) return plural(submissions.value.length, 'soumission') + ' en file';
  return ['Soumise le ' + s.submitted_at, 'par ' + s.instructor,
    plural(s.student_count, 'note'),
    flagCount(s) ? plural(flagCount(s), 'ligne') + ' signalée' + (flagCount(s) > 1 ? 's' : '') : null,
  ].filter(Boolean).join(' · ');
});

const returnReasons = [{
  key: 'main',
  options: [
    { value: 'complement', label: 'Complément attendu — une note manque, une ligne est à confirmer ; le reste tient' },
    { value: 'reprise', label: 'Reprise complète — la soumission ne peut pas être contrôlée en l’état' },
  ],
}];

function plural(n, w) { const v = Number(n) || 0; return v + ' ' + w + (v > 1 ? 's' : ''); }
/* ── Actes BRANCHÉS (M3 g6) — intégration et renvoi motivé. ── */
const actError = ref('');
const busy = ref(false);
async function runProcess() {
  actError.value = ''; pending.value = '';
  try {
    busy.value = true;
    await processSubmission({ name: current.value.name });
    reload();
  } catch (e) { actError.value = e.message || 'Prise en traitement refusée.'; }
  finally { busy.value = false; }
}
async function runIntegrate() {
  actError.value = ''; pending.value = '';
  try {
    busy.value = true;
    await integrateSubmission({ name: current.value.name });
    reload();
  } catch (e) { actError.value = e.message || 'Intégration refusée.'; }
  finally { busy.value = false; }
}
async function submitReturn({ reason, detail }) {
  returnOpen.value = false;
  actError.value = ''; pending.value = '';
  const motif = [reason, detail].filter(Boolean).join(' — ');
  try {
    busy.value = true;
    await rejectSubmission({ name: current.value.name, reason: motif });
    reload();
  } catch (e) { actError.value = e.message || 'Renvoi refusé.'; }
  finally { busy.value = false; }
}

function notBuilt(what) {
  pending.value = what + " — cet acte n'est pas encore branché au serveur. Rien n'a été enregistré.";
  returnOpen.value = false;
}

function reload() {
  // include_attendance=1 : le croisement est l'objet même de cet écran.
  res.load({ ...params.value, include_attendance: 1 });
}

onMounted(reload);
watch(params, reload);
watch(submissions, (s) => { if (s.length && !selectedId.value) selectedId.value = s[0].name; });
</script>
