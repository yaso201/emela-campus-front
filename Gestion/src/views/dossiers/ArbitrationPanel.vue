<template>
  <section class="overflow-hidden rounded-md-ln border border-ln-gray-300">
    <header class="border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
      <h3 class="text-[14px] font-semibold text-ln-gray-900">Arbitrage</h3>
      <p class="mt-1 text-caption leading-relaxed text-ln-gray-500">
        Le congé est la <b class="font-semibold text-ln-gray-900">seule procédure</b> du lot dont une
        décision peut être reprise par la direction. Une décision de congé n'est donc pas définitive
        tant qu'un arbitrage est ouvert.
      </p>
    </header>

    <div v-if="a" class="px-4 py-4">
      <!-- ⚠️ DEUX NIVEAUX, montrés comme deux niveaux. Les fondre laisserait
           croire que la décision du directeur des études est finale. -->
      <ol class="mb-4 flex flex-col gap-3">
        <li class="flex items-start gap-3">
          <span class="mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-ln-blue-100 text-[11px] font-bold text-ln-blue-800">1</span>
          <span>
            <b class="text-body-sm font-semibold text-ln-gray-900">Décision</b>
            <span class="block text-caption text-ln-gray-600">
              {{ dossier.status }} par {{ dossier.decided_by }} · {{ dossier.decider_role }}
            </span>
          </span>
        </li>
        <li class="flex items-start gap-3">
          <span class="mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full text-[11px] font-bold"
                :class="a.decided_by ? 'bg-ln-blue-100 text-ln-blue-800' : 'bg-ln-warning-bg text-ln-warning'">2</span>
          <span>
            <b class="text-body-sm font-semibold text-ln-gray-900">Arbitrage</b>
            <StatusPill class="ml-1.5" :status="a.decided_by ? 'valide' : 'suspendue'" :label="a.status" />
            <span class="block text-caption text-ln-gray-600">
              Demandé le {{ a.requested_on }} par {{ a.requested_by }} · réservé à la direction
            </span>
          </span>
        </li>
      </ol>

      <p v-if="!a.decided_by" class="rounded-sm-ln bg-ln-warning-bg p-3 text-caption leading-snug text-[#6B4415]">
        <b class="font-semibold">La décision est prise, et elle n'est pas définitive.</b>
        Tant que l'arbitrage n'est pas rendu, l'écran de l'étudiant doit dire que sa demande est
        <b class="font-semibold">en arbitrage</b>, non qu'elle est accordée — sinon il organise son
        année sur une décision reprenable.
      </p>
      <p v-else class="rounded-sm-ln bg-ln-success-bg p-3 text-caption leading-snug text-[#0B5341]">
        <b class="font-semibold">Arbitré par {{ a.decided_by }}.</b> « {{ a.reason }} »
      </p>
    </div>

    <p v-else class="px-4 py-4 text-caption leading-relaxed text-ln-gray-500">
      Aucun arbitrage n'a été demandé sur ce dossier. La décision est définitive — mais elle
      <b class="font-semibold text-ln-gray-700">pouvait</b> l'être repris, et c'est ce que ce panneau
      existe pour rendre lisible.
    </p>

    <footer v-if="a && !a.decided_by"
            class="flex items-center gap-3 border-t border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
      <span class="text-caption text-ln-gray-500">L'arbitrage exige un motif, comme la décision.</span>
      <button type="button" class="ml-auto ln-btn-primary" @click="emit('act', 'L’arbitrage')">
        Arbitrer…
      </button>
    </footer>
  </section>
</template>

<script setup>
/**
 * L'arbitrage du congé — la dérivation propre à cette procédure.
 *
 * `arbitrate_coa_request(name, decision, arbitration_reason)`, rôle Director. Aucune
 * autre procédure du lot n'en porte.
 *
 * ⚠️ Deux niveaux, montrés comme deux. Les fondre en un seul état laisserait croire
 * qu'une décision de congé est finale — et un étudiant qui organise son année sur une
 * décision reprenable est le défaut que ce panneau existe pour éviter.
 */
import { computed } from 'vue';
import { StatusPill } from '../../components/index.js';

const props = defineProps({ dossier: { type: Object, required: true } });
const emit = defineEmits(['act']);
const a = computed(() => props.dossier.arbitration);
</script>
