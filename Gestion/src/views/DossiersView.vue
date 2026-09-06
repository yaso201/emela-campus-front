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

    <StateBanner variant="info" lead="Six procédures, un seul patron.">
      Créer, déposer, <b class="font-semibold">instruire</b>, <b class="font-semibold">décider</b>,
      notifier — et une sortie sans décision partout. Instruction et décision sont
      <b class="font-semibold">deux actes</b>, et celui qui instruit ne décide pas. Deux procédures
      débordent le patron : le congé porte un <b class="font-semibold">arbitrage</b> au-dessus de la
      décision, la discipline un <b class="font-semibold">appel suspensif</b>.
    </StateBanner>

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

        <!-- ⚠️ L'appel suspend les effets : l'état se lit AVANT tout le reste,
             sinon un agent croit la sanction en cours. -->
        <!-- ⚠️ Le contrat est celui du composant (D-05), lu et non inventé :
             `deadline` porte `remaining` du SERVEUR, et `state` a exactement cinq
             valeurs dont `suspendue`. Les titres des deux colonnes sont surchargés
             parce que sur une suspension sous appel, « ce qui se produira » et
             « ce qui reste possible » se disent « arrêté » et « repris ». -->
        <DeferredEffectBanner v-if="current.suspended_by_appeal && current.deadline"
                              :deadline="current.deadline"
                              state="suspendue" tone="warning"
                              heading="Suspendue · appel en cours"
                              :lead="appealMessage(current)"
                              will-title="Ce qui est arrêté"
                              can-title="Ce qui a repris"
                              class="mb-4" />

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

            <!-- ⚠️ INSTRUCTION ET DÉCISION SONT DEUX ACTES, et le motif est
                 obligatoire à la décision. C'est le patron du lot 3, et il vaut
                 pour les six. -->
            <section v-if="current.decision_reason" class="mb-4 overflow-hidden rounded-md-ln border border-ln-gray-200">
              <header class="border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
                <h3 class="text-[14px] font-semibold text-ln-gray-900">Motif de la décision</h3>
                <p class="mt-0.5 text-caption text-ln-gray-500">
                  Prononcée par {{ current.decided_by }} · {{ current.decider_role }}
                </p>
              </header>
              <p class="px-4 py-3 text-body-sm leading-relaxed text-ln-gray-700">
                « {{ current.decision_reason }} »
              </p>
            </section>

            <!-- Le TRONC : l'acte attendu (instruire / décider), piloté par get_dossier. -->
            <TrunkActPanel :dossier="current" :error="actError" :busy="busy" class="mb-4"
                           @instruct="onInstruct" @decide="onDecide" />

            <!-- Ce que la procédure ajoute au patron (dérivations — ⏸ contrat partiel) -->
            <component :is="extraPanel" v-if="extraPanel" :dossier="current" @act="notBuilt" />
          </div>

          <aside class="flex flex-col gap-4">
            <!-- Qui instruit, qui décide — et l'interdit qui les sépare -->
            <section class="overflow-hidden rounded-md-ln border border-ln-gray-200">
              <header class="border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
                <h3 class="text-[14px] font-semibold text-ln-gray-900">Qui instruit, qui décide</h3>
              </header>
              <div class="px-4 py-3">
                <p class="mb-2 text-caption text-ln-gray-500">Instruction</p>
                <p class="text-body-sm text-ln-gray-900">{{ current.instructed_by || '—' }}</p>
                <p class="mb-2 mt-3 border-t border-ln-gray-100 pt-3 text-caption text-ln-gray-500">Décision</p>
                <p class="text-body-sm text-ln-gray-900">
                  {{ current.decided_by || 'à prendre' }}
                  <span class="block text-caption text-ln-gray-500">{{ current.decider_role }}</span>
                </p>
                <!-- ⚠️ Le maker-checker, dit avant l'acte plutôt qu'au refus. -->
                <p v-if="current.sole_decider"
                   class="mt-3 rounded-sm-ln bg-ln-warning-bg p-3 text-caption leading-snug text-[#6B4415]">
                  <b class="font-semibold">Celui qui a instruit ne peut pas décider.</b>
                  {{ current.instructed_by }} est le seul titulaire du rôle
                  {{ current.decider_role.toLowerCase() }} : ce dossier n'apparaît dans aucune file
                  ordinaire, et il attend depuis {{ plural(current.waiting_days, 'jour') }}.
                  <router-link :to="{ name: 'awaiting-decider' }" class="font-semibold underline">
                    Voir la liste
                  </router-link>
                </p>
              </div>
            </section>

            <!-- Ce que la procédure porte de plus, nommé -->
            <section v-if="current.extra" class="overflow-hidden rounded-md-ln border border-ln-blue-200 bg-ln-blue-50">
              <header class="border-b border-ln-blue-200 px-4 py-3">
                <h3 class="text-[14px] font-semibold text-ln-blue-900">
                  {{ current.extra.label }}
                  <span class="ml-1.5 font-normal text-ln-blue-700">· {{ current.extra.role }}</span>
                </h3>
              </header>
              <p class="px-4 py-3 text-caption leading-relaxed text-ln-blue-900">
                {{ current.extra.note }}
              </p>
              <!-- ⚠️ La procédure PEUT porter cette dérivation ; ce dossier ne la
                   porte pas. Le dire vaut mieux qu'un panneau absent sans raison. -->
              <p v-if="!current.extra_applies"
                 class="border-t border-ln-blue-200 px-4 py-3 text-caption leading-relaxed text-ln-blue-700">
                Ce dossier n'en porte pas : {{ notCarried(current) }}
              </p>
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
 * `deposit`, `issue`, `pronounce`, `register` — la mécanique non. C'est le patron du
 * lot 3, confirmé par le code.
 *
 * ⚠️ MAIS DEUX PROCÉDURES LE DÉBORDENT, et un écran unique serait faux pour elles :
 *
 *   — LE CONGÉ porte un ARBITRAGE au-dessus de la décision. Une décision de congé
 *     n'est donc pas définitive : l'écran montre deux niveaux, sinon il laisse
 *     croire qu'elle l'est.
 *
 *   — LA DISCIPLINE porte un APPEL SUSPENSIF. C'est la seule procédure où la
 *     décision est REJOUÉE par une autorité supérieure, sur un état modifié
 *     entre-temps — des jours déjà purgés.
 *
 * D'où la forme : un fil et une identité communs, et un panneau propre par
 * dérivation, monté dynamiquement. Le fil lui-même est DÉRIVÉ du patron déclaré au
 * simulacre : un fil écrit par procédure divergerait du jour où l'une gagne une
 * étape.
 */
import { computed, onMounted, ref, watch } from 'vue';
import {
  WorkQueue, StatusPill, StateBanner, ProcedureChain, DeferredEffectBanner,
} from '../components/index.js';
import AppealPanel from './dossiers/AppealPanel.vue';
import ArbitrationPanel from './dossiers/ArbitrationPanel.vue';
import CommissionPanel from './dossiers/CommissionPanel.vue';
import ContradictoryPanel from './dossiers/ContradictoryPanel.vue';
import RetractionPanel from './dossiers/RetractionPanel.vue';
import TrunkActPanel from './dossiers/TrunkActPanel.vue';
import { useAcademicContext } from '../composables/useAcademicContext.js';
import { useResource } from '../composables/useResource.js';
import { listDossiers } from '../api/dossiers-read.js';
import {
  instructCoaRequest, decideCoaRequest,
  instructLeaveReturnRequest, decideLeaveReturnRequest,
} from '../api/dossiers.js';

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
  subtitle: c.name + ' · ouvert le ' + (c.opened_on || c.created || '—'),
  status: c.suspended_by_appeal ? 'suspendue' : (c.status_tone || 'brouillon'),
  statusLabel: c.suspended_by_appeal ? 'Appel en cours' : c.status,
  // Un dossier sans décideur disponible attend : c'est un retard, pas un état.
  due: c.sole_decider ? 'depuis ' + plural(c.waiting_days, 'jour') : null,
  overdue: !!c.sole_decider,
})));

const identity = computed(() => {
  const c = current.value;
  if (!c) return [];
  // ⚠️ CONTRAT PARTIEL (get_dossier) : `ground` et `outcomes` ne sont pas rendus
  // par le détail transversal — on GARDE (jamais un `.join` sur un absent), et on
  // n'affiche la ligne que si le serveur la porte (dégradation propre, S-19).
  return [
    { k: 'Procédure', v: c.kind_label },
    { k: 'Étudiant', v: c.student_name + ' · ' + c.student },
    { k: 'Ouvert le', v: c.opened_on || c.created || '—' },
    ...(c.ground ? [{ k: 'Catégorie', v: c.ground }] : []),
    ...(c.outcomes?.length ? [{ k: 'Issues possibles', v: c.outcomes.join(' ou ') }] : []),
  ];
});

/** Le panneau propre à la dérivation — monté par le patron, pas par une cascade. */
const EXTRA_PANELS = {
  appel: AppealPanel, arbitrage: ArbitrationPanel, commission: CommissionPanel,
  contradictoire: ContradictoryPanel, retractation: RetractionPanel,
};
/**
 * ⚠️ MONTÉ SEULEMENT SI LE DOSSIER PORTE LA CHOSE.
 *
 * `extra` dit ce que la PROCÉDURE peut porter ; `extra_applies` dit ce que CE
 * dossier porte. Ma première version ne lisait que le premier : le panneau d'appel
 * se montait pour tout dossier disciplinaire, y compris un dossier classé sans
 * sanction — et il plantait au premier clic sur un `appeal` inexistant.
 */
const extraPanel = computed(() => {
  const c = current.value;
  if (!c || !c.extra || !c.extra_applies) return null;
  return EXTRA_PANELS[c.extra.kind] || null;
});

/**
 * ⚠️ Le plafond de reprise n'est PAS calculé ici. Il vit dans `AppealPanel`, où il
 * sert — à côté du champ qu'il borne. Une seconde copie dans cette vue serait deux
 * calculs du même nombre, et le bandeau afficherait un plafond qui pourrait cesser
 * de s'accorder avec le champ.
 */
function appealMessage(c) {
  return 'Appel déposé le ' + c.appeal.appealed_on + '. Les effets sont suspendus depuis ce jour : '
    + 'l’accès de l’étudiant s’est rouvert et le décompte s’est arrêté. '
    + plural(c.appeal.days_served_at_appeal, 'jour') + ' sur ' + c.suspension.days
    + ' ont été purgés — le décompte est arrêté, il n’est pas effacé.';
}

const subtitle = computed(() => {
  if (listState.value !== 'ready') return 'Chargement des dossiers';
  const c = current.value;
  if (!c) return plural(items.value.length, 'dossier') + ' ouvert' + (items.value.length > 1 ? 's' : '')
    + ' · six procédures';
  return [c.name, c.ground, c.suspended_by_appeal ? 'appel en cours' : c.status].filter(Boolean).join(' · ');
});

function plural(n, w) { const v = Number(n) || 0; return v + ' ' + w + (v > 1 ? 's' : ''); }

/** Pourquoi la dérivation ne s'applique pas — jamais un panneau muet. */
const NOT_CARRIED = {
  appel: 'aucun appel n’a été déposé, et un dossier classé sans sanction n’en attend pas.',
  arbitrage: 'aucun arbitrage n’a été demandé — la décision est définitive.',
  commission: 'la commission n’a pas encore été ouverte.',
  contradictoire: 'la mise en demeure n’a pas encore été envoyée.',
  retractation: 'l’information préalable n’a pas encore été enregistrée.',
};
function notCarried(c) { return NOT_CARRIED[c.extra.kind] || 'l’acte n’a pas eu lieu.'; }
function setKind(k) { kind.value = k; selectedId.value = null; reload(); }
function notBuilt(what) {
  pending.value = (what || 'Cet acte') + " n'est pas encore branché au serveur. Rien n'a été enregistré.";
}

/* ── Le TRONC du patron (M3 g7) — instruire / décider, routés par domaine. Le
 * tronc uniforme ne couvre que congé + retour ; les procédures à verbe propre
 * (réorientation, démission, abandon, discipline) attendent un contrat serveur
 * par procédure (get_dossier ne porte pas leur détail — S-19). ── */
const TRUNK = {
  conge: { instruct: instructCoaRequest, decide: decideCoaRequest },
  retour: { instruct: instructLeaveReturnRequest, decide: decideLeaveReturnRequest },
};
const actError = ref('');
const busy = ref(false);
async function onInstruct() {
  const c = current.value; const t = TRUNK[c?.kind];
  if (!t) return;
  actError.value = '';
  try { busy.value = true; await t.instruct({ name: c.name }); reload(); }
  catch (e) { actError.value = e.message || 'Instruction refusée.'; }
  finally { busy.value = false; }
}
async function onDecide({ decision, decision_reason }) {
  const c = current.value; const t = TRUNK[c?.kind];
  if (!t) return;
  actError.value = '';
  try { busy.value = true; await t.decide({ name: c.name, decision, decision_reason }); reload(); }
  catch (e) { actError.value = e.message || 'Décision refusée.'; }
  finally { busy.value = false; }
}

function reload() {
  res.load({ ...params.value, kind: kind.value === 'all' ? null : kind.value });
}

onMounted(reload);
watch(params, reload);
watch(items, (v) => { if (v.length && !selectedId.value) selectedId.value = v[0].name; });
</script>
