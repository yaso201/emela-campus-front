<template>
  <section class="mb-5 overflow-hidden rounded-md-ln border border-ln-gray-200" aria-label="Résultats d'une cohorte">
    <header class="flex flex-wrap items-end gap-3 border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
      <div class="mr-auto">
        <h2 class="text-h2 text-ln-gray-900">Résultats d’une cohorte, avant le jury</h2>
        <p class="mt-0.5 text-caption text-ln-gray-500">
          Le moteur calcule les résultats de semestre de la cohorte ; le jury délibère ensuite sur eux.
        </p>
      </div>
      <label class="flex flex-col gap-1 text-caption font-semibold text-ln-gray-700">Filière
        <select v-model="program" class="h-9 rounded-sm-ln border border-ln-gray-300 bg-white px-2 text-body-sm">
          <option v-for="p in programs" :key="p.name" :value="p.name">{{ p.program_name || p.name }}</option>
        </select>
      </label>
      <label class="flex flex-col gap-1 text-caption font-semibold text-ln-gray-700">Niveau
        <select v-model="level" class="h-9 rounded-sm-ln border border-ln-gray-300 bg-white px-2 text-body-sm">
          <option v-for="l in levels" :key="l.name" :value="l.name">{{ l.level_name || l.name }}</option>
        </select>
      </label>
      <p class="text-caption text-ln-gray-600">Semestre : <b class="font-semibold text-ln-gray-900">{{ data?.academic_term || '…' }}</b></p>
      <!-- Règle 3 : le calcul n'est offert qu'à qui le porte (`deliberate` et `can_compute` du serveur). -->
      <button v-if="can('deliberate') && data?.can_compute" type="button" class="ln-btn-primary" :disabled="busy" @click="compute">
        {{ busy ? 'Calcul…' : data.counts.recompute ? 'Recalculer les résultats' : 'Calculer les résultats' }}
      </button>
    </header>

    <StateBanner v-if="done" variant="success" lead="Calcul fait." :text="done" class="m-4" />
    <StateBanner v-if="actError" variant="warning" lead="Calcul refusé." :text="actError" class="m-4" />
    <BlockState v-if="state !== 'ready'" :state="state === 'denied' ? 'loading' : state" title="Aucun étudiant dans la cohorte"
                message="Personne n’a de résultat d’UE de ce programme, à ce niveau, ce semestre." :rows="4" :row-height="44" @retry="reload" />
    <template v-else>
      <!-- P16 : des pluriels accordés ; Q18 : la filière et le niveau par leur libellé. -->
      <p class="px-4 py-2 text-caption text-ln-gray-700">
        {{ data.program_label }} · {{ data.academic_level_label || data.academic_level }} · {{ nb(data.cohort_size, 'étudiant') }} :
        <b class="font-semibold">{{ data.counts.create }}</b> à créer,
        <b class="font-semibold">{{ data.counts.recompute }}</b> à recalculer,
        <b class="font-semibold">{{ data.counts.skip }}</b> {{ data.counts.skip >= 2 ? 'écartés' : 'écarté' }}.
        <span v-for="d in data.deliberations" :key="d.name"> Délibération {{ d.name }} ({{ d.academic_term }}) : {{ d.status }}.</span>
      </p>
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-body-sm">
          <thead>
            <tr>
              <th :class="headTh" class="!text-left">Étudiant</th>
              <th :class="headTh">Crédits du semestre</th>
              <th :class="headTh">Cumul (programme)</th>
              <th :class="headTh">MHC</th>
              <th :class="headTh">Semestre</th>
              <th :class="headTh" class="!text-left">Au calcul</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in data.rows" :key="r.student" :class="r.on_compute === 'skip' ? 'bg-ln-gray-50 text-ln-gray-500' : ''">
              <td :class="bodyTd" class="!text-left">
                <b class="font-semibold" :class="r.on_compute === 'skip' ? '' : 'text-ln-gray-900'">{{ r.student_name }}</b>
                <span class="block text-[11.5px] text-ln-gray-500"><span class="font-mono">{{ r.student }}</span> · {{ r.academic_level_label || r.academic_level }}</span>
              </td>
              <td :class="bodyTd">{{ r.total_ects_earned === null ? '—' : r.total_ects_earned + ' / ' + r.total_ects_possible }}</td>
              <td :class="bodyTd">{{ r.cumulative_ects ?? '—' }}</td>
              <td :class="bodyTd">{{ r.all_mhc_validated === null ? '—' : r.all_mhc_validated ? 'validés' : 'à valider' }}</td>
              <td :class="bodyTd">
                <StatusPill v-if="r.semester_validated !== null" :status="r.semester_validated ? 'valide' : 'incomplete'"
                            :label="r.semester_validated ? 'validé' : 'non validé'" />
                <span v-else>—</span>
              </td>
              <td :class="bodyTd" class="max-w-[320px] !whitespace-normal !text-left">
                <span v-if="r.on_compute === 'skip'" class="text-caption">Écarté — {{ r.skip_reason }}</span>
                <span v-else class="text-caption">{{ r.on_compute === 'create' ? 'Créé au calcul' : 'Recalculé' }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>

<script setup>
/**
 * MANDAT-14 (G-M2, C5 ; étape 11) — l'état d'une cohorte avant le jury, et le calcul de ses résultats de semestre.
 * La cohorte est la règle du serveur (`_cohort`, la même que le calcul) ; ce que le calcul fera de chaque ligne
 * (`on_compute`) et pourquoi il écarte (`skip_reason`) sont dits par lui. L'écran ne recompte rien : après l'acte,
 * il relit l'état.
 */
import { computed, onMounted, ref, watch } from 'vue';
import { StateBanner, StatusPill, headTh, bodyTd } from '../../components/index.js';
import BlockState from '../../components/internal/BlockState.vue';
import { useResource } from '../../composables/useResource.js';
import { useSession } from '../../composables/useSession.js';
import { useAcademicContext } from '../../composables/useAcademicContext.js';
import { computeSemesterResults, listSemesterResults } from '../../api/cohort.js';
import { listPrograms, getProgram } from '../../api/structure.js';

const { can } = useSession();
const { params } = useAcademicContext();
const res = useResource(listSemesterResults, { isEmpty: (d) => !d?.rows?.length });
const state = res.state;
const data = computed(() => res.data.value);
const programs = ref([]);
const levels = ref([]);
const program = ref('');
const level = ref('');
const busy = ref(false);
const done = ref('');
const actError = ref('');
const nb = (n, mot) => `${n} ${n >= 2 ? mot + 's' : mot}`;

async function loadLevels() {
  if (!program.value) { levels.value = []; level.value = ''; return; }
  try { levels.value = (await getProgram(program.value))?.levels || []; } catch { levels.value = []; }
  if (!levels.value.some((l) => l.name === level.value)) level.value = levels.value[0]?.name || '';
}
function reload() {
  // Le contexte rend `{academic_year, term}` (`useAcademicContext`) : le semestre est `term`.
  if (level.value) res.load({ academic_level: level.value, academic_term: params.value?.term,
    academic_year: params.value?.academic_year });
}
async function compute() {
  busy.value = true; done.value = ''; actError.value = '';
  try {
    // Le calcul porte sur la cohorte LUE (même niveau, même semestre) ; l'année est celle du contexte.
    const out = await computeSemesterResults({ academic_level: level.value, academic_term: data.value.academic_term,
      academic_year: params.value?.academic_year });
    done.value = `${nb(out.created || 0, 'résultat')} ${out.created >= 2 ? 'créés' : 'créé'}, `
      + `${out.recomputed || 0} ${out.recomputed >= 2 ? 'recalculés' : 'recalculé'} ; `
      + `${nb((out.skipped || []).length, 'étudiant')} ${(out.skipped || []).length >= 2 ? 'écartés' : 'écarté'}.`;
    reload();
  } catch (e) { actError.value = e.message; } finally { busy.value = false; }
}
watch(program, async () => { await loadLevels(); reload(); });
watch(level, reload);
onMounted(async () => {
  try { programs.value = (await listPrograms({}))?.filter?.((p) => p.custom_is_active !== 0) || []; } catch { programs.value = []; }
  program.value = programs.value[0]?.name || '';
});
</script>
