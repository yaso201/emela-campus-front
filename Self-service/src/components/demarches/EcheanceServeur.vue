<script setup>
// EcheanceServeur — un délai tel que le serveur le rend (deadlines.build_deadline) : libellé, terme, jours restants
// et leur unité, état, et ce qui se passe au terme (`at_term`). L'écran ne calcule aucun délai.
import { computed } from 'vue';
import { Clock3 } from 'lucide-vue-next';
import { formatDate, plural } from '@/composables/useDemarche';

const props = defineProps({ deadline: { type: Object, required: true } });

const tone = computed(() => {
  const s = props.deadline.state;
  if (s === 'échue') return 'border-ln-error/30 bg-ln-error-bg text-ln-error';
  if (s === 'en cours' && props.deadline.days_remaining !== null && props.deadline.days_remaining <= 3) {
    return 'border-ln-warning/40 bg-ln-warning-bg text-ln-warning';
  }
  if (s === 'suspendue par appel') return 'border-ln-blue-200 bg-ln-blue-50 text-ln-blue-800';
  return 'border-ln-gray-200 bg-ln-gray-50 text-ln-gray-900';
});

// P16 : les pluriels s'accordent (« 1 jour ouvrable », « 6 jours ouvrables »).
const remaining = computed(() => {
  const d = props.deadline;
  if (d.days_remaining === null || d.days_remaining === undefined) return null;
  return d.unit === 'jours ouvrables'
    ? plural(d.days_remaining, 'jour ouvrable', 'jours ouvrables')
    : plural(d.days_remaining, 'jour');
});
</script>

<template>
  <div class="rounded-md border p-3 text-sm" :class="tone">
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
      <Clock3 class="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <span class="font-semibold">{{ deadline.label }}</span>
      <span>· jusqu’au {{ formatDate(deadline.due_on) }}</span>
      <span v-if="remaining" class="font-semibold">· reste {{ remaining }}</span>
      <span class="ml-auto inline-flex items-center rounded-full border border-current/20 px-2 py-0.5 text-xs">
        {{ deadline.state }}
      </span>
    </div>
    <p v-if="deadline.at_term" class="mt-2 text-xs leading-relaxed opacity-90">{{ deadline.at_term }}</p>
  </div>
</template>
