<template>
  <!-- Formulaire d'unité (M2 g2) — champs = contrat serveur `create_ue(values)`
       (UE_WRITE_FIELDS). Le code est saisi (le concepteur demandait : saisi ou
       dérivé ? — ici saisi, c'est une décision d'interface consignée). -->
  <div class="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-6">
    <div class="w-full max-w-lg overflow-hidden rounded-lg-ln border border-ln-gray-300 bg-white shadow-elevated"
         role="dialog" aria-modal="true" aria-label="Ajouter une unité">
      <header class="border-b border-ln-gray-200 p-5">
        <h3 class="text-[17px] font-semibold text-ln-gray-900">Ajouter une unité</h3>
        <p class="mt-1 text-body-sm leading-normal text-ln-gray-500">
          Filière <b class="font-semibold">{{ program }}</b> · semestre <b class="font-semibold">{{ termLabel }}</b>
        </p>
      </header>
      <div class="flex flex-col gap-4 p-5">
        <div class="grid grid-cols-[140px_1fr] gap-4">
          <div>
            <label for="ue-code" class="flex items-center gap-1.5 text-body-sm font-semibold text-ln-gray-900">
              Code <span class="font-bold text-ln-error">obligatoire</span>
            </label>
            <input id="ue-code" v-model="form.ue_code" type="text"
                   class="mt-2 h-11 w-full rounded-sm-ln border border-ln-gray-300 px-3 font-mono text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600"
                   placeholder="UE-1.1" />
          </div>
          <div>
            <label for="ue-name" class="flex items-center gap-1.5 text-body-sm font-semibold text-ln-gray-900">
              Intitulé <span class="font-bold text-ln-error">obligatoire</span>
            </label>
            <input id="ue-name" v-model="form.ue_name" type="text"
                   class="mt-2 h-11 w-full rounded-sm-ln border border-ln-gray-300 px-3 text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600"
                   placeholder="Intitulé de l'unité" />
          </div>
        </div>
        <div class="w-40">
          <label for="ue-ects" class="text-body-sm font-semibold text-ln-gray-900">ECTS</label>
          <input id="ue-ects" v-model.number="form.ects_credits" type="number" min="0" step="1"
                 class="mt-2 h-11 w-full rounded-sm-ln border border-ln-gray-300 px-3 text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600" />
        </div>
        <StateBanner v-if="error" variant="error" lead="Création refusée." :text="error" />
      </div>
      <footer class="flex items-center gap-3 border-t border-ln-gray-200 bg-ln-gray-50 px-5 py-4">
        <p class="mr-auto text-caption text-ln-gray-500">L'unité naît en Brouillon.</p>
        <button type="button" class="ln-btn-secondary" @click="emit('cancel')">Annuler</button>
        <button type="button" class="ln-btn-primary" :disabled="!complete || busy" @click="submit">Ajouter l'unité</button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue';
import { StateBanner } from '../../components/index.js';

/** Ne fabrique aucune clé de contexte : émet ue_code/ue_name/ects ; la vue
 * ajoute program + academic_term. */
defineProps({
  program: { type: String, default: '' },
  termLabel: { type: String, default: '' },
  error: { type: String, default: '' },
  busy: { type: Boolean, default: false },
});
const emit = defineEmits(['cancel', 'submit']);
const form = reactive({ ue_code: '', ue_name: '', ects_credits: null });
const complete = computed(() => !!form.ue_code.trim() && !!form.ue_name.trim());
function submit() {
  const values = { ue_code: form.ue_code.trim(), ue_name: form.ue_name.trim() };
  if (typeof form.ects_credits === 'number') values.ects_credits = form.ects_credits;
  emit('submit', values);
}
</script>
