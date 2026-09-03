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
        <button type="button" class="ln-btn-primary" @click="startClosing">
          {{ data.requires_reason ? 'Clôturer avec motif…' : 'Clôturer l’année' }}
        </button>
      </div>
    </header>

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

    <div v-else class="grid items-start gap-5 xl:grid-cols-[1fr_420px]">
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
                          :label="data.open_anomalies + ' anomalie(s)'" />
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
          <p class="text-body-sm text-ln-gray-900">
            <b class="font-semibold">Année {{ data.previous.year_label }} — close le
              {{ data.previous.closed_on }}</b> par {{ data.previous.closed_by }}.
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
import { getYearClosure } from '../api/closure.js';

const { params } = useAcademicContext();
const res = useResource(getYearClosure, { isEmpty: (d) => !d?.anomalies?.length });
const state = res.state;
const pending = ref('');
const closing = ref(false);

const data = computed(() => res.data.value
  || { anomalies: [], continuations: [], produces: [], previous: { journal: [] } });

const subtitle = computed(() => {
  if (state.value !== 'ready') return 'Chargement de l’état de clôture';
  return [
    'ouverte le ' + data.value.opened_on,
    'jury tenu le ' + data.value.jury_on,
    data.value.students + ' étudiants',
    data.value.open_anomalies
      ? data.value.open_anomalies + ' anomalie(s) subsistent'
      : 'aucune anomalie',
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
  pending.value = '';
}

function submitClosure(payload) {
  closing.value = false;
  pending.value = 'La clôture (' + payload.reason + ') appelle `close_academic_year`, dont le point '
    + 'd’entrée n’est pas tranché. L’année reste ouverte et le motif n’a pas été enregistré.';
}

/** L'échappatoire dit ce qu'elle fait : elle referme, elle ne clôt pas. */
function cancelClosure() {
  closing.value = false;
  pending.value = 'Clôture abandonnée — l’année reste ouverte, rien n’a été enregistré.';
}

function reopen() {
  pending.value = 'Rouvrir ' + data.value.previous.year_label + ' appelle `reopen_academic_year`, '
    + 'dont le point d’entrée n’est pas tranché. Le motif de réouverture serait exigé, tracé, et '
    + 'ne s’effacerait pas à la nouvelle clôture.';
}

function reload() { res.load({ ...params.value }); }
onMounted(reload);
</script>
