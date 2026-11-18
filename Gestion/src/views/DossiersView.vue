<template>
  <div>
    <header class="mb-4 flex flex-wrap items-start justify-between gap-5">
      <div>
        <p class="mb-2 text-caption text-ln-gray-500">
          Dossiers · <b class="font-semibold text-ln-gray-900">{{ current ? current.kind_label : 'Six procédures' }}</b>
        </p>
        <h1 class="text-h1 tracking-tight text-ln-gray-900">
          {{ current ? current.student_name : 'Dossiers' }}
        </h1>
        <p class="mt-1 text-body-sm text-ln-gray-500">{{ subtitle }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <router-link :to="{ name: 'awaiting-decider' }" class="ln-btn-secondary">
          En attente d'un autre décideur
        </router-link>
      </div>
    </header>

    <StateBanner v-if="pending" variant="warning" lead="Acte non disponible." :text="pending" />

    <div class="mb-3 flex flex-wrap items-center gap-2">
      <button v-for="f in filters" :key="f.key" type="button"
              class="inline-flex h-[30px] items-center gap-1.5 rounded-sm-ln border px-3 text-caption font-medium"
              :class="f.key === kind ? 'border-ln-blue-900 bg-ln-blue-900 font-semibold text-white' : 'border-ln-gray-300 text-ln-gray-700'"
              @click="setKind(f.key)">
        {{ f.label }} <span class="tabular opacity-70">{{ f.count }}</span>
      </button>
    </div>

    <div class="grid items-start gap-5 xl:grid-cols-[368px_1fr]">
      <WorkQueue title="Dossiers ouverts" :items="queueItems" :selected-id="selectedId"
                 :total="queueItems.length"
                 :state="listState === 'denied' ? 'loading' : listState"
                 state-title="Aucun dossier"
                 state-message="Aucun dossier ouvert pour ce filtre. Ce n'est pas un écran vide : c'est une file vide."
                 @select="selectedId = $event" @retry="reload" />

      <section v-if="current">
        <!-- Le fil, DÉRIVÉ du patron de la procédure -->
        <ProcedureChain :steps="current.chain" class="mb-4" />

        <!-- MANDAT-12 (K-d de la PC1B) : l'appel, l'arbitrage, la commission, le contradictoire et la
             rétractation se lisent dans les faits du dossier (`detail`, S-18) — plus de bandeau ni de
             panneau lisant des champs que le serveur ne rend pas. -->
        <div class="grid items-start gap-5 lg:grid-cols-[1fr_340px]">
          <div>
            <!-- L'identité du dossier -->
            <section class="mb-4 overflow-hidden rounded-md-ln border border-ln-gray-200">
              <header class="flex items-center gap-3 border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
                <h3 class="text-[14px] font-semibold text-ln-gray-900">{{ current.name }}</h3>
                <StatusPill class="ml-auto" :status="current.status_tone" :label="current.status" />
              </header>
              <dl class="px-4 py-3">
                <div v-for="row in identity" :key="row.k"
                     class="flex items-baseline gap-3 border-b border-ln-gray-100 py-2 last:border-b-0">
                  <dt class="w-[148px] flex-shrink-0 text-caption text-ln-gray-500">{{ row.k }}</dt>
                  <dd class="text-body-sm leading-snug text-ln-gray-900">{{ row.v }}</dd>
                </div>
              </dl>
            </section>

            <!-- MANDAT-12 (S-18) : les faits du dossier (le motif de la décision compris), puis LES ACTES
                 DU LECTEUR — dérivés au serveur de la machine de la procédure. Remplacent l'acte de tronc et
                 les panneaux qui lisaient des champs absents (K-d de la PC1B). -->
            <FactsPanel v-if="detailOf" :detail="detailOf.detail" :labels="detailOf.detail_labels || {}" />
            <ActsPanel v-if="detailOf" :available="detailOf.available_acts" :blocked="detailOf.blocked_acts"
                       :waiting-roles="detailOf.waiting_for_roles" :busy="busy" @act="onAct" />
            <StateBanner v-if="actError" variant="error" lead="L'acte a échoué." :text="actError" />
          </div>

          <aside class="flex flex-col gap-4">
            <!-- Qui instruit, qui décide — et l'interdit qui les sépare -->
            <section class="overflow-hidden rounded-md-ln border border-ln-gray-200">
              <header class="border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
                <h3 class="text-[14px] font-semibold text-ln-gray-900">Qui instruit, qui décide</h3>
              </header>
              <!-- MANDAT-12 (S-18) : l'instructeur et le décideur lus dans le dossier (C3 : leur nom, à
                   côté de l'identifiant) ; le rôle qui décide est celui de la PROCÉDURE. -->
              <div class="px-4 py-3">
                <p class="mb-2 text-caption text-ln-gray-500">Instruction</p>
                <p class="text-body-sm text-ln-gray-900">{{ person(detailOf, 'instructed_by') || '—' }}</p>
                <p class="mb-2 mt-3 border-t border-ln-gray-100 pt-3 text-caption text-ln-gray-500">Décision</p>
                <p class="text-body-sm text-ln-gray-900">
                  {{ decisionActor || 'à prendre' }}
                  <span class="block text-caption text-ln-gray-500">{{ detailOf?.decider_role || current.decider_role }}</span>
                </p>
                <router-link :to="{ name: 'awaiting-decider' }" class="mt-3 block text-caption font-semibold text-ln-blue-600">
                  Les dossiers dont le seul décideur a instruit
                </router-link>
              </div>
            </section>

            <!-- Ce que la procédure porte de plus, nommé (K-d : le panneau qui EXPLIQUE reste) -->
            <section v-if="NOTES[current.kind]" class="overflow-hidden rounded-md-ln border border-ln-blue-200 bg-ln-blue-50">
              <header class="border-b border-ln-blue-200 px-4 py-3">
                <h3 class="text-[14px] font-semibold text-ln-blue-900">
                  {{ NOTES[current.kind].label }}
                  <span class="ml-1.5 font-normal text-ln-blue-700">· {{ NOTES[current.kind].role }}</span>
                </h3>
              </header>
              <p class="px-4 py-3 text-caption leading-relaxed text-ln-blue-900">{{ NOTES[current.kind].note }}</p>
            </section>
          </aside>
        </div>
      </section>

      <section v-else class="rounded-md-ln border border-dashed border-ln-gray-300 px-6 py-8 text-center">
        <h4 class="text-h3 text-ln-gray-900">Choisissez un dossier</h4>
        <p class="mx-auto mt-1.5 max-w-md text-body-sm leading-relaxed text-ln-gray-500">
          Les six procédures partagent un patron : créer, déposer, instruire, décider, notifier. Ce
          qu'une procédure ajoute — un arbitrage, une commission, un contradictoire, un appel — est
          nommé sur son dossier.
        </p>
      </section>
    </div>
  </div>
</template>

<script setup>
/**
 * Grappe 7 · les dossiers — six procédures, un patron, deux dérivations.
 *
 * ═══ CE QUE LA LECTURE A ÉTABLI ═══
 *
 * Les six surfaces suivent la MÊME suite d'actes : créer, déposer, instruire,
 * décider, notifier, plus une sortie sans décision. Les verbes changent — `submit`,
 * `deposit`, `issue`, `pronounce`, `register` — la mécanique non.
 *
 * ⚠️ DEUX PROCÉDURES LE DÉBORDENT : le congé porte un ARBITRAGE au-dessus de la
 * décision ; la discipline un APPEL SUSPENSIF, qui rejoue la décision sur un état
 * modifié entre-temps.
 *
 * MANDAT-12 (S-18, maquette M6, verdict PC1B) : le détail se lit PAR NOM
 * (`get_dossier`) — les faits de la procédure, sa machine, les actes du lecteur
 * dérivés au serveur. Un acte = sa fonction d'appel et ses champs ; le front
 * n'écrit plus de tronc par procédure ni de panneau par dérivation (K-d). Ce qui
 * reste écrit ici : la NOTE qui explique ce que la procédure porte de plus.
 */
import { computed, onMounted, ref, watch } from 'vue';
import {
  WorkQueue, StatusPill, StateBanner, ProcedureChain,
} from '../components/index.js';
import FactsPanel from './dossiers/FactsPanel.vue';
import ActsPanel from './dossiers/ActsPanel.vue';
import { useAcademicContext } from '../composables/useAcademicContext.js';
import { useResource } from '../composables/useResource.js';
import { listDossiers, getDossier } from '../api/dossiers-read.js';
import * as DOS from '../api/dossiers.js';

const { params } = useAcademicContext();
const res = useResource(listDossiers, { isEmpty: (d) => !d?.items?.length });
const listState = res.state;

const kind = ref('all');
const selectedId = ref(null);
const pending = ref('');

const items = computed(() => res.data.value?.items || []);
const current = computed(() => items.value.find((c) => c.name === selectedId.value) || null);

const KINDS = {
  conge: 'Congé', retour: 'Retour de congé', reorientation: 'Réorientation',
  demission: 'Démission', abandon: 'Abandon', discipline: 'Discipline',
};

const filters = computed(() => {
  const counts = items.value.reduce((a, c) => ({ ...a, [c.kind]: (a[c.kind] || 0) + 1 }), {});
  return [{ key: 'all', label: 'Toutes', count: items.value.length },
    ...Object.keys(KINDS).filter((k) => counts[k])
      .map((k) => ({ key: k, label: KINDS[k], count: counts[k] }))];
});

const queueItems = computed(() => items.value.map((c) => ({
  id: c.name,
  title: c.student_name + ' · ' + c.kind_label,
  subtitle: c.name + ' · ouvert le ' + frDate(c.opened_on || c.created),
  status: c.suspended_by_appeal ? 'suspendue' : (c.status_tone || 'brouillon'),
  statusLabel: c.suspended_by_appeal ? 'Appel en cours' : c.status,
  // Un dossier sans décideur disponible attend : c'est un retard, pas un état.
  due: c.sole_decider ? 'depuis ' + plural(c.waiting_days, 'jour') : null,
  overdue: !!c.sole_decider,
})));

/* ── MANDAT-12 (S-18) — le détail lu par nom ; jamais celui d'un autre dossier. ── */
const detailRes = useResource(getDossier, { isEmpty: (d) => !d });
const detailOf = computed(() => (detailRes.data.value?.name === selectedId.value ? detailRes.data.value : null));
watch(selectedId, (n) => { if (n) detailRes.load({ name: n }); });

/** Le nom d'une personne du dossier (C3) : le libellé rendu par le serveur, sinon l'identifiant. */
function person(d, field) {
  if (!d) return null;
  return d.detail_labels?.[field] || d.detail?.[field] || d[field] || null;
}

/**
 * Le décideur : d'abord le FAIT de décision du dossier (son champ varie avec la procédure — `decision_by`
 * au congé, `decided_by` à la réorientation, `registered_by` / `refused_by` à la démission…), nommé ; à
 * défaut, l'acteur de l'étape « décision » du fil.
 */
const DECISION_FIELDS = ['decision_by', 'decided_by', 'registered_by', 'refused_by', 'pronounced_by', 'dismissed_by'];
const decisionActor = computed(() => {
  const d = detailOf.value;
  const field = DECISION_FIELDS.find((k) => d?.detail?.[k]);
  if (field) return person(d, field);
  const step = d?.chain?.find((s) => s.key === 'decision');
  // Une étape non accomplie n'a pas d'auteur : ce que le fil y porte est le rôle attendu, pas un décideur.
  if (!step?.actor || step.status !== 'done') return null;
  const named = Object.keys(d.detail || {}).find((k) => d.detail[k] === step.actor && d.detail_labels?.[k]);
  return named ? d.detail_labels[named] : step.actor;
});

/**
 * K-c — « Issues possibles » LUES DANS LA MACHINE (S-18), plus dans une table du
 * front : les statuts où le dossier peut finir — sans sortie, ou pris dans un
 * cycle (l'arbitrage du congé fait aller et venir Approuvée et Rejetée). « Annulée »
 * est la sortie sans décision, pas une issue.
 */
function outcomesOf(machine) {
  if (!machine) return [];
  const reaches = (from, to) => {
    const seen = new Set(); const todo = [...(machine[from] || [])];
    while (todo.length) {
      const s = todo.pop();
      if (s === to) return true;
      if (!seen.has(s)) { seen.add(s); todo.push(...(machine[s] || [])); }
    }
    return false;
  };
  return Object.keys(machine).filter((s) => s !== 'Annulée' && s !== 'Brouillon'
    && (!(machine[s] || []).length || reaches(s, s)));
}

const identity = computed(() => {
  const c = current.value;
  if (!c) return [];
  const outcomes = outcomesOf(detailOf.value?.machine);
  return [
    { k: 'Procédure', v: c.kind_label },
    { k: 'Étudiant', v: c.student_name + ' · ' + c.student },
    { k: 'Ouvert le', v: frDate(c.opened_on || c.created || detailOf.value?.created) },
    ...(c.ground ? [{ k: 'Catégorie', v: c.ground }] : []),
    ...(outcomes.length ? [{ k: 'Issues possibles', v: outcomes.join(' ou ') }] : []),
  ];
});

/**
 * K-d — LE PANNEAU QUI EXPLIQUE RESTE : ce que la procédure porte de plus que le
 * patron, nommé. Le FAIT (appel déposé, mise en demeure, rétractation…) se lit dans
 * `detail` ; la note, elle, décrit la procédure, pas le dossier.
 */
const NOTES = {
  conge: { label: 'Arbitrage', role: 'Direction',
    note: 'Une décision de congé peut être reprise par la direction. '
      + 'L’écran montre donc deux niveaux : la décision, et son arbitrage.' },
  reorientation: { label: 'Commission', role: 'Collégiale',
    note: 'La seule procédure dont l’instruction est collégiale : '
      + 'une commission, pas un instructeur.' },
  demission: { label: 'Rétractation', role: 'Étudiant',
    note: 'La rétractation appartient à l’étudiant. L’écran de gestion la '
      + 'montre comme un fait possible ; il ne l’offre pas comme un bouton.' },
  abandon: { label: 'Réponse de l’étudiant', role: 'Étudiant',
    note: 'Un abandon prononcé sans mise en demeure serait une décision '
      + 'sans contradictoire. L’ordre est visible, et il ne se contourne pas.' },
  discipline: { label: 'Appel', role: 'Direction',
    note: 'L’appel suspend les effets dès son dépôt. Statuer et fixer la '
      + 'reprise sont UN SEUL acte serveur — l’écran ne les sépare pas.' },
};

const subtitle = computed(() => {
  if (listState.value !== 'ready') return 'Chargement des dossiers';
  const c = current.value;
  if (!c) return plural(items.value.length, 'dossier') + ' ouvert' + (items.value.length > 1 ? 's' : '')
    + ' · six procédures';
  return [c.name, c.ground, c.suspended_by_appeal ? 'appel en cours' : c.status].filter(Boolean).join(' · ');
});

function plural(n, w) { const v = Number(n) || 0; return v + ' ' + w + (v > 1 ? 's' : ''); }
/** « 2027-03-09 10:12:00 » → « 09/03/2027 » ; une date absente reste un tiret. */
function frDate(v) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v || '');
  return m ? m[3] + '/' + m[2] + '/' + m[1] : '—';
}
function setKind(k) { kind.value = k; selectedId.value = null; reload(); }

/* ── Un acte = sa fonction d'appel (api/dossiers.js) et ses champs. ── */
// La clé de l'issue, par verbe serveur (`decision` le plus souvent).
const OUTCOME_KEY = { decideSuspensionAppeal: 'decision' };
const REASON_KEY = {
  arbitrateCoaRequest: 'arbitration_reason', refuseResignation: 'refusal_reason',
  pronounceAbandonment: 'pronounce_reason', dismissAbandonment: 'dismiss_reason',
  pronounceDisciplinarySuspension: 'pronounce_reason', closeWithoutSanction: 'closure_reason',
  decideSuspensionAppeal: 'appeal_reason', liftSuspension: 'lift_reason',
};
const actError = ref('');
const busy = ref(false);
async function onAct({ act, outcome, reason, values }) {
  const fn = DOS[act.act];
  if (!fn) { pending.value = 'Aucune fonction d’appel pour ' + act.act + '. Rien n’a été enregistré.'; return; }
  const payload = { name: selectedId.value, ...values };
  if (outcome) payload[OUTCOME_KEY[act.act] || 'decision'] = outcome;
  if (reason) payload[REASON_KEY[act.act] || 'decision_reason'] = reason;
  actError.value = '';
  pending.value = '';
  try { busy.value = true; await fn(payload); reload(); detailRes.load({ name: selectedId.value }); }
  catch (e) { actError.value = e.message || 'Acte refusé.'; }
  finally { busy.value = false; }
}

function reload() {
  res.load({ ...params.value, kind: kind.value === 'all' ? null : kind.value });
}

onMounted(reload);
watch(params, reload);
watch(items, (v) => { if (v.length && !selectedId.value) selectedId.value = v[0].name; });
</script>
