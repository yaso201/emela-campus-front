<template>
  <div>
    <header class="mb-4 flex flex-wrap items-start gap-4">
      <div>
        <p class="mb-2 text-caption text-ln-gray-500">
          Conseil pédagogique · <b class="font-semibold text-ln-gray-900">Préconisations</b>
        </p>
        <h1 class="text-h1 tracking-tight text-ln-gray-900">Préconisations de l'année</h1>
        <p class="mt-1 text-body-sm text-ln-gray-500">{{ subtitle }}</p>
      </div>
      <div class="ml-auto">
        <button type="button" class="ln-btn-secondary" @click="exportList">Exporter la liste</button>
      </div>
    </header>

    <!-- ⚠️ L'AFFICHAGE PERMANENT REMPLACE LA TRANSMISSION, et cela doit être dit :
         un bouton « transmettre au jury » aurait figé une liste, et il en aurait
         toujours manqué une — la préconisation rendue après l'envoi. -->
    <StateBanner variant="info" lead="Le jury lit cette liste ; on ne la lui envoie pas.">
      Le règlement impose que <b class="font-semibold">toutes</b> les préconisations soient portées au
      jury. Elles le sont par <b class="font-semibold">affichage permanent</b> dans le tableau de
      délibération, non par un envoi horodaté : une préconisation rendue après coup y figure aussi.
      C'est pourquoi cet écran ne porte aucun bouton de transmission — il n'y a rien à envoyer.
    </StateBanner>

    <BlockState v-if="state !== 'ready'" :state="state === 'denied' ? 'loading' : state"
                title="Aucune préconisation sur cette année"
                message="Aucune séance n’a rendu de préconisation. Le jury lira une colonne vide, et c’est une information exacte."
                :rows="4" :row-height="72" :skeleton-widths="[260, 180, 'auto']"
                @retry="reload" />

    <template v-else>
      <div class="mb-4 flex flex-wrap items-center gap-6 rounded-md-ln border border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
        <div>
          <span class="block text-h2 tabular text-ln-gray-900">{{ data.count }}</span>
          <span class="text-caption text-ln-gray-500">Préconisations rendues</span>
        </div>
        <div>
          <span class="block text-h2 tabular text-ln-gray-900">{{ data.closed }}</span>
          <span class="text-caption text-ln-gray-500">Closes</span>
        </div>
        <div>
          <span class="block text-h2 tabular" :class="data.missing_findings ? 'text-ln-warning' : 'text-ln-gray-900'">
            {{ data.missing_findings }}
          </span>
          <span class="text-caption" :class="data.missing_findings ? 'text-ln-warning' : 'text-ln-gray-500'">
            Contrats sans constat
          </span>
        </div>
        <div>
          <span class="block text-h2 tabular text-ln-gray-900">{{ data.days_to_jury }} j</span>
          <span class="text-caption text-ln-gray-500">Avant le jury du {{ data.jury_date }}</span>
        </div>
      </div>

      <div class="mb-3 flex flex-wrap items-center gap-2">
        <button type="button" :class="chipClass(null)" @click="setFilter(null)">
          Toutes <span class="ml-1 tabular font-semibold">{{ data.count }}</span>
        </button>
        <button type="button" :class="chipClass('missing')" @click="setFilter('missing')">
          Sans constat <span class="ml-1 tabular font-semibold">{{ data.missing_findings }}</span>
        </button>
        <button v-for="t in data.types" :key="t.key" type="button"
                :class="chipClass(t.key)" @click="setFilter(t.key)">
          {{ t.label }} <span class="ml-1 tabular font-semibold">{{ t.count }}</span>
        </button>
      </div>

      <div class="grid items-start gap-5 xl:grid-cols-[1fr_396px]">
        <ul class="flex flex-col gap-3">
          <!-- ⚠️ LE SEUL ORDONNANCEMENT DE CETTE LISTE : ce qui MANQUE au dossier
               que le jury lira vient en tête. Ce n'est pas un tri par gravité
               d'étudiant — c'est un tri par pièce absente. -->
          <li v-for="p in items" :key="p.name"
              class="overflow-hidden rounded-md-ln border"
              :class="isMissing(p) ? 'border-ln-warning' : 'border-ln-gray-200'">
            <header class="flex flex-wrap items-center gap-3 border-b px-4 py-2.5"
                    :class="isMissing(p) ? 'border-ln-warning-bg bg-ln-warning-bg' : 'border-ln-gray-200 bg-ln-gray-50'">
              <h3 class="text-[14px] font-semibold text-ln-gray-900">
                {{ typeLabel(p.kind) }} — {{ p.student_name }}
              </h3>
              <span class="ml-auto flex items-center gap-2">
                <StatusPill :status="p.status" :label="p.status_label" />
                <button type="button" class="inline-flex h-[26px] items-center rounded-sm-ln border border-ln-gray-300 bg-white px-2.5 text-caption font-semibold text-ln-gray-700"
                        @click="open(p)">Ouvrir</button>
              </span>
            </header>
            <div class="px-4 py-3">
              <p class="text-body-sm leading-relaxed text-ln-gray-700">{{ p.body }}</p>
              <p v-if="p.finding" class="mt-2 rounded-sm-ln bg-ln-gray-50 px-3 py-2 text-caption leading-relaxed text-ln-gray-700">
                <b class="font-semibold text-ln-gray-900">Constat posé le {{ p.finding.posted_on }}
                  par {{ p.finding.posted_by }} — {{ p.finding.verdict }}.</b>
                « {{ p.finding.text }} »
              </p>
              <dl class="mt-3 flex flex-wrap gap-x-8 gap-y-1.5">
                <div>
                  <dt class="text-caption text-ln-gray-500">Propriétaire</dt>
                  <dd class="text-body-sm font-semibold text-ln-gray-900">{{ p.owner }}</dd>
                </div>
                <div>
                  <dt class="text-caption text-ln-gray-500">Clôture</dt>
                  <dd class="text-body-sm font-semibold text-ln-gray-900">{{ closesLabel(p.kind) }}</dd>
                </div>
                <div>
                  <dt class="text-caption text-ln-gray-500">Rendue le</dt>
                  <dd class="text-body-sm font-semibold text-ln-gray-900">{{ p.rendered_on }}</dd>
                </div>
                <div v-if="p.due_on">
                  <dt class="text-caption text-ln-gray-500">Échéance</dt>
                  <dd class="text-body-sm font-semibold text-ln-gray-900">
                    {{ p.due_on }}<span v-if="p.days_left" class="font-normal text-ln-gray-500"> — dans {{ p.days_left }} j</span>
                  </dd>
                </div>
                <div v-if="isMissing(p)">
                  <dt class="text-caption text-ln-gray-500">Constat</dt>
                  <dd class="text-body-sm font-semibold text-ln-warning">À poser</dd>
                </div>
              </dl>
              <p v-if="p.kind === 'reorientation'" class="mt-3 text-caption leading-relaxed text-ln-gray-600">
                <b class="font-semibold text-ln-gray-900">Cette recommandation n'ouvre aucune demande,
                  ne pré-remplit aucun formulaire et ne déclenche aucune procédure.</b>
                Si l'étudiant souhaite se réorienter, il en fait la demande lui-même, dans les formes
                ordinaires.
              </p>
            </div>
          </li>
        </ul>

        <div class="flex flex-col gap-5">
          <!-- ⚠️ LE CONSTAT N'EST PAS UNE CASE PARMI D'AUTRES : sans lui, le contrat
               de remédiation n'est qu'une intention morte. Il reste donc en tête du
               panneau tant qu'il manque. -->
          <section v-if="firstMissing" class="overflow-hidden rounded-md-ln border border-ln-warning">
            <header class="border-b border-ln-warning-bg bg-ln-warning-bg px-4 py-3">
              <h3 class="text-[15px] font-semibold text-ln-gray-900">Constat de fin de semestre</h3>
              <p class="mt-0.5 text-caption leading-relaxed text-ln-warning">
                Contrat de {{ firstMissing.student_name }} — échéance le {{ firstMissing.due_on }}.
                Sans ce constat, le contrat reste une intention : le jury lira « non constaté ».
              </p>
            </header>
            <div class="flex flex-col gap-3 px-4 py-4">
              <p class="text-body-sm font-semibold text-ln-gray-900">
                Les objectifs ont-ils été atteints ? <span class="font-bold text-ln-error">obligatoire</span>
              </p>
              <div class="flex gap-2">
                <label v-for="v in VERDICTS" :key="v"
                       class="flex min-h-[44px] flex-1 cursor-pointer items-center justify-center rounded-sm-ln border px-3 text-caption font-semibold"
                       :class="v === verdict ? 'border-ln-blue-800 bg-ln-blue-50 text-ln-blue-900' : 'border-ln-gray-300 text-ln-gray-700'">
                  <input v-model="verdict" type="radio" :value="v" name="verdict" class="sr-only" />
                  {{ v }}
                </label>
              </div>
              <label for="appreciation" class="text-body-sm font-semibold text-ln-gray-900">
                Appréciation du propriétaire <span class="font-bold text-ln-error">obligatoire</span>
              </label>
              <textarea id="appreciation" v-model="appreciation" rows="3"
                        class="w-full rounded-sm-ln border border-ln-gray-300 p-3 text-body-sm leading-normal text-ln-gray-900 outline-none focus:border-ln-blue-600"
                        placeholder="Ce que l’accompagnement a produit, et ce qui reste…"></textarea>
            </div>
            <footer class="flex items-center gap-3 border-t border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
              <p class="mr-auto text-caption text-ln-gray-500">Posé par {{ firstMissing.owner }}.</p>
              <button type="button" class="ln-btn-primary" :disabled="!complete" @click="postFinding">
                Poser le constat
              </button>
            </footer>
          </section>

          <section class="overflow-hidden rounded-md-ln border border-ln-gray-200">
            <header class="border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
              <h3 class="text-[14px] font-semibold text-ln-gray-900">Les cinq types</h3>
              <p class="mt-0.5 text-caption text-ln-gray-500">
                Chacun a un propriétaire et une clôture. Un seul exige un constat.
              </p>
            </header>
            <ul class="px-4 py-3">
              <li v-for="t in data.types" :key="t.key"
                  class="mb-3 border-b border-ln-gray-100 pb-3 last:mb-0 last:border-b-0 last:pb-0">
                <p class="text-body-sm font-semibold text-ln-gray-900">
                  {{ t.label }}
                  <span v-if="t.needs_finding" class="ml-1 rounded-sm-ln bg-ln-warning-bg px-1.5 py-0.5 text-micro font-semibold text-ln-warning">
                    constat obligatoire
                  </span>
                </p>
                <p class="mt-0.5 text-caption leading-relaxed text-ln-gray-600">{{ t.note }}</p>
                <p class="mt-1 text-caption text-ln-gray-500">
                  {{ t.owner }} · clôture : {{ t.closes.toLowerCase() }}
                  · {{ t.in_file ? 'inscrite au dossier' : 'non inscrite au dossier' }}
                </p>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </template>

    <StateBanner v-if="pending" variant="warning" lead="Acte non disponible." :text="pending" class="mt-4" />
  </div>
</template>

<script setup>
/**
 * Grappe 8 · écran N10 du lot 7 — les préconisations.
 *
 * ⚠️ AFFICHAGE PERMANENT, ET NON ENVOI. C'est la décision qui structure l'écran :
 * il n'existe aucun bouton de transmission au jury. Un envoi aurait figé une liste
 * à une date, et il en aurait toujours manqué une — celle rendue après coup.
 *
 * ⚠️ LE CONSTAT DE FIN DE SEMESTRE EST LE SEUL VRAI RISQUE DU DISPOSITIF. Le
 * contrat de remédiation est la seule préconisation qui en exige un ; sans lui, il
 * n'est qu'une intention morte, et le jury lit « non constaté ». Il n'est donc pas
 * une case parmi d'autres : il reste en tête tant qu'il manque, et `needs_finding`
 * vient de la table des types — jamais reconnu au libellé.
 *
 * 🔴 `list_council_preconisations` n'est pas tranché : voir `api/council.js`.
 */
import { computed, onMounted, ref, watch } from 'vue';
import { StateBanner, StatusPill } from '../components/index.js';
import BlockState from '../components/internal/BlockState.vue';
import { useAcademicContext } from '../composables/useAcademicContext.js';
import { useResource } from '../composables/useResource.js';
import { listCouncilPreconisations } from '../api/council.js';

const VERDICTS = ['Atteints', 'Partiellement', 'Non atteints'];

const { params } = useAcademicContext();
const res = useResource(listCouncilPreconisations, { isEmpty: (d) => !d?.items?.length });
const state = res.state;
const pending = ref('');
const filter = ref(null);
const verdict = ref(null);
const appreciation = ref('');

const data = computed(() => res.data.value || { types: [] });
const items = computed(() => data.value.items || []);
const complete = computed(() => !!verdict.value && appreciation.value.trim().length > 0);

const subtitle = computed(() => {
  if (state.value !== 'ready') return 'Chargement des préconisations';
  return [
    data.value.count + ' préconisations',
    data.value.missing_findings + ' contrats sans constat',
    'toutes lisibles par le jury du ' + data.value.jury_date,
  ].join(' · ');
});

/** Dérivé de la table des types, comme au simulacre : jamais lu au libellé. */
function typeOf(kind) { return (data.value.types || []).find((t) => t.key === kind) || {}; }
function typeLabel(kind) { return typeOf(kind).label || kind; }
function closesLabel(kind) { return typeOf(kind).closes || '—'; }
function isMissing(p) { return !!typeOf(p.kind).needs_finding && !p.finding; }

const firstMissing = computed(() => items.value.find((p) => isMissing(p)) || null);

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

function open(p) {
  pending.value = 'Le détail de ' + p.name + ' appelle une lecture par préconisation, qui n’existe '
    + 'pas : la liste porte déjà tout ce que le serveur rend. Rien de plus ne s’ouvrira.';
}

function postFinding() {
  pending.value = 'Poser le constat appelle `post_preconisation_finding`, dont le point d’entrée '
    + 'n’est pas tranché. Le verdict et l’appréciation saisis n’ont pas été enregistrés.';
}

function exportList() {
  pending.value = 'L’export n’est pas branché : reconstituer le fichier au navigateur produirait '
    + 'un document sans millésime, et le jury lit la liste en ligne.';
}

function reload() { res.load({ ...params.value, kind: filter.value }); }
// Le contexte arrive APRÈS le mount en mode serveur (stabilisation §5) :
// même patron que le planning — on ne part pas sans le semestre, et on
// recharge quand il arrive. (Les signatures serveur du conseil sont
// positionnelles : un appel sans terme fait 500, pas un vide.)
onMounted(() => { if (params.value.term) reload(); });
watch(params, reload);
</script>
