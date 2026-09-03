<template>
  <div>
    <header class="mb-4">
      <p class="mb-2 text-caption text-ln-gray-500">
        À traiter · <b class="font-semibold text-ln-gray-900">Demandes de documents</b>
      </p>
      <h1 class="text-h1 tracking-tight text-ln-gray-900">Demandes de documents</h1>
      <p class="mt-1 text-body-sm text-ln-gray-500">{{ subtitle }}</p>
    </header>

    <BlockState v-if="state !== 'ready'" :state="state === 'denied' ? 'loading' : state"
                title="Aucune demande en attente"
                message="Aucun étudiant n’attend de document. C’est l’état normal d’une file traitée — et il n’y a rien à préparer d’avance."
                :rows="5" :row-height="56" :skeleton-widths="[180, 240, 120]"
                @retry="reload" />

    <div v-else class="grid items-start gap-5 xl:grid-cols-[392px_1fr]">
      <div class="flex flex-col gap-5">
        <WorkQueue title="Demandes" :items="queueItems" :selected-id="selectedId"
                   :total="data.count" state="ready" @select="select" />

        <!-- ⚠️ LE CATALOGUE EST RESTREINT, ET IL DIT POURQUOI. Masquer les deux
             types non demandables laisserait croire à un oubli ; les griser
             inviterait à chercher comment les débloquer. Ils sont donc listés,
             expliqués, et adressés à leur vrai service. -->
        <section class="overflow-hidden rounded-md-ln border border-ln-gray-200">
          <header class="border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
            <h3 class="text-[14px] font-semibold text-ln-gray-900">Catalogue des documents</h3>
            <p class="mt-0.5 text-caption text-ln-gray-500">
              Restreint au sous-ensemble demandable ici.
            </p>
          </header>
          <ul class="px-4 py-3">
            <li v-for="c in catalogue" :key="c.key"
                class="mb-3 border-b border-ln-gray-100 pb-3 last:mb-0 last:border-b-0 last:pb-0">
              <p class="text-body-sm font-semibold"
                 :class="c.requestable ? 'text-ln-gray-900' : 'text-ln-gray-500'">
                {{ c.label }}
                <span v-if="!c.requestable" class="ml-1 rounded-sm-ln bg-ln-gray-100 px-1.5 py-0.5 text-micro font-semibold text-ln-gray-600">
                  émis par la {{ c.source.toLowerCase() }}
                </span>
              </p>
              <p class="mt-0.5 text-caption leading-relaxed text-ln-gray-600">{{ c.condition }}</p>
            </li>
          </ul>
          <p class="border-t border-ln-gray-200 bg-ln-gray-50 px-4 py-3 text-caption leading-relaxed text-ln-gray-600">
            Le <b class="font-semibold text-ln-gray-900">diplôme</b> et
            l'<b class="font-semibold text-ln-gray-900">attestation de réussite</b> ne se demandent
            pas ici : ils viennent de la
            <router-link :to="{ name: 'graduation' }" class="font-semibold">diplomation</router-link>,
            à l'issue du cursus. Une demande de ce type reçue ici est
            <b class="font-semibold text-ln-gray-900">irrecevable</b>, non prématurée — elle ne se
            reformule pas, elle se réadresse.
          </p>
        </section>
      </div>

      <div>
        <ObjectPanel v-if="request" :title="request.doc_label + ' — ' + request.student_name"
                     :subtitle="panelSubtitle" state="ready"
                     :warning="request.blocked_reason ? { lead: 'Émission impossible en l’état.', text: request.blocked_reason } : null">
          <template #header-right>
            <StatusPill :status="request.status" :label="request.status_label" />
          </template>

          <!-- Les quatre vérifications sont CALCULÉES, jamais saisies : c'est ce
               que l'étudiant ne pouvait pas voir en déposant sa demande. -->
          <dl class="mb-5 flex flex-wrap gap-x-10 gap-y-3 rounded-md-ln border border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
            <div v-for="c in request.checks" :key="c.label">
              <dt class="text-caption text-ln-gray-500">{{ c.label }}</dt>
              <dd class="text-body-sm font-semibold text-ln-gray-900">{{ c.value }}</dd>
            </div>
            <p class="ml-auto max-w-[280px] self-center text-caption leading-relaxed text-ln-gray-500">
              Ces vérifications conditionnent l'émission. Elles sont calculées, jamais saisies.
            </p>
          </dl>

          <div v-if="request.lines.length" class="overflow-hidden rounded-md-ln border border-ln-gray-200">
            <header class="flex items-center gap-3 border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-2.5">
              <h4 class="text-[14px] font-semibold text-ln-gray-900">Aperçu du document</h4>
              <span class="ml-auto text-caption text-ln-gray-500">Ce que le document portera</span>
            </header>
            <table class="w-full border-collapse text-body-sm">
              <thead>
                <tr>
                  <th :class="headTh" class="!text-left">Unité d'enseignement</th>
                  <th :class="headTh" class="w-[80px]">Crédits</th>
                  <th :class="headTh" class="w-[90px]">Moyenne</th>
                  <th :class="headTh" class="!text-left">Résultat</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="l in request.lines" :key="l.code">
                  <td :class="bodyTd" class="!text-left">
                    <span class="font-mono text-[11.5px] text-ln-gray-500">{{ l.code }}</span>
                    {{ l.label }}
                  </td>
                  <td :class="bodyTd">{{ l.ects }}</td>
                  <td :class="bodyTd">{{ l.average }}</td>
                  <td :class="bodyTd" class="!text-left">{{ l.outcome }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="rounded-md-ln border border-dashed border-ln-gray-300 px-4 py-6 text-center text-caption leading-relaxed text-ln-gray-500">
            Aucun aperçu pour ce document : son contenu est produit à l'émission, depuis les données
            arrêtées de la période. Un aperçu reconstitué ici pourrait différer de ce que l'étudiant
            recevra.
          </p>

          <!-- ⚠️ NI EXEMPLAIRE, NI RETRAIT. Et le code de vérification NAÎT DE
               L'ÉMISSION : tant qu'il n'existe pas, l'écran le dit au lieu d'un
               champ vide qu'un agent lirait comme une donnée manquante. -->
          <div class="mt-5 rounded-md-ln border border-ln-gray-200 px-4 py-3">
            <h4 class="text-[14px] font-semibold text-ln-gray-900">Code de vérification publique</h4>
            <p v-if="request.verification_code" class="mt-1 text-body-sm text-ln-gray-700">
              <b class="font-mono text-[13px] font-semibold text-ln-gray-900">{{ request.verification_code }}</b>
              — émis le {{ request.issued_on }} par {{ request.issued_by }}. Celui qui reçoit le
              document en contrôle l'authenticité en ligne.
            </p>
            <p v-else class="mt-1 text-body-sm leading-relaxed text-ln-gray-600">
              <b class="font-semibold text-ln-gray-900">Il n'existe pas encore.</b> Le code naît de
              l'émission : il n'y a donc rien à afficher ni à communiquer avant l'acte. Il n'y a pas
              non plus d'exemplaire à compter ni de retrait à prévoir — le document se télécharge
              autant de fois que nécessaire.
            </p>
          </div>

          <p v-if="request.refusal_reason" class="mt-5 rounded-md-ln border border-[#F3C6C6] bg-ln-error-bg px-4 py-3 text-body-sm leading-relaxed text-[#7A2020]">
            <b class="font-semibold">Refusée le {{ request.refused_on }}.</b> {{ request.refusal_reason }}
            Ce motif reste lisible dans l'espace de l'étudiant.
          </p>

          <template #actions>
            <ActionBar :actions="actions"
                       attribution="L'émission est <b>tracée</b> : date et agent."
                       :hint="hint" @act="act" />
          </template>
        </ObjectPanel>

        <ObjectPanel v-else title="" state="empty"
                     state-title="Aucune demande sélectionnée"
                     state-message="Choisissez une demande dans la file pour voir ses vérifications et son aperçu." />

        <!-- L'étape de motif : deux catégories, et la distinction voyage avec le
             refus parce qu'elle dit à l'étudiant s'il peut reformuler. -->
        <div v-if="refusing" class="mt-5">
          <ReasonStep title="Refuser cette demande"
                      :subtitle="'Demande ' + request.name + ' — ' + request.student_name"
                      name="doc-refusal" reason-label="Catégorie du refus"
                      :reason-groups="refusalGroups"
                      detail-label="Motif lisible par l'étudiant"
                      detail-placeholder="Ce qui fait obstacle, et ce qu'il peut faire…"
                      detail-hint="Le motif part avec le refus et reste lisible dans l'espace de l'étudiant."
                      confirm-label="Refuser la demande" confirm-kind="danger"
                      footnote="« Prématurée » annonce à l'étudiant qu'il pourra reformuler ; « irrecevable » annonce le contraire."
                      :modal="false"
                      @submit="submitRefusal" @cancel="cancelRefusal" />
        </div>
      </div>
    </div>

    <StateBanner v-if="pending" variant="warning" lead="Acte non disponible." :text="pending" class="mt-4" />
  </div>
</template>

<script setup>
/**
 * Grappe 9 · écrans N6 et N7 du lot 7 — la file des demandes de documents.
 *
 * Le patron du lot 2 sans modification : file à gauche, objet à droite, motif
 * obligatoire au refus. Trois ajouts, et chacun vient d'une contrainte arrêtée :
 *
 * ⚠️ LE CATALOGUE EST RESTREINT AU SOUS-ENSEMBLE DEMANDABLE. Diplôme et attestation
 * de réussite viennent de la diplomation. Ils figurent au catalogue, EXPLIQUÉS et
 * non masqués : masquer laisserait croire à un oubli, et griser inviterait à
 * chercher comment débloquer. Une demande de ce type est irrecevable — donc non
 * reformulable — et cette différence-là compte pour l'étudiant.
 *
 * ⚠️ AUCUN EXEMPLAIRE. Rien à compter, rien à retirer.
 *
 * ⚠️ LE CODE DE VÉRIFICATION NAÎT DE L'ÉMISSION. Tant qu'il n'existe pas, l'écran
 * le DIT — un champ vide se lirait comme une donnée manquante, et un agent aurait
 * pu le communiquer avant qu'il n'existe.
 *
 * 🔴 Aucun de ces chemins n'est tranché : voir `api/documents.js`.
 */
import { computed, onMounted, ref } from 'vue';
import { ActionBar, ObjectPanel, ReasonStep, StateBanner, StatusPill, WorkQueue, headTh, bodyTd }
  from '../components/index.js';
import BlockState from '../components/internal/BlockState.vue';
import { useAcademicContext } from '../composables/useAcademicContext.js';
import { useResource } from '../composables/useResource.js';
import { listDocumentRequests } from '../api/documents.js';

const { params } = useAcademicContext();
const res = useResource(listDocumentRequests, { isEmpty: (d) => !d?.items?.length });
const state = res.state;
const pending = ref('');
const selectedId = ref(null);
const refusing = ref(false);

const data = computed(() => res.data.value || {});
const catalogue = computed(() => data.value.catalogue || []);
const queueItems = computed(() => (data.value.items || []).map((r) => ({
  id: r.name,
  title: r.student_name,
  subtitle: r.doc_label + ' · ' + r.program_label,
  status: r.status,
  statusLabel: r.status_label,
  due: r.received_on.split(' à ')[0],
  done: !!r.issued_on || !!r.refused_on,
})));

/**
 * Le détail vient de la LISTE, non d'un second appel : le simulacre rend déjà tout
 * ce que `get_document_request` rendrait. Un second appel au clic aurait doublé la
 * chaîne pour la même donnée — et les deux auraient divergé.
 */
const request = computed(() =>
  (data.value.items || []).find((r) => r.name === selectedId.value) || null);

const subtitle = computed(() => {
  if (state.value !== 'ready') return 'Chargement de la file';
  return [
    data.value.pending + ' demandes en attente sur ' + data.value.count,
    'la plus ancienne date du ' + data.value.oldest,
  ].join(' · ');
});

const panelSubtitle = computed(() => {
  const r = request.value;
  if (!r) return '';
  return [r.name, r.program_label, 'reçue le ' + r.received_on,
    r.purpose ? 'motif : ' + r.purpose.toLowerCase() : 'sans motif déclaré'].join(' · ');
});

const actions = computed(() => {
  const r = request.value;
  if (!r || r.issued_on || r.refused_on) return [];
  return [
    { key: 'refuser', label: 'Refuser…', kind: 'secondary' },
    { key: 'emettre', label: 'Émettre le document', kind: 'primary', disabled: !r.issuable },
  ];
});

const hint = computed(() => {
  const r = request.value;
  if (!r) return '';
  if (r.issued_on) return 'Émise le ' + r.issued_on + ' par ' + r.issued_by + '. Une année close n’y change rien : un relevé d’année close s’émet.';
  if (r.refused_on) return 'Refusée le ' + r.refused_on + '. L’étudiant lit le motif dans son espace.';
  if (!r.issuable) return 'L’émission est indisponible tant que la condition affichée n’est pas remplie. Le refus reste possible — et « prématurée » annonce à l’étudiant qu’il pourra reformuler.';
  return 'Le document sera signé par la scolarité, déposé dans l’espace de l’étudiant, et portera un code de vérification publique produit par l’acte.';
});

const refusalGroups = computed(() => [{
  key: 'categorie',
  label: '',
  options: (data.value.refusal_categories || []).map((c) => ({
    value: c.key,
    label: c.label + ' — ' + c.examples + (c.reformulable ? ' L’étudiant pourra reformuler.' : ' Non reformulable.'),
  })),
}]);

function select(id) {
  selectedId.value = id;
  refusing.value = false;
}

function act(key) {
  if (key === 'refuser') {
    refusing.value = true;
    return;
  }
  pending.value = 'Émettre appelle `emit_document`, dont le point d’entrée n’est pas tranché. '
    + 'Aucun document n’a été produit, et aucun code de vérification n’a été créé.';
}

function submitRefusal(payload) {
  refusing.value = false;
  pending.value = 'Le refus (' + payload.reason + ') appelle `refuse_document_request`, dont le '
    + 'point d’entrée n’est pas tranché. Le motif saisi n’a pas été enregistré et n’est pas parti.';
}

/** L'échappatoire dit ce qu'elle fait : elle referme, elle ne refuse pas. */
function cancelRefusal() {
  refusing.value = false;
  pending.value = 'Refus abandonné — la demande reste en attente, rien n’a été enregistré.';
}

function reload() { res.load({ ...params.value }); }
onMounted(() => {
  reload();
  selectedId.value = 'DOC-2027-0188';
});
</script>
