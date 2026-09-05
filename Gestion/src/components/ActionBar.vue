<template>
  <!-- Aucun acte disponible : la barre DISPARAÎT, elle ne se grise pas.
       Règle 3 — celui qui instruit ne doit pas voir le bouton de décision ;
       un bouton grisé est déjà une fuite d'information. -->
  <div v-if="visibleActions.length" class="flex flex-wrap items-center gap-3 rounded-b-md-ln border border-t-0 border-ln-gray-200 bg-ln-gray-50 p-4">
    <p v-if="attribution" class="mr-auto basis-full text-caption text-ln-gray-500 sm:basis-auto">
      <span v-html="attribution"></span>
    </p>
    <!-- AN-10 : l'explication (hint) du geste vient des DONNÉES de l'écran —
         v-tip la rend au survol et au focus ; le libellé reste le texte visible. -->
    <button v-for="a in visibleActions" :key="a.key" type="button" v-tip="a.hint || ''"
            :class="['min-h-[36px]', btnClass(a)]"
            :disabled="a.disabled"
            @click="emit('act', a.key)">
      {{ a.label }}
    </button>
    <p v-if="hint" class="basis-full text-caption text-ln-gray-500">{{ hint }}</p>
  </div>
</template>

<script setup>
/**
 * 8 · Barre d'acte — les actions possibles sur l'objet ouvert.
 * Réf : lot 2 (contrôle des notes), lot 3 (prononcé, appel).
 * Props : actions[] = { key, label, kind: 'primary'|'secondary'|'danger', visible, disabled, hint }
 *         attribution (HTML court : « Contrôlé par … ») · hint
 * Événement : act(key)
 *
 * La visibilité se décide EN AMONT par can() — le composant n'interroge aucun
 * rôle. Une action absente n'est pas une action désactivée.
 */
import { computed } from 'vue';

const props = defineProps({
  actions: { type: Array, default: () => [] },
  attribution: { type: String, default: '' },
  hint: { type: String, default: '' },
});
const emit = defineEmits(['act']);

const visibleActions = computed(() => props.actions.filter((a) => a.visible !== false));

function btnClass(a) {
  if (a.kind === 'primary') return 'ln-btn-primary';
  if (a.kind === 'danger') return 'ln-btn-danger';
  return 'ln-btn-secondary';
}
</script>
