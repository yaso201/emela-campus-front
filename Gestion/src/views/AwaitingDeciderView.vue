<template>
  <div>
    <header class="mb-4">
      <p class="mb-2 text-caption text-ln-gray-500">
        À traiter · <b class="font-semibold text-ln-gray-900">En attente d'un autre décideur</b>
      </p>
      <h1 class="text-h1 tracking-tight text-ln-gray-900">Dossiers sans décideur disponible</h1>
      <p class="mt-1 text-body-sm text-ln-gray-500">{{ subtitle }}</p>
    </header>

    <StateBanner variant="error" lead="Pourquoi ces dossiers sont ici.">
      Celui qui a instruit un dossier ne peut pas en décider — la file de décision l'en écarte. Quand
      aucune autre personne ne porte le rôle, le dossier sort de toutes les files :
      <b class="font-semibold">il ne bloque rien, il n'alerte personne, il attend</b>. Cette liste est
      le seul endroit où il reste visible.
    </StateBanner>

    <!-- ⚠️ LE PÉRIMÈTRE RÉEL, dit plutôt que masqué. -->
    <StateBanner variant="warning" lead="Ce que cette liste couvre — et ce qu'elle ne couvre pas.">
      Le filtre par instructeur s'applique aujourd'hui à
      <b class="font-semibold">{{ data.scope_label || 'deux procédures' }}</b>. Ailleurs — discipline,
      réorientation, congé, démission — le dossier reste dans la file de son instructeur, qui découvre
      l'interdit au moment de décider. Ces dossiers ne sont pas perdus : ils sont visibles, mais mal
      annoncés. Le périmètre de cette liste suivra celui du filtre.
    </StateBanner>

    <BlockState v-if="state !== 'ready'" :state="state === 'denied' ? 'loading' : state"
                title="Aucun dossier sans décideur"
                message="Chaque dossier en attente de décision a au moins un décideur éligible. C'est l'état normal — et il le reste tant que chaque rôle décideur a deux titulaires."
                :rows="3" :row-height="52" :skeleton-widths="[150, 186, 196, 186, 104, 'auto']"
                @retry="reload" />

    <template v-else>
      <div class="overflow-hidden rounded-md-ln border border-ln-gray-200">
        <table class="w-full border-collapse text-body-sm">
          <thead>
            <tr>
              <th :class="headTh" class="!text-left">Dossier</th>
              <th :class="headTh" class="!text-left">Objet</th>
              <th :class="headTh" class="!text-left">Instruit par</th>
              <th :class="headTh" class="!text-left">Rôle décideur requis</th>
              <th :class="headTh">En attente</th>
              <th :class="headTh" class="!text-left">Issue</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in items" :key="d.name" class="bg-ln-warning-bg">
              <td :class="bodyTd" class="!text-left font-mono text-[11.5px] text-ln-gray-700">{{ d.name }}</td>
              <td :class="bodyTd" class="!text-left">
                {{ d.kind_label }}
                <span class="block text-caption text-ln-gray-500">{{ d.student_name }}</span>
              </td>
              <td :class="bodyTd" class="!text-left">{{ d.instructed_by }}</td>
              <td :class="bodyTd" class="!text-left">
                {{ d.decider_role }}
                <span class="block text-caption text-ln-error">seul titulaire du rôle</span>
              </td>
              <td :class="bodyTd" class="tabular font-semibold">{{ d.waiting_days }} j</td>
              <td :class="bodyTd" class="!text-left">
                <!-- ⚠️ UNE SEULE ISSUE. « Reprendre l'instruction » a été retirée
                     au lot 8 : le dossier disciplinaire ne porte aucune estampille
                     d'instructeur — seul le rôle instruit. Une issue qui
                     échouerait ne se propose pas. -->
                <button type="button"
                        class="inline-flex h-[26px] items-center rounded-sm-ln border border-ln-gray-300 bg-white px-2.5 text-caption font-semibold text-ln-gray-700"
                        @click="designate(d)">Désigner un décideur…</button>
              </td>
            </tr>
          </tbody>
        </table>
        <p class="border-t border-ln-gray-200 bg-ln-gray-50 px-4 py-3 text-caption leading-relaxed text-ln-gray-600">
          <b class="font-semibold text-ln-gray-900">Désigner un décideur</b> ouvre l'écran d'attribution
          des rôles, ce dossier en contexte : l'attribution y est avertie et acquittée, comme partout
          ailleurs — la refaire ici dupliquerait le dispositif. C'est la seule issue proposée, et elle
          ne rend <b class="font-semibold text-ln-gray-900">jamais</b> l'instructeur éligible à la
          décision.
        </p>
      </div>

      <div class="mt-5 grid gap-5 lg:grid-cols-2">
        <section class="overflow-hidden rounded-md-ln border border-ln-gray-200">
          <header class="border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
            <h3 class="text-[14px] font-semibold text-ln-gray-900">Ce que la liste ne fait pas</h3>
          </header>
          <ul class="px-4 py-3">
            <li v-for="n in LIMITS" :key="n.t" class="mb-3 flex items-start gap-2.5 last:mb-0">
              <span class="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ln-gray-400"></span>
              <span>
                <b class="text-body-sm font-semibold text-ln-gray-900">{{ n.t }}</b>
                <span class="block text-caption leading-relaxed text-ln-gray-600">{{ n.d }}</span>
              </span>
            </li>
          </ul>
        </section>

        <section class="overflow-hidden rounded-md-ln border border-ln-gray-200">
          <header class="border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
            <h3 class="text-[14px] font-semibold text-ln-gray-900">Prévenir plutôt que réparer</h3>
          </header>
          <div class="px-4 py-3">
            <dl class="flex flex-col gap-2">
              <div v-for="row in prevention" :key="row.k"
                   class="flex items-baseline gap-3 border-b border-ln-gray-100 pb-2 last:border-b-0 last:pb-0">
                <dt class="w-[176px] flex-shrink-0 text-caption text-ln-gray-500">{{ row.k }}</dt>
                <dd class="text-body-sm text-ln-gray-900">{{ row.v }}</dd>
              </div>
            </dl>
            <p class="mt-3 text-caption leading-relaxed text-ln-gray-500">
              Un second titulaire par rôle décideur ferait disparaître cette liste.
              <router-link :to="{ name: 'admin' }" class="font-semibold text-ln-blue-600">
                Ouvrir l'attribution des rôles
              </router-link>
            </p>
          </div>
        </section>
      </div>
    </template>

  </div>
</template>

<script setup>
/**
 * Grappe 7 · l'écran A8 du lot 8 — celui qui est né du filtre.
 *
 * ⚠️ SON POINT D'ENTRÉE N'EXISTE PAS. J'ai cherché `awaiting`, `no_decider`,
 * `other_decider`, `instructed_by` dans toute la surface d'appel : aucune
 * correspondance. Le manque est nommé dans `api/dossiers-read.js` et il n'a pas
 * bougé depuis le lot 8.
 *
 * ⚠️ ET SON PÉRIMÈTRE EST CELUI DU FILTRE, PAS CELUI DU BESOIN. Le filtre par
 * instructeur ne couvre que deux procédures — retour de congé et constat d'abandon.
 * L'écran le DIT, dans un second bandeau, plutôt que de promettre une exhaustivité
 * qu'il n'a pas : c'est la correction demandée au lot 8, et elle tient.
 *
 * ⚠️ UNE SEULE ISSUE. « Reprendre l'instruction » a été retirée après lecture du
 * code : `disciplinary_suspension` ne porte aucune estampille d'instructeur — seul
 * le rôle instruit. Une issue qui échouerait ne se propose pas.
 */
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { StateBanner, headTh, bodyTd } from '../components/index.js';
import BlockState from '../components/internal/BlockState.vue';
import { useAcademicContext } from '../composables/useAcademicContext.js';
import { useResource } from '../composables/useResource.js';
import { listAwaitingOtherDecider } from '../api/dossiers-read.js';

const router = useRouter();
const { params } = useAcademicContext();
const res = useResource(listAwaitingOtherDecider, { isEmpty: (d) => !d?.items?.length });
const state = res.state;

const data = computed(() => res.data.value || {});
const items = computed(() => data.value.items || []);

const LIMITS = [
  { t: 'Elle ne débloque rien d’elle-même',
    d: 'Aucune réattribution automatique : la direction agit, ou le dossier attend.' },
  { t: 'Elle n’autorise pas l’instructeur à décider',
    d: 'Le filtre reste entier — c’est le décideur qui change, jamais la règle.' },
  { t: 'Elle ne couvre pas encore toutes les procédures',
    d: 'Deux à ce jour. Ailleurs, le dossier reste dans la file de son instructeur.' },
  { t: 'Le décideur bloqué la voit, en lecture',
    d: 'Savoir que son dossier attend, sans pouvoir agir dessus, vaut mieux que l’ignorer.' },
];

const prevention = computed(() => [
  { k: 'Rôles à un seul titulaire',
    v: data.value.roles_single_holder + ' sur ' + data.value.roles_total },
  { k: 'Dont porteurs de décision', v: data.value.roles_decider_single_holder },
  { k: 'Dossiers exposés', v: 'Tout dossier qu’ils instruisent eux-mêmes' },
  { k: 'Procédures couvertes ici', v: data.value.scope_label || '—' },
]);

const subtitle = computed(() => {
  if (state.value !== 'ready') return 'Chargement de la liste';
  const oldest = Math.max(0, ...items.value.map((d) => d.waiting_days || 0));
  return [plural(items.value.length, 'dossier'),
    oldest ? 'le plus ancien attend depuis ' + plural(oldest, 'jour') : null,
    data.value.scope_label].filter(Boolean).join(' · ');
});

function plural(n, w) { const v = Number(n) || 0; return v + ' ' + w + (v > 1 ? 's' : ''); }
/**
 * ⚠️ L'ISSUE MÈNE MAINTENANT QUELQUE PART. Elle disait « l'écran appartient à la
 * grappe 8 » ; il est produit (grappe 11), et le lien porte le DOSSIER en contexte —
 * sans quoi la personne arrive sur une liste de six noms sans savoir pourquoi.
 *
 * ⚠️ Il ne pré-remplit rien pour autant : l'écran d'attribution ne connaît pas le
 * rôle décideur qu'exige ce dossier, et le deviner attribuerait le mauvais.
 */
function designate(d) {
  router.push({ name: 'admin', query: { dossier: d.name } });
}
function reload() { res.load({ ...params.value }); }
onMounted(reload);
</script>
