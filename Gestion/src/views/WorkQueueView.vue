<template>
  <div>
    <header class="mb-5 flex flex-wrap items-start justify-between gap-5">
      <div>
        <p class="mb-2 text-caption text-ln-gray-500">À traiter</p>
        <h1 class="text-h1 tracking-tight text-ln-gray-900">Ce qui attend un geste de vous</h1>
        <p class="mt-1 text-body-sm text-ln-gray-500">{{ subtitle }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button v-for="f in filters" :key="f.key" type="button"
                class="inline-flex h-[30px] items-center gap-1.5 rounded-sm-ln border px-3 text-caption font-medium"
                :class="f.key === domain ? 'border-ln-blue-900 bg-ln-blue-900 font-semibold text-white' : 'border-ln-gray-300 text-ln-gray-700'"
                @click="setDomain(f.key)">
          {{ f.label }} <span class="tabular opacity-70">{{ f.count }}</span>
        </button>
      </div>
    </header>

    <div class="grid items-start gap-5 lg:grid-cols-[368px_1fr]">
      <WorkQueue title="À traiter" :items="items" :selected-id="selectedId" :total="items.length"
                 :state="state === 'denied' ? 'loading' : state"
                 :expected-count="expected"
                 state-title="Rien ne vous attend"
                 state-message="Aucun objet de vos domaines n'attend de geste. Ce n'est pas un écran vide : c'est une file vide."
                 @select="select" @retry="reload" />

      <section v-if="selected" class="overflow-hidden rounded-md-ln border border-ln-gray-200">
        <header class="flex items-start gap-4 border-b border-ln-gray-200 px-5 py-4">
          <div>
            <h2 class="text-h3 text-ln-gray-900">{{ selected.title }}</h2>
            <p class="mt-0.5 text-caption text-ln-gray-500">{{ selected.subtitle }}</p>
          </div>
          <StatusPill class="ml-auto" :status="selected.status" :label="selected.statusLabel" />
        </header>
        <div class="px-5 py-4">
          <p class="text-body-sm leading-relaxed text-ln-gray-700">
            Cet objet appartient au domaine <b>{{ domainLabel(selected.domain) }}</b>. L'écran qui le
            traite est livré avec sa grappe ; « À traiter » n'agit sur rien — il oriente.
          </p>
          <p v-if="selected.due" class="mt-2 text-caption" :class="selected.overdue ? 'font-semibold text-ln-error' : 'text-ln-gray-500'">
            En attente {{ selected.due }}.
          </p>
          <div class="mt-4 flex gap-2">
            <button type="button" class="ln-btn-primary" @click="openDomain(selected)">Ouvrir dans {{ domainLabel(selected.domain) }}</button>
          </div>
        </div>
      </section>

      <section v-else class="rounded-md-ln border border-dashed border-ln-gray-300 px-6 py-8 text-center">
        <h4 class="text-h3 text-ln-gray-900">Choisissez un objet</h4>
        <p class="mx-auto mt-1.5 max-w-md text-body-sm leading-relaxed text-ln-gray-500">
          La file énumère ; elle ne décide pas. Un objet ouvert reste dans la file jusqu'à ce que
          son geste soit posé.
        </p>
      </section>
    </div>
  </div>
</template>

<script setup>
/**
 * Grappe 1 · « À traiter » — la file multi-domaines du lot 1.
 * Elle n'agit sur rien : elle oriente vers l'écran qui agit. C'est le seul
 * endroit du châssis où plusieurs domaines coexistent.
 */
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { WorkQueue, StatusPill } from '../components/index.js';
import { useResource } from '../composables/useResource.js';
import { useAcademicContext } from '../composables/useAcademicContext.js';
import { listWorkQueue } from '../api/queues.js';
import { NAV_ITEMS } from '../nav.js';

const router = useRouter();
const { params } = useAcademicContext();
const { state, data, expected, load } = useResource(listWorkQueue);

const domain = ref('all');
const selectedId = ref(null);

const items = computed(() => data.value?.items || []);
const selected = computed(() => items.value.find((i) => i.id === selectedId.value) || null);
const subtitle = computed(() =>
  state.value === 'ready'
    ? items.value.length + ' objet' + (items.value.length > 1 ? 's' : '') + ' · toutes vos files réunies'
    : 'Chargement de vos files');

const DOMAINS = { grades: 'Notes', documents: 'Documents', planning: 'Planning', council: 'Conseil pédagogique', dossiers: 'Dossiers', structure: 'Structure' };
function domainLabel(key) { return DOMAINS[key] || key; }

const filters = computed(() => {
  const counts = items.value.reduce((acc, i) => ({ ...acc, [i.domain]: (acc[i.domain] || 0) + 1 }), {});
  return [{ key: 'all', label: 'Tous', count: items.value.length },
    ...Object.keys(DOMAINS).filter((k) => counts[k]).map((k) => ({ key: k, label: DOMAINS[k], count: counts[k] }))];
});

function setDomain(key) { domain.value = key; reload(); }
function select(id) { selectedId.value = id; }
function reload() { load({ ...params.value, domain: domain.value === 'all' ? null : domain.value }); }

/** Aucune route en dur : on relit la navigation déclarée. */
function openDomain(item) {
  const target = NAV_ITEMS.find((n) => n.key === item.domain);
  if (target) router.push(target.path);
}

onMounted(reload);
watch(params, reload);
</script>
