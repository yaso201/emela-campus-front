<template>
  <section class="overflow-hidden rounded-md-ln border border-ln-gray-300">
    <header class="border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
      <h3 class="text-[14px] font-semibold text-ln-gray-900">Information préalable et rétractation</h3>
      <p class="mt-1 text-caption leading-relaxed text-ln-gray-500">
        Avant d'enregistrer une démission, l'établissement doit avoir
        <b class="font-semibold text-ln-gray-900">informé</b> l'étudiant des conséquences — et le canal
        est tracé. C'est une obligation, pas une formalité.
      </p>
    </header>

    <div class="px-4 py-4">
      <p class="mb-2 text-micro font-bold uppercase tracking-wider text-ln-gray-500">
        Information préalable
      </p>
      <p v-if="info" class="mb-4 text-body-sm text-ln-gray-900">
        {{ info.channel }}
        <span class="block text-caption text-ln-gray-500">Enregistrée le {{ info.recorded_on }}</span>
      </p>
      <p v-else class="mb-4 rounded-sm-ln bg-ln-warning-bg p-3 text-caption leading-snug text-[#6B4415]">
        <b class="font-semibold">Non enregistrée.</b> Le canal doit être tracé avant l'enregistrement
        de la démission — c'est ce qui distingue une démission éclairée d'une démission subie.
      </p>

      <!-- ⚠️ LA RÉTRACTATION APPARTIENT À L'ÉTUDIANT. L'écran de gestion la montre
           comme un fait possible ; il ne l'offre pas comme un bouton d'agent. Un
           bouton ici laisserait croire qu'un agent peut se rétracter à sa place. -->
      <div class="border-t border-ln-gray-100 pt-3">
        <p class="mb-2 text-micro font-bold uppercase tracking-wider text-ln-gray-500">
          Fenêtre de rétractation
        </p>
        <!-- ⚠️ Contrat D-05, lu au composant : `deadline.remaining` vient du
             serveur. `totalDays` sert à la barre d'écoulement — sans lui, elle
             partirait de zéro et laisserait croire que la fenêtre vient d'ouvrir. -->
        <RetractionWindow v-if="deadline"
                          :deadline="deadline"
                          :total-days="dossier.retraction_total_days"
                          title="L’étudiant peut encore se rétracter"
                          body="La rétractation appartient à l’étudiant : elle ne se prononce pas depuis
                            cet écran. Enregistrer la démission avant ce terme lui retirerait un droit."
                          aside="Cet écran la montre comme un fait possible ; il ne l’offre pas comme un
                            bouton d’agent."
                          footnote="Le décompte vient du serveur — une échéance de droit ne se calcule
                            pas au front." />
        <p v-else class="text-caption leading-relaxed text-ln-gray-500">
          La fenêtre de rétractation est close. La démission peut être enregistrée.
        </p>
      </div>
    </div>

    <footer class="flex flex-wrap items-center gap-3 border-t border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
      <span class="text-caption text-ln-gray-500">
        <template v-if="r && r.open">
          L'enregistrement attend le terme de la rétractation.
        </template>
        <template v-else>Refuser une démission est un acte motivé.</template>
      </span>
      <span class="ml-auto flex gap-2">
        <button type="button" class="ln-btn-secondary" @click="emit('act', 'Le refus de la démission')">
          Refuser…
        </button>
        <button type="button" class="ln-btn-primary" :disabled="!info || (r && r.open)"
                @click="emit('act', 'L’enregistrement de la démission')">
          Enregistrer
        </button>
      </span>
    </footer>
  </section>
</template>

<script setup>
/**
 * La démission — information préalable et rétractation.
 *
 * `record_resignation_information(name, info_channel)` puis
 * `register_resignation(name)`. Et `retract_resignation(name)`, qui appartient à
 * l'étudiant.
 *
 * ⚠️ L'enregistrement est INERTE tant que l'information n'est pas tracée ou que la
 * fenêtre de rétractation court. Ce n'est pas une garde d'interface inventée : c'est
 * l'ordre des actes au serveur, rendu visible avant le clic plutôt qu'au refus.
 */
import { computed } from 'vue';
import { RetractionWindow } from '../../components/index.js';

const props = defineProps({ dossier: { type: Object, required: true } });
const emit = defineEmits(['act']);

const info = computed(() => props.dossier.information || null);
const r = computed(() => props.dossier.retraction || null);
const deadline = computed(() => props.dossier.retraction_deadline || null);
</script>
