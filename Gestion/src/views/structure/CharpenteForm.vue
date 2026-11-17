<template>
  <!-- Formulaire de charpente (MANDAT-10, E3') — un seul patron pour les créations des étapes 1 et 2 : année,
       semestre, férié, filière, niveau, parcours. Les champs sont DÉCLARÉS par l'écran parent, au contrat serveur ;
       le formulaire n'ajoute aucune clé de contexte (la vue-parente les ajoute, comme pour `GroupForm`). -->
  <div class="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-6">
    <div class="w-full max-w-lg overflow-hidden rounded-lg-ln border border-ln-gray-300 bg-white shadow-elevated"
         role="dialog" aria-modal="true" :aria-label="title">
      <header class="border-b border-ln-gray-200 p-5">
        <h3 class="text-[17px] font-semibold text-ln-gray-900">{{ title }}</h3>
        <p v-if="subtitle" class="mt-1 text-body-sm leading-normal text-ln-gray-500">{{ subtitle }}</p>
      </header>
      <div class="flex flex-col gap-4 p-5">
        <div v-for="f in fields" :key="f.key">
          <template v-if="f.type === 'check'">
            <label class="flex items-center gap-2 text-body-sm font-semibold text-ln-gray-900">
              <input :id="idOf(f)" v-model="form[f.key]" type="checkbox" class="h-4 w-4" />
              {{ f.label }}
            </label>
            <p v-if="f.hint" class="mt-1 text-caption text-ln-gray-500">{{ f.hint }}</p>
          </template>
          <template v-else>
            <label :for="idOf(f)" class="flex items-center gap-1.5 text-body-sm font-semibold text-ln-gray-900">
              {{ f.label }} <span v-if="f.required" class="font-bold text-ln-error">obligatoire</span>
            </label>
            <select v-if="f.type === 'select'" :id="idOf(f)" v-model="form[f.key]"
                    class="mt-2 h-11 w-full rounded-sm-ln border border-ln-gray-300 bg-white px-3 text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600">
              <option value="" disabled>—</option>
              <option v-for="o in f.options" :key="o.value ?? o" :value="o.value ?? o">{{ o.label ?? o }}</option>
            </select>
            <select v-else-if="f.type === 'multiselect'" :id="idOf(f)" v-model="form[f.key]" multiple :size="Math.min(6, Math.max(3, (f.options || []).length))"
                    class="mt-2 w-full rounded-sm-ln border border-ln-gray-300 bg-white px-3 py-2 text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600">
              <option v-for="o in f.options" :key="o.value ?? o" :value="o.value ?? o">{{ o.label ?? o }}</option>
            </select>
            <input v-else :id="idOf(f)" v-model="form[f.key]" :type="f.type || 'text'" :min="f.min"
                   :placeholder="f.placeholder || ''"
                   class="mt-2 h-11 w-full rounded-sm-ln border border-ln-gray-300 px-3 text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600" />
            <p v-if="hintOf(f)" class="mt-1 text-caption" :class="hintTone(f)">{{ hintOf(f) }}</p>
          </template>
        </div>
        <StateBanner v-if="error" variant="error" :lead="refusalLead" :text="error" />
      </div>
      <footer class="flex items-center gap-3 border-t border-ln-gray-200 bg-ln-gray-50 px-5 py-4">
        <p class="mr-auto text-caption text-ln-gray-500">{{ footnote }}</p>
        <button type="button" class="ln-btn-secondary" @click="emit('cancel')">Annuler</button>
        <button type="button" class="ln-btn-primary" :disabled="!complete || busy" @click="submit">{{ confirmLabel }}</button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue';
import { StateBanner } from '../../components/index.js';

/**
 * `fields` : [{ key, label, type ('text'|'date'|'number'|'select'|'check'), required, options, placeholder, hint,
 * live(form) → { text, tone } | null, initial }]. `live` donne un retour CALCULÉ à la saisie (ex. la parité lue
 * dans le nom d'un semestre) — une aide, jamais une garde : le refus qui fait foi reste au serveur.
 */
const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  fields: { type: Array, required: true }, // [{ key, label, type, required, options, placeholder, hint, live, initial, min }]
  confirmLabel: { type: String, default: 'Créer' },
  footnote: { type: String, default: '' },
  refusalLead: { type: String, default: 'Création refusée.' },
  error: { type: String, default: '' },
  busy: { type: Boolean, default: false },
  name: { type: String, default: 'charpente' },
});
const emit = defineEmits(['cancel', 'submit']);

const form = reactive(Object.fromEntries(props.fields.map((f) =>
  [f.key, f.initial ?? (f.type === 'check' ? false : f.type === 'multiselect' ? [] : '')])));
const filled = (f) => (f.type === 'multiselect' ? (form[f.key] || []).length > 0 : String(form[f.key] ?? '').trim() !== '');
const complete = computed(() => props.fields.every((f) => !f.required || filled(f))
  && props.fields.every((f) => !f.live || f.live(form)?.tone !== 'error'));

const idOf = (f) => `${props.name}-${f.key}`;
function hintOf(f) { return (f.live && f.live(form)?.text) || f.hint || ''; }
function hintTone(f) {
  const t = f.live && f.live(form)?.tone;
  return t === 'error' ? 'font-semibold text-ln-error' : t === 'ok' ? 'text-ln-success' : 'text-ln-gray-500';
}

function submit() {
  const values = {};
  for (const f of props.fields) {
    const v = form[f.key];
    if (f.type === 'check') values[f.key] = v ? 1 : 0;
    else if (f.type === 'multiselect') { if ((v || []).length) values[f.key] = [...v]; }
    else if (f.type === 'number') { if (v !== '' && v != null) values[f.key] = Number(v); }
    else if (String(v ?? '').trim() !== '') values[f.key] = String(v).trim();
  }
  emit('submit', values);
}
</script>
