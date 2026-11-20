<template>
  <div class="flex flex-col gap-2">
    <label :for="id" class="text-caption font-semibold text-ln-gray-700">{{ label }}</label>
    <input :id="id" v-model="query" type="search" autocomplete="off" :placeholder="placeholder"
           class="h-9 rounded-sm-ln border border-ln-gray-300 px-3 text-body-sm focus:outline-none focus:ring-2 focus:ring-ln-blue-600/25"
           @input="schedule" />
    <p v-if="hint" class="text-caption text-ln-gray-500">{{ hint }}</p>
    <p v-else-if="error" class="text-caption text-ln-error" role="alert">{{ error }}</p>
    <p v-else-if="loading" class="text-caption text-ln-gray-500">Recherche…</p>

    <div v-if="result && !loading" class="max-h-[320px] overflow-y-auto rounded-sm-ln border border-ln-gray-200">
      <template v-if="kind !== 'staff'">
        <p class="sticky top-0 border-b border-ln-gray-100 bg-ln-gray-50 px-3 py-1.5 text-micro font-semibold uppercase tracking-wide text-ln-gray-500">
          Étudiants · {{ result.students.length }}
        </p>
        <p v-if="!result.students.length" class="px-3 py-2 text-caption text-ln-gray-500">Aucun étudiant ne correspond.</p>
        <button v-for="s in result.students" :key="s.student" type="button"
                class="flex w-full items-start gap-3 border-b border-ln-gray-100 px-3 py-2 text-left last:border-b-0 hover:bg-ln-blue-50"
                :class="selected === s.student ? 'bg-ln-blue-50' : ''" @click="pick({ type: 'student', ...s })">
          <span class="min-w-0 flex-1">
            <b class="block text-body-sm font-semibold text-ln-gray-900">{{ s.student_name }}</b>
            <!-- Q18 : la filière et le niveau par leur libellé ; le matricule reste (P24). -->
            <span class="text-caption text-ln-gray-600">
              <span class="font-mono">{{ s.student }}</span> · {{ s.program_label || s.program }} · {{ s.academic_level_label || s.academic_level }}
            </span>
          </span>
          <!-- P16 : le statut par son libellé (« Actif »), jamais par son code (« ACT »). -->
          <StatusPill :status="s.academic_status === 'ACT' ? 'valide' : 'propose'" :label="s.academic_status_label || s.academic_status" />
        </button>
      </template>
      <template v-if="kind !== 'student'">
        <p class="sticky top-0 border-b border-ln-gray-100 bg-ln-gray-50 px-3 py-1.5 text-micro font-semibold uppercase tracking-wide text-ln-gray-500">
          Personnel · {{ result.staff.length }}
        </p>
        <p v-if="!result.staff.length" class="px-3 py-2 text-caption text-ln-gray-500">Aucun membre du personnel ne correspond.</p>
        <button v-for="p in result.staff" :key="p.user" type="button"
                class="flex w-full items-start gap-3 border-b border-ln-gray-100 px-3 py-2 text-left last:border-b-0 hover:bg-ln-blue-50"
                :class="selected === p.user ? 'bg-ln-blue-50' : ''" @click="pick({ type: 'staff', ...p })">
          <span class="min-w-0 flex-1">
            <b class="block text-body-sm font-semibold text-ln-gray-900">{{ p.full_name }}</b>
            <!-- Q18 : le courriel départage deux homonymes — la seule exception au « nom, jamais le compte ». -->
            <span class="text-caption text-ln-gray-600">{{ p.user }} · {{ (p.role_labels || p.roles).join(', ') }}</span>
          </span>
        </button>
      </template>
      <p v-if="result.may_be_truncated.students || result.may_be_truncated.staff"
         class="border-t border-ln-gray-200 bg-ln-gray-50 px-3 py-2 text-caption text-ln-gray-600">
        Le serveur rend vingt personnes au plus : précisez la recherche.
      </p>
    </div>
  </div>
</template>

<script setup>
/**
 * MANDAT-14 (C7) — chercher une personne, par le SERVEUR (`search_people`). Aucune liste locale : la portée
 * (la filière d'un RF), le plafond et le refus sous trois caractères sont ceux du serveur. Sert la recherche du
 * bandeau, l'étudiant d'un dossier ouvert (M9) et les sièges d'une commission ou d'un conseil.
 */
import { ref } from 'vue';
import StatusPill from './StatusPill.vue';
import { searchPeople } from '../api/people.js';

const props = defineProps({
  kind: { type: String, default: 'all' },
  label: { type: String, default: 'Chercher une personne' },
  placeholder: { type: String, default: 'Nom, matricule ou courriel — trois caractères au moins' },
  id: { type: String, default: 'people-search' },
  selected: { type: String, default: '' },
  initial: { type: String, default: '' },
});
const emit = defineEmits(['pick']);

const query = ref(props.initial);
const result = ref(null);
const loading = ref(false);
const error = ref('');
const hint = ref(props.initial ? '' : 'Trois caractères au moins.');
let timer = null;
let seq = 0;

function schedule() {
  clearTimeout(timer);
  timer = setTimeout(run, 250);
}
async function run() {
  const text = query.value.trim();
  error.value = '';
  if (text.length < 3) { result.value = null; hint.value = 'Trois caractères au moins.'; return; }
  hint.value = '';
  loading.value = true;
  const mine = ++seq;
  try {
    const out = await searchPeople({ query: text, kind: props.kind });
    if (mine === seq) result.value = out;
  } catch (err) {
    if (mine === seq) { result.value = null; error.value = err.message; }
  } finally {
    if (mine === seq) loading.value = false;
  }
}
function pick(person) { emit('pick', person); }
if (props.initial) run();
</script>
