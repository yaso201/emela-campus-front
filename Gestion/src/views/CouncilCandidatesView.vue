<template>
  <div>
    <header class="mb-4 flex flex-wrap items-start gap-4">
      <div>
        <p class="mb-2 text-caption text-ln-gray-500">
          Conseil pédagogique · <b class="font-semibold text-ln-gray-900">Candidats</b>
        </p>
        <h1 class="text-h1 tracking-tight text-ln-gray-900">Candidats au conseil — {{ data.program_label }}</h1>
        <p class="mt-1 text-body-sm text-ln-gray-500">{{ subtitle }}</p>
      </div>
      <div class="ml-auto flex items-center gap-2">
        <button type="button" class="ln-btn-secondary" @click="exportList">Exporter la liste</button>
        <button v-if="can('prepare:council')" type="button" class="ln-btn-primary"
                :disabled="!retainedCount" @click="prepareOpen = true">
          Préparer la séance · {{ retainedCount }} retenus
        </button>
      </div>
    </header>

    <StateBanner v-if="actError" variant="error" lead="L'acte a échoué." :text="actError" class="mb-4" />

    <!-- ⚠️ LA THÈSE DE L'ÉCRAN, ET ELLE EST NÉGATIVE. Elle vient en premier
         parce qu'un tableau de chiffres sur des étudiants se lit comme un
         verdict tant que personne n'a dit le contraire. -->
    <StateBanner variant="warning" lead="Figurer sur cette liste n’emporte rien.">
      Ce n'est ni une sanction, ni une décision, ni une présomption d'échec : c'est le résultat de
      trois calculs sur les notes et l'assiduité du semestre impair. Le conseil examine qui il veut
      examiner, et <b class="font-semibold">n'est tenu par aucun de ces critères</b>. Retenir un
      étudiant l'inscrit à l'ordre du jour — rien d'autre.
    </StateBanner>

    <StateBanner variant="info" lead="Ces résultats ne sont pas officiels.">
      La délibération est annuelle et se tient en juillet : en janvier, crédits et moyennes sont
      <b class="font-semibold">calculés, pas arrêtés</b> — ce sont les mêmes chiffres que l'étudiant
      voit sous la mention « données non officielles, susceptibles d'évolution ». C'est aussi
      pourquoi le conseil ne décide rien : on ne décide pas sur des résultats non arrêtés.
    </StateBanner>

    <BlockState v-if="state !== 'ready'" :state="state === 'denied' ? 'loading' : state"
                title="Aucun candidat sur ce semestre"
                message="Aucun étudiant ne relève d’un des trois critères. Ce n’est pas une erreur — c’est un semestre sans signal, et la séance peut ne pas se tenir."
                :rows="6" :row-height="52" :skeleton-widths="[34, 186, 132, 126, 132, 'auto']"
                @retry="reload" />

    <template v-else>
      <!-- Les filtres sont les CRITÈRES eux-mêmes : l'écran n'en invente aucun,
           et « Retenus » est le seul qui ne soit pas un calcul. -->
      <div class="mb-3 flex flex-wrap items-center gap-2">
        <button type="button" :class="chipClass(null)" @click="setFilter(null)">
          Tous les critères <span class="ml-1 tabular font-semibold">{{ data.count }}</span>
        </button>
        <button v-for="c in data.criteria" :key="c.key" type="button"
                :class="chipClass(c.key)" @click="setFilter(c.key)">
          {{ c.title }} <span class="ml-1 tabular font-semibold">{{ c.count }}</span>
        </button>
        <button type="button" :class="chipClass('retained')" @click="setFilter('retained')">
          Retenus <span class="ml-1 tabular font-semibold">{{ retainedCount }}</span>
        </button>
        <p class="ml-auto text-caption text-ln-gray-500">
          Un étudiant peut relever de plusieurs critères — il n'apparaît qu'une fois.
        </p>
      </div>

      <div class="overflow-hidden rounded-md-ln border border-ln-gray-200">
        <table class="w-full border-collapse text-body-sm">
          <thead>
            <tr>
              <th :class="headTh" class="w-[44px]"><span class="sr-only">Retenu</span></th>
              <th :class="headTh" class="!text-left">Étudiant</th>
              <th :class="headTh">Crédits non acquis<sup class="text-ln-gray-400">°</sup></th>
              <th :class="headTh">Unité la plus basse<sup class="text-ln-gray-400">°</sup></th>
              <th :class="headTh">Absences (séances)</th>
              <th :class="headTh" class="!text-left">Critères constatés</th>
              <th :class="headTh" class="!text-left">Conseil antérieur</th>
            </tr>
          </thead>
          <tbody>
            <!-- ⚠️ AUCUN TRI PAR GRAVITÉ, et aucune teinte de ligne graduée : les
                 lignes sont dans l'ordre du registre. Un tri par nombre de
                 critères aurait produit un classement des étudiants. -->
            <tr v-for="row in items" :key="row.student">
              <td :class="bodyTd">
                <button type="button" class="flex h-[26px] w-[26px] items-center justify-center rounded-sm-ln border"
                        :class="row.retained ? 'border-ln-blue-800 bg-ln-blue-800 text-white' : 'border-ln-gray-300 bg-white'"
                        :aria-pressed="row.retained ? 'true' : 'false'"
                        @click="toggleRetained(row)">
                  <span aria-hidden="true">{{ row.retained ? '✓' : '' }}</span>
                  <span class="sr-only">Retenir {{ row.student_name }} pour la séance</span>
                </button>
              </td>
              <td :class="bodyTd" class="!text-left">
                <b class="font-semibold text-ln-gray-900">{{ row.student_name }}</b>
                <span class="block font-mono text-[11.5px] text-ln-gray-500">{{ row.student }}</span>
              </td>
              <td :class="bodyTd">
                {{ row.credits_missing }} / {{ row.credits_total }}<sup class="text-ln-gray-400">°</sup>
              </td>
              <td :class="bodyTd">
                {{ decimal(row.lowest_ue) }}<sup class="text-ln-gray-400">°</sup>
                <span class="block text-caption text-ln-gray-500">{{ row.lowest_ue_code }}</span>
              </td>
              <td :class="bodyTd">
                {{ row.absences }}
                <span class="text-caption text-ln-gray-500">/ {{ row.absence_modules }} mod.</span>
              </td>
              <td :class="bodyTd" class="!text-left">
                <span class="flex flex-wrap gap-1">
                  <span v-for="c in data.criteria" :key="c.key"
                        class="rounded-sm-ln px-1.5 py-0.5 text-micro font-semibold"
                        :class="row[c.key] ? 'bg-ln-warning-bg text-ln-warning' : 'bg-ln-gray-100 text-ln-gray-400'">
                    {{ c.label }}
                  </span>
                </span>
              </td>
              <td :class="bodyTd" class="!text-left text-caption text-ln-gray-500">
                {{ row.previous_council || '—' }}
              </td>
            </tr>
          </tbody>
        </table>
        <p class="border-t border-ln-gray-200 bg-ln-gray-50 px-4 py-3 text-caption leading-relaxed text-ln-gray-600">
          <b class="font-semibold text-ln-gray-900">Aucun tri par gravité, aucun score.</b> Les lignes
          sont dans l'ordre du registre. Trier par nombre de critères ou par crédits manquants
          produirait un classement des étudiants — et un classement se lit comme une conclusion.
        </p>
      </div>

      <dl class="mt-4 flex flex-col gap-2 rounded-md-ln border border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
        <div class="flex items-baseline gap-3">
          <dt class="w-[152px] flex-shrink-0 text-caption font-semibold text-ln-gray-900">
            <sup>°</sup> résultat non officiel
          </dt>
          <dd class="text-caption leading-relaxed text-ln-gray-600">
            Susceptible d'évolution jusqu'à la délibération de juillet.
          </dd>
        </div>
        <div v-for="c in data.criteria" :key="c.key" class="flex items-baseline gap-3">
          <dt class="w-[152px] flex-shrink-0 text-caption font-semibold text-ln-gray-900">{{ c.label }}</dt>
          <dd class="text-caption leading-relaxed text-ln-gray-600">{{ c.rule }}</dd>
        </div>
      </dl>

      <p class="mt-4 text-caption text-ln-gray-500">
        La séance se tient ailleurs :
        <router-link :to="{ name: 'council-session' }" class="font-semibold">ouvrir la séance du {{ data.session_date }}</router-link>
        · <router-link :to="{ name: 'council-absences' }" class="font-semibold">les seuils d'absence</router-link>
        · <router-link :to="{ name: 'council-preconisations' }" class="font-semibold">les préconisations de l'année</router-link>
      </p>
    </template>

    <StateBanner v-if="pending" variant="info" lead="Séance préparée." :text="pending" class="mt-4" />

    <!-- Préparer la séance : la rétention humaine devient l'ordre du jour. La date
         est obligatoire (create_cps_session l'exige). -->
    <div v-if="prepareOpen" class="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-6">
      <div class="w-full max-w-lg overflow-hidden rounded-lg-ln border border-ln-gray-300 bg-white shadow-elevated"
           role="dialog" aria-modal="true" aria-label="Préparer la séance">
        <header class="border-b border-ln-gray-200 p-5">
          <h3 class="text-[17px] font-semibold text-ln-gray-900">Préparer la séance du conseil</h3>
          <p class="mt-1 text-body-sm leading-normal text-ln-gray-500">
            {{ retainedCount }} cas retenus deviennent l'ordre du jour. La séance s'ouvre en brouillon —
            personne n'est convoqué avant que le directeur des études ne la tienne.
          </p>
        </header>
        <div class="p-5">
          <label for="cps-date" class="flex items-center gap-1.5 text-body-sm font-semibold text-ln-gray-900">
            Date de la séance <span class="font-bold text-ln-error">obligatoire</span>
          </label>
          <input id="cps-date" v-model="sessionDate" type="date"
                 class="mt-2 h-11 w-full rounded-sm-ln border border-ln-gray-300 px-3 text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600" />
        </div>
        <footer class="flex items-center gap-3 border-t border-ln-gray-200 bg-ln-gray-50 px-5 py-4">
          <button type="button" class="ln-btn-secondary ml-auto" @click="prepareOpen = false">Annuler</button>
          <button type="button" class="ln-btn-primary" :disabled="!sessionDate || !retainedCount || busy"
                  @click="submitPrepare">Préparer</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Grappe 8 · écran N8 du lot 7 — les candidats au conseil.
 *
 * ⚠️ LA LISTE EST CALCULÉE, ET C'EST TOUT CE QU'ELLE EST. L'écran est donc construit
 * comme un INSTRUMENT DE LECTURE : pas de tri par gravité, pas de score, pas de
 * bouton qui « traite » un étudiant. Une seule action — le retenir pour la séance.
 *
 * ⚠️ Le signe ° sur chaque valeur calculée n'est pas décoratif : il vient de
 * `official: false` rendu par le serveur. L'écran ne devine pas à quelle période la
 * délibération a eu lieu — il se tromperait un an sur deux.
 *
 * 🔴 `list_council_candidates` n'est pas tranché : voir `api/council.js`.
 */
import { computed, onMounted, ref, watch } from 'vue';
import { StateBanner, headTh, bodyTd } from '../components/index.js';
import BlockState from '../components/internal/BlockState.vue';
import { useSession } from '../composables/useSession.js';
import { useAcademicContext } from '../composables/useAcademicContext.js';
import { useResource } from '../composables/useResource.js';
import { listCouncilCandidates, prepareCouncilSession, examineCouncilStudent } from '../api/council.js';

const { can } = useSession();
const { params } = useAcademicContext();
const res = useResource(listCouncilCandidates, { isEmpty: (d) => !d?.items?.length });
const state = res.state;
const pending = ref('');
const actError = ref('');
const busy = ref(false);
const filter = ref(null);
// La rétention est une SÉLECTION HUMAINE (arbitrage A1) : aucun acte serveur unitaire.
// Elle vit côté client jusqu'à la préparation, qui la matérialise en une séance.
const retainedSet = ref(new Set());
const prepareOpen = ref(false);
const sessionDate = ref('');

const data = computed(() => res.data.value || { criteria: [] });
const withRetained = computed(() => (data.value.items || []).map(
  (r) => ({ ...r, retained: retainedSet.value.has(r.student) })));
const items = computed(() => (filter.value === 'retained'
  ? withRetained.value.filter((r) => r.retained) : withRetained.value));
const retainedCount = computed(() => withRetained.value.filter((r) => r.retained).length);

const subtitle = computed(() => {
  if (state.value !== 'ready') return 'Chargement des candidats';
  return [
    data.value.count + ' étudiants relèvent d’au moins un critère sur ' + data.value.enrolled + ' inscrits',
    data.value.retained + ' retenus pour la séance du ' + data.value.session_date,
    'calculé sur le ' + (data.value.term_label || '').toLowerCase(),
  ].join(' · ');
});

function decimal(v) { return v == null ? '—' : String(v.toFixed(2)).replace('.', ','); }

function chipClass(key) {
  const on = filter.value === key;
  return 'flex h-[30px] items-center rounded-sm-ln border px-3 text-caption '
    + (on ? 'border-ln-blue-800 bg-ln-blue-50 font-semibold text-ln-blue-900'
      : 'border-ln-gray-200 bg-white text-ln-gray-700');
}

function setFilter(key) {
  filter.value = filter.value === key ? null : key;
  reload();
}

/**
 * Retenir = SÉLECTION HUMAINE (arbitrage A1). Aucun acte serveur unitaire : la
 * rétention vit côté client jusqu'à la préparation, qui la matérialise. La case
 * bascule donc bien — mais elle ne prétend rien enregistrer avant « Préparer ».
 */
function toggleRetained(row) {
  const s = new Set(retainedSet.value);
  if (s.has(row.student)) s.delete(row.student); else s.add(row.student);
  retainedSet.value = s;
}

// Préparer la séance (M3 g8) : create_cps_session(prefill=False) PUIS
// update_cps_examined(retenus) — la rétention humaine devient l'ordre du jour.
// Deux appels EM, un geste. La date est OBLIGATOIRE (le serveur l'exige).
async function submitPrepare() {
  const retained = items.value.filter((r) => r.retained);
  if (!retained.length || !sessionDate.value) return;
  actError.value = '';
  try {
    busy.value = true;
    const sess = await prepareCouncilSession({
      academic_term: params.value.term, session_date: sessionDate.value,
      prefill_candidates: false,
    });
    await examineCouncilStudent({
      name: sess.name,
      examined: retained.map((r) => ({ student: r.student, criteria_snapshot: r.criteria_snapshot })),
    });
    prepareOpen.value = false; sessionDate.value = '';
    pending.value = 'Séance ' + sess.name + ' préparée avec ' + retained.length
      + ' cas retenus. Elle se tient à l’écran de la séance.';
  } catch (e) { actError.value = e.message || 'La préparation a échoué.'; }
  finally { busy.value = false; }
}

function exportList() {
  pending.value = 'L’export de la liste n’est pas branché : aucun point d’entrée ne le sert, et '
    + 'reconstituer le fichier au navigateur produirait un document sans millésime.';
}

// Le filtre « Retenus » est CLIENT (la rétention l'est) ; les critères sont serveur.
function reload() {
  const crit = filter.value === 'retained' ? null : filter.value;
  res.load({ ...params.value, criterion: crit });
}
// Le contexte arrive APRÈS le mount en mode serveur (stabilisation §5) :
// même patron que le planning — on ne part pas sans le semestre, et on
// recharge quand il arrive. (Les signatures serveur du conseil sont
// positionnelles : un appel sans terme fait 500, pas un vide.)
onMounted(() => { if (params.value.term) reload(); });
watch(params, reload);
</script>
