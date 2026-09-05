<template>
  <div>
    <header class="mb-4 flex flex-wrap items-start justify-between gap-5">
      <div>
        <p class="mb-2 text-caption text-ln-gray-500">Répartition · <b class="font-semibold text-ln-gray-900">Validation</b></p>
        <h1 class="text-h1 tracking-tight text-ln-gray-900">{{ current.program_label || '…' }}<span v-if="current.line_count"> — {{ current.line_count }} lignes proposées</span></h1>
        <p class="mt-1 text-body-sm text-ln-gray-500">{{ subtitle }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button v-if="can('validate:service')" type="button" class="ln-btn-secondary" :disabled="busy" @click="returnOpen = true">Renvoyer au responsable…</button>
        <button v-if="can('validate:service')" type="button" class="ln-btn-primary" :disabled="blockedByReason || busy" @click="validateAll">
          Valider les {{ current.line_count || 0 }} lignes
        </button>
      </div>
    </header>

    <StateBanner v-if="pending" variant="info" lead="Répartition" :text="pending" />
    <StateBanner v-if="actError" variant="error" lead="L'acte a échoué." :text="actError" />

    <div v-if="report" class="mb-4">
      <BatchReport title="Validation des lignes" :report="report"
                   ok-label="validées" ko-label="en échec" failures-first :retryable="false"
                   footnote="Une ligne au-delà de la norme sans motif est refusée ; elle se rejoue après motivation." />
      <button type="button" class="ln-btn-secondary mt-2" @click="report = null">Fermer le rapport</button>
    </div>

    <div class="grid items-start gap-5 xl:grid-cols-[368px_1fr]">
      <WorkQueue title="Répartitions proposées" :items="queueItems" :selected-id="selectedId"
                 :total="queueItems.length"
                 :state="queueState === 'denied' ? 'loading' : queueState"
                 state-title="Aucune répartition proposée"
                 state-message="Les responsables de formation n'ont encore rien soumis pour cette année."
                 @select="selectedId = $event" @retry="loadQueue" />

      <section>
        <StateBanner variant="warning" lead="400 h est une norme, pas un plafond.">
          Le système ne refuse jamais le dépassement ; il refuse une dérogation sans motif. Le total lu
          ici est l'<b class="font-semibold">engagé</b> — validé + proposé, toutes filières confondues.
        </StateBanner>

        <DenseTable :state="detailState === 'denied' ? 'loading' : detailState" :row-height="36"
                    :expected-count="current.line_count" expected-label="lignes"
                    :skeleton-widths="[32, 196, 150, 66, 96, 132]" max-height="412px"
                    state-title="Aucune ligne dans cette proposition"
                    @retry="loadDetail">
          <template #head>
            <tr>
              <th :class="headTh" style="width:32px"></th>
              <th :class="headTh" class="!text-left">Module · activité</th>
              <th :class="headTh" class="!text-left">Enseignant</th>
              <th :class="headTh">Heures</th>
              <th :class="headTh">Engagé</th>
              <th :class="headTh" class="!text-left">État</th>
            </tr>
          </template>
          <template #body>
            <tr v-for="line in lines" :key="line.id"
                :class="[line.over_norm ? 'bg-ln-warning-bg' : 'hover:bg-ln-gray-50',
                         line.module_id === activeDerogation?.module_id ? 'shadow-[inset_2px_0_0_var(--ln-warning)]' : '']">
              <td :class="bodyTd">
                <!-- Une ligne sous dérogation non motivée n'est pas cochable :
                     ce n'est pas un refus, c'est l'ordre des choses. Le motif
                     se pose d'abord, à la ligne qui franchit la norme. -->
                <input v-if="!line.needs_reason" type="checkbox" :checked="checked[line.id] !== false"
                       class="h-4 w-4 accent-ln-blue-800" :aria-label="'Valider ' + line.module_code"
                       @change="checked[line.id] = $event.target.checked" />
                <span v-else class="text-ln-warning" aria-label="Motif exigé avant validation">—</span>
              </td>
              <td :class="bodyTd" class="!text-left">
                <ActivityTag :kind="line.activity" />
                <span class="ml-1.5 font-mono text-[11.5px] text-ln-gray-500">{{ line.module_code }}</span>
                <span class="ml-1">{{ line.module_label }}</span>
              </td>
              <td :class="bodyTd" class="!text-left">{{ line.teacher }}</td>
              <td :class="bodyTd">{{ line.hours }} h</td>
              <td :class="bodyTd"><b v-if="line.over_norm" class="font-semibold">{{ line.engaged }} h</b><span v-else>{{ line.engaged }} h</span></td>
              <td :class="bodyTd" class="!text-left">
                <StatusPill :status="line.needs_reason ? 'suspendue' : (line.over_norm ? 'valide' : 'propose')"
                            :label="line.state_label" />
              </td>
            </tr>
          </template>
          <template #legend>
            <span>Une ligne <b class="font-semibold text-ln-gray-900">au-delà de la norme</b> reste validable — après motivation. Le motif couvre toutes les lignes du même module pour le même enseignant.</span>
          </template>
        </DenseTable>

        <!-- Le motif se demande À LA LIGNE, pas à l'envoi : c'est la ligne qui
             franchit la norme, pas la proposition. -->
        <ReasonStep v-if="activeDerogation" class="mt-4" name="derogation"
                    :title="'Dérogation à la norme — ' + activeDerogation.teacher"
                    :subtitle="derogationSubtitle"
                    reason-label="Catégorie du motif"
                    :reason-groups="derogationReasons"
                    detail-label="Précision"
                    detail-placeholder="Ce qui justifie de dépasser la norme pour cet enseignant…"
                    detail-hint="Le motif est attaché aux lignes validées et reste lisible au bilan de charge."
                    confirm-label="Valider avec dérogation"
                    cancel-label="Renvoyer plutôt…"
                    :modal="false"
                    footnote="Sans motif, la validation de ces lignes n'est pas possible — le dépassement, lui, n'est jamais refusé."
                    @cancel="preferReturn" @submit="submitDerogation" />
      </section>
    </div>

    <div v-if="returnOpen" class="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-6">
      <ReasonStep class="w-full max-w-2xl" name="service-return"
                  title="Renvoyer la répartition au responsable"
                  subtitle="Un seul acte : la proposition repart chez le responsable de formation, qui retrouve ses lignes modifiables. La catégorie oriente son travail, elle ne change pas la nature du renvoi."
                  reason-label="Catégorie du motif"
                  :reason-groups="returnReasons"
                  detail-label="Précision"
                  detail-hint="Le responsable reçoit la catégorie et la précision."
                  confirm-label="Renvoyer"
                  footnote="Renvoyer et rejeter sont le même acte serveur."
                  @cancel="returnOpen = false" @submit="submitReturn" />
    </div>
  </div>
</template>

<script setup>
/**
 * Grappe 3 · Répartition — écran N2 du lot 6 corrigé.
 *
 * Le patron du lot 2 s'applique tel quel : file à gauche, objet à droite, motif
 * obligatoire posé PENDANT l'acte. Une seule nuance neuve — le motif de
 * dérogation ne se demande pas à l'envoi, il se demande À LA LIGNE, parce que
 * c'est la ligne qui franchit la norme.
 *
 * Renvoyer et rejeter restent UN SEUL acte serveur : deux catégories de motif,
 * jamais deux boutons (arbitrage A-02).
 */
import { computed, onMounted, reactive, ref, watch } from 'vue';
import {
  WorkQueue, DenseTable, StatusPill, StateBanner, ReasonStep, BatchReport, headTh, bodyTd,
} from '../components/index.js';
import ActivityTag from './repartition/ActivityTag.vue';
import { useSession } from '../composables/useSession.js';
import { useAcademicContext } from '../composables/useAcademicContext.js';
import { useResource } from '../composables/useResource.js';
import {
  listServiceProposals, getServiceProposal, validateServicePlan, returnServicePlan,
} from '../api/service.js';

const { can } = useSession();
const { params } = useAcademicContext();

const queueRes = useResource(listServiceProposals);
const detailRes = useResource((p) => getServiceProposal(p), { isEmpty: (d) => !d?.lines?.length });
const queueState = queueRes.state;
const detailState = detailRes.state;

const selectedId = ref(null);
const checked = reactive({});
const returnOpen = ref(false);

const queueItems = computed(() => queueRes.data.value?.items || []);
const current = computed(() => detailRes.data.value || {});
/** needs_reason vient du serveur ; la motivation locale le lève. */
const lines = computed(() =>
  (current.value.lines || []).map((l) => ({
    ...l,
    needs_reason: l.needs_reason && motivated[l.module_id] !== true,
    state_label: l.needs_reason && motivated[l.module_id] === true
      ? 'Dérogation motivée'
      : l.state_label,
  })));

const subtitle = computed(() => {
  const c = current.value;
  if (detailState.value !== 'ready') return 'Chargement de la proposition';
  return [c.proposed_on ? 'Proposées le ' + c.proposed_on : null,
    c.proposed_by ? 'par ' + c.proposed_by + ', responsable de formation' : null,
    c.total_hours ? c.total_hours + ' heures' : null].filter(Boolean).join(' · ');
});

/**
 * La première ligne au-delà de la norme non encore motivée. Le serveur ne rend
 * PAS de dérogation agrégée (FORMES : `derogations: []`) — la dérogation se
 * DÉRIVE des lignes `needs_reason`, une à la fois : traiter deux dépassements
 * dans le même panneau reviendrait à un motif générique, c'est-à-dire pas de motif.
 */
const activeDerogation = computed(() =>
  (current.value.lines || []).find((l) => l.needs_reason && motivated[l.module_id] !== true) || null);
const blockedByReason = computed(() => !!activeDerogation.value);

const derogationSubtitle = computed(() => {
  const d = activeDerogation.value;
  if (!d) return '';
  return d.teacher + ' — ' + d.engaged + ' h engagées, au-delà de la norme. '
    + 'Le motif couvre les lignes de ce module pour cet enseignant.';
});

const derogationReasons = [{
  key: 'main',
  options: [
    { value: 'absence_titulaire', label: 'Absence de titulaire sur la discipline' },
    { value: 'remplacement', label: 'Remplacement en cours d’année' },
    { value: 'mutualisation', label: 'Mutualisation entre filières' },
    { value: 'autre', label: 'Autre — à préciser' },
  ],
}];

const returnReasons = [{
  key: 'main',
  options: [
    { value: 'complement', label: 'Complément attendu — des lignes manquent, le reste tient' },
    { value: 'reprise', label: 'Reprise complète — la proposition ne peut pas être contrôlée en l’état' },
  ],
}];

/**
 * Motiver et écarter ne peuvent pas avoir le même effet.
 *
 * · Motiver ferme la dérogation : ses lignes redeviennent cochables, la pastille
 *   change, et le bouton de validation se libère. C'est ce que la légende promet.
 * · « Renvoyer plutôt » n'écarte rien en silence : il ouvre le renvoi. Quelqu'un
 *   qui refuse de motiver un dépassement veut renvoyer la proposition, pas
 *   valider sans motif.
 *
 * Tant que le serveur n'est pas branché, la motivation est portée localement :
 * l'effet est vrai à l'écran, la persistance viendra du rechargement.
 */
const motivated = reactive({});
/**
 * Le motif de dérogation capturé — passé à `validate_service_lines` comme
 * `derogation_reason` (le serveur ne le pose QUE sur les lignes au-delà de la
 * norme ; sous la norme, un motif décoratif est refusé — pièce d'audit).
 */
const derogationReason = ref('');

function submitDerogation({ reason, detail }) {
  const d = activeDerogation.value;
  if (!d) return;
  motivated[d.module_id] = true;
  derogationReason.value = [reason, detail].filter(Boolean).join(' — ');
  // La motivation lève needs_reason à l'écran ; elle sera PERSISTÉE à la
  // validation (derogation_reason porté par l'appel).
}
function preferReturn() { returnOpen.value = true; }

/* ── Actes BRANCHÉS (M2 g3) — validation de masse et renvoi unitaire. ── */
const pending = ref('');
const actError = ref('');
const busy = ref(false);
const report = ref(null);

/** Les lignes à valider : cochées ET non bloquées par un motif manquant. */
const checkedNames = computed(() =>
  lines.value.filter((l) => !l.needs_reason && checked[l.id] !== false).map((l) => l.id));

async function validateAll() {
  actError.value = ''; pending.value = '';
  const names = checkedNames.value;
  if (!names.length) { pending.value = 'Aucune ligne cochée à valider.'; return; }
  try {
    busy.value = true;
    report.value = await validateServicePlan({
      names,
      ...(derogationReason.value ? { derogation_reason: derogationReason.value } : {}),
    });
    loadQueue();
    if (selectedId.value) loadDetail();
  } catch (e) {
    actError.value = e.message || 'Validation refusée.';
  } finally { busy.value = false; }
}

/**
 * Renvoyer la proposition : le serveur ne connaît qu'un renvoi UNITAIRE
 * (`return_service_line(name, return_reason)`) — l'écran renvoie donc chaque
 * ligne de la proposition avec le même motif (F : lot front ↔ unitaire serveur).
 */
async function submitReturn({ reason, detail }) {
  returnOpen.value = false;
  actError.value = ''; pending.value = '';
  const motif = [reason, detail].filter(Boolean).join(' — ');
  const names = (current.value.lines || []).map((l) => l.id);
  try {
    busy.value = true;
    await Promise.all(names.map((name) => returnServicePlan({ name, return_reason: motif })));
    pending.value = names.length + ' ligne(s) renvoyée(s) au responsable.';
    loadQueue();
  } catch (e) {
    actError.value = e.message || 'Renvoi refusé.';
  } finally { busy.value = false; }
}

function loadQueue() { queueRes.load(params.value); }
function loadDetail() {
  Object.keys(motivated).forEach((k) => delete motivated[k]);
  derogationReason.value = '';
  report.value = null;
  // ⚠️ `academic_year` est OBLIGATOIRE pour `list_service_lines` (500 sinon) —
  // le simulacre l'ignorait, le serveur l'exige. Le passer avec la proposition.
  if (selectedId.value) {
    detailRes.load({ proposal: selectedId.value, academic_year: params.value.academic_year });
  }
}

onMounted(() => { if (params.value.academic_year) loadQueue(); });  // pas d'appel sans contexte (§5)
watch(params, loadQueue);
watch(queueItems, (items) => { if (items.length && !selectedId.value) selectedId.value = items[0].id; });
watch(selectedId, loadDetail);
</script>
