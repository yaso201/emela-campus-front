<template>
  <div>
    <header class="mb-4 flex flex-wrap items-start justify-between gap-5">
      <div>
        <p class="mb-2 text-caption text-ln-gray-500">Répartition · <b class="font-semibold text-ln-gray-900">Signaux</b></p>
        <h1 class="text-h1 tracking-tight text-ln-gray-900">Signaux de répartition</h1>
        <p class="mt-1 text-body-sm text-ln-gray-500">{{ subtitle }}</p>
      </div>
      <button type="button" class="ln-btn-secondary" @click="notBuilt('Export de la liste')">Exporter la liste</button>
    </header>

    <StateBanner v-if="pending" variant="warning" lead="Acte non disponible." :text="pending" />

    <StateBanner variant="info" lead="Un signal n'est pas une erreur.">
      Un module volontairement non réparti, un dépassement assumé, un remplacement de dernière minute :
      tous apparaissent ici et tous sont légitimes. Rien n'est bloqué, rien n'est à « corriger » —
      c'est une liste à lire.
    </StateBanner>

    <BlockState v-if="state !== 'ready'" :state="state === 'denied' ? 'loading' : state"
                title="Aucun signal"
                message="Aucun écart entre la maquette, la répartition et le planning. Ce n'est pas un écran vide : c'est une liste vide."
                :rows="6" :skeleton-widths="[210, 260, 140, 120]" :row-height="42"
                @retry="reload">
      <!-- Cet écran EST la page : son erreur doit offrir une sortie. Les trois
           panneaux qui vivent à côté d'un contenu vivant (arbre, unité,
           couverture) n'en ont pas besoin — la page reste navigable autour. -->
      <template #action>
        <router-link :to="{ name: 'service' }" class="ln-btn-secondary">Retour à la répartition</router-link>
      </template>
    </BlockState>

    <template v-else>
      <!-- Trois familles, jamais triées par gravité : aucune n'est plus grave
           qu'une autre, et un tri par gravité suggérerait une hiérarchie. -->
      <section v-for="fam in families" :key="fam.key" class="mb-4 overflow-hidden rounded-md-ln border border-ln-gray-200 last:mb-0">
        <header class="flex items-center gap-3 border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
          <span class="text-[14px] font-semibold text-ln-gray-900">{{ fam.title }}</span>
          <span class="min-w-0 flex-1 text-caption leading-snug text-ln-gray-500">{{ fam.description }}</span>
          <span class="tabular flex-shrink-0 rounded-full bg-ln-gray-100 px-2.5 py-0.5 text-caption font-bold text-ln-gray-700">
            {{ (fam.items || []).length }}
          </span>
        </header>

        <p v-if="!(fam.items || []).length" class="px-4 py-4 text-caption text-ln-gray-500">
          Aucun signal de cette nature.
        </p>

        <div v-for="s in fam.items" :key="s.id"
             class="flex min-h-[42px] flex-wrap items-center gap-3 border-b border-ln-gray-100 px-4 py-2 text-body-sm last:border-0">
          <span class="font-semibold text-ln-gray-900">{{ s.subject }}</span>
          <span class="min-w-0 flex-1 text-caption text-ln-gray-500">{{ s.detail }}</span>
          <span class="flex flex-shrink-0 items-center gap-3">
            <StatusPill :status="s.status" :label="s.status_label" />
            <!-- Une action de CONSULTATION, jamais une action corrective. -->
            <!-- Le sujet voyage AVEC le lien. Sans lui, un signal par personne
                 ouvre le bilan de quelqu'un d'autre. -->
            <router-link v-if="s.route" :to="linkTo(s)"
                         class="inline-flex h-[26px] items-center rounded-sm-ln border border-ln-gray-300 px-2.5 text-caption font-semibold text-ln-gray-700">
              {{ s.action_label || 'Ouvrir' }}
            </router-link>
          </span>
        </div>
      </section>

      <p class="mt-4 max-w-3xl text-caption leading-relaxed text-ln-gray-500">
        Un enseignant choisi au planning <b class="font-semibold text-ln-gray-900">gagne toujours</b> sur
        la répartition. Le signal enregistre l'écart ; il ne le conteste pas.
      </p>
    </template>
  </div>
</template>

<script setup>
/**
 * Grappe 3 · Répartition — écran N4 du lot 6.
 *
 * Aucun de ces signaux ne bloque quoi que ce soit. L'écran évite donc tout
 * vocabulaire d'erreur : pas de rouge, pas de « corriger ». Trois listes, un
 * compte, et une action de CONSULTATION.
 *
 * ⚠️ Les familles ne sont pas triées par gravité : aucune n'est plus grave
 * qu'une autre, et un tri le suggérerait. Elles arrivent dans l'ordre du
 * serveur — maquette, norme, planning.
 *
 * ⚠️ Le périmètre suit le lecteur (arbitrage du lot 6) : un responsable de
 * formation voit SA filière pour la couverture et le contournement, mais voit
 * le dépassement de norme des enseignants qu'il emploie — le dépassement
 * concerne un enseignant, pas une filière. C'est le serveur qui filtre.
 */
import { computed, onMounted, ref, watch } from 'vue';
import { StatusPill, StateBanner } from '../components/index.js';
import BlockState from '../components/internal/BlockState.vue';
import { useAcademicContext } from '../composables/useAcademicContext.js';
import { useResource } from '../composables/useResource.js';
import { listServiceSignals } from '../api/service.js';

const { params } = useAcademicContext();
const res = useResource(listServiceSignals, { isEmpty: (d) => !d?.families?.some((f) => f.items?.length) });
const state = res.state;
const pending = ref('');

const families = computed(() => res.data.value?.families || []);
const total = computed(() => families.value.reduce((n, f) => n + (f.items?.length || 0), 0));
const subtitle = computed(() =>
  state.value !== 'ready' ? 'Calcul des signaux'
    : total.value + ' signaux sur ' + (res.data.value?.program_count || 0) +
      ' filières · aucun ne suspend une action');

/**
 * Un signal qui nomme une personne doit transmettre cette personne. Le serveur
 * rend `teacher_id` sur les signaux de norme ; les autres n'en ont pas besoin.
 */
function linkTo(s) {
  return s.teacher_id ? { name: s.route, params: { teacher: s.teacher_id } } : { name: s.route };
}

function notBuilt(what) { pending.value = what + " — pas encore branché au serveur. Rien n'a été produit."; }
function reload() { res.load(params.value); }

onMounted(() => { if (params.value.academic_year) reload(); });  // pas d'appel sans contexte (§5)
watch(params, reload);
</script>
