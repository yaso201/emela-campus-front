<template>
  <!-- Panneau de dotation (M2 g11) — construit STRICTEMENT selon le relevé §3.7 :
       la simulation d'abord, les phrases « ce rôle ouvre… » et « ce cumul annule
       le cloisonnement » sont RÉDIGÉES AU SERVEUR et reprises telles quelles ;
       l'accusé est une DONNÉE (elle voyage jusqu'au serveur), pas un clic. -->
  <div class="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/30 p-6">
    <div class="w-full max-w-2xl overflow-hidden rounded-lg-ln border border-ln-gray-300 bg-white shadow-elevated"
         role="dialog" aria-modal="true" aria-label="Doter une personne">
      <header class="border-b border-ln-gray-200 p-5">
        <h3 class="text-[17px] font-semibold text-ln-gray-900">Doter une personne</h3>
        <p class="mt-1 text-body-sm leading-normal text-ln-gray-500">
          Choisissez la personne et le changement : la simulation dit ce qu'il ouvre
          et ce qu'il retire, avant tout enregistrement.
        </p>
      </header>

      <div class="flex flex-col gap-4 p-5">
        <div>
          <label for="gp-target" class="flex items-center gap-1.5 text-body-sm font-semibold text-ln-gray-900">
            Personne <span class="font-bold text-ln-error">obligatoire</span>
          </label>
          <select id="gp-target" v-model="target"
                  class="mt-2 h-11 w-full rounded-sm-ln border border-ln-gray-300 bg-white px-3 text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600">
            <option value="" disabled>Choisir une personne dotée…</option>
            <option v-for="t in targets" :key="t.user" :value="t.user">{{ t.name }} — {{ t.user }}</option>
          </select>
        </div>

        <div>
          <span class="text-body-sm font-semibold text-ln-gray-900">Changement</span>
          <div class="mt-2 flex flex-col gap-2">
            <label v-for="c in CHANGES" :key="c.kind"
                   class="flex min-h-[40px] cursor-pointer items-center gap-3 rounded-sm-ln border px-4 text-body-sm"
                   :class="c.kind === kind ? 'border-ln-blue-800 bg-ln-blue-50 font-semibold text-ln-blue-900' : 'border-ln-gray-300 text-ln-gray-700'">
              <input v-model="kind" type="radio" :value="c.kind" name="gp-kind" class="h-4 w-4 accent-ln-blue-800" />
              {{ c.label }}
            </label>
          </div>
        </div>

        <div v-if="kind">
          <label for="gp-value" class="flex items-center gap-1.5 text-body-sm font-semibold text-ln-gray-900">
            {{ valueLabel }} <span class="font-bold text-ln-error">obligatoire</span>
          </label>
          <select id="gp-value" v-model="value"
                  class="mt-2 h-11 w-full rounded-sm-ln border border-ln-gray-300 bg-white px-3 text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600">
            <option value="" disabled>Choisir…</option>
            <option v-for="o in valueOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>

        <!-- Simulation — TOUT est serveur : opens, scope_report, warnings. -->
        <div v-if="sim" class="rounded-md-ln border border-ln-gray-200 bg-ln-gray-50 p-4">
          <p v-if="sim.would_be_noop" class="text-body-sm text-ln-gray-600">
            Ce changement ne modifie rien — la personne est déjà dans cet état.
          </p>
          <template v-else>
            <p class="text-caption text-ln-gray-500">Avant → après</p>
            <p class="mt-0.5 text-body-sm text-ln-gray-700">
              {{ (sim.before.roles || []).join(' · ') || '—' }}
              <span class="text-ln-gray-400">→</span>
              <b class="font-semibold text-ln-gray-900">{{ (sim.after.roles || []).join(' · ') || '—' }}</b>
            </p>
            <ul v-if="sim.opens && sim.opens.length" class="mt-3 flex flex-col gap-2">
              <li v-for="o in sim.opens" :key="o.role" class="text-caption leading-relaxed text-ln-gray-700">
                <b class="font-semibold text-ln-gray-900">{{ o.role }}</b> — {{ o.opens }}
              </li>
            </ul>
            <p v-if="sim.scope_report && sim.scope_report.note" class="mt-2 text-caption text-ln-gray-600">
              {{ sim.scope_report.note }}
            </p>
          </template>
        </div>

        <!-- Avertissements SERVEUR — chacun exige son accusé (A5). -->
        <div v-if="warnings.length" class="rounded-md-ln border border-ln-warning bg-ln-warning-bg p-4">
          <p class="text-body-sm font-semibold text-[#6B4415]">Avertissements — accusé exigé avant l'acte</p>
          <label v-for="w in warnings" :key="w.code"
                 class="mt-3 flex cursor-pointer items-start gap-3 text-caption leading-relaxed text-[#6B4415]">
            <input v-model="acked" type="checkbox" :value="w.code" class="mt-0.5 h-4 w-4 accent-ln-warning" />
            <span><b class="font-mono text-[11.5px] font-semibold">{{ w.code }}</b> — {{ w.message }}</span>
          </label>
          <p class="mt-2 text-caption text-[#6B4415]">{{ sim && sim.acknowledgement_contract }}</p>
        </div>

        <!-- Motif de retrait — obligatoire (DEC-339), libre. -->
        <div v-if="needsReason">
          <label for="gp-reason" class="flex items-center gap-1.5 text-body-sm font-semibold text-ln-gray-900">
            Motif du retrait <span class="font-bold text-ln-error">obligatoire</span>
          </label>
          <textarea id="gp-reason" v-model="reason" rows="3"
                    class="mt-2 w-full rounded-sm-ln border border-ln-gray-300 p-3 text-body-sm text-ln-gray-900 outline-none focus:border-ln-blue-600"
                    placeholder="Pourquoi ce rôle / cette portée est retiré(e)…" />
        </div>

        <StateBanner v-if="error" variant="error" lead="L'acte a échoué." :text="error" />
      </div>

      <footer class="flex items-center gap-3 border-t border-ln-gray-200 bg-ln-gray-50 px-5 py-4">
        <p class="mr-auto text-caption text-ln-gray-500">Toute attribution est journalisée dans la même transaction.</p>
        <button type="button" class="ln-btn-secondary" @click="emit('cancel')">Annuler</button>
        <button type="button" class="ln-btn-primary" :disabled="!canApply || busy" @click="apply">
          {{ applyLabel }}
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup>
/**
 * Panneau de dotation (M2 g11). Le seul écran dont le serveur A LONGTEMPS
 * manqué ; il existe désormais (`identity/role_administration`). Ce panneau
 * respecte le relevé §3.7 À LA LETTRE : il ne rédige AUCUNE phrase de politique
 * (opens/warnings viennent du serveur), il SIMULE avant d'agir, et l'accusé de
 * chaque avertissement est une donnée transmise à l'acte (arbitrage A5). Le
 * retrait exige un motif libre obligatoire (DEC-339).
 */
import { computed, ref, watch } from 'vue';
import { StateBanner } from '../../components/index.js';
import {
  previewGrantEffect, assignRoleProfile, addRole, removeRole, setRoleScope, clearRoleScope,
} from '../../api/roles.js';

const props = defineProps({
  // { targets:[{user,name,roles[]}], profiles:[noms], roles:[{role,opens,...}],
  //   programs:[noms] } — toutes LUES (aucun identifiant inventé).
  options: { type: Object, default: () => ({ targets: [], profiles: [], roles: [], programs: [] }) },
});
const emit = defineEmits(['cancel', 'done']);

const CHANGES = [
  { kind: 'profil_applique', label: 'Appliquer un profil' },
  { kind: 'role_ajoute', label: 'Ajouter un rôle' },
  { kind: 'role_retire', label: 'Retirer un rôle' },
  { kind: 'portee_armee', label: 'Armer une portée (filière)' },
  { kind: 'portee_retiree', label: 'Retirer une portée (filière)' },
];

const target = ref('');
const kind = ref('');
const value = ref('');
const sim = ref(null);
const acked = ref([]);
const reason = ref('');
const error = ref('');
const busy = ref(false);

const targets = computed(() => props.options.targets || []);
const currentTarget = computed(() => targets.value.find((t) => t.user === target.value) || null);
const needsReason = computed(() => kind.value === 'role_retire' || kind.value === 'portee_retiree');
const warnings = computed(() => (sim.value && sim.value.warnings) || []);

const valueLabel = computed(() => ({
  profil_applique: 'Profil', role_ajoute: 'Rôle', role_retire: 'Rôle à retirer',
  portee_armee: 'Filière', portee_retiree: 'Filière à retirer',
}[kind.value] || 'Valeur'));

const valueOptions = computed(() => {
  const o = props.options;
  if (kind.value === 'profil_applique') return (o.profiles || []).map((p) => ({ value: p, label: p }));
  if (kind.value === 'role_ajoute') return (o.roles || []).map((r) => ({ value: r.role, label: r.role }));
  if (kind.value === 'role_retire') return (currentTarget.value?.roles || []).map((r) => ({ value: r, label: r }));
  if (kind.value === 'portee_armee') return (o.programs || []).map((p) => ({ value: p, label: p }));
  if (kind.value === 'portee_retiree') {
    return (currentTarget.value?.scope?.programsList || []).map((p) => ({ value: p, label: p }));
  }
  return [];
});

// Simuler dès que (personne, changement, valeur) sont posés — sans appliquer.
watch([target, kind, value], async () => {
  sim.value = null; acked.value = []; error.value = '';
  if (!target.value || !kind.value || !value.value) return;
  try {
    sim.value = await previewGrantEffect({ target_user: target.value, kind: kind.value, value: value.value });
  } catch (e) { error.value = e.message || 'Simulation refusée.'; }
});
// Changer de type remet la valeur à zéro (les options changent).
watch(kind, () => { value.value = ''; });

const allAcked = computed(() => warnings.value.every((w) => acked.value.includes(w.code)));
const canApply = computed(() =>
  !!sim.value && !sim.value.would_be_noop && allAcked.value
  && (!needsReason.value || reason.value.trim().length > 0));

const applyLabel = computed(() => ({
  profil_applique: 'Appliquer le profil', role_ajoute: 'Ajouter le rôle',
  role_retire: 'Retirer le rôle', portee_armee: 'Armer la portée', portee_retiree: 'Retirer la portée',
}[kind.value] || 'Appliquer'));

async function apply() {
  error.value = '';
  const ack = acked.value.slice();
  try {
    busy.value = true;
    const tu = target.value;
    if (kind.value === 'profil_applique') await assignRoleProfile({ target_user: tu, profile: value.value, acknowledged_warnings: ack });
    else if (kind.value === 'role_ajoute') await addRole({ target_user: tu, role: value.value, acknowledged_warnings: ack });
    else if (kind.value === 'role_retire') await removeRole({ target_user: tu, role: value.value, reason: reason.value.trim(), acknowledged_warnings: ack });
    else if (kind.value === 'portee_armee') await setRoleScope({ target_user: tu, program: value.value, acknowledged_warnings: ack });
    else if (kind.value === 'portee_retiree') await clearRoleScope({ target_user: tu, program: value.value, reason: reason.value.trim(), acknowledged_warnings: ack });
    emit('done');
  } catch (e) {
    error.value = e.message || 'Acte refusé.';
  } finally { busy.value = false; }
}
</script>
