<template>
  <div>
    <header class="mb-4">
      <p class="mb-2 text-caption text-ln-gray-500">
        À traiter · <b class="font-semibold text-ln-gray-900">Demandes de documents</b>
      </p>
      <h1 class="text-h1 tracking-tight text-ln-gray-900">Demandes de documents</h1>
      <p class="mt-1 text-body-sm text-ln-gray-500">{{ subtitle }}</p>
    </header>

    <StateBanner v-if="done" variant="success" lead="Acte enregistré." :text="done" />
    <StateBanner v-if="actError" variant="warning" lead="Acte refusé." :text="actError" />

    <BlockState v-if="state !== 'ready'" :state="state === 'denied' ? 'loading' : state"
                title="Aucune demande en attente"
                message="Aucun étudiant n’attend de document. C’est l’état normal d’une file traitée — et il n’y a rien à préparer d’avance."
                :rows="5" :row-height="56" :skeleton-widths="[180, 240, 120]"
                @retry="reload" />

    <div v-else class="grid grid-cols-1 items-start gap-5 xl:grid-cols-[392px_1fr]">
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
            <!-- MANDAT-14 (G-M4, C1) : le catalogue du SERVEUR — `requestable`, et la raison quand il ne l'est pas. -->
            <li v-for="c in catalogue" :key="c.document_type"
                class="mb-3 border-b border-ln-gray-100 pb-3 last:mb-0 last:border-b-0 last:pb-0">
              <p class="text-body-sm font-semibold"
                 :class="c.requestable ? 'text-ln-gray-900' : 'text-ln-gray-500'">
                {{ c.label }}
                <span v-if="!c.requestable" class="ml-1 rounded-sm-ln bg-ln-gray-100 px-1.5 py-0.5 text-micro font-semibold text-ln-gray-600">
                  ne se demande pas ici
                </span>
              </p>
              <p class="mt-0.5 text-caption leading-relaxed text-ln-gray-600">
                {{ c.reason || 'L’étudiant le demande depuis son espace (Documents › Mes demandes).' }}
              </p>
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
            <StatusPill :status="pastille(request)" :label="request.status_label" />
          </template>

          <!-- MANDAT-14 (G-M4, C1) : ce que le serveur rend de la demande — la période, les programmes de la
               période (DEC-351 ; C12 : un réorienté reçoit UN document en sections par programme), l'éligibilité
               RECALCULÉE en file. Rien n'est saisi ni recompté ici. -->
          <dl class="mb-5 flex flex-wrap gap-x-10 gap-y-3 rounded-md-ln border border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
            <div>
              <dt class="text-caption text-ln-gray-500">Période</dt>
              <dd class="text-body-sm font-semibold text-ln-gray-900">{{ periode(request) }}</dd>
            </div>
            <div>
              <dt class="text-caption text-ln-gray-500">{{ (request.programs || []).length > 1 ? 'Programmes' : 'Programme' }} de la période</dt>
              <dd class="text-body-sm font-semibold text-ln-gray-900">{{ request.program_label }}</dd>
            </div>
            <div class="basis-full">
              <dt class="text-caption text-ln-gray-500">Éligibilité, recalculée en file</dt>
              <dd class="text-body-sm text-ln-gray-900">{{ request.eligibility_note }}</dd>
            </div>
          </dl>
          <p v-if="(request.programs || []).length > 1"
             class="mb-5 rounded-md-ln border border-ln-blue-100 bg-ln-blue-50 px-4 py-3 text-caption leading-relaxed text-ln-gray-700">
            <b class="font-semibold text-ln-gray-900">Réorienté dans la période.</b> Le relevé est un seul document en
            sections par programme : chaque section porte ses unités et ses crédits, aucun total n’additionne les deux.
          </p>

          <p class="rounded-md-ln border border-dashed border-ln-gray-300 px-4 py-6 text-center text-caption leading-relaxed text-ln-gray-500">
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
              — pièce {{ request.issued_document }}, émise le {{ fr(request.issued_on) }}. Celui qui reçoit le
              document en contrôle l'authenticité en ligne.
            </p>
            <p v-else-if="request.issued_on" class="mt-1 text-body-sm leading-relaxed text-ln-gray-600">
              Pièce {{ request.issued_document }}, émise le {{ fr(request.issued_on) }} ; le code de vérification n’est
              pas disponible dans cette lecture.
            </p>
            <p v-else class="mt-1 text-body-sm leading-relaxed text-ln-gray-600">
              <b class="font-semibold text-ln-gray-900">Il n'existe pas encore.</b> Le code naît de
              l'émission : il n'y a donc rien à afficher ni à communiquer avant l'acte. Il n'y a pas
              non plus d'exemplaire à compter ni de retrait à prévoir — le document se télécharge
              autant de fois que nécessaire.
            </p>
          </div>

          <p v-if="request.refusal_reason" class="mt-5 rounded-md-ln border border-[#F3C6C6] bg-ln-error-bg px-4 py-3 text-body-sm leading-relaxed text-[#7A2020]">
            <b class="font-semibold">Refusée le {{ fr(request.refused_on) }}<template v-if="request.refusal_label"> — {{ request.refusal_label }}</template>.</b>
            {{ request.refusal_reason }}
            <template v-if="request.reformulable === true">L’étudiant pourra reformuler ;</template>
            <template v-else-if="request.reformulable === false">Non reformulable ;</template>
            il lit ce motif dans son espace.
          </p>

          <template #actions>
            <ActionBar :actions="actions"
                       attribution="L'émission est <b>tracée</b> : date et agent."
                       :hint="hint" @act="act" />
          </template>
        </ObjectPanel>

        <ObjectPanel v-else title="" state="empty"
                     state-title="Aucune demande sélectionnée"
                     state-message="Choisissez une demande dans la file pour voir son état et l’émettre ou la refuser." />

        <!-- Conception (lot 7 bis, D-15 ; écart E-3.8) : l'émission est irréversible (la pièce naît signée, son code de
             vérification avec elle) — une confirmation qui nomme la pièce et l'étudiant. -->
        <div v-if="confirmingEmit && request" class="mt-5 rounded-md-ln border border-ln-blue-200 bg-ln-blue-50 p-4"
             role="group" aria-label="Confirmer l'émission">
          <p class="text-body-sm text-ln-gray-900">
            Émettre <b class="font-semibold">{{ request.doc_label }}</b> pour <b class="font-semibold">{{ request.student_name }}</b> :
            la pièce est produite et signée, son code de vérification naît avec elle. L’émission ne se défait pas.
          </p>
          <div class="mt-3 flex flex-wrap justify-end gap-2">
            <button type="button" class="ln-btn-secondary" @click="confirmingEmit = false">Revenir</button>
            <button type="button" class="ln-btn-primary" :disabled="busy" @click="emitConfirmed">Confirmer l’émission</button>
          </div>
        </div>

        <!-- L'étape de motif : les catégories du SERVEUR, et la distinction voyage avec le
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
                      :modal="false" :busy="busy"
                      @submit="submitRefusal" @cancel="cancelRefusal" />
        </div>
      </div>
    </div>

    <StateBanner v-if="pending" variant="info" lead="Refus abandonné." :text="pending" class="mt-4" />
  </div>
</template>

<script setup>
/**
 * Grappe 9 · la file des demandes de documents.
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
 * le DIT — un champ vide se lirait comme une donnée manquante.
 *
 * MANDAT-14 (G-M4, C1, Q10) : la forme du serveur (`list_document_requests`) ; délivrer
 * (`fulfill_document_request`) et refuser (`refuse_document_request`, catégorie du serveur)
 * sont BRANCHÉS — l'écran relit la file après l'acte.
 */
import { computed, onMounted, ref } from 'vue';
import { ActionBar, ObjectPanel, ReasonStep, StateBanner, StatusPill, WorkQueue }
  from '../components/index.js';
import BlockState from '../components/internal/BlockState.vue';
import { useAcademicContext } from '../composables/useAcademicContext.js';
import { useResource } from '../composables/useResource.js';
import { useSession } from '../composables/useSession.js';
import { emitDocument, listDocumentRequests, refuseDocumentRequest } from '../api/documents.js';

const { params } = useAcademicContext();
const { can } = useSession();
const res = useResource(listDocumentRequests, { isEmpty: (d) => !d?.items?.length });
const state = res.state;
const pending = ref('');
const done = ref('');
const actError = ref('');
const busy = ref(false);
const selectedId = ref(null);
const refusing = ref(false);

const data = computed(() => res.data.value || {});
const catalogue = computed(() => data.value.catalogue || []);
// MANDAT-14 (G-M4, C1) : la file lit la forme du serveur. Le libellé de statut est celui du serveur ; la
// couleur de la pastille est une présentation (en attente et émettable, en attente et bloquée, émise, refusée).
// P16 : « 4 septembre », « 1er octobre » ; des pluriels accordés.
const fr = (iso) => (iso ? new Date(String(iso).slice(0, 10) + 'T12:00:00')
  .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }).replace(/^1 /, '1er ') : '—');
const nb = (n, un, plusieurs) => `${n} ${n >= 2 ? plusieurs : un}`;
const periode = (r) => (r.academic_term ? r.academic_term : 'année ' + r.academic_year);
const pastille = (r) => (r.status === 'Émise' ? 'valide' : r.status === 'Refusée' ? 'renvoyee'
  : r.issuable ? 'propose' : 'incomplete');
const queueItems = computed(() => (data.value.items || []).map((r) => ({
  id: r.name,
  title: r.student_name,
  subtitle: r.doc_label + ' · ' + periode(r) + ' · ' + r.program_label,
  status: pastille(r),
  statusLabel: r.status === 'Demandée' && !r.issuable ? 'En attente — non émettable' : r.status_label,
  due: 'demandée le ' + fr(r.requested_on),
  done: r.status !== 'Demandée',
})));

/**
 * Le détail vient de la LISTE, non d'un second appel : elle rend déjà tout ce que
 * l'écran montre. Un second appel au clic aurait doublé la chaîne pour la même
 * donnée — et les deux auraient pu diverger.
 */
const request = computed(() =>
  (data.value.items || []).find((r) => r.name === selectedId.value) || null);

const subtitle = computed(() => {
  if (state.value !== 'ready') return 'Chargement de la file';
  const c = data.value.counts || {};
  return [
    data.value.pending + ' en attente sur ' + data.value.count,
    nb(c['Émise'] || 0, 'émise', 'émises'), nb(c['Refusée'] || 0, 'refusée', 'refusées'),
    data.value.oldest_pending ? 'la plus ancienne attente date du ' + fr(data.value.oldest_pending) : 'aucune attente',
  ].join(' · ');
});

const panelSubtitle = computed(() => {
  const r = request.value;
  if (!r) return '';
  return [r.name, periode(r), 'demandée le ' + fr(r.requested_on)].join(' · ');
});

// Règle 3 : l'acte n'est offert qu'à qui le porte (la clé de la matrice, `emit:documents` = {EM}).
const actions = computed(() => {
  const r = request.value;
  if (!r || r.status !== 'Demandée' || !can('emit:documents')) return [];
  return [
    { key: 'refuser', label: 'Refuser…', kind: 'secondary', disabled: busy.value },
    { key: 'emettre', label: 'Émettre le document', kind: 'primary', disabled: !r.issuable || busy.value },
  ];
});

const hint = computed(() => {
  const r = request.value;
  if (!r) return '';
  if (r.issued_on) return 'Émise le ' + fr(r.issued_on) + '. Une année close n’y change rien : un relevé d’année close s’émet.';
  if (r.refused_on) return 'Refusée le ' + fr(r.refused_on) + '. L’étudiant lit le motif dans son espace.';
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

const confirmingEmit = ref(false);
function select(id) {
  selectedId.value = id;
  refusing.value = false;
  confirmingEmit.value = false;
  done.value = ''; actError.value = '';
}

async function act(key) {
  done.value = ''; actError.value = ''; pending.value = '';
  if (key === 'refuser') {
    confirmingEmit.value = false;
    refusing.value = true;
    return;
  }
  // D-15 : l'émission passe d'abord par sa confirmation.
  refusing.value = false;
  confirmingEmit.value = true;
}
async function emitConfirmed() {
  confirmingEmit.value = false;
  const r = request.value;
  busy.value = true;
  try {
    const out = await emitDocument({ name: r.name });
    done.value = `${r.doc_label} de ${r.student_name} émis${out?.issued_document ? ' — pièce ' + out.issued_document : ''}.`;
    await reload();
  } catch (e) { actError.value = e.message; } finally { busy.value = false; }
}

async function submitRefusal(payload) {
  const r = request.value;
  busy.value = true; done.value = ''; actError.value = '';
  try {
    await refuseDocumentRequest({ name: r.name, refusal_category: payload.reason, refusal_reason: payload.detail });
    refusing.value = false;
    done.value = `Demande ${r.name} refusée ; ${r.student_name} lit le motif dans son espace.`;
    await reload();
  } catch (e) { actError.value = e.message; } finally { busy.value = false; }
}

/** L'échappatoire dit ce qu'elle fait : elle referme, elle ne refuse pas. */
function cancelRefusal() {
  refusing.value = false;
  pending.value = 'La demande reste en attente ; rien n’a été enregistré.';
}

function reload() { return res.load({ ...params.value }); }
onMounted(async () => {
  await reload();
  // `?demande=` ouvre une demande donnée (lien depuis la file de travail) ; sinon, la première de la file.
  selectedId.value = new URLSearchParams(location.search).get('demande') || (data.value.items || [])[0]?.name || null;
});
</script>
