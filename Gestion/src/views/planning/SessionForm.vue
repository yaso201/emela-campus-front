<template>
  <!-- MANDAT-12 (M2, validée PC1B) — créer, modifier une séance, ou en remplacer l'enseignant.
       Tout ce qui se choisit vient de S-9 (`list_schedule_options`) : salles, modules du groupe,
       enseignants, types — et, en création, les groupes de la filière (`list_groups`, K-a). La
       disponibilité est CALCULÉE PAR LE SERVEUR sur le créneau saisi, la séance éditée exclue (C2) :
       l'écran la montre, il ne la calcule pas, et elle reste un confort — la garde est la
       vérification du serveur à l'enregistrement. -->
  <div class="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-6">
    <div class="w-full max-w-2xl overflow-hidden rounded-lg-ln border border-ln-gray-300 bg-white shadow-elevated"
         role="dialog" aria-modal="true" :aria-label="TITLE[mode]">
      <header class="border-b border-ln-gray-200 p-5">
        <h3 class="text-[17px] font-semibold text-ln-gray-900">{{ TITLE[mode] }}</h3>
        <p class="mt-1 text-body-sm leading-normal text-ln-gray-500">
          <template v-if="initial">Groupe <b class="font-semibold">{{ form.student_group }}</b> · {{ initial.course }} — {{ initial.course_name }}</template>
          <template v-else>Filière <b class="font-semibold">{{ programLabel || program }}</b></template>
        </p>
      </header>

      <div class="flex flex-col gap-4 p-5">
        <div v-if="mode === 'create'">
          <label for="ses-group" class="text-body-sm font-semibold text-ln-gray-900">Groupe</label>
          <select id="ses-group" v-model="form.student_group" :class="field" @change="reload">
            <option value="" disabled>—</option>
            <option v-for="g in groups" :key="g.name" :value="g.name">{{ g.student_group_name || g.name }}</option>
          </select>
        </div>
        <StateBanner v-if="optionsError" variant="error" compact lead="Options indisponibles." :text="optionsError" />

        <template v-if="mode !== 'instructor'">
          <!-- MANDAT-14 (D-FRONT-LARGEURS-ETROITES-01) : une colonne en étroit, trois en large. -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label for="ses-date" class="text-body-sm font-semibold text-ln-gray-900">Date</label>
              <input id="ses-date" v-model="form.schedule_date" type="date" :class="field" @change="reload" />
            </div>
            <div>
              <label for="ses-from" class="text-body-sm font-semibold text-ln-gray-900">Début</label>
              <input id="ses-from" v-model="form.from_time" type="time" step="1800" :class="field" @change="reload" />
            </div>
            <div>
              <label for="ses-to" class="text-body-sm font-semibold text-ln-gray-900">Fin</label>
              <input id="ses-to" v-model="form.to_time" type="time" step="1800" :class="field" @change="reload" />
            </div>
          </div>
          <p class="-mt-2 text-caption text-ln-gray-500">Durée en multiples de trente minutes, alignée sur la demi-heure — validation serveur.</p>
          <StateBanner v-if="options?.group_busy" variant="warning" lead="Le groupe a déjà une séance sur ce créneau."
                       text="Le serveur refusera le chevauchement à l'enregistrement." />

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label for="ses-course" class="text-body-sm font-semibold text-ln-gray-900">Module</label>
              <select id="ses-course" v-model="form.course" :class="field" :disabled="mode === 'edit'">
                <option value="" disabled>—</option>
                <option v-for="c in options?.courses || []" :key="c.course" :value="c.course">{{ c.module_code }} — {{ c.course_name }}</option>
              </select>
            </div>
            <div>
              <label for="ses-type" class="text-body-sm font-semibold text-ln-gray-900">Type de séance</label>
              <select id="ses-type" v-model="form.custom_session_type" :class="field">
                <option value="" disabled>—</option>
                <option v-for="t in options?.session_types || []" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
          </div>

          <div>
            <label for="ses-room" class="text-body-sm font-semibold text-ln-gray-900">Salle</label>
            <select id="ses-room" v-model="form.room" :class="field">
              <option value="" disabled>—</option>
              <option v-for="r in options?.rooms || []" :key="r.name" :value="r.name">
                {{ r.room_name }} · {{ r.seating_capacity }} places{{ r.busy ? ' — occupée sur ce créneau' : '' }}
              </option>
            </select>
          </div>
        </template>

        <div>
          <label for="ses-instr" class="text-body-sm font-semibold text-ln-gray-900">Enseignant</label>
          <select id="ses-instr" v-model="form.instructor" :class="field">
            <option value="">{{ suggested ? 'Celui de la répartition — ' + suggested : '—' }}</option>
            <option v-for="i in options?.instructors || []" :key="i.instructor" :value="i.instructor">
              {{ i.instructor_name }} · {{ i.instructor_type }}{{ i.busy ? ' — déjà en séance sur ce créneau' : '' }}
            </option>
          </select>
          <p class="mt-1.5 text-caption leading-snug text-ln-gray-500">
            <template v-if="suggested">
              La ligne de service validée propose <b class="font-semibold text-ln-gray-700">{{ suggested }}</b> pour ce
              module et ce type. En choisir un autre n'est jamais refusé : l'écart est enregistré.
            </template>
            <template v-else-if="form.course && form.custom_session_type">
              <b class="font-semibold text-ln-gray-700">Aucune ligne de service</b> ne propose d'enseignant pour ce module
              et ce type : choisissez-en un. Une séance sans enseignant est refusée par le serveur.
            </template>
          </p>
        </div>

        <StateBanner v-if="error" variant="error" lead="Enregistrement refusé." :text="error" />
      </div>

      <footer class="flex items-center gap-3 border-t border-ln-gray-200 bg-ln-gray-50 px-5 py-4">
        <p class="mr-auto text-caption text-ln-gray-500">{{ FOOT[mode] }}</p>
        <button type="button" class="ln-btn-secondary" @click="emit('cancel')">Annuler</button>
        <button type="button" class="ln-btn-primary" :disabled="!complete || busy" @click="submit">{{ CONFIRM[mode] }}</button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { StateBanner } from '../../components/index.js';
import { listScheduleOptions } from '../../api/planning.js';
import { listGroups } from '../../api/groups.js';

const props = defineProps({
  mode: { type: String, default: 'create' },       // create | edit | instructor
  program: { type: String, default: '' },
  programLabel: { type: String, default: '' },
  context: { type: Object, default: () => ({}) },  // { academic_year, term } — le contexte, jamais deviné
  initial: { type: Object, default: null },
  slot: { type: Object, default: null },           // { schedule_date, from_time, to_time }
  error: { type: String, default: '' },
  busy: { type: Boolean, default: false },
});
const emit = defineEmits(['cancel', 'submit']);

const TITLE = { create: 'Nouvelle séance', edit: 'Modifier la séance', instructor: 'Remplacer l’enseignant' };
const CONFIRM = { create: 'Créer la séance', edit: 'Enregistrer', instructor: 'Remplacer' };
const FOOT = {
  create: 'La séance naît en brouillon : elle se publie avec la semaine.',
  edit: 'Une séance publiée qui change repasse « Modifiée », avec trace.',
  instructor: 'Une séance publiée repasse « Modifiée » ; la provenance se recalcule.',
};
const field = 'mt-2 h-11 w-full rounded-sm-ln border border-ln-gray-300 bg-white px-3 text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600';

const form = reactive({
  student_group: props.initial?.student_group || '',
  schedule_date: props.initial?.schedule_date || props.slot?.schedule_date || '',
  from_time: props.initial?.from_time || props.slot?.from_time || '',
  to_time: props.initial?.to_time || props.slot?.to_time || '',
  course: props.initial?.course || '',
  custom_session_type: props.initial?.custom_session_type || '',
  room: props.initial?.room || '',
  instructor: props.mode === 'create' ? '' : (props.initial?.instructor || ''),
});
const options = ref(null);
const groups = ref([]);

const suggested = computed(() => {
  const c = (options.value?.courses || []).find((x) => x.course === form.course);
  return (c && c.suggested && c.suggested[form.custom_session_type]) || '';
});
const complete = computed(() => {
  if (props.mode === 'instructor') return !!form.instructor && form.instructor !== props.initial?.instructor;
  return !!(form.student_group && form.schedule_date && form.from_time && form.to_time && form.course
    && form.custom_session_type && form.room && (form.instructor || suggested.value));
});

// Revue adversariale MANDAT-12 (M7, O-5) : la réponse d'un chargement dépassé (autre groupe, autre créneau) ne
// gagne pas — garde de séquence, comme `useResource` ; un refus se dit au lieu de laisser les anciennes options.
let seq = 0;
const optionsError = ref('');
async function reload() {
  const mine = ++seq;
  optionsError.value = '';
  if (!form.student_group) { options.value = null; return; }
  const slot = form.schedule_date && form.from_time && form.to_time
    ? { schedule_date: form.schedule_date, from_time: form.from_time, to_time: form.to_time } : {};
  try {
    const out = await listScheduleOptions({ student_group: form.student_group, ...slot,
      exclude: props.initial?.name || null });
    if (mine === seq) options.value = out;
  } catch (e) {
    if (mine === seq) { options.value = null; optionsError.value = e.message || 'Les options de la séance ne se lisent pas.'; }
  }
}
function submit() {
  if (props.mode === 'instructor') { emit('submit', { instructor: form.instructor }); return; }
  const values = { ...form };
  if (!values.instructor) delete values.instructor;      // la répartition propose (create_schedule)
  emit('submit', values);
}
onMounted(async () => {
  if (props.mode === 'create' && props.program) {
    // Audit de conception MANDAT-12 (moyen 3) : un échec de la lecture des groupes (K-a) est DIT, dans le même
    // bandeau que celui des options — la liste ne reste pas muette sur « — ».
    try { groups.value = (await listGroups({ ...props.context, program: props.program })) || []; }
    catch (e) { groups.value = []; optionsError.value = e.message || 'Les groupes de la filière ne se lisent pas.'; }
  }
  reload();
});
</script>
