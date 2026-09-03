<template>
  <span class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm-ln px-2 py-0.5 text-caption font-semibold" :class="tone.wrap" role="status">
    <span class="h-1.5 w-1.5 flex-shrink-0 rounded-full" :class="tone.dot" aria-hidden="true"></span>
    {{ displayLabel }}
    <span v-if="code" class="font-mono text-[10px] tracking-wide opacity-70">{{ code }}</span>
  </span>
</template>

<script setup>
/**
 * 15 · Pastille d'état — l'état d'un objet métier.
 * Réf : lot 4 §1. Jamais la couleur seule : la pastille porte toujours un
 * libellé, et un point coloré qui n'est qu'un renfort.
 * Props : status · label · code
 */
import { computed } from 'vue';

const props = defineProps({
  status: { type: String, required: true },
  label: { type: String, default: null },
  code: { type: String, default: null },
});

const MAP = {
  brouillon:  { tone: 'neutral', label: 'Brouillon' },
  propose:    { tone: 'info',    label: 'Proposé' },
  valide:     { tone: 'success', label: 'Validé' },
  recue:      { tone: 'info',    label: 'Reçue' },
  incomplete: { tone: 'warning', label: 'Incomplète' },
  integree:   { tone: 'success', label: 'Intégrée' },
  renvoyee:   { tone: 'error',   label: 'Renvoyée' },
  publiee:    { tone: 'info',    label: 'Publiée' },
  modifiee:   { tone: 'warning', label: 'Modifiée' },
  annulee:    { tone: 'error',   label: 'Annulée' },
  a_instruire:{ tone: 'neutral', label: 'À instruire' },
  a_decider:  { tone: 'info',    label: 'À décider' },
  suspendue:  { tone: 'warning', label: 'Suspendue' },
  echue:      { tone: 'neutral', label: 'Échue' },

  /**
   * ⚠️ TROIS CLÉS AJOUTÉES PAR LES GRAPPES 8 À 11, et pas une de plus.
   *
   * La grappe 6 avait introduit `refuse` — hors vocabulaire — par trois formes que
   * l'audit ne voyait pas, et la correction fut de RENOMMER le champ : ce n'était
   * pas un état d'objet métier. Ici, les trois le sont, et aucune clé existante ne
   * les dit sans mentir :
   *
   *   — `a_envisager` : le SECOND seuil d'absence. « À envisager » n'est pas « à
   *     prononcer » (`incomplete`) : l'acte appartient au directeur des études, et
   *     le ton doit être plus grave que celui du premier seuil, qui reste ouvert ;
   *   — `non_eligible` : la diplomation PRÉSENTE une éligibilité, elle ne la décide
   *     pas. Un dossier non éligible n'est ni refusé (`renvoyee`) ni incomplet — le
   *     jury peut attribuer quand même, par indulgence motivée ;
   *   — `anomalie` : une dotation de rôle, ou un point de clôture, qui NE TIENT PAS
   *     DEBOUT. Distinct de `incomplete`, qui dit qu'il manque une pièce : ici la
   *     pièce est là et elle est fausse.
   *
   * Réutiliser une clé au ton juste avec un libellé surchargé aurait laissé dans le
   * code un état qui dit autre chose que ce qu'il rend — c'est exactement le défaut
   * que l'audit garde ailleurs.
   */
  a_envisager:  { tone: 'error',   label: 'À envisager' },
  non_eligible: { tone: 'error',   label: 'Non éligible' },
  anomalie:     { tone: 'error',   label: 'Anomalie' },
};

const TONES = {
  neutral: { wrap: 'bg-ln-gray-100 text-ln-gray-700', dot: 'bg-ln-gray-500' },
  info:    { wrap: 'bg-ln-blue-100 text-ln-blue-700', dot: 'bg-ln-blue-600' },
  success: { wrap: 'bg-ln-success-bg text-ln-success', dot: 'bg-ln-success' },
  warning: { wrap: 'bg-ln-warning-bg text-ln-warning', dot: 'bg-ln-warning' },
  error:   { wrap: 'bg-ln-error-bg text-ln-error', dot: 'bg-ln-error' },
};

const config = computed(() => MAP[props.status] ?? { tone: 'neutral', label: props.status });
const tone = computed(() => TONES[config.value.tone]);
const displayLabel = computed(() => props.label ?? config.value.label);
</script>
