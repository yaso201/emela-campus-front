<template>
  <div>
    <header class="mb-4">
      <p class="mb-2 text-caption text-ln-gray-500">
        Conseil pédagogique · <b class="font-semibold text-ln-gray-900">Séance du {{ data.date }}</b>
      </p>
      <h1 class="text-h1 tracking-tight text-ln-gray-900">Séance du {{ data.date }} — {{ data.program_label }}</h1>
      <p class="mt-1 text-body-sm text-ln-gray-500">{{ subtitle }}</p>
    </header>

    <!-- ⚠️ LE SEUL DISPOSITIF DU SYSTÈME QUI INTERVIENT PENDANT QU'ON PEUT ENCORE
         AGIR — tout le reste constate. L'écran doit donc rester un procès-verbal,
         et n'offrir aucune forme qui ressemble à une décision. -->
    <StateBanner variant="error" lead="Le conseil ne prononce aucune décision.">
      Ni progression, ni redoublement, ni exclusion : il constate, il alerte, il préconise. Les
      décisions appartiennent au jury de fin d'année, à qui <b class="font-semibold">toutes</b> les
      préconisations de cette séance seront transmises —
      <router-link :to="{ name: 'council-preconisations' }" class="font-semibold">par affichage permanent</router-link>,
      non par un envoi qui les figerait.
    </StateBanner>

    <BlockState v-if="state !== 'ready'" :state="state === 'denied' ? 'loading' : state"
                title="Aucune séance ouverte"
                message="Aucune séance n’est ouverte sur cette filière et cette année. La préparation se fait depuis la liste des candidats."
                :rows="5" :row-height="56" :skeleton-widths="[180, 240, 120]"
                @retry="reload" />

    <div v-else class="grid items-start gap-5 xl:grid-cols-[392px_1fr]">
      <div>
        <WorkQueue title="Ordre du jour" :items="agendaItems" :selected-id="selectedId"
                   :total="data.convoked" state="ready" @select="select" />
        <p class="mt-3 rounded-md-ln border border-ln-gray-200 bg-ln-gray-50 px-4 py-3 text-caption leading-relaxed text-ln-gray-600">
          Une <b class="font-semibold text-ln-gray-900">absence non justifiée</b> à la convocation est
          portée au jury de fin d'année — c'est le seul effet automatique de la séance. La convocation
          est notifiée dans l'espace de l'étudiant, sans accusé : il la voit et peut justifier son
          absence. Sans cela, « non justifiée » se constaterait contre quelqu'un qui n'en avait pas
          les moyens.
        </p>
      </div>

      <ObjectPanel v-if="subject" :title="subject.student_name"
                   :subtitle="panelSubtitle"
                   :state="'ready'">
        <template #header-right>
          <StatusPill :status="subject.status" :label="subject.status_label" />
        </template>

        <h4 class="mb-2 text-micro font-bold uppercase tracking-wider text-ln-gray-500">
          Ce qui est constaté
          <span class="normal-case tracking-normal text-ln-warning">— résultats calculés, non délibérés</span>
        </h4>
        <div class="overflow-hidden rounded-md-ln border border-ln-gray-200">
          <table class="w-full border-collapse text-body-sm">
            <thead>
              <tr>
                <th :class="headTh" class="!text-left">Constat</th>
                <th :class="headTh" class="w-[120px]">Valeur</th>
                <th :class="headTh" class="!text-left">Détail</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in subject.rows" :key="row.label" :class="row.flagged ? 'bg-ln-warning-bg' : ''">
                <td :class="bodyTd" class="!text-left">{{ row.label }}</td>
                <td :class="bodyTd">
                  {{ row.value }}<sup v-if="!row.official" class="text-ln-gray-400">°</sup>
                </td>
                <td :class="[bodyTd, '!text-left text-caption',
                             row.flagged ? 'text-ln-warning' : 'text-ln-gray-500']">{{ row.note }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mt-2 text-caption text-ln-gray-500">
          <sup>°</sup> valeur calculée, non arrêtée — la délibération se tient en juillet.
        </p>

        <h4 class="mb-2 mt-5 text-micro font-bold uppercase tracking-wider text-ln-gray-500">
          Préconisations rendues en séance
        </h4>
        <div v-if="subject.preconisations" class="rounded-md-ln border border-ln-gray-200 px-4 py-3">
          <p class="text-body-sm font-semibold text-ln-gray-900">
            {{ subject.preconisations }} préconisation(s) rendue(s) pour cet étudiant
          </p>
          <p class="mt-1 text-caption leading-relaxed text-ln-gray-600">
            Elles vivent dans la liste de l'année, avec leur propriétaire et leur clôture.
            <router-link :to="{ name: 'council-preconisations' }" class="font-semibold">Les ouvrir</router-link>
          </p>
        </div>
        <p v-else class="rounded-md-ln border border-dashed border-ln-gray-300 px-4 py-3 text-caption text-ln-gray-500">
          Aucune préconisation pour l'instant. Examiner sans préconiser est un résultat valable — et
          c'est le cas majoritaire.
        </p>

        <div class="mt-5">
          <label for="pv" class="text-body-sm font-semibold text-ln-gray-900">Observations portées au procès-verbal</label>
          <p class="mt-0.5 text-caption text-ln-gray-500">
            Elles décrivent ce que la séance a entendu. Elles n'emportent aucun effet.
          </p>
          <textarea id="pv" v-model="observations" rows="4"
                    class="mt-2 w-full rounded-sm-ln border border-ln-gray-300 p-3 text-body-sm leading-normal text-ln-gray-900 outline-none focus:border-ln-blue-600"
                    placeholder="Ce que le conseil a entendu et constaté…"></textarea>
        </div>

        <template #actions>
          <ActionBar :actions="actions"
                     attribution="Présidée par <b>S. Kouassi</b>, directeur des études."
                     :hint="actionHint" @act="act" />
        </template>
      </ObjectPanel>

      <ObjectPanel v-else title="" state="empty"
                   state-title="Aucun étudiant sélectionné"
                   state-message="Choisissez un point de l’ordre du jour pour ouvrir son procès-verbal." />
    </div>

    <StateBanner v-if="pending" variant="warning" lead="Acte non disponible." :text="pending" class="mt-4" />
  </div>
</template>

<script setup>
/**
 * Grappe 8 · écran N9 du lot 7 — la séance.
 *
 * ⚠️ « UN CHOIX GRISÉ QUI EXPLIQUE POURQUOI VAUT MIEUX QU'UN CHOIX ABSENT » — et
 * c'est la seule exception assumée à la règle 3 de ce dépôt.
 *
 * Partout ailleurs, une action indisponible n'est pas rendue : un bouton grisé est
 * une fuite d'information sur ce que d'autres peuvent faire. Ici, l'indisponibilité
 * ne vient PAS d'un droit — le président de séance a bien le droit de clore — mais
 * d'un ÉTAT de la séance qu'il peut lui-même changer. Retirer le bouton lui ferait
 * chercher une action qu'il détient.
 *
 * ⚠️ Et la RAISON vient du serveur (`close_blocked_reason`). Une phrase écrite dans
 * la vue serait une seconde implémentation de la règle de clôture, et divergerait
 * d'elle au premier amendement.
 *
 * 🔴 `get_council_session` n'est pas tranché : voir `api/council.js`.
 */
import { computed, onMounted, ref, watch } from 'vue';
import { ActionBar, ObjectPanel, StateBanner, StatusPill, WorkQueue, headTh, bodyTd } from '../components/index.js';
import BlockState from '../components/internal/BlockState.vue';
import { useAcademicContext } from '../composables/useAcademicContext.js';
import { useResource } from '../composables/useResource.js';
import { getCouncilSession } from '../api/council.js';

const { params } = useAcademicContext();
const res = useResource(getCouncilSession, { isEmpty: (d) => !d?.agenda?.length });
const state = res.state;
const pending = ref('');
const selectedId = ref(null);
const observations = ref('');

const data = computed(() => res.data.value || {});
const subject = computed(() => data.value.subject || null);

const agendaItems = computed(() => (data.value.agenda || []).map((a) => ({
  id: a.name,
  title: a.student_name,
  subtitle: 'Convoqué le ' + a.convoked_on
    + (a.examined_at ? ' · examiné à ' + a.examined_at : ' · à examiner')
    + ' · ' + a.presence_label,
  status: a.status,
  statusLabel: a.status_label,
  done: !!a.examined_at,
})));

const subtitle = computed(() => {
  if (state.value !== 'ready') return 'Chargement de la séance';
  return [
    data.value.convoked + ' étudiants convoqués',
    data.value.examined + ' examinés',
    'ouverte à ' + data.value.opened_at,
    'présidée par ' + data.value.chair,
  ].join(' · ');
});

const panelSubtitle = computed(() => {
  const s = subject.value;
  if (!s) return '';
  return [s.student, data.value.program_label, s.presence_label,
    s.examined_at ? 'examiné à ' + s.examined_at : 'examen en cours'].join(' · ');
});

/**
 * ⚠️ AUCUNE ISSUE QUI RESSEMBLE À UNE DÉCISION. Les trois actes sont : passer au
 * suivant, préconiser, clore la séance. Ni « faire progresser », ni « ajourner »,
 * ni « exclure » — ces verbes appartiennent au jury.
 */
const actions = computed(() => [
  { key: 'preconiser', label: 'Ajouter une préconisation…', kind: 'secondary' },
  { key: 'sans', label: 'Examiner sans préconisation', kind: 'secondary' },
  { key: 'suivant', label: 'Enregistrer et passer au suivant', kind: 'primary' },
  // Le seul bouton DÉSACTIVÉ du dépôt, et il porte sa raison juste dessous.
  { key: 'clore', label: 'Clôturer la séance', kind: 'secondary',
    disabled: !data.value.can_close },
]);

const actionHint = computed(() => {
  if (data.value.can_close) {
    return 'Aucune décision de progression, de redoublement ou d’exclusion ne se prend ici.';
  }
  return 'Clôturer la séance est indisponible : ' + (data.value.close_blocked_reason || '');
});

function select(id) {
  selectedId.value = id;
  observations.value = '';
  res.load({ ...params.value, item: id });
}

function act(key) {
  const verbs = {
    preconiser: '`add_council_preconisation`',
    sans: '`examine_council_student`',
    suivant: '`examine_council_student`',
    clore: '`close_council_session`',
  };
  pending.value = 'Cet acte appelle ' + verbs[key] + ', dont le point d’entrée n’est pas tranché — '
    + 'et dont le vocabulaire de préconisation n’a aucune source lue. Rien n’a été enregistré : '
    + 'les observations saisies restent dans la page et partiront à la navigation.';
}

function reload() { res.load({ ...params.value }); }
onMounted(() => {
  if (params.value.term) reload();   // même patron que le planning (§5)
  selectedId.value = 'CPS-2027-003';
});
watch(params, reload);
</script>
