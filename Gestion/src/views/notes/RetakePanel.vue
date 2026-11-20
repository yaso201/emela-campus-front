<template>
  <div class="flex flex-col gap-4">
    <form class="flex flex-wrap items-end gap-3" @submit.prevent="reload">
      <label class="flex flex-col gap-1 text-caption font-semibold text-ln-gray-700">Code du module
        <input v-model="course" type="text" class="h-9 w-[160px] rounded-sm-ln border border-ln-gray-300 px-2 font-mono text-body-sm" />
      </label>
      <p class="text-caption text-ln-gray-600">Semestre : <b class="font-semibold text-ln-gray-900">{{ data?.academic_term || term || '…' }}</b></p>
      <button type="submit" class="ln-btn-secondary" :disabled="!course.trim()">Lire les candidats</button>
      <p v-if="data" class="ml-auto text-caption text-ln-gray-600">
        <template v-if="data.course_name">{{ data.course_name }} · </template>
        <b class="font-semibold text-ln-gray-900">{{ data.eligible_count }}</b>
        {{ data.eligible_count >= 2 ? 'éligibles' : 'éligible' }} sur {{ data.rows.length }}
      </p>
    </form>

    <!-- P21 (PC1B) : quand une même phrase ferme toutes les lignes (le jury clos), elle se dit UNE fois, ici. -->
    <StateBanner v-if="allBlocked" variant="warning" lead="Saisie fermée." :text="data.rows[0].blocked_reason" />
    <StateBanner v-if="done" variant="success" lead="Note enregistrée." :text="done" />
    <StateBanner v-if="actError" variant="warning" lead="Saisie refusée." :text="actError" />

    <p v-if="!course.trim() && state !== 'ready'" class="text-caption text-ln-gray-500">
      Saisissez le code d’un module pour lire ses candidats au rattrapage.
    </p>
    <BlockState v-else-if="state !== 'ready'" :state="state === 'denied' ? 'loading' : state" title="Aucun candidat"
                message="Aucun résultat d’UE ne porte ce module pour ce semestre." :rows="5" :row-height="44" @retry="reload" />
    <div v-else class="overflow-x-auto rounded-md-ln border border-ln-gray-200">
      <table class="w-full border-collapse text-body-sm">
        <thead>
          <tr>
            <th :class="headTh" class="!text-left">Étudiant</th>
            <th :class="headTh">Module (session principale)</th>
            <th :class="headTh">UE</th>
            <th :class="headTh" class="!text-left">Rattrapage</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in data.rows" :key="r.ue_result" class="align-top" :class="r.eligible ? '' : 'bg-ln-gray-50'">
            <td :class="bodyTd" class="!text-left">
              <b class="font-semibold text-ln-gray-900">{{ r.student_name }}</b>
              <span class="block font-mono text-[11.5px] text-ln-gray-500">{{ r.student }}</span>
            </td>
            <td :class="bodyTd">
              {{ num(r.retake_posted ? r.original_grade : r.module_average) }}
              <span v-if="r.retake_posted" class="block text-caption text-ln-gray-500">après rattrapage : {{ num(r.module_average) }}</span>
            </td>
            <td :class="bodyTd">
              {{ num(r.ue_average) }}
              <span class="block text-caption text-ln-gray-500">{{ r.ue_name || r.course_ue }} · {{ r.ue_validated ? 'validée' : 'non validée' }}</span>
            </td>
            <td :class="bodyTd" class="max-w-[420px] !whitespace-normal !text-left">
              <template v-if="r.eligible && can('control:grades')">
                <div class="flex items-center gap-2">
                  <input v-model="grades[r.ue_result]" type="number" min="0" max="20" step="0.25" placeholder="/20"
                         :aria-label="'Note de rattrapage — ' + r.student_name"
                         class="h-9 w-[90px] rounded-sm-ln border border-ln-gray-300 px-2 text-body-sm" />
                  <button type="button" class="ln-btn-primary"
                          :disabled="busy || grades[r.ue_result] === undefined || grades[r.ue_result] === ''"
                          @click="record(r)">Enregistrer</button>
                </div>
                <p class="mt-1 text-caption text-ln-gray-500">Une seule session (Art. 26.1) : la note remplace celle du module.</p>
              </template>
              <p v-else-if="r.eligible" class="text-caption text-ln-gray-600">Éligible — la saisie revient au responsable de la scolarité.</p>
              <p v-else-if="allBlocked" class="text-caption text-ln-gray-500">Fermée (voir ci-dessus).</p>
              <!-- La phrase de la garde de la saisie, telle que le serveur la rend : jamais une règle redite à l'écran. -->
              <p v-else class="text-caption leading-relaxed text-ln-gray-600">{{ r.blocked_reason }}</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
/**
 * MANDAT-14 (G-M3, C6 ; étape 11) — saisir les notes de rattrapage d'un module. Les candidats et la raison de chaque
 * refus viennent du serveur (`list_retake_candidates`, la règle même de la saisie) ; « jury clos » est SA phrase.
 * Le semestre est celui du contexte ; `?module=` ouvre un module donné.
 */
import { computed, onMounted, reactive, ref } from 'vue';
import { StateBanner, headTh, bodyTd } from '../../components/index.js';
import BlockState from '../../components/internal/BlockState.vue';
import { useResource } from '../../composables/useResource.js';
import { useSession } from '../../composables/useSession.js';
import { useAcademicContext } from '../../composables/useAcademicContext.js';
import { listRetakeCandidates, recordRetakeGrade } from '../../api/retake.js';

const { can } = useSession();
const { params } = useAcademicContext();
const res = useResource(listRetakeCandidates, { isEmpty: (d) => !d?.rows?.length });
const state = res.state;
const data = computed(() => res.data.value);
const course = ref(new URLSearchParams(location.search).get('module') || '');
// Le semestre du contexte : `params.term` (l'identifiant de l'Academic Term), jamais une clé fabriquée.
const term = computed(() => params.value?.term || '');
const grades = reactive({});
const busy = ref(false);
const done = ref('');
const actError = ref('');
const allBlocked = computed(() => data.value?.rows?.length && data.value.rows.every((r) => !r.eligible)
  && new Set(data.value.rows.map((r) => r.blocked_reason)).size === 1);
// P16 : la virgule décimale.
const num = (v) => (v === null || v === undefined || v === '' ? '—' : String(v).replace('.', ','));

function reload() {
  if (!course.value.trim()) return;
  res.load({ course: course.value.trim(), academic_term: term.value });
}
async function record(r) {
  busy.value = true; done.value = ''; actError.value = '';
  try {
    await recordRetakeGrade({ ue_result: r.ue_result, course: course.value.trim(), retake_grade: grades[r.ue_result] });
    done.value = `${r.student_name} : ${num(grades[r.ue_result])}/20 au rattrapage — le module et l’UE sont recalculés.`;
    delete grades[r.ue_result];
    reload();
  } catch (e) { actError.value = e.message; } finally { busy.value = false; }
}
onMounted(reload);
</script>
