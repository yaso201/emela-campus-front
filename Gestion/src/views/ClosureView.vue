<template>
  <div>
    <header class="mb-4 flex flex-wrap items-start gap-4">
      <div>
        <p class="mb-2 text-caption text-ln-gray-500">
          Clôture · <b class="font-semibold text-ln-gray-900">Année {{ data.year_label }}</b>
        </p>
        <h1 class="text-h1 tracking-tight text-ln-gray-900">Clôturer l'année {{ data.year_label }}</h1>
        <p class="mt-1 text-body-sm text-ln-gray-500">{{ subtitle }}</p>
      </div>
      <div v-if="state === 'ready'" class="ml-auto">
        <button v-if="!running.length" type="button" class="ln-btn-primary" @click="startClosing">
          {{ data.requires_reason ? 'Clôturer avec motif…' : 'Clôturer l’année' }}
        </button>
        <!-- MANDAT-14 (G-M7, C10) : un semestre court — l'acte ordinaire n'est pas offert ; l'anticipée est
             un acte DISTINCT, explicite, avec son propre motif (X2 : l'acte « Clôture anticipée » au registre). -->
        <button v-else type="button" class="ln-btn-primary" @click="startEarly">Clôture anticipée…</button>
      </div>
    </header>

    <StateBanner v-if="done" variant="success" lead="Année close." :text="done" />
    <StateBanner v-if="actError" variant="warning" lead="Clôture refusée." :text="actError" />
    <StateBanner v-if="state === 'ready' && running.length" variant="warning"
                 :lead="'Un semestre court encore : ' + running.map((t) => t.academic_term + ' (fin le ' + frDate(t.term_end_date) + ')').join(', ') + '.'"
                 class="mb-4">
      La clôture ordinaire attend la fin des semestres de l’année : le serveur la refuse tant qu’un semestre
      court. Clore maintenant est une <b class="font-semibold">clôture anticipée</b> — un acte distinct,
      motivé à part, qui gèle l’année comme l’autre et se rouvre de la même façon.
    </StateBanner>

    <StateBanner variant="info" lead="Les deux années coexistent.">
      L'année {{ data.next_year_label }} est ouverte depuis le {{ data.next_year_opened_on }}. Clore
      {{ data.year_label }} n'inscrit, ne réinscrit et n'exclut personne : l'inscription est un acte
      distinct, déjà ouvert.
    </StateBanner>

    <BlockState v-if="state !== 'ready'" :state="state === 'denied' ? 'loading' : state"
                title="Aucune année à clore"
                message="Aucune année ouverte sur ce contexte. Une année déjà close se rouvre depuis son propre écran."
                :rows="4" :row-height="64" :skeleton-widths="[260, 'auto', 120]"
                @retry="reload" />

    <div v-else class="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1fr_420px]">
      <div class="flex flex-col gap-5">
        <!-- ⚠️ PANNEAU 1 · LES ANOMALIES. Ce qui aurait dû être réglé. L'écran ne
             barre rien : il montre ce qui reste ouvert et laisse clore quand même,
             en le sachant — mais alors le motif est exigé. -->
        <section class="overflow-hidden rounded-md-ln border"
                 :class="data.open_anomalies ? 'border-ln-warning' : 'border-ln-gray-200'">
          <header class="flex items-start gap-3 border-b px-4 py-3"
                  :class="data.open_anomalies ? 'border-ln-warning-bg bg-ln-warning-bg' : 'border-ln-gray-200 bg-ln-gray-50'">
            <div>
              <h2 class="text-h2 text-ln-gray-900">Anomalies</h2>
              <p class="mt-0.5 max-w-2xl text-caption leading-relaxed text-ln-gray-700">
                Ce qui aurait dû être réglé avant la clôture. Rien n'empêche de clore — mais clore
                avec une anomalie <b class="font-semibold text-ln-gray-900">exige un motif</b>.
              </p>
            </div>
            <span class="ml-auto flex-shrink-0">
              <StatusPill v-if="data.open_anomalies" status="anomalie"
                          :label="data.open_anomalies + (data.open_anomalies >= 2 ? ' anomalies' : ' anomalie')" />
              <StatusPill v-else status="valide" label="Aucune anomalie" />
            </span>
          </header>
          <ul>
            <li v-for="a in data.anomalies" :key="a.key"
                class="flex flex-wrap items-start gap-x-4 gap-y-2 border-b border-ln-gray-100 px-4 py-3 last:border-b-0">
              <span class="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-micro font-bold"
                    :class="a.ok ? 'bg-ln-success-bg text-ln-success' : 'bg-ln-warning-bg text-ln-warning'"
                    aria-hidden="true">{{ a.ok ? '✓' : '!' }}</span>
              <span class="min-w-[280px] flex-1">
                <b class="text-body-sm font-semibold text-ln-gray-900">{{ a.label }}</b>
                <span class="block text-caption leading-relaxed text-ln-gray-600">{{ a.detail }}</span>
              </span>
              <span class="ml-auto flex items-center gap-2">
                <StatusPill :status="a.status" :label="a.status_label" />
                <router-link v-if="a.route" :to="{ name: a.route }"
                             class="inline-flex h-[26px] items-center rounded-sm-ln border border-ln-gray-300 bg-white px-2.5 text-caption font-semibold">
                  Voir la liste
                </router-link>
              </span>
            </li>
          </ul>
        </section>

        <!-- ⚠️ PANNEAU 2 · LES CONTINUATIONS. Ni anomalie, ni retard : ces objets
             survivent à la clôture PAR CONCEPTION, et n'appellent aucun motif.
             Les mêler aux anomalies exigerait un motif pour une procédure
             disciplinaire qui court normalement. -->
        <section class="overflow-hidden rounded-md-ln border border-ln-gray-200">
          <header class="flex items-start gap-3 border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
            <div>
              <h2 class="text-h2 text-ln-gray-900">Ce qui continue après la clôture</h2>
              <p class="mt-0.5 max-w-2xl text-caption leading-relaxed text-ln-gray-700">
                Ni anomalie, ni retard : ces objets survivent à la clôture par conception. Ils
                <b class="font-semibold text-ln-gray-900">n'appellent aucun motif</b>.
              </p>
            </div>
            <span class="ml-auto flex-shrink-0">
              <StatusPill status="propose" :label="data.continuations.length + ' continuations'" />
            </span>
          </header>
          <ul>
            <li v-for="c in data.continuations" :key="c.key"
                class="flex flex-wrap items-start gap-x-4 gap-y-2 border-b border-ln-gray-100 px-4 py-3 last:border-b-0">
              <span class="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-ln-blue-100 text-micro font-bold text-ln-blue-700"
                    aria-hidden="true">i</span>
              <span class="min-w-[280px] flex-1">
                <b class="text-body-sm font-semibold text-ln-gray-900">{{ c.label }}</b>
                <span class="block text-caption leading-relaxed text-ln-gray-600">{{ c.detail }}</span>
              </span>
              <span class="ml-auto flex items-center gap-2">
                <StatusPill :status="c.status" :label="c.status_label" />
                <router-link v-if="c.route" :to="{ name: c.route }"
                             class="inline-flex h-[26px] items-center rounded-sm-ln border border-ln-gray-300 bg-white px-2.5 text-caption font-semibold">
                  Voir
                </router-link>
              </span>
            </li>
          </ul>
        </section>

        <section class="overflow-hidden rounded-md-ln border border-ln-gray-200">
          <header class="border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
            <h2 class="text-h2 text-ln-gray-900">Ce que la clôture produit</h2>
            <p class="mt-0.5 text-caption text-ln-gray-500">Et ce qu'elle ne produit pas.</p>
          </header>
          <ul class="px-4 py-3">
            <li v-for="p in data.produces" :key="p.label"
                class="mb-3 flex items-start gap-3 last:mb-0">
              <span class="mt-0.5 flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-sm-ln border text-micro font-bold"
                    :class="p.on ? 'border-ln-blue-800 bg-ln-blue-800 text-white' : 'border-ln-gray-300 bg-ln-gray-100 text-ln-gray-400'"
                    aria-hidden="true">{{ p.on ? '✓' : '×' }}</span>
              <span>
                <b class="text-body-sm font-semibold" :class="p.on ? 'text-ln-gray-900' : 'text-ln-gray-600'">{{ p.label }}</b>
                <span class="block text-caption leading-relaxed text-ln-gray-600">{{ p.detail }}</span>
              </span>
            </li>
          </ul>
        </section>
      </div>

      <div class="flex flex-col gap-5">
        <!-- MANDAT-14 (C10) : l'acte nomme l'année qui devient courante (`new_current_year`, exigé par le serveur),
             choisie parmi les autres années du contexte — jamais devinée. -->
        <label v-if="closing || early" class="flex flex-col gap-1">
          <span class="text-caption font-semibold text-ln-gray-700">Année qui devient courante</span>
          <select v-model="newCurrentYear" class="h-10 rounded-sm-ln border border-ln-gray-300 bg-white px-2 text-body-sm">
            <option value="" disabled>Choisir l’année…</option>
            <option v-for="y in otherYears" :key="y.id" :value="y.id">{{ y.label }}</option>
          </select>
        </label>

        <!-- MANDAT-14 (G-M7) : la clôture anticipée — la case explicite et SON motif (early_closure_reason),
             distinct du motif ordinaire. Le bouton reste inerte tant que les deux ne sont pas posés. -->
        <section v-if="early" class="overflow-hidden rounded-md-ln border border-ln-warning">
          <header class="border-b border-ln-warning-bg bg-ln-warning-bg px-4 py-3">
            <h2 class="text-h2 text-ln-gray-900">Clôture anticipée de {{ yearLabel }}</h2>
            <p class="mt-0.5 text-caption leading-relaxed text-ln-gray-700">
              {{ running.map((t) => t.academic_term).join(', ') }} court jusqu’au
              {{ running.map((t) => frDate(t.term_end_date)).join(', ') }}. Ses notes et ses décisions seront gelées
              à la clôture, comme celles des semestres finis.
            </p>
          </header>
          <div class="flex flex-col gap-3 px-4 py-3">
            <label class="flex items-start gap-2 text-body-sm text-ln-gray-900">
              <input v-model="earlyAck" type="checkbox" class="mt-1" />
              <span>Je clos l’année <b class="font-semibold">avant la fin de ses semestres</b>.</span>
            </label>
            <label class="flex flex-col gap-1">
              <span class="text-caption font-semibold text-ln-gray-700">Motif de la clôture anticipée</span>
              <textarea v-model="earlyReason" rows="4" class="rounded-sm-ln border border-ln-gray-300 px-3 py-2 text-body-sm"
                        placeholder="Ce qui justifie de clore avant la fin du semestre…" />
              <span class="text-micro text-ln-gray-500">Porté par l’acte « Clôture anticipée » du registre ; il ne remplace pas le motif d’anomalie.</span>
            </label>
            <div class="flex justify-end gap-2">
              <button type="button" class="ln-btn-secondary" @click="early = false">Revenir</button>
              <button type="button" class="ln-btn-primary"
                      :disabled="busy || !earlyAck || earlyReason.trim().length < 10 || !newCurrentYear"
                      @click="submitEarly">Clôturer par anticipation</button>
            </div>
            <p class="text-micro text-ln-gray-500">Réservé au Director — non à la Direction : deux rôles de nom voisin.</p>
          </div>
        </section>

        <!-- Le motif est une ÉTAPE, pas un champ en bas de page : le bouton reste
             inerte tant qu'elle n'est pas complète. -->
        <ReasonStep v-if="closing" title="Motif de clôture"
                    :subtitle="reasonSubtitle"
                    name="closure" reason-label="Ce qui justifie de clore maintenant"
                    :reason-groups="reasonGroups"
                    detail-label="Pourquoi ne pas attendre leur résolution"
                    detail-placeholder="Ce qui justifie de clore malgré ces anomalies…"
                    detail-hint="Le motif reste lisible avec l'acte de clôture, et ne s'efface pas."
                    confirm-label="Clôturer l'année"
                    footnote="Réservé au Director — non à la Direction : deux rôles de nom voisin."
                    :modal="false"
                    @submit="submitClosure" @cancel="cancelClosure" />

        <section class="rounded-md-ln border border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
          <!-- Q18 : la personne qui a prononcé l'acte, par son nom. -->
          <p class="text-body-sm text-ln-gray-900">
            <b class="font-semibold">Année {{ data.previous.year_label }} — close le
              {{ data.previous.closed_on }}</b> par {{ data.previous.closed_by_name || data.previous.closed_by }}.
          </p>
          <p v-if="data.previous.reopened" class="mt-1 text-caption leading-relaxed text-ln-gray-600">
            Rouverte, puis close à nouveau. Le motif de réouverture ne s'est pas effacé à la
            nouvelle clôture — sans quoi une année deux fois close se lirait comme une année close
            une seule fois.
          </p>
        </section>

        <section class="overflow-hidden rounded-md-ln border border-ln-gray-200">
          <header class="border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
            <h3 class="text-[14px] font-semibold text-ln-gray-900">
              Réouverture de {{ data.previous.year_label }}
            </h3>
            <p class="mt-0.5 text-caption text-ln-gray-500">
              Une année close se rouvre — motivée, tracée, bornée.
            </p>
          </header>
          <ul class="px-4 py-3">
            <li v-for="(j, i) in data.previous.journal" :key="i"
                class="mb-2.5 flex items-baseline gap-3 last:mb-0">
              <span class="w-[92px] flex-shrink-0 text-caption tabular text-ln-gray-500">{{ j.date }}</span>
              <span class="text-body-sm leading-relaxed text-ln-gray-700">
                <b v-if="j.lead" class="font-semibold text-ln-gray-900">{{ j.lead }}</b>
                {{ j.text }}
              </span>
            </li>
          </ul>
          <footer class="flex items-center gap-3 border-t border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
            <p class="mr-auto text-caption text-ln-gray-500">Réservé au Director.</p>
            <button type="button" class="ln-btn-secondary" @click="reopen">
              Rouvrir {{ data.previous.year_label }}…
            </button>
          </footer>
        </section>

        <StateBanner variant="warning" lead="La clôture n’est pas une fin de travail.">
          Les documents s'émettent encore, les procédures courent encore, la réouverture existe. Ce
          que la clôture arrête, ce sont les <b class="font-semibold">notes et les décisions
          académiques</b> — rien d'autre.
        </StateBanner>
      </div>
    </div>

    <StateBanner v-if="pending" variant="warning" lead="Acte non disponible." :text="pending" class="mt-4" />
  </div>
</template>

<script setup>
/**
 * Grappe 9 · écran N12 du lot 7 — la clôture d'année.
 *
 * ⚠️ DEUX PANNEAUX SÉPARÉS, ET C'EST TOUTE LA CONCEPTION DE CET ÉCRAN.
 *
 *   — les ANOMALIES : ce qui aurait dû être réglé. Clore quand même est permis, et
 *     exige un motif ;
 *   — les CONTINUATIONS : ce qui survit à la clôture par conception. Aucun motif.
 *
 * Une liste unique aurait produit l'une des deux fautes symétriques : exiger un
 * motif pour une procédure disciplinaire qui court normalement, ou laisser clore
 * sans un mot sur trois dossiers sans décideur. `requires_reason` est porté par la
 * donnée, et `data.requires_reason` est DÉRIVÉ des anomalies ouvertes au simulacre —
 * l'écran ne recompte pas la règle.
 *
 * ⚠️ L'écran ne barre rien. Il montre ce qui reste ouvert et laisse la direction
 * clore en le sachant : ce qui compte est que la liste soit exhaustive avant l'acte.
 *
 * 🔴 Aucun de ces chemins n'est tranché : voir `api/closure.js`.
 */
import { computed, onMounted, ref } from 'vue';
import { ReasonStep, StateBanner, StatusPill } from '../components/index.js';
import BlockState from '../components/internal/BlockState.vue';
import { useAcademicContext } from '../composables/useAcademicContext.js';
import { useResource } from '../composables/useResource.js';
import { closeAcademicYear, getYearClosure } from '../api/closure.js';

const { params, years } = useAcademicContext();
const res = useResource(getYearClosure, { isEmpty: (d) => !d?.anomalies?.length });
const state = res.state;
const pending = ref('');
const closing = ref(false);
const done = ref('');
const actError = ref('');
const busy = ref(false);

const data = computed(() => res.data.value
  || { anomalies: [], continuations: [], produces: [], previous: { journal: [] } });

// MANDAT-14 (C10) : l'année à clore est celle du contexte (`params.academic_year`, jamais fabriquée) ; celle qui
// devient courante se choisit parmi les AUTRES années du contexte.
const yearId = computed(() => params.value?.academic_year || '');
const yearLabel = computed(() => data.value.year_label || data.value.academic_year || '');
const otherYears = computed(() => (years.value || []).filter((y) => y.id !== yearId.value && y.label !== yearLabel.value));
const newCurrentYear = ref('');

const subtitle = computed(() => {
  if (state.value !== 'ready') return 'Chargement de l’état de clôture';
  const n = Number(data.value.open_anomalies) || 0;
  const students = Number(data.value.students) || 0;
  return [
    'ouverte le ' + data.value.opened_on,
    'jury tenu le ' + data.value.jury_on,
    students + (students >= 2 ? ' étudiants' : ' étudiant'),
    n ? n + (n >= 2 ? ' anomalies subsistent' : ' anomalie subsiste') : 'aucune anomalie',
  ].join(' · ');
});

const reasonSubtitle = computed(() => {
  if (!data.value.requires_reason) {
    return 'Aucune anomalie ne subsiste : la clôture se prononce sans motif. Les procédures, '
      + 'les demandes et les constats en cours n’en appellent aucun.';
  }
  return 'Exigé parce qu’une anomalie subsiste. Sans anomalie, la clôture se prononce sans motif — '
    + 'les continuations, elles, n’en appellent jamais.';
});

/**
 * Les catégories de motif viennent des ANOMALIES OUVERTES, non d'une énumération
 * inventée : le motif porte sur ce qui reste ouvert, et rien d'autre.
 */
const reasonGroups = computed(() => [{
  key: 'anomalie',
  label: '',
  options: (data.value.anomalies || []).filter((a) => !a.ok)
    .map((a) => ({ value: a.key, label: 'Clore malgré : ' + a.label }))
    .concat([{ value: 'autre', label: 'Un autre motif, précisé ci-dessous' }]),
}]);

function startClosing() {
  closing.value = true;
  early.value = false;
  pending.value = ''; done.value = ''; actError.value = '';
}

// MANDAT-14 (C10) : la clôture ordinaire est BRANCHÉE — le serveur la refuse tant qu'un semestre court, par sa
// phrase ; l'écran la relit (`actError`).
async function submitClosure(payload) {
  if (!newCurrentYear.value) { actError.value = 'Choisissez l’année qui devient courante.'; return; }
  busy.value = true; actError.value = ''; done.value = '';
  try {
    const reason = [payload.reason, payload.detail].filter(Boolean).join(' — ');
    await closeAcademicYear({ academic_year: params.value?.academic_year, new_current_year: newCurrentYear.value, reason });
    closing.value = false;
    done.value = `L’année ${yearLabel.value} est close ; ses notes et ses décisions sont gelées.`;
    res.load({ ...params.value });
  } catch (e) { actError.value = e.message; } finally { busy.value = false; }
}

/** L'échappatoire dit ce qu'elle fait : elle referme, elle ne clôt pas. */
function cancelClosure() {
  closing.value = false;
  pending.value = 'Clôture abandonnée — l’année reste ouverte, rien n’a été enregistré.';
}

// La réouverture reste à brancher sur cet écran (dette déclarée au rapport) : l'écran le dit, sans nom de fonction.
function reopen() {
  pending.value = 'La réouverture de ' + data.value.previous.year_label + ' ne se fait pas encore depuis cet écran. '
    + 'Elle exige un motif, tracé, qui ne s’efface pas à la nouvelle clôture.';
}

// MANDAT-14 (G-M7) : les semestres en cours, rendus par get_year_status (C10) ; la date au format de l'écran (P16).
const running = computed(() => data.value.running_terms || []);
const early = ref(new URLSearchParams(location.search).get('ouvrir') === 'anticipee');
const earlyAck = ref(false);
const earlyReason = ref('');
const frDate = (iso) => (iso ? new Date(String(iso).slice(0, 10) + 'T12:00:00')
  .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).replace(/^1 /, '1er ') : '');
function startEarly() { early.value = true; closing.value = false; pending.value = ''; done.value = ''; actError.value = ''; }
async function submitEarly() {
  busy.value = true; actError.value = ''; done.value = '';
  try {
    await closeAcademicYear({ academic_year: params.value?.academic_year, new_current_year: newCurrentYear.value,
      early_closure: 1, early_closure_reason: earlyReason.value.trim() });
    early.value = false;
    done.value = `L’année ${yearLabel.value} est close par anticipation ; le registre porte l’acte « Clôture anticipée ».`;
    res.load({ ...params.value });
  } catch (e) { actError.value = e.message; } finally { busy.value = false; }
}

function reload() { res.load({ ...params.value }); }
onMounted(reload);
</script>
