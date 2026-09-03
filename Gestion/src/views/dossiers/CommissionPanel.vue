<template>
  <section class="overflow-hidden rounded-md-ln border border-ln-gray-300">
    <header class="border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
      <h3 class="text-[14px] font-semibold text-ln-gray-900">Commission de réorientation</h3>
      <p class="mt-1 text-caption leading-relaxed text-ln-gray-500">
        La <b class="font-semibold text-ln-gray-900">seule procédure</b> du lot dont l'instruction est
        collégiale. L'écran nomme donc les membres — il ne peut pas afficher « instruit par X ».
      </p>
    </header>

    <div class="px-4 py-4">
      <p class="mb-2 text-micro font-bold uppercase tracking-wider text-ln-gray-500">Membres</p>
      <ul class="mb-4 flex flex-col gap-1.5">
        <li v-for="m in members" :key="m.member_user" class="flex items-baseline gap-3 text-body-sm">
          <span class="w-[92px] flex-shrink-0 text-caption text-ln-gray-500">{{ m.member_role }}</span>
          <span class="text-ln-gray-900">{{ m.member_user }}</span>
        </li>
      </ul>

      <p class="mb-2 border-t border-ln-gray-100 pt-3 text-micro font-bold uppercase tracking-wider text-ln-gray-500">
        Crédits reconnus · {{ totalCredits }}
      </p>
      <!-- ⚠️ CHAQUE RECONNAISSANCE PORTE SON FONDEMENT. `basis` n'est pas un
           commentaire : une reconnaissance de crédits sans fondement ne se
           distingue pas d'une faveur. -->
      <article v-for="c in credits" :key="c.source_label"
               class="mb-2 rounded-sm-ln border border-ln-gray-200 p-3 last:mb-0">
        <p class="flex items-baseline gap-2">
          <b class="text-body-sm font-semibold text-ln-gray-900">{{ c.source_label }}</b>
          <span class="tabular ml-auto text-body-sm font-semibold text-ln-blue-700">
            {{ c.credits_recognized }} crédits
          </span>
        </p>
        <p class="mt-1 text-caption leading-relaxed text-ln-gray-600">
          <b class="font-semibold text-ln-gray-700">Fondement :</b> {{ c.basis }}
        </p>
      </article>
      <p v-if="!credits.length" class="text-caption text-ln-gray-500">
        Aucune reconnaissance de crédits n'a encore été posée. Ce n'est pas un manque : la commission
        peut conclure qu'aucun crédit n'est transférable.
      </p>
    </div>

    <footer class="flex items-center gap-3 border-t border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
      <span class="text-caption text-ln-gray-500">
        La décision de réorientation appartient au directeur des études, non à la commission.
      </span>
      <button type="button" class="ml-auto ln-btn-secondary"
              @click="emit('act', 'L’ajout d’une reconnaissance de crédits')">
        Reconnaître des crédits…
      </button>
    </footer>
  </section>
</template>

<script setup>
/**
 * La commission de réorientation.
 *
 * `start_reorientation_commission(name)` · `add_commission_member(name, member_role,
 * member_user)` · `add_credit_recognition(name, source_label, credits_recognized,
 * basis)`.
 *
 * ⚠️ La commission INSTRUIT ; elle ne décide pas. `decide_reorientation` est un acte
 * distinct, du directeur des études — le patron du lot 3 tient même quand
 * l'instruction est collégiale.
 */
import { computed } from 'vue';

const props = defineProps({ dossier: { type: Object, required: true } });
const emit = defineEmits(['act']);

const members = computed(() => props.dossier.commission || []);
const credits = computed(() => props.dossier.credits || []);
/** Sommé, jamais déclaré. */
const totalCredits = computed(() =>
  credits.value.reduce((a, c) => a + (c.credits_recognized || 0), 0));
</script>
