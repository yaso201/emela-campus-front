<template>
  <!-- Formulaire de création de groupe (M2 g4) — champs = contrat serveur
       `create_group(values)` (GROUP_WRITE_FIELDS). Programme et année viennent
       du contexte ; le découpage est un Select fermé. -->
  <div class="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-6">
    <div class="w-full max-w-lg overflow-hidden rounded-lg-ln border border-ln-gray-300 bg-white shadow-elevated"
         role="dialog" aria-modal="true" aria-label="Créer un groupe">
      <header class="border-b border-ln-gray-200 p-5">
        <h3 class="text-[17px] font-semibold text-ln-gray-900">Créer un groupe</h3>
        <p class="mt-1 text-body-sm leading-normal text-ln-gray-500">
          Filière <b class="font-semibold">{{ program }}</b> · année <b class="font-semibold">{{ yearLabel }}</b>
        </p>
      </header>
      <div class="flex flex-col gap-4 p-5">
        <div>
          <label for="grp-name" class="flex items-center gap-1.5 text-body-sm font-semibold text-ln-gray-900">
            Nom du groupe <span class="font-bold text-ln-error">obligatoire</span>
          </label>
          <input id="grp-name" v-model="form.student_group_name" type="text"
                 class="mt-2 h-11 w-full rounded-sm-ln border border-ln-gray-300 px-3 text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600"
                 placeholder="Ex. Promotion L1 — groupe A" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="grp-basis" class="flex items-center gap-1.5 text-body-sm font-semibold text-ln-gray-900">
              Découpage <span class="font-bold text-ln-error">obligatoire</span>
            </label>
            <select id="grp-basis" v-model="form.group_based_on"
                    class="mt-2 h-11 w-full rounded-sm-ln border border-ln-gray-300 bg-white px-3 text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600">
              <option value="" disabled>—</option>
              <option v-for="b in BASES" :key="b.value" :value="b.value">{{ b.label }}</option>
            </select>
          </div>
          <div>
            <label for="grp-max" class="text-body-sm font-semibold text-ln-gray-900">Capacité</label>
            <input id="grp-max" v-model.number="form.max_strength" type="number" min="0"
                   class="mt-2 h-11 w-full rounded-sm-ln border border-ln-gray-300 px-3 text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600" />
          </div>
        </div>
        <StateBanner v-if="error" variant="error" lead="Création refusée." :text="error" />
      </div>
      <footer class="flex items-center gap-3 border-t border-ln-gray-200 bg-ln-gray-50 px-5 py-4">
        <p class="mr-auto text-caption text-ln-gray-500">Un effectif au-delà de la capacité est signalé, jamais refusé.</p>
        <button type="button" class="ln-btn-secondary" @click="emit('cancel')">Annuler</button>
        <button type="button" class="ln-btn-primary" :disabled="!complete || busy" @click="submit">Créer le groupe</button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue';
import { StateBanner } from '../../components/index.js';

/**
 * Ce formulaire ne fabrique PAS les clés de contexte : il n'émet que les champs
 * qu'il possède (nom, découpage, capacité). C'est la vue-parente, seule
 * détentrice du contexte, qui ajoute `program` et `academic_year` avant l'appel.
 */
defineProps({
  program: { type: String, default: '' },
  yearLabel: { type: String, default: '' },
  error: { type: String, default: '' },
  busy: { type: Boolean, default: false },
});
const emit = defineEmits(['cancel', 'submit']);

const BASES = [
  { value: 'Batch', label: 'Par promotion' },
  { value: 'Course', label: 'Par module' },
  { value: 'Activity', label: 'Par activité' },
];
const form = reactive({ student_group_name: '', group_based_on: '', max_strength: null });
const complete = computed(() => !!form.student_group_name.trim() && !!form.group_based_on);

function submit() {
  const values = {
    student_group_name: form.student_group_name.trim(),
    group_based_on: form.group_based_on,
  };
  if (typeof form.max_strength === 'number') values.max_strength = form.max_strength;
  emit('submit', values);
}
</script>
