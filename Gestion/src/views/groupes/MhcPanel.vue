<template>
  <div class="flex flex-col gap-4">
    <StateBanner v-if="data && !data.can_decide" variant="info" lead="Lecture seule.">
      La décision sur une inscription à un MHC appartient à l’Education Manager. Vous lisez l’état et l’historique de
      chaque décision ; aucun bouton d’acte ne vous est proposé.
    </StateBanner>
    <StateBanner v-if="done" variant="success" lead="Décision enregistrée." :text="done" />
    <StateBanner v-if="actError" variant="warning" lead="Acte refusé." :text="actError" />

    <div class="flex flex-wrap items-center gap-2">
      <button v-for="s in STATUTS" :key="s.k" type="button"
              class="inline-flex h-[30px] items-center gap-1.5 rounded-sm-ln border px-3 text-caption font-medium"
              :class="s.k === statut ? 'border-ln-blue-900 bg-ln-blue-900 font-semibold text-white' : 'border-ln-gray-300 text-ln-gray-700'"
              @click="statut = s.k">{{ s.l }} <span class="tabular opacity-70">{{ count(s.k) }}</span></button>
      <span v-if="cohorte" class="ml-auto text-caption text-ln-gray-500">Semestre du contexte · {{ cohorte }}</span>
    </div>

    <BlockState v-if="state !== 'ready'" :state="state === 'denied' ? 'loading' : state" title="Aucune inscription à un MHC"
                message="Aucun étudiant n’est inscrit à un MHC pour ce semestre." :rows="5" :row-height="52" @retry="reload" />
    <!-- P19 (PC1B) : le tableau tient dans sa largeur — colonnes fixes, textes qui passent à la ligne ; le formulaire
         de décision s'ouvre sur une ligne pleine largeur sous l'inscription, il ne déborde plus du bord droit. -->
    <div v-else class="overflow-x-auto rounded-md-ln border border-ln-gray-200">
      <table class="w-full min-w-[720px] table-fixed border-collapse text-body-sm">
        <colgroup>
          <col class="w-[20%]" /><col class="w-[30%]" /><col class="w-[12%]" /><col class="w-[13%]" /><col class="w-[25%]" />
        </colgroup>
        <thead>
          <tr>
            <th :class="headTh" class="!text-left">Étudiant</th>
            <th :class="headTh" class="!text-left">MHC</th>
            <th :class="headTh" class="!text-left">Validation</th>
            <th :class="headTh" class="!text-left">État</th>
            <th :class="headTh" class="!text-left">Décision</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="r in rows" :key="r.name">
            <tr class="align-top">
              <td :class="bodyTd" class="!text-left break-words">
                <b class="font-semibold text-ln-gray-900">{{ r.student_name }}</b>
                <span class="block font-mono text-[11.5px] text-ln-gray-500">{{ r.student }}</span>
              </td>
              <td :class="bodyTd" class="!text-left break-words">
                <span class="font-mono text-[11.5px] text-ln-gray-500">{{ r.mhc_code }}</span> {{ r.mhc_name }}
                <span class="block text-caption" :class="r.blocks_semester ? 'text-ln-warning' : 'text-ln-gray-500'">
                  {{ r.mhc_type }}{{ r.blocks_semester ? ' — conditionne la validation du semestre (Art. 22.3)' : '' }}
                </span>
              </td>
              <td :class="bodyTd" class="!text-left break-words">{{ r.validation_method }}</td>
              <td :class="bodyTd" class="!text-left">
                <StatusPill :status="r.status === 'Validé' ? 'valide' : r.status === 'Non validé' ? 'renvoyee' : 'propose'" :label="r.status" />
              </td>
              <td :class="bodyTd" class="!text-left break-words whitespace-normal">
                <!-- Q18 : le décideur par son nom, jamais par son compte. -->
                <p v-if="r.validated_by" class="text-caption text-ln-gray-700">
                  {{ r.validated_by_name || r.validated_by }}, le {{ fr(r.validation_date) }}<span v-if="r.validation_comment"> — « {{ r.validation_comment }} »</span>
                </p>
                <p v-else class="text-caption text-ln-gray-500">Aucune décision.</p>
                <!-- Règle 3 : le bouton n'existe que pour qui porte l'acte (`decide:mhc` et `can_decide` du serveur).
                     Une décision se révise : l'acte reste offert sur toute ligne. -->
                <button v-if="canDecide && deciding !== r.name" type="button" class="mt-1 text-caption font-semibold text-ln-blue-800"
                        @click="deciding = r.name; decision = ''; comment = ''">
                  {{ r.validated_by ? 'Réviser la décision…' : 'Statuer…' }}
                </button>
              </td>
            </tr>
            <tr v-if="canDecide && deciding === r.name" class="bg-ln-gray-50">
              <td colspan="5" :class="bodyTd" class="!text-left">
                <div class="flex flex-col gap-2">
                  <p class="text-caption font-semibold text-ln-gray-900">{{ r.student_name }} — {{ r.mhc_code }} {{ r.mhc_name }}</p>
                  <div class="flex flex-wrap gap-4">
                    <label v-for="d in data.decisions" :key="d" class="inline-flex items-center gap-1.5 text-caption">
                      <input v-model="decision" type="radio" :name="'mhc-' + r.name" :value="d" class="accent-ln-blue-900" /> {{ d }}
                    </label>
                  </div>
                  <textarea v-model="comment" rows="2" placeholder="Commentaire (facultatif ; lu dans le dossier)"
                            class="w-full rounded-sm-ln border border-ln-gray-300 p-2 text-caption" />
                  <div class="flex justify-end gap-2">
                    <button type="button" class="ln-btn-secondary" @click="deciding = null">Annuler</button>
                    <button type="button" class="ln-btn-primary" :disabled="!decision || busy" @click="submit(r)">Enregistrer</button>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
      <p v-if="data.may_be_truncated" class="border-t border-ln-gray-200 bg-ln-gray-50 px-4 py-2 text-caption text-ln-gray-600">
        Le serveur rend 200 inscriptions au plus : filtrez par état.
      </p>
    </div>
  </div>
</template>

<script setup>
/**
 * MANDAT-14 (G-M1, C4 ; étape 5) — statuer sur les inscriptions aux MHC. La liste et le vocabulaire des décisions
 * viennent du serveur ; l'Education Manager décide (clé `decide:mhc`), le GA et le DE lisent sans bouton (Q5, P12).
 */
import { computed, onMounted, ref } from 'vue';
import { StateBanner, StatusPill, headTh, bodyTd } from '../../components/index.js';
import BlockState from '../../components/internal/BlockState.vue';
import { useResource } from '../../composables/useResource.js';
import { useSession } from '../../composables/useSession.js';
import { useAcademicContext } from '../../composables/useAcademicContext.js';
import { listMhcEnrollments, validateMhcEnrollment } from '../../api/mhc.js';

const { can } = useSession();
const { params } = useAcademicContext();
const res = useResource(listMhcEnrollments, { isEmpty: (d) => !d?.items?.length });
const state = res.state;
const data = computed(() => res.data.value);
const STATUTS = [{ k: 'tous', l: 'Toutes' }, { k: 'Inscrit', l: 'À statuer' }, { k: 'Validé', l: 'Validées' },
  { k: 'Non validé', l: 'Non validées' }];
const statut = ref(new URLSearchParams(location.search).get('mhc') || 'tous');
const rows = computed(() => (data.value?.items || []).filter((r) => statut.value === 'tous' || r.status === statut.value));
const count = (k) => (data.value?.items || []).filter((r) => k === 'tous' || r.status === k).length;
const canDecide = computed(() => can('decide:mhc') && Boolean(data.value?.can_decide));
// Le niveau des inscriptions, par son libellé (Q18), quand la liste n'en porte qu'un.
const cohorte = computed(() => {
  const niveaux = [...new Set((data.value?.items || []).map((r) => r.academic_level_label || r.academic_level).filter(Boolean))];
  return niveaux.length === 1 ? niveaux[0] : '';
});
const deciding = ref(null);
const decision = ref('');
const comment = ref('');
const busy = ref(false);
const done = ref('');
const actError = ref('');
// P16 : « 8 septembre », « 1er octobre ».
const fr = (iso) => (iso ? new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  .replace(/^1 /, '1er ') : '');

async function submit(r) {
  busy.value = true; actError.value = ''; done.value = '';
  try {
    await validateMhcEnrollment({ student: r.student, mhc_module: r.mhc_module, decision: decision.value, comment: comment.value });
    done.value = `${r.student_name} — ${r.mhc_code} : ${decision.value}.`;
    deciding.value = null;
    reload();
  } catch (e) { actError.value = e.message; } finally { busy.value = false; }
}
// Le contexte rend `{academic_year, term}` (`useAcademicContext`) : le semestre est `term`.
function reload() { res.load({ academic_term: params.value?.term }); }
onMounted(reload);
</script>
