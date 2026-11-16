<template>
  <div>
    <StructureTabs />
    <header class="mb-4 flex flex-wrap items-start justify-between gap-5">
      <div>
        <p class="mb-2 text-caption text-ln-gray-500">Structure · <b class="font-semibold text-ln-gray-900">Calendrier académique</b></p>
        <h1 class="text-h1 tracking-tight text-ln-gray-900">Calendrier académique</h1>
        <p class="mt-1 text-body-sm text-ln-gray-500">{{ subtitle }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button v-if="can('write:calendar')" type="button" class="ln-btn-primary" @click="open('year')">
          + Ouvrir une année
        </button>
      </div>
    </header>

    <StateBanner v-if="done" variant="success" lead="Enregistré." :text="done" />
    <StateBanner v-if="actError" variant="error" lead="L'acte a échoué." :text="actError" />

    <CharpenteForm v-if="form === 'year'" name="cal-year" title="Ouvrir une année académique"
                   subtitle="Le nom de l'année se déduit de ses dates (2027-2028). Une année ne chevauche jamais une autre (RUN-05)."
                   :fields="YEAR_FIELDS" confirm-label="Ouvrir l'année" :error="formError" :busy="busy"
                   footnote="Les semestres et les fériés s'ajoutent ensuite, dans l'année."
                   @cancel="close" @submit="submit(createAcademicYear, withYearName($event))" />
    <CharpenteForm v-if="form === 'term'" name="cal-term" :title="'Ajouter un semestre — ' + (selected?.name || '')"
                   subtitle="Le numéro du semestre (S1, S2…) porte sa parité : impair au premier semestre, pair au second."
                   :fields="TERM_FIELDS" confirm-label="Ajouter le semestre" :error="formError" :busy="busy"
                   footnote="Un semestre sans numéro est refusé : sa parité ne se devine pas."
                   @cancel="close" @submit="submit(createAcademicTerm, { ...$event, year: selected.name })" />
    <CharpenteForm v-if="form === 'holiday'" name="cal-holiday" :title="'Ajouter un jour férié — ' + (selected?.name || '')"
                   :subtitle="'Un férié retire un jour ouvré : il décale les délais de droit qui se comptent en jours ouvrés. Dates de l’année : du ' + shortDate(selected?.year_start_date) + ' au ' + shortDate(selected?.year_end_date) + '.'"
                   :fields="HOLIDAY_FIELDS" confirm-label="Ajouter le férié" :error="formError" :busy="busy"
                   footnote="Les fêtes mobiles (Pâques, Tabaski…) se saisissent chaque année."
                   @cancel="close" @submit="submit(addHoliday, { ...$event, year: selected.name })" />

    <div v-if="removing" class="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-6">
      <ReasonStep class="w-full max-w-lg" name="cal-remove-holiday"
                  :title="'Retirer le férié du ' + longDate(removing.holiday_date)"
                  :subtitle="removing.description + ' — les délais déjà calculés ne bougent pas ; les suivants comptent ce jour comme ouvré.'"
                  reason-label="Motif du retrait" :reason-groups="REMOVE_REASONS"
                  detail-label="Précision" confirm-label="Retirer le férié" confirm-kind="danger"
                  @cancel="removing = null" @submit="submitRemove" />
    </div>

    <div v-if="designating" class="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-6">
      <ReasonStep class="w-full max-w-lg" name="cal-current-year"
                  :title="'Désigner ' + selected.name + ' comme année courante'"
                  subtitle="Tous les écrans s'ouvrent sur l'année courante, et les procédures qui en dépendent (gel, conseils, clôture) la lisent. L'année courante actuelle est conservée, elle n'est pas close."
                  reason-label="Motif" :reason-groups="CURRENT_REASONS" detail-label="Précision"
                  confirm-label="Désigner l'année courante" @cancel="designating = false" @submit="submitCurrent" />
    </div>

    <div class="grid items-start gap-5 xl:grid-cols-[320px_1fr]">
      <WorkQueue title="Années académiques" :items="queueItems" :selected-id="selectedId" :total="queueItems.length"
                 :state="state === 'denied' ? 'loading' : state" state-title="Aucune année académique"
                 state-message="Aucune année n'est ouverte. Rien ne fonctionne sans année courante (RUN-06) : ouvrez la première année, puis désignez-la."
                 @select="selectedId = $event" @retry="load" />

      <section v-if="selected">
        <div class="mb-4 flex flex-wrap items-stretch gap-6 rounded-md-ln border border-ln-gray-200 bg-ln-gray-50 px-5 py-4">
          <div v-for="b in totals" :key="b.label" class="flex flex-col gap-0.5">
            <span class="tabular text-[20px] font-bold leading-tight text-ln-gray-900">{{ b.value }}</span>
            <span class="text-caption text-ln-gray-500">{{ b.label }}</span>
          </div>
          <div class="ml-auto flex flex-col items-end justify-center gap-2">
            <StatusPill :status="yearStatus(selected).status" :label="yearStatus(selected).label" />
            <button v-if="can('write:calendar') && !selected.is_current && !selected.closed" type="button"
                    class="ln-btn-secondary" @click="designating = true">Désigner comme année courante…</button>
          </div>
        </div>

        <StateBanner v-if="selected.closed" variant="info" lead="Année close."
                     text="Ses semestres et ses fériés se lisent ; ils ne se modifient plus. Une réouverture motivée se fait à l'écran de clôture." />

        <!-- Semestres -->
        <div class="mb-2 mt-2 flex items-center gap-3">
          <h4 class="text-micro font-bold uppercase tracking-wider text-ln-gray-500">Semestres et périodes</h4>
          <button v-if="writable" type="button" class="ln-btn-secondary ml-auto" @click="open('term')">+ Ajouter un semestre</button>
        </div>
        <DenseTable :state="selected.terms.length ? 'ready' : 'empty'" :row-height="40" max-height="320px"
                    state-title="Aucun semestre" state-message="Cette année n'a pas encore de semestre. Les inscriptions, les groupes et les épreuves s'y rattachent.">
          <template #head>
            <tr>
              <th :class="headTh" class="!text-left">Semestre</th>
              <th :class="headTh" class="!text-left">Parité</th>
              <th :class="headTh">Début</th>
              <th :class="headTh">Fin</th>
              <th :class="headTh">Jours ouvrés</th>
            </tr>
          </template>
          <template #body>
            <tr v-for="t in selected.terms" :key="t.name">
              <td :class="bodyTd" class="!text-left font-semibold">{{ t.term_name }}</td>
              <td :class="bodyTd" class="!text-left">
                <StatusPill v-if="t.parity" status="valide" :label="t.parity === 'impair' ? 'Impair' : 'Pair'" />
                <StatusPill v-else status="incomplete" label="Parité absente"
                            hint="Le nom ne porte pas de numéro S1, S2… : les règles qui dépendent de la parité ne s'appliquent pas à cette période." />
              </td>
              <td :class="bodyTd">{{ shortDate(t.term_start_date) }}</td>
              <td :class="bodyTd">{{ shortDate(t.term_end_date) }}</td>
              <td :class="bodyTd">{{ t.working_days ?? '—' }}</td>
            </tr>
          </template>
          <template #legend>
            <span>Les jours ouvrés sont calculés au serveur, fériés déduits — l'écran ne les recalcule jamais ;
              « — » : aucun calendrier ne couvre ces dates.</span>
          </template>
        </DenseTable>

        <!-- Fériés -->
        <div class="mb-2 mt-6 flex flex-wrap items-center gap-3">
          <h4 class="text-micro font-bold uppercase tracking-wider text-ln-gray-500">Jours fériés de l'année</h4>
          <StatusPill v-if="inForce" status="valide" label="En vigueur pour les délais" />
          <StatusPill v-else-if="!selected.closed" status="propose" label="Préparés — pas encore en vigueur" />
          <button v-if="writable" type="button" class="ln-btn-secondary ml-auto" @click="open('holiday')">+ Ajouter un férié</button>
        </div>
        <p v-if="!inForce && !selected.closed" class="mb-2 text-caption leading-relaxed text-ln-gray-500">
          Les délais en jours ouvrés lisent aujourd'hui la liste <b class="font-semibold">{{ cal?.holiday_list_in_force || '—' }}</b>.
          Ceux de cette année seront lus dès qu'elle commencera.
        </p>
        <DenseTable :state="selected.holidays.length ? 'ready' : 'empty'" :row-height="40" max-height="360px"
                    state-title="Aucun jour férié"
                    :state-message="selected.closed ? 'Les fériés de cette année close ne sont pas conservés à part.' : 'Aucun férié n’est saisi : tous les jours de semaine compteraient comme ouvrés.'">
          <template #head>
            <tr>
              <th :class="headTh" class="!text-left">Date</th>
              <th :class="headTh" class="!text-left">Fête</th>
              <th :class="headTh"></th>
            </tr>
          </template>
          <template #body>
            <tr v-for="h in selected.holidays" :key="h.holiday_date">
              <td :class="bodyTd" class="!text-left">{{ longDate(h.holiday_date) }}</td>
              <td :class="bodyTd" class="!text-left">{{ h.description }}</td>
              <td :class="bodyTd">
                <button v-if="writable" type="button"
                        class="h-[26px] rounded-sm-ln border border-ln-gray-300 px-2 text-caption font-semibold text-ln-gray-700"
                        @click="removing = h">Retirer…</button>
              </td>
            </tr>
          </template>
        </DenseTable>
      </section>
    </div>
  </div>
</template>

<script setup>
/**
 * Étape 1 de la boucle · le CALENDRIER ACADÉMIQUE (MANDAT-10, E3', maquette).
 *
 * Une année, ses semestres (et leur parité), ses jours fériés — et laquelle est l'année COURANTE. Trois faits
 * qu'aucun autre écran ne pose, et dont tous dépendent : sans année courante rien ne s'ouvre (RUN-06), sans fériés
 * les délais en jours ouvrés sont faux (RUN-01), un semestre sans numéro n'a pas de parité (DC-CH-2).
 *
 * Droits : lecture `read:structure` (tout le staff) ; écriture `write:calendar` (Gestionnaire académique). Règle 3 :
 * un lecteur sans le droit ne voit AUCUN bouton d'acte — ni grisé, ni « bientôt ».
 *
 * Choix laissés à la MOA (note de maquette) : (a) les fériés portés par l'année ; (b) l'année courante désignée
 * ici ou par la seule clôture ; (d) le numéro `S<n>` imposé au nom du semestre.
 */
import { computed, onMounted, ref, watch } from 'vue';
import { WorkQueue, DenseTable, StatusPill, StateBanner, ReasonStep, headTh, bodyTd } from '../components/index.js';
import CharpenteForm from './structure/CharpenteForm.vue';
import StructureTabs from './structure/StructureTabs.vue';
import { useSession } from '../composables/useSession.js';
import { useResource } from '../composables/useResource.js';
import {
  getAcademicCalendar, createAcademicYear, createAcademicTerm, addHoliday, removeHoliday, setCurrentAcademicYear,
} from '../api/charpente.js';

const { can } = useSession();
const res = useResource(getAcademicCalendar, { isEmpty: (d) => !d?.years?.length });

/** Le nom d'une année se lit dans ses dates (2027-2028) : le serveur l'exige, l'écran ne le fait pas saisir. */
function withYearName(v) {
  return { ...v, academic_year_name: v.year_start_date.slice(0, 4) + '-' + v.year_end_date.slice(0, 4) };
}
const state = res.state;
const cal = computed(() => res.data.value || null);
const years = computed(() => cal.value?.years || []);
const selectedId = ref(null);
const selected = computed(() => years.value.find((y) => y.name === selectedId.value) || null);

const form = ref('');
const formError = ref('');
const actError = ref('');
const done = ref('');
const busy = ref(false);
const removing = ref(null);
const designating = ref(false);

const writable = computed(() => can('write:calendar') && !!selected.value && !selected.value.closed);
const inForce = computed(() => !!selected.value && selected.value.holiday_list === cal.value?.holiday_list_in_force);

function yearStatus(y) {
  if (y.closed) return { status: 'echue', label: 'Close' };
  if (y.is_current) return { status: 'valide', label: 'Année courante' };
  return { status: 'propose', label: 'Ouverte' };
}

const queueItems = computed(() => years.value.map((y) => ({
  id: y.name,
  title: y.name,
  subtitle: shortDate(y.year_start_date) + ' → ' + shortDate(y.year_end_date) + ' · ' + y.terms.length + ' semestre'
    + (y.terms.length > 1 ? 's' : '') + ' · ' + y.holidays.length + ' férié' + (y.holidays.length > 1 ? 's' : ''),
  status: yearStatus(y).status,
  statusLabel: yearStatus(y).label,
})));

const subtitle = computed(() => (state.value !== 'ready' ? 'Chargement du calendrier'
  : years.value.length + ' années · année courante ' + (cal.value?.current_academic_year || 'non désignée')));

const totals = computed(() => {
  const y = selected.value;
  if (!y) return [];
  return [
    { value: shortDate(y.year_start_date), label: 'Début' },
    { value: shortDate(y.year_end_date), label: 'Fin' },
    { value: y.terms.length, label: 'Semestres et périodes' },
    { value: y.holidays.length, label: 'Jours fériés' },
  ];
});

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
function shortDate(d) {
  if (!d) return '—';
  const [y, m, j] = d.split('-').map(Number);
  return j + ' ' + MONTHS[m - 1] + ' ' + y;
}
function longDate(d) {
  if (!d) return '—';
  return DAYS[new Date(d + 'T00:00:00').getDay()] + ' ' + shortDate(d);
}

/* Champs — au contrat proposé au serveur (api/charpente.js). */
const YEAR_FIELDS = [
  { key: 'year_start_date', label: 'Premier jour', type: 'date', required: true },
  { key: 'year_end_date', label: 'Dernier jour', type: 'date', required: true,
    live: (f) => (f.year_start_date && f.year_end_date && f.year_end_date <= f.year_start_date
      ? { text: 'La fin précède le début.', tone: 'error' }
      : f.year_start_date && f.year_end_date
        ? { text: 'Nom : ' + f.year_start_date.slice(0, 4) + '-' + f.year_end_date.slice(0, 4), tone: 'ok' } : null) },
];
const TERM_FIELDS = [
  { key: 'term_name', label: 'Nom du semestre', required: true, placeholder: 'S1, S2, LIS-S5-COM…',
    live: (f) => {
      if (!f.term_name) return null;
      const m = /S(\d+)/.exec(f.term_name);
      return m ? { text: 'Parité lue : ' + (Number(m[1]) % 2 ? 'impair' : 'pair') + ' (S' + m[1] + ').', tone: 'ok' }
        : { text: 'Aucun numéro S1, S2… dans le nom : la parité ne se devine pas.', tone: 'error' };
    } },
  { key: 'term_start_date', label: 'Premier jour', type: 'date', required: true },
  { key: 'term_end_date', label: 'Dernier jour', type: 'date', required: true },
];
// K1 : la date est bornée aux dates de l'année — dite à la saisie, refusée au serveur.
const HOLIDAY_FIELDS = computed(() => [
  { key: 'holiday_date', label: 'Date', type: 'date', required: true,
    live: (f) => {
      const y = selected.value;
      if (!f.holiday_date || !y) return null;
      return f.holiday_date < y.year_start_date || f.holiday_date > y.year_end_date
        ? { text: 'Hors de l’année ' + y.name + ' (du ' + shortDate(y.year_start_date) + ' au ' + shortDate(y.year_end_date) + ') : un férié s’ajoute à l’année qui le contient.', tone: 'error' }
        : null;
    } },
  { key: 'description', label: 'Fête', required: true, placeholder: 'Ex. Fête de l’Indépendance' },
]);
const REMOVE_REASONS = [{ key: 'r', label: 'Motif', options: [
  { value: 'erreur', label: 'Erreur de saisie' },
  { value: 'deplace', label: 'Fête déplacée par décret' },
  { value: 'autre', label: 'Autre — à préciser' },
] }];
const CURRENT_REASONS = [{ key: 'c', label: 'Motif', options: [
  { value: 'rentree', label: 'Rentrée de la nouvelle année' },
  { value: 'correction', label: 'Correction d’une désignation erronée' },
] }];

function open(which) { form.value = which; formError.value = ''; actError.value = ''; done.value = ''; }
function close() { form.value = ''; }

async function submit(act, payload) {
  formError.value = '';
  try {
    busy.value = true;
    await act(payload);
    form.value = '';
    done.value = 'La modification est enregistrée.';
    load();
  } catch (e) { formError.value = e.message || 'Refusé.'; }
  finally { busy.value = false; }
}
async function submitRemove({ reason, detail }) {
  actError.value = '';
  try {
    busy.value = true;
    await removeHoliday({ year: selected.value.name, holiday_date: removing.value.holiday_date,
      reason: reason + ' — ' + detail });
    removing.value = null;
    done.value = 'Le férié est retiré.';
    load();
  } catch (e) { actError.value = e.message || 'Retrait refusé.'; removing.value = null; }
  finally { busy.value = false; }
}
async function submitCurrent({ reason, detail }) {
  actError.value = '';
  try {
    busy.value = true;
    await setCurrentAcademicYear({ year: selected.value.name, reason: reason + ' — ' + detail });
    designating.value = false;
    done.value = selected.value.name + ' est l’année courante.';
    load();
  } catch (e) { actError.value = e.message || 'Désignation refusée.'; designating.value = false; }
  finally { busy.value = false; }
}

async function load() {
  await res.load({});
  if (!selected.value) selectedId.value = (years.value.find((y) => y.is_current) || years.value[0])?.name || null;
}
watch(selectedId, () => { done.value = ''; actError.value = ''; });
onMounted(load);
</script>
