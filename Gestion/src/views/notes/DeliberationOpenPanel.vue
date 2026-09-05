<template>
  <!-- Ouvrir une délibération (M3 g6, arbitrage 2) : create → add_jury_member →
       start, depuis l'écran. Sièges = Select serveur (deliberation_jury_member).
       Les membres se saisissent par leur identifiant User : AUCUNE lecture des
       utilisateurs de gestion n'existe (demande S-17) — le serveur valide
       l'existence, un inconnu est refusé avec sa phrase. -->
  <div class="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-6">
    <div class="w-full max-w-2xl overflow-hidden rounded-lg-ln border border-ln-gray-300 bg-white shadow-elevated"
         role="dialog" aria-modal="true" aria-label="Ouvrir une délibération">
      <header class="border-b border-ln-gray-200 p-5">
        <h3 class="text-[17px] font-semibold text-ln-gray-900">Ouvrir une délibération</h3>
        <p class="mt-1 text-body-sm leading-normal text-ln-gray-500">
          Année <b class="font-semibold">{{ yearLabel }}</b> · semestre <b class="font-semibold">{{ termLabel }}</b>.
          Le jury enregistré est une condition de clôture — il se compose ici.
        </p>
      </header>
      <div class="flex flex-col gap-4 p-5">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="dop-program" class="flex items-center gap-1.5 text-body-sm font-semibold text-ln-gray-900">
              Filière <span class="font-bold text-ln-error">obligatoire</span>
            </label>
            <select id="dop-program" v-model="form.program" @change="emit('program', form.program)"
                    class="mt-2 h-11 w-full rounded-sm-ln border border-ln-gray-300 bg-white px-3 text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600">
              <option value="" disabled>—</option>
              <option v-for="p in options.programs" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
          <div>
            <label for="dop-level" class="flex items-center gap-1.5 text-body-sm font-semibold text-ln-gray-900">
              Niveau <span class="font-bold text-ln-error">obligatoire</span>
            </label>
            <select id="dop-level" v-model="form.academic_level"
                    class="mt-2 h-11 w-full rounded-sm-ln border border-ln-gray-300 bg-white px-3 text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600">
              <option value="" disabled>{{ options.levels.length ? '—' : 'Choisir la filière d’abord' }}</option>
              <option v-for="l in options.levels" :key="l.id" :value="l.id">{{ l.label }}</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="dop-date" class="flex items-center gap-1.5 text-body-sm font-semibold text-ln-gray-900">
              Date de délibération <span class="font-bold text-ln-error">obligatoire</span>
            </label>
            <input id="dop-date" v-model="form.deliberation_date" type="date"
                   class="mt-2 h-11 w-full rounded-sm-ln border border-ln-gray-300 px-3 text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600" />
          </div>
          <div>
            <label for="dop-president" class="flex items-center gap-1.5 text-body-sm font-semibold text-ln-gray-900">
              Président (User) <span class="font-bold text-ln-error">obligatoire</span>
            </label>
            <input id="dop-president" v-model="form.president" type="text" placeholder="prenom.nom@lanem.bj"
                   class="mt-2 h-11 w-full rounded-sm-ln border border-ln-gray-300 px-3 text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600" />
          </div>
        </div>

        <div>
          <p class="flex items-center gap-1.5 text-body-sm font-semibold text-ln-gray-900">
            Membres du jury <span class="font-bold text-ln-error">obligatoire</span>
          </p>
          <div v-for="(m, i) in form.members" :key="i" class="mt-2 grid grid-cols-[220px_1fr_60px] gap-3">
            <select v-model="m.member_role"
                    class="h-11 rounded-sm-ln border border-ln-gray-300 bg-white px-3 text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600">
              <option value="" disabled>Siège…</option>
              <option v-for="s in SEATS" :key="s" :value="s">{{ s }}</option>
            </select>
            <input v-model="m.user" type="text" placeholder="Identifiant User du membre"
                   class="h-11 rounded-sm-ln border border-ln-gray-300 px-3 text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600" />
            <button type="button" class="ln-btn-secondary h-11" :disabled="form.members.length <= 1"
                    @click="form.members.splice(i, 1)">–</button>
          </div>
          <button type="button" class="ln-btn-secondary mt-2" @click="form.members.push({ member_role: '', user: '' })">
            + Ajouter un membre
          </button>
          <p class="mt-1.5 text-caption text-ln-gray-500">
            Sièges = vocabulaire serveur. Le serveur valide chaque identifiant — un inconnu est refusé, motivé.
          </p>
        </div>
        <StateBanner v-if="error" variant="error" lead="L'ouverture a échoué." :text="error" />
      </div>
      <footer class="flex items-center gap-3 border-t border-ln-gray-200 bg-ln-gray-50 px-5 py-4">
        <p class="mr-auto text-caption text-ln-gray-500">Crée le jury puis démarre la délibération.</p>
        <button type="button" class="ln-btn-secondary" @click="emit('cancel')">Annuler</button>
        <button type="button" class="ln-btn-primary" :disabled="!complete || busy" @click="submit">
          Ouvrir et démarrer
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue';
import { StateBanner } from '../../components/index.js';

/** Sièges du jury de délibération — Select serveur (deliberation_jury_member.json). */
const SEATS = ['Président', 'Directeur des Études', 'Responsable de formation', 'Secrétariat pédagogique'];

const props = defineProps({
  // { programs: [noms], levels: [{id,label}] } — lus (structureOptions + arbre de la filière choisie).
  options: { type: Object, default: () => ({ programs: [], levels: [] }) },
  yearLabel: { type: String, default: '' },
  termLabel: { type: String, default: '' },
  error: { type: String, default: '' },
  busy: { type: Boolean, default: false },
});
const emit = defineEmits(['cancel', 'submit', 'program']);

const form = reactive({
  program: '', academic_level: '', deliberation_date: '', president: '',
  members: [{ member_role: '', user: '' }],
});
const complete = computed(() =>
  !!form.program && !!form.academic_level && !!form.deliberation_date
  && form.president.trim().length > 0
  && form.members.every((m) => m.member_role && m.user.trim()));

function submit() {
  emit('submit', {
    program: form.program,
    academic_level: form.academic_level,
    deliberation_date: form.deliberation_date,
    president: form.president.trim(),
    members: form.members.map((m) => ({ member_role: m.member_role, user: m.user.trim() })),
  });
}
</script>
