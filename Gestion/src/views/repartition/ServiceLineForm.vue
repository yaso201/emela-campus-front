<template>
  <!-- Formulaire de ligne de service — création ET édition (le serveur ne
       connaît qu'un `upsert_service_line`). Rendu en modal : le tableau
       dessous ne doit pas paraître actionnable pendant la saisie. -->
  <div class="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-6">
    <div class="w-full max-w-xl overflow-hidden rounded-lg-ln border border-ln-gray-300 bg-white shadow-elevated"
         role="dialog" aria-modal="true" :aria-label="title">
      <header class="border-b border-ln-gray-200 p-5">
        <h3 class="text-[17px] font-semibold text-ln-gray-900">{{ title }}</h3>
        <p class="mt-1 text-body-sm leading-normal text-ln-gray-500">
          Une heure vaut une heure. L'enseignant peut être posé plus tard —
          il est exigé à la <b class="font-semibold">proposition</b>, pas ici.
        </p>
      </header>

      <div class="flex flex-col gap-4 p-5">
        <div>
          <label :for="'sl-course'" class="flex items-center gap-1.5 text-body-sm font-semibold text-ln-gray-900">
            Module <span class="font-bold text-ln-error">obligatoire</span>
          </label>
          <select id="sl-course" v-model="form.course"
                  class="mt-2 h-11 w-full rounded-sm-ln border border-ln-gray-300 bg-white px-3 text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600">
            <option value="" disabled>Choisir un module de la maquette…</option>
            <option v-for="c in courses" :key="c" :value="c">{{ c }}</option>
          </select>
          <p v-if="!courses.length" class="mt-1.5 text-caption text-ln-gray-500">
            Aucun module lu pour cette filière — la maquette doit d'abord porter des unités.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="sl-activity" class="flex items-center gap-1.5 text-body-sm font-semibold text-ln-gray-900">
              Type d'activité <span class="font-bold text-ln-error">obligatoire</span>
            </label>
            <select id="sl-activity" v-model="form.activity_type"
                    class="mt-2 h-11 w-full rounded-sm-ln border border-ln-gray-300 bg-white px-3 text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600">
              <option value="" disabled>—</option>
              <option v-for="a in ACTIVITIES" :key="a.value" :value="a.value">{{ a.label }}</option>
            </select>
          </div>
          <div>
            <label for="sl-hours" class="flex items-center gap-1.5 text-body-sm font-semibold text-ln-gray-900">
              Heures <span class="font-bold text-ln-error">obligatoire</span>
            </label>
            <input id="sl-hours" v-model.number="form.hours" type="number" min="0" step="0.5"
                   class="mt-2 h-11 w-full rounded-sm-ln border border-ln-gray-300 px-3 text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600" />
          </div>
        </div>

        <div>
          <label for="sl-teacher" class="text-body-sm font-semibold text-ln-gray-900">Enseignant</label>
          <select id="sl-teacher" v-model="form.instructor"
                  class="mt-2 h-11 w-full rounded-sm-ln border border-ln-gray-300 bg-white px-3 text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600">
            <option value="">À attribuer plus tard</option>
            <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
          <p class="mt-1.5 text-caption text-ln-gray-500">
            La liste ne porte que les enseignants déjà engagés sur la filière.
          </p>
        </div>

        <div>
          <label for="sl-group" class="text-body-sm font-semibold text-ln-gray-900">Groupe</label>
          <select id="sl-group" v-model="form.student_group"
                  class="mt-2 h-11 w-full rounded-sm-ln border border-ln-gray-300 bg-white px-3 text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600">
            <option value="">Promotion entière</option>
            <option v-for="g in groups" :key="g" :value="g">{{ g }}</option>
          </select>
        </div>
      </div>

      <footer class="flex items-center gap-3 border-t border-ln-gray-200 bg-ln-gray-50 px-5 py-4">
        <p class="mr-auto text-caption text-ln-gray-500">Enregistrée en <b class="font-semibold">Brouillon</b> — modifiable jusqu'à la proposition.</p>
        <button type="button" class="ln-btn-secondary" @click="emit('cancel')">Annuler</button>
        <button type="button" class="ln-btn-primary" :disabled="!complete" @click="submit">
          {{ line ? 'Enregistrer' : 'Ajouter la ligne' }}
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup>
/**
 * Formulaire de ligne de service (M2 g3) — LE FORMULAIRE que le concepteur
 * n'avait pas produit ; ses champs sont EXACTEMENT le contrat serveur
 * (`upsert_service_line` allowed : course, activity_type, hours, instructor,
 * student_group). Aucun identifiant inventé : module, enseignant et groupe se
 * choisissent dans des listes lues (les modules du plan, les enseignants
 * engagés, les groupes de la filière).
 */
import { computed, reactive } from 'vue';

const props = defineProps({
  // édition : la ligne existante (id + valeurs) ; création : null.
  line: { type: Object, default: null },
  // Les listes de choix, LUES du plan (aucun identifiant inventé) :
  //   { courses: [libellés de module], teachers: [{id, name}], groups: [libellés] }
  options: { type: Object, default: () => ({ courses: [], teachers: [], groups: [] }) },
});
const courses = computed(() => props.options.courses || []);
const teachers = computed(() => props.options.teachers || []);
const groups = computed(() => props.options.groups || []);
const emit = defineEmits(['submit', 'cancel']);

const ACTIVITIES = [
  { value: 'CM', label: 'CM — Cours magistral' },
  { value: 'TD', label: 'TD — Travaux dirigés' },
  { value: 'TP', label: 'TP — Travaux pratiques' },
  { value: 'PJ', label: 'PJ — Projet' },
];

const form = reactive({
  course: props.line?.course || '',
  activity_type: props.line ? (props.line.activity || '').toUpperCase() : '',
  hours: props.line?.hours ?? null,
  instructor: props.line?.teacher_id || props.line?.instructor || '',
  student_group: props.line?.group || '',
});

const title = computed(() => (props.line ? 'Modifier la ligne de service' : 'Ajouter une ligne de service'));
const complete = computed(() =>
  !!form.course && !!form.activity_type && typeof form.hours === 'number' && form.hours > 0);

function submit() {
  if (!complete.value) return;
  const values = {
    course: form.course,
    activity_type: form.activity_type,
    hours: form.hours,
  };
  if (form.instructor) values.instructor = form.instructor;
  if (form.student_group) values.student_group = form.student_group;
  emit('submit', values);
}
</script>
