<template>
  <section class="overflow-hidden rounded-md-ln border border-ln-gray-300">
    <header class="border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
      <h3 class="text-[14px] font-semibold text-ln-gray-900">Mise en demeure et réponse</h3>
      <p class="mt-1 text-caption leading-relaxed text-ln-gray-500">
        <b class="font-semibold text-ln-gray-900">Un abandon prononcé sans mise en demeure serait une
        décision sans contradictoire.</b> L'ordre est visible, et il ne se contourne pas.
      </p>
    </header>

    <div class="px-4 py-4">
      <ol class="flex flex-col gap-3">
        <li class="flex items-start gap-3">
          <span class="mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-ln-blue-100 text-[11px] font-bold text-ln-blue-800">1</span>
          <span>
            <b class="text-body-sm font-semibold text-ln-gray-900">Mise en demeure envoyée</b>
            <span class="block text-caption text-ln-gray-600">Le {{ n.issued_on }}</span>
          </span>
        </li>
        <li class="flex items-start gap-3">
          <span class="mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full text-[11px] font-bold"
                :class="n.response ? 'bg-ln-blue-100 text-ln-blue-800' : 'bg-ln-warning-bg text-ln-warning'">2</span>
          <span>
            <b class="text-body-sm font-semibold text-ln-gray-900">Réponse de l'étudiant</b>
            <template v-if="n.response">
              <span class="block text-caption text-ln-gray-600">Reçue le {{ n.response_on }}</span>
              <span class="mt-1.5 block rounded-sm-ln bg-ln-gray-50 p-2.5 text-caption leading-relaxed text-ln-gray-700">
                « {{ n.response }} »
              </span>
            </template>
            <!-- ⚠️ L'ABSENCE DE RÉPONSE N'EST PAS UN MANQUE À COMBLER : c'est un
                 fait, et c'est le fait qui fonde le prononcé. L'écran ne doit pas
                 la présenter comme une donnée qui manque. -->
            <span v-else class="mt-1 block rounded-sm-ln bg-ln-warning-bg p-2.5 text-caption leading-relaxed text-[#6B4415]">
              <b class="font-semibold">Aucune réponse à ce jour.</b> Ce n'est pas une donnée
              manquante : c'est un fait, et c'est lui qui fonde le prononcé. L'absence de réponse se
              constate, elle ne se comble pas.
            </span>
          </span>
        </li>
        <li class="flex items-start gap-3">
          <span class="mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full text-[11px] font-bold"
                :class="decided ? 'bg-ln-blue-100 text-ln-blue-800' : 'bg-ln-gray-100 text-ln-gray-500'">3</span>
          <span>
            <b class="text-body-sm font-semibold text-ln-gray-900">Prononcé ou écarté</b>
            <span class="block text-caption text-ln-gray-600">
              <template v-if="decided">{{ dossier.status }} par {{ dossier.decided_by }}</template>
              <template v-else>Les deux issues sont ouvertes, et chacune exige un motif.</template>
            </span>
          </span>
        </li>
      </ol>
    </div>

    <footer v-if="!decided" class="flex flex-wrap items-center gap-3 border-t border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
      <span class="text-caption text-ln-gray-500">
        Écarter un constat est un acte motivé, pas un abandon de procédure.
      </span>
      <span class="ml-auto flex gap-2">
        <button type="button" class="ln-btn-secondary" @click="emit('act', 'L’écartement du constat')">
          Écarter…
        </button>
        <button type="button" class="ln-btn-primary" @click="emit('act', 'Le prononcé de l’abandon')">
          Prononcer…
        </button>
      </span>
    </footer>
  </section>
</template>

<script setup>
/**
 * Le contradictoire du constat d'abandon.
 *
 * `issue_abandonment_notice(name)` · `record_abandonment_response(name,
 * response_text)` · puis `pronounce_abandonment` ou `dismiss_abandonment`, chacun
 * avec son motif.
 *
 * ⚠️ Deux actes que les autres procédures n'ont pas, et l'ordre est la garantie :
 * mettre en demeure, enregistrer la réponse OU son absence, puis décider.
 *
 * ⚠️ Et « aucune réponse » n'est pas une donnée manquante. C'est le fait qui fonde
 * le prononcé. Un écran qui la présenterait comme un champ à remplir inviterait à
 * attendre indéfiniment.
 */
import { computed } from 'vue';

const props = defineProps({ dossier: { type: Object, required: true } });
const emit = defineEmits(['act']);

const n = computed(() => props.dossier.notice || { issued_on: '—', response: null });
const decided = computed(() => !!props.dossier.decided_by);
</script>
