<template>
  <div>
    <header class="mb-4 flex flex-wrap items-start gap-4">
      <div>
        <p class="mb-2 text-caption text-ln-gray-500">
          Administration · <b class="font-semibold text-ln-gray-900">Rôles et portées</b>
        </p>
        <h1 class="text-h1 tracking-tight text-ln-gray-900">Qui peut quoi</h1>
        <p class="mt-1 text-body-sm text-ln-gray-500">{{ subtitle }}</p>
      </div>
      <div class="ml-auto">
        <button type="button" class="ln-btn-primary" @click="grant">Doter une personne…</button>
      </div>
    </header>

    <!-- ⚠️ LE CONTEXTE VENU DE L'ÉCRAN A8. « Désigner un décideur » mène ici avec
         son dossier : sans ce bandeau, la personne arrive sur une liste de six noms
         sans savoir pourquoi elle y est. Et l'écran ne PRÉ-REMPLIT rien — il ne
         connaît pas le rôle décideur requis par ce dossier. -->
    <StateBanner v-if="fromDossier" variant="info" lead="Vous venez d’un dossier sans décideur.">
      Le dossier <b class="font-mono text-[12px] font-semibold">{{ fromDossier }}</b> est instruit
      par la seule personne qui portait le rôle décideur. Doter une <b class="font-semibold">seconde
      personne</b> de ce rôle le débloque — et cela ne rend
      <b class="font-semibold">jamais</b> l'instructeur éligible à sa propre décision. Rien n'est
      pré-rempli ici : cet écran ne connaît pas le rôle qu'exige ce dossier, et le deviner
      attribuerait le mauvais.
      <router-link :to="{ name: 'awaiting-decider' }" class="font-semibold">Revenir à la liste</router-link>
    </StateBanner>


    <BlockState v-if="state !== 'ready'" :state="state === 'denied' ? 'loading' : state"
                title="Personne n’est dotée"
                message="Aucune personne ne porte de rôle de gestion. C’est l’état d’un établissement qui n’a pas encore été configuré — et non un état stable."
                :rows="5" :row-height="56" :skeleton-widths="[186, 150, 'auto', 220, 110]"
                @retry="reload" />

    <template v-else>
      <div class="mb-3 flex flex-wrap items-center gap-2">
        <button type="button" :class="chipClass(null)" @click="setFilter(null)">
          Toutes <span class="ml-1 tabular font-semibold">{{ data.count }}</span>
        </button>
        <button type="button" :class="chipClass('anomalies')" @click="setFilter('anomalies')">
          Anomalies <span class="ml-1 tabular font-semibold">{{ anomalyCount }}</span>
        </button>
        <button v-for="t in anomalyTypes" :key="t.key" type="button"
                :class="chipClass(t.key)" @click="setFilter(t.key)">
          {{ t.label }} <span class="ml-1 tabular font-semibold">{{ t.count }}</span>
        </button>
        <p class="ml-auto text-caption text-ln-gray-500">{{ data.context_note }}</p>
      </div>

      <div class="overflow-hidden rounded-md-ln border border-ln-gray-200">
        <table class="w-full border-collapse text-body-sm">
          <thead>
            <tr>
              <th :class="headTh" class="!text-left">Personne</th>
              <!-- F3-FORMES arbitrage 3 : la colonne Profil est RETIRÉE.
                   Le gabarit appartient au GESTE, pas à l'état (DC-T5-2 : un
                   profil est appliqué, jamais stocké) ; le journal porte son
                   historique. L'afficher contredirait la décision fondatrice
                   à l'écran. -->
              <th :class="headTh" class="!text-left">Rôles</th>
              <th :class="headTh" class="!text-left">Portée effective</th>
              <th :class="headTh" class="!text-left">Dotée le</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in items" :key="p.person">
              <td :class="bodyTd" class="!text-left align-top">
                <b class="font-semibold text-ln-gray-900">{{ p.name }}</b>
                <span class="block text-caption text-ln-gray-500">{{ p.email }}</span>
              </td>

              <td :class="bodyTd" class="!whitespace-normal !text-left align-top">
                <span class="flex flex-wrap gap-1">
                  <span v-for="r in p.roles" :key="r"
                        class="rounded-sm-ln px-1.5 py-0.5 text-micro font-semibold"
                        :class="r.includes('technique') ? 'bg-ln-error-bg text-ln-error' : 'bg-ln-gray-100 text-ln-gray-700'">
                    {{ r }}
                  </span>
                </span>
              </td>
              <!-- ⚠️ `scope.kind` PORTE TOUT L'ÉCRAN, et `reason` est rédigé au
                   serveur. Une simple liste de filières obligerait l'écran à
                   deviner pourquoi elle est vide ou complète. -->
              <td :class="bodyTd" class="!whitespace-normal !text-left align-top">
                <StatusPill :status="scopePill(p.scope.kind)" :label="scopeLabel(p.scope)" />
                <span class="mt-1 block max-w-[320px] text-caption leading-relaxed text-ln-gray-600">
                  {{ p.scope.reason }}
                </span>
              </td>
              <td :class="bodyTd" class="!text-left align-top text-caption text-ln-gray-500">
                {{ p.granted_on }}
                <span class="block">par {{ p.granted_by }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <p class="border-t border-ln-gray-200 bg-ln-gray-50 px-4 py-3 text-caption leading-relaxed text-ln-gray-600">
          <b class="font-semibold text-ln-gray-900">Fermé par défaut.</b> Un rôle cloisonnable sans
          filière liée ne voit rien : le serveur ne compense pas ce vide par une portée implicite, il
          le renvoie comme anomalie. Une liaison neutralisée par un cumul reste
          <b class="font-semibold text-ln-gray-900">enregistrée</b> et reprendra effet si le cumul
          cesse — d'où « annulée » plutôt que « aucune ».
        </p>
      </div>

      <div class="mt-5 grid items-start gap-5 xl:grid-cols-2">
        <section class="overflow-hidden rounded-md-ln border border-ln-gray-200">
          <header class="border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
            <h3 class="text-[14px] font-semibold text-ln-gray-900">Anomalies</h3>
            <p class="mt-0.5 text-caption text-ln-gray-500">
              Calculées, jamais stockées.
            </p>
          </header>
          <ul class="px-4 py-3">
            <li v-for="(a, i) in anomalies" :key="i"
                class="mb-3 flex items-start gap-3 last:mb-0">
              <span class="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-ln-error-bg text-micro font-bold text-ln-error"
                    aria-hidden="true">!</span>
              <span>
                <b class="text-body-sm font-semibold text-ln-gray-900">{{ a.name }}</b>
                <span class="text-body-sm text-ln-gray-700"> — {{ typeLabel(a.kind) }}</span>
                <span class="block text-caption leading-relaxed text-ln-gray-600">{{ a.detail }}</span>
              </span>
            </li>
          </ul>
          <p class="border-t border-ln-gray-200 bg-ln-gray-50 px-4 py-3 text-caption leading-relaxed text-ln-gray-600">
            <b class="font-semibold text-ln-gray-900">« Cumul sans accusé » existera dès le premier
            jour</b> : les rôles attribués à la main avant cet écran n'ont aucun accusé enregistré.
            Les afficher comme anomalies est la seule façon de les régulariser.
          </p>
        </section>

        <section class="overflow-hidden rounded-md-ln border border-ln-gray-200">
          <header class="border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
            <h3 class="text-[14px] font-semibold text-ln-gray-900">Journal des attributions</h3>
            <p class="mt-0.5 text-caption text-ln-gray-500">
              Immuable · une trace, jamais une garde.
            </p>
          </header>
          <ul class="px-4 py-3">
            <li v-for="(j, i) in journal" :key="i"
                class="mb-3 border-b border-ln-gray-100 pb-3 last:mb-0 last:border-b-0 last:pb-0">
              <p class="text-caption tabular text-ln-gray-500">{{ j.at }} · {{ j.author }}</p>
              <p class="mt-0.5 text-body-sm text-ln-gray-900">
                <b class="font-semibold">{{ j.target }}</b>
              </p>
              <!-- ⚠️ « AVANT ET APRÈS » plutôt que « rôle ajouté » : un an plus tard,
                   la question est l'état, pas le geste. -->
              <p class="mt-0.5 text-caption leading-relaxed text-ln-gray-600">
                avant : {{ j.before }}<br />
                après : <b class="font-semibold text-ln-gray-900">{{ j.after }}</b>
              </p>
              <p v-if="j.accuses.length" class="mt-1 text-caption text-ln-gray-600">
                acquitté : {{ j.accuses.map(warningLabel).join(' · ') }}
              </p>
              <p v-if="j.reason" class="mt-1 text-caption text-ln-gray-600">
                motif : {{ j.reason }}
              </p>
            </li>
          </ul>
          <p class="border-t border-ln-gray-200 bg-ln-gray-50 px-4 py-3 text-caption leading-relaxed text-ln-gray-600">
            L'attribution relève de l'<b class="font-semibold text-ln-gray-900">administration
            technique</b>. Le risque administrateur n'est pas traitable au niveau applicatif : celui
            qui détient les accès système contournerait toute garde. Le journal reste comme
            <b class="font-semibold text-ln-gray-900">trace</b>, pas comme garde — et son écriture
            appartient au serveur, dans la même transaction que l'acte.
          </p>
        </section>
      </div>

      <section class="mt-5 overflow-hidden rounded-md-ln border border-ln-gray-200">
        <header class="border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
          <h3 class="text-[14px] font-semibold text-ln-gray-900">
            Les avertissements que la dotation devra rendre
          </h3>
          <p class="mt-0.5 text-caption leading-relaxed text-ln-gray-500">
            Rédigés au serveur et repris tels quels. Ceux marqués « accusé exigé » font de la
            confirmation une <b class="font-semibold text-ln-gray-700">donnée</b> — elle doit voyager
            jusqu'au serveur et y être stockée, sinon elle n'aura existé que dans un navigateur.
          </p>
        </header>
        <ul class="px-4 py-3">
          <li v-for="w in warnings" :key="w.code"
              class="mb-3 border-b border-ln-gray-100 pb-3 last:mb-0 last:border-b-0 last:pb-0">
            <p class="text-body-sm font-semibold text-ln-gray-900">
              <span class="font-mono text-[11.5px]">{{ w.code }}</span>
              <span v-if="w.exige_accuse" class="ml-2 rounded-sm-ln bg-ln-warning-bg px-1.5 py-0.5 text-micro font-semibold text-ln-warning">
                accusé exigé
              </span>
            </p>
            <p class="mt-0.5 text-caption leading-relaxed text-ln-gray-600">{{ w.message }}</p>
          </li>
        </ul>
      </section>
    </template>

    <StateBanner v-if="pending" variant="warning" lead="Acte non disponible." :text="pending" class="mt-4" />

    <GrantPanel v-if="panelOpen" :options="grantOptions" @cancel="panelOpen = false" @done="onGranted" />
  </div>
</template>

<script setup>
/**
 * Grappe 11 · l'attribution des rôles — écran 7 du lot 5, trou T5.
 *
 * ⚠️ LE SEUL ÉCRAN DU SYSTÈME DONT LE SERVEUR N'EXISTE PAS. Son objet n'est pas de
 * cocher des cases : c'est de rendre visible CE QUE CHAQUE ATTRIBUTION OUVRE, et
 * d'avertir quand un cumul retire une protection.
 *
 * ⚠️ ET C'EST POURQUOI LE PANNEAU DE DOTATION N'EST PAS PRODUIT ICI. Il dépend
 * entièrement de `preview_grant_effect` : les phrases « ce rôle ouvre… » et « ce
 * cumul annule le cloisonnement » sont rédigées au SERVEUR. Les écrire dans la vue
 * dupliquerait la matrice des rôles, et l'écran divergerait d'elle au premier
 * changement — sans que personne ne s'en aperçoive, puisqu'il serait toujours
 * plausible. L'écran affiche donc la liste des avertissements attendus, et dit qu'il
 * ne les fabrique pas.
 *
 * ⚠️ Cet écran est la CIBLE du lien « désigner un décideur » de l'écran A8. Il reçoit
 * le dossier en contexte et le dit — mais ne pré-remplit rien : il ne connaît pas le
 * rôle décideur qu'exige ce dossier, et le deviner attribuerait le mauvais.
 *
 * 🔴 Les douze points d'entrée sont spécifiés dans
 * `handoff-gestion/T5-points-d-entree.md`. Aucun n'existe.
 */
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { StateBanner, StatusPill, headTh, bodyTd } from '../components/index.js';
import BlockState from '../components/internal/BlockState.vue';
import GrantPanel from './administration/GrantPanel.vue';
import { useResource } from '../composables/useResource.js';
import { listRoleGrants, listGrantAnomalies, listGrantJournal, listAssignableRoles } from '../api/roles.js';
import { listStructureOptions } from '../api/structure.js';

const route = useRoute();
const res = useResource(listRoleGrants, { isEmpty: (d) => !d?.items?.length });
const anomaliesRes = useResource(listGrantAnomalies, { isEmpty: (d) => !d?.items?.length });
const journalRes = useResource(listGrantJournal, { isEmpty: (d) => !d?.items?.length });
const state = res.state;
const pending = ref('');
const filter = ref(null);
const panelOpen = ref(false);
const catalog = ref([]);      // rôles attribuables (listAssignableRoles)
const programs = ref([]);     // filières (listStructureOptions)

const data = computed(() => res.data.value || {});
const items = computed(() => data.value.items || []);
const anomalies = computed(() => anomaliesRes.data.value?.items || []);
const anomalyTypes = computed(() => anomaliesRes.data.value?.types || []);
const anomalyCount = computed(() => anomalies.value.length);
const journal = computed(() => journalRes.data.value?.items || []);
const warnings = computed(() => Object.values(data.value.warnings || {}));

/** Le dossier passé par l'écran A8, s'il y en a un. */
const fromDossier = computed(() => route.query.dossier || '');

const subtitle = computed(() => {
  if (state.value !== 'ready') return 'Chargement des dotations';
  return [
    data.value.count + ' personnes dotées',
    (data.value.profiles || []).length + ' profils disponibles',
    anomalyCount.value + ' anomalies',
    'toute attribution est journalisée',
  ].join(' · ');
});

/**
 * Les quatre `scope.kind` ne sont pas quatre nuances : `nulle` ferme tout,
 * `annulee` élargit tout. Leur ton doit donc différer, et « annulée » n'est pas
 * une anomalie — c'est une liaison qui dort.
 */
const SCOPE_PILLS = { nature: 'valide', liaison: 'valide', annulee: 'incomplete', nulle: 'anomalie' };
function scopePill(kind) { return SCOPE_PILLS[kind] || 'brouillon'; }
function scopeLabel(scope) {
  if (scope.kind === 'nature') return 'Toutes filières — par nature';
  if (scope.kind === 'liaison') return 'Cloisonnée sur ' + scope.program;
  if (scope.kind === 'annulee') return 'Liaison ' + scope.program + ' — annulée par cumul';
  return 'Portée nulle — ne voit rien';
}

function typeLabel(kind) {
  return (anomalyTypes.value.find((t) => t.key === kind) || {}).label || kind;
}
function warningLabel(code) {
  return (data.value.warnings || {})[code]?.code || code;
}

function chipClass(key) {
  const on = filter.value === key;
  return 'flex h-[30px] items-center rounded-sm-ln border px-3 text-caption '
    + (on ? 'border-ln-blue-800 bg-ln-blue-50 font-semibold text-ln-blue-900'
      : 'border-ln-gray-200 bg-white text-ln-gray-700');
}

function setFilter(key) {
  filter.value = filter.value === key ? null : key;
  reload();
}

/**
 * Options du panneau de dotation — toutes LUES (aucun identifiant inventé) :
 * les personnes dotées (avec leurs rôles et portées, pour le retrait), les
 * profils, le catalogue de rôles attribuables, les filières.
 */
const grantOptions = computed(() => ({
  targets: items.value.map((p) => ({
    user: p.person, name: p.name, roles: p.roles,
    scope: { programsList: p.scope?.programsList || [] },
  })),
  profiles: data.value.profiles || [],
  roles: catalog.value,
  programs: programs.value,
}));

function grant() { pending.value = ''; panelOpen.value = true; }
function onGranted() { panelOpen.value = false; reload(); }

function reload() {
  res.load({ filter: filter.value });
  anomaliesRes.load({});
  journalRes.load({});
}
onMounted(async () => {
  reload();
  // catalogue de rôles + filières pour le panneau (lectures, tolérantes à l'échec)
  try { const c = await listAssignableRoles(); catalog.value = (c && c.roles) || []; } catch { catalog.value = []; }
  try { const s = await listStructureOptions(); programs.value = (s?.programs || []).map((p) => p.name || p); } catch { programs.value = []; }
});
</script>
