<template>
  <!-- Le TRONC du patron des dossiers (M3 g7) : instruire → décider. Piloté par les
       champs RÉELS de get_dossier : `act` (le geste nommé par le serveur), `status`
       (Soumise → En revue), `waiting_for_roles` (qui peut agir). Instruire et décider
       sont DEUX actes, et celui qui instruit ne décide pas (patron du lot 3).

       ⚠️ Le tronc uniforme (instruct_X / decide_X) ne s'applique proprement qu'au
       CONGÉ et au RETOUR DE CONGÉ. Les quatre autres procédures portent des verbes
       propres (commission, contradictoire, rétractation, appel) que get_dossier ne
       peut pas encore piloter (CONTRAT PARTIEL ASSUMÉ — dossiers_read.py : ni `extra`
       ni détail par procédure) : l'écran le DIT plutôt que de feindre un bouton. -->
  <section class="overflow-hidden rounded-md-ln border border-ln-gray-300">
    <header class="border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
      <h3 class="text-[14px] font-semibold text-ln-gray-900">L'acte attendu</h3>
      <p class="mt-0.5 text-caption text-ln-gray-500">{{ dossier.act || 'Aucun acte en attente.' }}</p>
    </header>

    <div class="px-4 py-4">
      <StateBanner v-if="error" variant="error" lead="L'acte a échoué." :text="error" class="mb-3" />

      <!-- Cas non tronc : procédure à verbe propre — dit, jamais feint. -->
      <p v-if="!routed" class="rounded-sm-ln bg-ln-gray-50 p-3 text-caption leading-relaxed text-ln-gray-600">
        Cette procédure ({{ dossier.kind_label }}) porte un acte propre à sa dérivation.
        Son pilotage depuis l'écran attend un contrat serveur par procédure (le détail transversal
        ne le porte pas encore) — rien n'est feint ici.
      </p>

      <template v-else>
        <!-- INSTRUIRE (statut Soumise) — sans paramètre. -->
        <template v-if="phase === 'instruct'">
          <p class="mb-3 text-body-sm leading-relaxed text-ln-gray-700">
            Instruire fait passer le dossier en revue. C'est un acte distinct de la décision —
            celui qui instruit ne décidera pas.
          </p>
          <button type="button" class="ln-btn-primary" :disabled="!canAct || busy" @click="emit('instruct')">
            {{ dossier.act }}
          </button>
          <p v-if="!canAct" class="mt-2 text-caption text-ln-gray-500">
            En attente de : {{ (dossier.waiting_for_roles || []).join(', ') || '—' }}.
          </p>
        </template>

        <!-- DÉCIDER (statut En revue) — décision + motif obligatoire. -->
        <template v-else-if="phase === 'decide'">
          <p class="mb-2 text-micro font-bold uppercase tracking-wider text-ln-gray-500">Décision</p>
          <div class="mb-3 flex gap-2">
            <label v-for="d in DECISIONS" :key="d"
                   class="flex min-h-[40px] flex-1 cursor-pointer items-center justify-center rounded-sm-ln border px-3 text-body-sm font-semibold"
                   :class="d === decision ? 'border-ln-blue-800 bg-ln-blue-50 text-ln-blue-900' : 'border-ln-gray-300 text-ln-gray-700'">
              <input v-model="decision" type="radio" name="trunk-decision" :value="d" class="sr-only" />
              {{ d }}
            </label>
          </div>
          <label for="trunk-reason" class="flex items-center gap-1.5 text-body-sm font-semibold text-ln-gray-900">
            Motif de la décision <span class="font-bold text-ln-error">obligatoire</span>
          </label>
          <textarea id="trunk-reason" v-model="reason" rows="3"
                    class="mt-2 w-full rounded-sm-ln border border-ln-gray-300 p-3 text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600"
                    placeholder="Ce qui fonde la décision…"></textarea>
          <div class="mt-3">
            <button type="button" class="ln-btn-primary" :disabled="!canDecide || busy"
                    @click="emit('decide', { decision, decision_reason: reason.trim() })">
              {{ dossier.act }}
            </button>
            <p v-if="!canAct" class="mt-2 text-caption text-ln-gray-500">
              En attente de : {{ (dossier.waiting_for_roles || []).join(', ') || '—' }}.
            </p>
          </div>
        </template>

        <p v-else class="rounded-sm-ln bg-ln-gray-50 p-3 text-caption text-ln-gray-600">
          Aucun acte de tronc en attente à ce statut ({{ dossier.status }}).
        </p>
      </template>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { StateBanner } from '../../components/index.js';
import { useSession } from '../../composables/useSession.js';

const props = defineProps({
  dossier: { type: Object, required: true },
  error: { type: String, default: '' },
  busy: { type: Boolean, default: false },
});
const emit = defineEmits(['instruct', 'decide']);

const { roles } = useSession();

/** Vocabulaire serveur (decide_X n'accepte que ces deux valeurs). */
const DECISIONS = ['Approuvée', 'Rejetée'];

// Le tronc uniforme ne route que congé + retour ; les autres domaines sont dits ⏸.
const TRUNK_DOMAINS = new Set(['conge', 'retour']);
const routed = computed(() => TRUNK_DOMAINS.has(props.dossier.kind));

const phase = computed(() => {
  const s = props.dossier.status;
  if (s === 'Soumise') return 'instruct';
  if (s === 'En revue') return 'decide';
  return 'none';
});

// Le geste est réservé aux rôles que le serveur attend (waiting_for_roles).
const canAct = computed(() => {
  const waiting = props.dossier.waiting_for_roles || [];
  const mine = roles.value || [];
  return waiting.some((r) => mine.includes(r));
});

const decision = ref('');
const reason = ref('');
const canDecide = computed(() => canAct.value && !!decision.value && reason.value.trim().length > 0);
</script>
