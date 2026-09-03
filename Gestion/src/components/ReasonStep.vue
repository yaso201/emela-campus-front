<template>
  <!-- `modal` n'est pas cosmétique : un panneau rendu EN LIGNE sous un tableau
       vivant ne doit pas annoncer que ce tableau est inerte. -->
  <div class="overflow-hidden rounded-lg-ln border border-ln-gray-300 bg-white shadow-elevated"
       :role="modal ? 'dialog' : 'group'" :aria-modal="modal ? 'true' : undefined" :aria-label="title">
    <header class="border-b border-ln-gray-200 p-5">
      <h3 class="text-[17px] font-semibold text-ln-gray-900">{{ title }}</h3>
      <p v-if="subtitle" class="mt-1 text-body-sm leading-normal text-ln-gray-500">{{ subtitle }}</p>
    </header>

    <div class="flex flex-col gap-4 p-5">
      <slot name="before" />

      <fieldset>
        <legend class="flex items-center gap-1.5 text-body-sm font-semibold text-ln-gray-900">
          {{ reasonLabel }} <span class="font-bold text-ln-error">obligatoire</span>
        </legend>
        <template v-for="group in reasonGroups" :key="group.key">
          <p v-if="group.label" class="mb-2 mt-4 text-micro font-bold uppercase tracking-wider text-ln-gray-500">{{ group.label }}</p>
          <div class="flex flex-col gap-2">
            <label v-for="opt in group.options" :key="opt.value"
                   class="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-sm-ln border px-4 text-body-sm"
                   :class="opt.value === reason ? 'border-ln-blue-800 bg-ln-blue-50 font-semibold text-ln-blue-900 shadow-[inset_0_0_0_1px_var(--ln-blue-800)]' : 'border-ln-gray-300 text-ln-gray-700'">
              <input v-model="reason" type="radio" :value="opt.value" :name="name" class="h-4 w-4 accent-ln-blue-800" />
              {{ opt.label }}
            </label>
          </div>
        </template>
      </fieldset>

      <div>
        <label :for="name + '-detail'" class="flex items-center gap-1.5 text-body-sm font-semibold text-ln-gray-900">
          {{ detailLabel }} <span v-if="detailRequired" class="font-bold text-ln-error">obligatoire</span>
        </label>
        <textarea :id="name + '-detail'" v-model="detail" rows="4"
                  class="mt-2 w-full rounded-sm-ln border border-ln-gray-300 p-3 text-body-sm leading-normal text-ln-gray-900 outline-none focus:border-ln-blue-600"
                  :placeholder="detailPlaceholder" />
        <p v-if="detailHint" class="mt-1.5 text-caption text-ln-gray-500">{{ detailHint }}</p>
      </div>

      <slot name="after" />
    </div>

    <footer class="flex items-center gap-3 border-t border-ln-gray-200 bg-ln-gray-50 px-5 py-4">
      <p class="mr-auto text-caption text-ln-gray-500">{{ footnote }}</p>
      <!-- L'échappatoire DIT ce qu'elle fait. Un « Annuler » qui débloque un
           acte contredit la note affichée deux lignes au-dessus. -->
      <button type="button" class="ln-btn-secondary" @click="emit('cancel')">{{ cancelLabel }}</button>
      <button type="button" :class="confirmKind === 'danger' ? 'ln-btn-danger' : 'ln-btn-primary'"
              :disabled="!complete" @click="submit">
        {{ confirmLabel }}
      </button>
    </footer>
  </div>
</template>

<script setup>
/**
 * 9 · Étape de motif — un acte qui exige un motif s'ouvre en vue dédiée.
 * Réf : lot 2 (renvoi d'une soumission), lot 3 (prononcé, infirmation).
 * Règle 2 : le motif conditionne l'acte. Ce n'est pas un champ en bas de
 * formulaire — c'est une étape, et le bouton reste INERTE tant qu'elle n'est
 * pas complète. On ne rejette pas en passant.
 *
 * Variantes : un seul groupe de motifs, ou plusieurs groupes intitulés —
 * c'est ainsi que « compléter » et « reprendre » cohabitent dans l'acte UNIQUE
 * de renvoi (arbitrage A-02 : le serveur ne connaît qu'un renvoi).
 *
 * Props : title · subtitle · name · reasonGroups[] · detail* · confirm* ·
 *         cancelLabel · modal (false pour un panneau rendu en ligne)
 * Événement : submit({ reason, detail }) · cancel
 */
import { computed, ref } from 'vue';

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  name: { type: String, default: 'reason' },
  reasonLabel: { type: String, default: 'Motif' },
  reasonGroups: { type: Array, required: true },   // [{ key, label, options: [{value,label}] }]
  detailLabel: { type: String, default: 'Précision' },
  detailPlaceholder: { type: String, default: '' },
  detailHint: { type: String, default: '' },
  detailRequired: { type: Boolean, default: true },
  confirmLabel: { type: String, default: 'Confirmer' },
  confirmKind: { type: String, default: 'primary' },
  footnote: { type: String, default: '' },
  cancelLabel: { type: String, default: 'Annuler' },
  modal: { type: Boolean, default: true },
});
const emit = defineEmits(['submit', 'cancel']);

const reason = ref(null);
const detail = ref('');

const complete = computed(() => !!reason.value && (!props.detailRequired || detail.value.trim().length > 0));

function submit() {
  if (!complete.value) return;
  emit('submit', { reason: reason.value, detail: detail.value.trim() });
}
</script>
