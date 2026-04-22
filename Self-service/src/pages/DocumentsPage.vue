<script setup>
// DocumentsPage — Bibliothèque documentaire étudiant (Flux 8)
// Agrège : documents obligatoires, académiques, financiers, carte étudiant.
// Règle absolue : le portail expose, filtre, affiche. Il ne crée, ne valide,
// ne modifie et n'émet aucun document.
//
import { computed, ref, watch } from 'vue';
import { useFrappeCall } from '@/composables/useFrappeCall';
import { useProfileStore } from '@/stores/profile';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import BlockError from '@/components/ui/BlockError.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import EmptyState from '@/components/ui/EmptyState.vue';

const profile = useProfileStore();

// ── API principale ───────────────────────────────────────────────────
const libraryResource = useFrappeCall(
  'portal_app.api.document_library.get_my_document_library',
  {},
  { auto: false },
);

watch(
  () => [profile.status, profile.profile],
  ([status, currentProfile]) => {
    if (status === 'loaded' && currentProfile === 'student') {
      libraryResource.reload();
    }
  },
  { immediate: true },
);

// ── Filtres (frontend-only) ──────────────────────────────────────────
const categoryFilter = ref('all');
const sourceFilter = ref('all');

const categoryOptions = [
  { value: 'all', label: 'Tous' },
  { value: 'a_valider', label: 'À valider' },
  { value: 'valides', label: 'Validés' },
  { value: 'officiels', label: 'Officiels' },
  { value: 'archives', label: 'Archivés' },
];

const sourceOptions = [
  { value: 'all', label: 'Toutes' },
  { value: 'mandatory', label: 'Obligatoires' },
  { value: 'academic', label: 'Académiques' },
  { value: 'financial', label: 'Financiers' },
  { value: 'student_card', label: 'Carte étudiant' },
];

const filteredItems = computed(() => {
  let items = libraryResource.data?.items || [];
  if (categoryFilter.value !== 'all') {
    items = items.filter((i) => i.category === categoryFilter.value);
  }
  if (sourceFilter.value !== 'all') {
    items = items.filter((i) => i.source === sourceFilter.value);
  }
  return items;
});

const counts = computed(() => {
  const cats = libraryResource.data?.categories || {};
  return {
    a_valider: cats.a_valider?.length || 0,
    valides: cats.valides?.length || 0,
    officiels: cats.officiels?.length || 0,
    archives: cats.archives?.length || 0,
  };
});

const hasRootWarnings = computed(() => {
  const w = libraryResource.data?.warnings;
  return Array.isArray(w) && w.length > 0;
});

const rootWarnings = computed(() => libraryResource.data?.warnings || []);

// ── Preview / Actions ────────────────────────────────────────────────
const previewOpen = ref(false);
const previewHtml = ref('');
const previewLoading = ref(false);
const previewError = ref(null);
const previewTitle = ref('');

const ALLOWED_PREVIEW_ENDPOINTS = [
  'portal_app.api.academic_documents.get_document_content',
  'portal_app.api.finance_documents.get_receipt_html',
];

async function fetchDocumentHtml(endpoint, params) {
  if (!ALLOWED_PREVIEW_ENDPOINTS.includes(endpoint)) {
    previewError.value = 'Action non autorisée';
    return;
  }
  previewLoading.value = true;
  previewError.value = null;
  previewHtml.value = '';
  try {
    const formData = new URLSearchParams();
    for (const [k, v] of Object.entries(params || {})) {
      if (v !== undefined && v !== null) formData.append(k, v);
    }
    const resp = await fetch(`/api/method/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Frappe-CSRF-Token': window.csrf_token || '',
        Accept: 'application/json',
      },
      body: formData.toString(),
      credentials: 'same-origin',
    });
    if (!resp.ok) {
      throw new Error(`Erreur ${resp.status}`);
    }
    const json = await resp.json();
    let html = json.message !== undefined ? json.message : json;
    // get_document_content retourne { html: '...' }, get_receipt_html retourne une chaîne directe
    if (typeof html === 'object' && html !== null && typeof html.html === 'string') {
      html = html.html;
    }
    if (typeof html !== 'string') throw new Error('Format de réponse inattendu');
    previewHtml.value = html;
    previewOpen.value = true;
  } catch (e) {
    previewError.value = e.message || 'Erreur de chargement';
    previewOpen.value = true;
  } finally {
    previewLoading.value = false;
  }
}

function closePreview() {
  previewOpen.value = false;
  previewHtml.value = '';
  previewError.value = null;
}

function handleAction(action) {
  if (!action) return;
  if (action.type === 'verify' && action.url) {
    window.open(action.url, '_blank');
  } else if (action.type === 'view' && action.url) {
    window.location.href = action.url;
  } else if (action.type === 'view' && action.endpoint) {
    previewTitle.value = 'Prévisualisation';
    fetchDocumentHtml(action.endpoint, action.params);
  } else if (action.type === 'download' && action.endpoint) {
    previewTitle.value = 'Reçu';
    fetchDocumentHtml(action.endpoint, action.params);
  } else if (action.type === 'validate' && action.url) {
    window.location.href = action.url;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────
function categoryLabel(cat) {
  const map = {
    a_valider: 'À valider',
    valides: 'Validés',
    officiels: 'Officiels',
    archives: 'Archivés',
  };
  return map[cat] || cat;
}

function sourceLabel(src) {
  const map = {
    mandatory: 'Obligatoire',
    academic: 'Académique',
    financial: 'Financier',
    student_card: 'Carte étudiant',
  };
  return map[src] || src;
}

function documentTypeLabel(dt) {
  if (!dt) return '';
  return dt.replace(/_/g, ' ');
}

function categoryIndicatorClass(cat) {
  const map = {
    a_valider: 'bg-ln-warning',
    valides: 'bg-ln-success',
    officiels: 'bg-ln-blue-600',
    archives: 'bg-ln-gray-400',
  };
  return map[cat] || 'bg-ln-gray-300';
}

function mapStatusForBadge(status) {
  const s = (status || '').toLowerCase();
  const map = {
    active: 'active',
    pending: 'pending',
    validated: 'validated',
    validé: 'validated',
    'à valider': 'pending',
    expired: 'failed',
    révoqué: 'failed',
    remplacé: 'failed',
    refused: 'rejected',
  };
  return map[s] || 'neutral';
}

function formatDate(d) {
  if (!d) return '';
  return d;
}

function formatAmount(amount, currency) {
  if (amount == null) return '';
  const fmt = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency || 'XOF',
    maximumFractionDigits: 0,
  });
  return fmt.format(amount);
}

const isStudent = computed(() => profile.profile === 'student');
const showProfileGuard = computed(() => !profile.isLoading && !profile.isGuest && !isStudent.value);
</script>

<template>
  <div class="flex flex-col gap-6">
    <header>
      <h1 class="text-2xl font-bold text-ln-gray-900 mb-1">Mes documents</h1>
      <p class="text-sm text-ln-gray-600">
        Retrouvez vos documents à valider, vos documents validés, vos documents officiels et vos archives.
      </p>
    </header>

    <!-- Guard : profil non étudiant -->
    <div
      v-if="showProfileGuard"
      class="bg-white rounded-lg border border-ln-gray-200 p-6 text-center"
    >
      <h2 class="text-base font-semibold text-ln-gray-900">Page réservée aux étudiants</h2>
      <p class="text-sm text-ln-gray-600 mt-2">
        Cette page est accessible uniquement depuis un profil étudiant.
      </p>
    </div>

    <div v-else>
      <!-- Guard : guest -->
      <div
        v-if="profile.isGuest"
        class="bg-white rounded-lg border border-ln-gray-200 p-6 text-center"
      >
        <h2 class="text-base font-semibold text-ln-gray-900">Connexion requise</h2>
        <p class="text-sm text-ln-gray-600 mt-2">
          Connectez-vous avec votre compte étudiant pour consulter vos documents.
        </p>
      </div>

      <!-- Guard : loading profil -->
      <div v-else-if="profile.isLoading" class="grid gap-4">
        <BlockSkeleton :lines="5" :show-title="false" />
      </div>

      <div v-else class="flex flex-col gap-6">
        <!-- Loading API -->
        <div v-if="libraryResource.loading" class="grid gap-4">
          <BlockSkeleton :lines="3" :show-title="true" />
          <BlockSkeleton :lines="4" :show-title="false" />
        </div>

        <!-- Erreur API -->
        <BlockError
          v-else-if="libraryResource.error"
          title="Documents indisponibles"
          :message="libraryResource.error.message || 'Erreur réseau'"
          :retry="() => libraryResource.reload()"
        />

        <!-- Contenu -->
        <template v-else>
          <!-- Warnings racine -->
          <div
            v-if="hasRootWarnings"
            class="bg-amber-50 border border-amber-200 rounded-lg p-4"
          >
            <p
              v-for="(w, idx) in rootWarnings"
              :key="`rw-${idx}`"
              class="text-sm text-amber-800 font-medium"
            >
              {{ w }}
            </p>
          </div>

          <!-- Compteurs -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div
              v-for="opt in categoryOptions.filter((o) => o.value !== 'all')"
              :key="opt.value"
              class="bg-white rounded-lg border border-ln-gray-200 p-4 flex flex-col gap-1"
            >
              <span class="text-xs text-ln-gray-500 uppercase tracking-wider font-semibold">
                {{ opt.label }}
              </span>
              <span class="text-xl font-bold text-ln-gray-900">
                {{ counts[opt.value] ?? 0 }}
              </span>
            </div>
          </div>

          <!-- Filtres -->
          <div class="bg-white rounded-lg border border-ln-gray-200 p-4 flex flex-col gap-4">
            <div class="flex flex-col gap-2">
              <span class="text-xs font-semibold text-ln-gray-500 uppercase tracking-wider">
                Catégorie
              </span>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="opt in categoryOptions"
                  :key="`cat-${opt.value}`"
                  type="button"
                  class="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px]"
                  :class="
                    categoryFilter === opt.value
                      ? 'bg-ln-blue-900 text-white'
                      : 'bg-ln-gray-100 text-ln-gray-700 hover:bg-ln-gray-200'
                  "
                  @click="categoryFilter = opt.value"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>
            <div class="flex flex-col gap-2">
              <span class="text-xs font-semibold text-ln-gray-500 uppercase tracking-wider">
                Source
              </span>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="opt in sourceOptions"
                  :key="`src-${opt.value}`"
                  type="button"
                  class="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px]"
                  :class="
                    sourceFilter === opt.value
                      ? 'bg-ln-blue-900 text-white'
                      : 'bg-ln-gray-100 text-ln-gray-700 hover:bg-ln-gray-200'
                  "
                  @click="sourceFilter = opt.value"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>
          </div>

          <!-- Liste documents -->
          <div v-if="filteredItems.length === 0" class="bg-white rounded-lg border border-ln-gray-200">
            <EmptyState
              icon="FileText"
              label="Aucun document ne correspond à vos filtres"
              description="Modifiez les filtres ou revenez plus tard."
            />
          </div>

          <div v-else class="grid grid-cols-1 gap-4">
            <div
              v-for="item in filteredItems"
              :key="item.id"
              class="bg-white rounded-lg border border-ln-gray-200 p-4 md:p-5 flex flex-col gap-3 relative overflow-hidden"
            >
              <!-- Indicateur catégorie -->
              <div
                class="absolute left-0 top-0 bottom-0 w-1"
                :class="categoryIndicatorClass(item.category)"
              />

              <!-- Header -->
              <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-2 pl-2">
                <div class="min-w-0">
                  <h3 class="text-sm font-semibold text-ln-gray-900 truncate">
                    {{ item.title || 'Document sans titre' }}
                  </h3>
                  <div class="flex flex-wrap items-center gap-2 mt-1">
                    <StatusBadge
                      :status="mapStatusForBadge(item.status)"
                      :label="item.status"
                      size="sm"
                    />
                    <span class="text-[11px] text-ln-gray-500">{{ categoryLabel(item.category) }}</span>
                    <span class="text-[11px] text-ln-gray-400">·</span>
                    <span class="text-[11px] text-ln-gray-500">{{ sourceLabel(item.source) }}</span>
                    <span v-if="item.document_type" class="text-[11px] text-ln-gray-400">·</span>
                    <span
                      v-if="item.document_type"
                      class="text-[11px] text-ln-gray-500 capitalize"
                    >
                      {{ documentTypeLabel(item.document_type) }}
                    </span>
                  </div>
                </div>
                <div
                  v-if="item.issued_on"
                  class="text-xs text-ln-gray-500 whitespace-nowrap md:text-right"
                >
                  {{ formatDate(item.issued_on) }}
                </div>
              </div>

              <!-- Meta : version, montant, code -->
              <div class="flex flex-wrap items-center gap-3 pl-2 text-xs text-ln-gray-600">
                <span v-if="item.document_version">Version {{ item.document_version }}</span>
                <span v-if="item.amount != null" class="font-medium text-ln-gray-900">
                  {{ formatAmount(item.amount, item.currency) }}
                </span>
                <span v-if="item.verification_code" class="font-mono text-ln-gray-500">
                  Code : {{ item.verification_code }}
                </span>
                <span v-if="item.verified" class="text-ln-success font-medium"> Vérifié </span>
              </div>

              <!-- Warnings item -->
              <div v-if="item.warnings?.length" class="pl-2">
                <p
                  v-for="(w, idx) in item.warnings"
                  :key="`iw-${item.id}-${idx}`"
                  class="text-xs text-ln-warning"
                >
                  {{ w }}
                </p>
              </div>

              <!-- Actions -->
              <div class="flex flex-wrap gap-2 pl-2 pt-1">
                <template
                  v-for="(action, aidx) in item.actions"
                  :key="`a-${item.id}-${aidx}`"
                >
                  <button
                    v-if="action.type === 'validate'"
                    type="button"
                    class="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-ln-blue-900 hover:bg-ln-blue-700 px-3 py-2 rounded-sm focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px]"
                    @click="handleAction(action)"
                  >
                    Valider
                  </button>
                  <button
                    v-else-if="action.type === 'view'"
                    type="button"
                    class="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-ln-blue-900 hover:bg-ln-blue-700 px-3 py-2 rounded-sm focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px]"
                    @click="handleAction(action)"
                  >
                    Voir
                  </button>
                  <button
                    v-else-if="action.type === 'verify'"
                    type="button"
                    class="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-ln-blue-900 bg-ln-blue-50 hover:bg-ln-blue-100 px-3 py-2 rounded-sm focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px]"
                    @click="handleAction(action)"
                  >
                    Vérifier
                  </button>
                  <button
                    v-else-if="action.type === 'download'"
                    type="button"
                    class="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-ln-gray-700 bg-ln-gray-100 hover:bg-ln-gray-200 px-3 py-2 rounded-sm focus:outline-none focus:ring-2 focus:ring-ln-gray-500/25 min-h-[44px]"
                    @click="handleAction(action)"
                  >
                    Télécharger
                  </button>
                </template>
                <span v-if="!item.actions?.length" class="text-xs text-ln-gray-400 italic">
                  Aucune action disponible
                </span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Modale de prévisualisation HTML -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="previewOpen"
          class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          @click.self="closePreview"
        >
          <div
            class="bg-white rounded-lg border border-ln-gray-200 shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
          >
            <!-- Header modale -->
            <div class="flex items-center justify-between px-5 py-4 border-b border-ln-gray-200">
              <h3 class="text-base font-semibold text-ln-gray-900">{{ previewTitle }}</h3>
              <button
                type="button"
                class="p-2 rounded-md-ln text-ln-gray-500 hover:text-ln-gray-700 hover:bg-ln-gray-50 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px] min-w-[44px] flex items-center justify-center"
                @click="closePreview"
                aria-label="Fermer"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M15 5L5 15M5 5l10 10" />
                </svg>
              </button>
            </div>

            <!-- Corps modale -->
            <div class="flex-1 overflow-y-auto p-5">
              <div v-if="previewLoading" class="grid gap-3">
                <BlockSkeleton :lines="4" :show-title="true" />
              </div>
              <BlockError
                v-else-if="previewError"
                title="Impossible d'afficher le document"
                :message="previewError"
                :retry="null"
              />
              <!-- Le contenu HTML ci-dessous provient exclusivement des endpoints whitelistés (get_document_content / get_receipt_html). Jamais de rendering HTML sur des champs utilisateur. -->
              <div v-else class="text-sm text-ln-gray-800" v-html="previewHtml" />
            </div>

            <!-- Footer modale -->
            <div class="px-5 py-3 border-t border-ln-gray-200 flex justify-end">
              <button
                type="button"
                class="text-xs font-semibold text-ln-gray-700 bg-ln-gray-100 hover:bg-ln-gray-200 px-4 py-2 rounded-sm focus:outline-none focus:ring-2 focus:ring-ln-gray-500/25 min-h-[44px]"
                @click="closePreview"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
