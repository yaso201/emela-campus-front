<template>
  <AppShell :nav-groups="navGroups" :bottom-items="bottomItems" :current="current"
            :user="person" :roles="roles" :has-personal-space="spaces.personal"
            :unread="counts.overdue > 0" :rail="rail" :compact="compact"
            @navigate="go" @switch-space="switchSpace" @search="search" @logout="logout" @toggle-nav="compactNavOpen = !compactNavOpen">
    <template #context>
      <ContextBar :year="year" :term="term" :note="note" :loading="!ctxReady"
                  :candidates="needsTermChoice ? candidateTerms : []" @pick="pick" @choose="setTerm" />
    </template>

    <!-- ⚠️ Ce bandeau vit dans la COQUILLE, qui ne se démonte jamais : il doit être
         effacé explicitement au changement de route. Les douze bandeaux équivalents
         des vues tombent d'eux-mêmes — leur composant se démonte. Celui-ci non. -->
    <StateBanner v-if="pending" variant="warning" lead="Acte non disponible." :text="pending" />

    <!-- RÈGLE 5, portée une fois : un refus de droit rend le refus expliqué à
         la place de la page, où que le refus soit né. Aucune vue n'y pense. -->
    <AccessDenied v-if="denial" :title="denialTitle" :message="denial.message"
                  :until-label="denialUntil" :allowed="denialAllowed"
                  :missing-channel="denialChannel" />

    <router-view v-else />

    <!-- MANDAT-14 (C7) : la recherche du bandeau est BRANCHÉE — étudiants et personnel, par le serveur.
         Un étudiant trouvé ouvre ses actes de gestion ; aucun écran n'invente un « dossier étudiant ». -->
    <div v-if="searchOpen" class="fixed inset-0 z-40 flex items-start justify-center bg-ln-gray-900/40 p-4 pt-20"
         @click.self="searchOpen = false">
      <section role="dialog" aria-modal="true" aria-label="Chercher une personne"
               class="w-full max-w-xl overflow-hidden rounded-md-ln border border-ln-gray-200 bg-white shadow-lg">
        <header class="flex items-center gap-3 border-b border-ln-gray-200 bg-ln-gray-50 px-4 py-3">
          <h2 class="text-h2 text-ln-gray-900">Chercher une personne</h2>
          <button type="button" class="ml-auto text-caption font-semibold text-ln-gray-600" @click="searchOpen = false">Fermer</button>
        </header>
        <div class="flex flex-col gap-3 px-4 py-3">
          <PeopleSearch id="bandeau-recherche" :initial="searchInitial" :selected="searchPicked?.student || searchPicked?.user || ''"
                        label="Nom, matricule ou courriel" @pick="searchPicked = $event" />
          <div v-if="searchPicked" class="rounded-sm-ln border border-ln-blue-200 bg-ln-blue-50 px-3 py-2 text-body-sm">
            <template v-if="searchPicked.type === 'student'">
              <b class="font-semibold text-ln-gray-900">{{ searchPicked.student_name }}</b> — {{ searchPicked.student }}
              <div class="mt-2 flex flex-wrap gap-2">
                <button v-if="can('instruct:dossiers')" type="button" class="ln-btn-primary"
                        @click="openDossierFor(searchPicked.student)">Ouvrir un dossier pour cet étudiant…</button>
                <router-link :to="{ name: 'dossiers' }" class="ln-btn-secondary" @click="searchOpen = false">Voir les dossiers</router-link>
              </div>
            </template>
            <template v-else>
              <b class="font-semibold text-ln-gray-900">{{ searchPicked.full_name }}</b> — {{ (searchPicked.role_labels || searchPicked.roles).join(', ') }}
              <p class="mt-1 text-caption text-ln-gray-600">Un membre du personnel se désigne depuis l’acte qui l’appelle (siège de commission, de conseil).</p>
            </template>
          </div>
        </div>
      </section>
    </div>
  </AppShell>
</template>

<script setup>
/**
 * Coquille — session, contexte, navigation, refus expliqué.
 * Elle ne connaît aucun écran : elle route ce que nav.js déclare.
 */
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { AppShell, ContextBar, AccessDenied, StateBanner } from './components/index.js';
import PeopleSearch from './components/PeopleSearch.vue';
import { NAV, BOTTOM_KEYS } from './nav.js';
import { useSession } from './composables/useSession.js';
import { closeSession } from './api/session.js';
import { useAcademicContext } from './composables/useAcademicContext.js';
import { denial, clearDenial } from './composables/useResource.js';
import { workQueueCounts } from './api/queues.js';

const route = useRoute();
const router = useRouter();
const { person, roles, spaces, open, can } = useSession();
const {
  year, term, note, params, ready: ctxReady, load: loadCtx, setYear, setTerm, years, terms,
  candidateTerms, needsTermChoice,
} = useAcademicContext();

const counts = ref({ total: 0, by_domain: {}, overdue: 0 });
const width = ref(window.innerWidth);
const compactNavOpen = ref(false);

onMounted(async () => {
  window.addEventListener('resize', () => { width.value = window.innerWidth; });
  await Promise.all([open(), loadCtx()]);
  try { counts.value = await workQueueCounts({}); } catch { /* les pastilles ne bloquent aucun écran */ }
});

/** Le bandeau d'acte non branché — effacé au changement de route, voir ci-dessous. */
const pending = ref('');

/**
 * Le refus appartient à la page qui l'a provoqué : on change d'écran, il tombe.
 *
 * ⚠️ ET LE BANDEAU D'ACTE NON BRANCHÉ AUSSI — il ne tombait pas.
 *
 * J'ai transplanté le patron `pending` / `notBuilt` d'un composant de ROUTE vers la
 * COQUILLE. Les douze bandeaux équivalents des vues tombent d'eux-mêmes parce que
 * leur composant se démonte — c'est ce que dit `RepartitionView` : « le bandeau tombe
 * au prochain chargement ». **Cette phrase est fausse ici** : `App.vue` ne se démonte
 * jamais.
 *
 * `StateBanner` n'a aucune échappatoire (ni bouton de fermeture, ni événement) : le
 * bandeau restait donc épinglé au-dessus de TOUS les écrans pour la session entière.
 * Pire que le `noop()` qu'il remplaçait — le silence était réparable d'un second clic.
 */
watch(() => route.fullPath, () => {
  clearDenial();
  pending.value = '';
});

const compact = computed(() => width.value < 768);
// Rail automatique sur les écrans denses : c'est ce qui fait tenir le tableau
// de délibération dans 1280 px (lot 8, A1).
// Le rail est une propriété de LARGEUR, pas d'écran : il se déclenche sur un
// écran dense ET une fenêtre étroite. Cette liste doit grandir avec chaque
// grappe — un écran dense oublié ici perd 208 px sans raison.
const DENSE = [
  'grades', 'planning', 'council',
  'service', 'service-validate', 'service-charge', 'service-signals', 'service-progress',
  'structure',
  'groups', 'enrollment',
  'council-session', 'council-preconisations', 'council-absences',
  'documents', 'graduation', 'closure', 'admin',
];
const rail = computed(() => DENSE.includes(route.name) && width.value < 1440);
const current = computed(() => String(route.name || ''));

const navGroups = computed(() =>
  NAV.map((group) => ({
    key: group.key,
    title: group.title,
    items: group.items
      .filter((item) => !item.hidden)                     // déclarée pour le routeur, pas pour la barre
      .filter((item) => !item.need || can(item.need))     // règle 3 : non rendu, jamais grisé
      .map((item) => ({
        ...item,
        count: item.countKey ? counts.value[item.countKey] || 0 : counts.value.by_domain?.[item.key] || 0,
        overdue: item.key === 'queue' && counts.value.overdue > 0,
      })),
  })).filter((g) => g.items.length));

const bottomItems = computed(() =>
  navGroups.value.flatMap((g) => g.items).filter((i) => BOTTOM_KEYS.includes(i.key)));

function go(key) {
  if (key === 'home') return router.push('/a-traiter');
  if (key === 'notifications') return;
  const target = NAV.flatMap((g) => g.items).find((i) => i.key === key);
  if (target) router.push(target.path);
}

/** La bascule transmet le contexte académique — il ne se perd pas au passage. */
function switchSpace() {
  const q = new URLSearchParams({ year: params.value.academic_year || '', term: params.value.term || '' });
  window.location.assign('/espace-personnel?' + q.toString());
}

function pick(which) {
  // Sélection minimale : la coquille tourne en rond dans la liste reçue. Le
  // sélecteur riche appartient au bandeau, il viendra avec la grappe 2.
  if (which === 'year') {
    const i = years.value.findIndex((y) => y.id === year.value?.id);
    setYear(years.value[(i + 1) % years.value.length]?.id);
  } else {
    const i = terms.value.findIndex((t) => t.id === term.value?.id);
    setTerm(terms.value[(i + 1) % terms.value.length]?.id);
  }
}
/**
 * MANDAT-14 (C7, D-RECHERCHE-PERSONNE-01) : LA RECHERCHE EST BRANCHÉE sur `search_people`.
 *
 * Avant, le bouton de recherche de `AppShell` (rendu sur tous les écrans) disait qu'il n'était pas branché. Il
 * ouvre maintenant la recherche d'une personne — étudiants et personnel, par le serveur ; un lecteur sans
 * `read:people` reçoit la phrase qui le dit. `?chercher=` l'ouvre directement (preuves du lot 6).
 */
const searchOpen = ref(Boolean(new URLSearchParams(location.search).get('chercher')));
const searchInitial = new URLSearchParams(location.search).get('chercher') || '';
const searchPicked = ref(null);
function search() {
  if (!can('read:people')) {
    pending.value = 'La recherche d’une personne est réservée au personnel de gestion.';
    return;
  }
  searchOpen.value = true;
}
function openDossierFor(student) {
  searchOpen.value = false;
  router.push({ name: 'dossiers', query: { ouvrir: student } });
}

/**
 * AN-09 — la déconnexion est un acte SERVEUR : la session Frappe est invalidée
 * (`/api/method/logout`), puis rechargement de /gestion — le serveur, ne voyant
 * plus de session, redirige vers la connexion. Le shell étant servi
 * `Cache-Control: no-store`, le retour-arrière ne rend aucun contenu.
 */
async function logout() {
  try { await closeSession(); } catch { /* la session peut déjà être morte — on sort quand même */ }
  window.location.assign('/gestion');
}

const d = computed(() => denial.value?.details || {});
const denialTitle = computed(() => (d.value.status ? 'Accès limité — ' + d.value.status : 'Accès non ouvert'));
const denialUntil = computed(() =>
  d.value.days_left != null ? 'Cette limitation court encore ' + d.value.days_left + ' jours.' : '');
const denialAllowed = computed(() => d.value.allowed || []);
const denialChannel = computed(() => d.value.missing_channel || '');
</script>
