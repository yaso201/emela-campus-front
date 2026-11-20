<template>
  <!-- MANDAT-12 (M3, validée PC1B) — créer ou modifier un MODULE (Course). La création pose le lien
       du module à son unité, mais NE COMPOSE PAS la maquette : composer est un acte de la
       maquette (responsable de formation, Education Manager), distinct de la charpente. -->
  <div class="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-6">
    <div class="w-full max-w-lg overflow-hidden rounded-lg-ln border border-ln-gray-300 bg-white shadow-elevated"
         role="dialog" aria-modal="true" :aria-label="initial ? 'Modifier le module' : 'Créer un module'">
      <header class="border-b border-ln-gray-200 p-5">
        <h3 class="text-[17px] font-semibold text-ln-gray-900">{{ initial ? 'Modifier le module' : 'Créer un module' }}</h3>
        <p class="mt-1 text-body-sm leading-normal text-ln-gray-500">Unité <b class="font-semibold">{{ ueLabel }}</b></p>
      </header>
      <div class="flex flex-col gap-4 p-5">
        <div>
          <label for="mod-name" class="flex items-center gap-1.5 text-body-sm font-semibold text-ln-gray-900">
            Intitulé <span class="font-bold text-ln-error">obligatoire</span>
          </label>
          <input id="mod-name" v-model="form.course_name" type="text" :class="field" placeholder="Ex. Génie logiciel avancé" />
        </div>
        <!-- MANDAT-14 (D-FRONT-LARGEURS-ETROITES-01) : une colonne en étroit, deux en large. -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label for="mod-coef" class="text-body-sm font-semibold text-ln-gray-900">Coefficient</label>
            <input id="mod-coef" v-model.number="form.custom_coefficient" type="number" min="1" :class="field" />
          </div>
          <div>
            <label for="mod-nature" class="text-body-sm font-semibold text-ln-gray-900">Nature</label>
            <select id="mod-nature" v-model="form.custom_module_nature" :class="field">
              <option v-for="n in NATURES" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
        </div>
        <p class="text-caption leading-snug text-ln-gray-500">
          Le code du module est attribué par le serveur à partir du sigle de la filière ; il ne se saisit pas.
        </p>
        <StateBanner v-if="error" variant="error" lead="Enregistrement refusé." :text="error" />
      </div>
      <footer class="flex items-center gap-3 border-t border-ln-gray-200 bg-ln-gray-50 px-5 py-4">
        <p class="mr-auto text-caption text-ln-gray-500">{{ initial ? 'Un code déjà utilisé par des notes reste verrouillé.' : 'Le module naît rattaché, non composé.' }}</p>
        <button type="button" class="ln-btn-secondary" @click="emit('cancel')">Annuler</button>
        <button type="button" class="ln-btn-primary" :disabled="!form.course_name.trim() || busy" @click="emit('submit', { ...form })">
          {{ initial ? 'Enregistrer' : 'Créer le module' }}
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import { StateBanner } from '../../components/index.js';

const props = defineProps({
  ueLabel: { type: String, default: '' },
  initial: { type: Object, default: null },
  error: { type: String, default: '' },
  busy: { type: Boolean, default: false },
});
const emit = defineEmits(['cancel', 'submit']);
// Les natures du champ `Course.custom_module_nature` (fixture emela_core : « Standard », « Stage »).
const NATURES = ['Standard', 'Stage'];
const field = 'mt-2 h-11 w-full rounded-sm-ln border border-ln-gray-300 bg-white px-3 text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600';
const form = reactive({
  course_name: props.initial?.label || '',
  custom_coefficient: props.initial?.coefficient || 2,
  custom_module_nature: props.initial?.nature || 'Standard',
});
</script>
