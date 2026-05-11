<script setup>
// SupportDetailPage — détail d'une Support Request
// Refs : D05 §10.3, U03 §8.5, T03 F-CF-016d
// DEC : DEC-097 (pas de messagerie), DEC-119 (annulation), DEC-127 (composable custom fetch)
// P4-FRONT-002 : boutons clôture et rating activés

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Paperclip, Star, CheckCircle2, XCircle } from 'lucide-vue-next';
import { useSupportApi } from '@/composables/useSupportApi';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import BlockError from '@/components/ui/BlockError.vue';
import AlertBlock from '@/components/ui/AlertBlock.vue';

const route = useRoute();
const router = useRouter();

const api = useSupportApi();
const {
  currentRequest,
  isLoading,
  error,
  loadDetail,
  cancelRequest,
  closeRequest,
  rateRequest,
  mapRequestStatus,
} = api;

// ── Chargement ──────────────────────────────────────────────────────
const requestId = computed(() => route.params.id);

async function reload() {
  if (requestId.value) {
    await loadDetail(requestId.value);
  }
}

onMounted(reload);

// Recharger si l'utilisateur navigue entre deux détails via router-link
watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) reload();
  },
);

// ── Format date lisible ────────────────────────────────────────────
function formatDateTime(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

// ── Badge statut ────────────────────────────────────────────────────
const statusMeta = computed(() =>
  currentRequest.value ? mapRequestStatus(currentRequest.value.status) : null,
);

// ── Visibilité des sections conditionnelles ────────────────────────
const showAgentResponse = computed(
  () =>
    currentRequest.value?.status === 'Répondu' &&
    !!currentRequest.value?.response,
);

const canCancel = computed(
  () => currentRequest.value?.status === 'Nouveau',
);

const canClose = computed(
  () => currentRequest.value?.status === 'Répondu',
);

const canRate = computed(
  () => ['Répondu', 'Clos'].includes(currentRequest.value?.status),
);

function sanitizeAttachmentUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw;

  try {
    const parsed = new URL(raw, window.location.origin);
    if (['http:', 'https:'].includes(parsed.protocol)) {
      return parsed.href;
    }
  } catch {
    return null;
  }
  return null;
}

const safeAttachmentUrl = computed(() => sanitizeAttachmentUrl(currentRequest.value?.attachment));
const hasAttachment = computed(() => !!safeAttachmentUrl.value);

// ── Rating interactif ──────────────────────────────────────────────
const currentRating = computed(() => {
  const r = currentRequest.value?.satisfaction_rating;
  if (!r) return 0;
  const n = parseInt(r, 10);
  return Number.isFinite(n) ? n : 0;
});

const hoverRating = ref(0);
const isRating = ref(false);
const rateError = ref(null);

async function submitRating(rating) {
  if (!currentRequest.value || isRating.value) return;
  isRating.value = true;
  rateError.value = null;

  const ok = await rateRequest(currentRequest.value.name, rating);
  isRating.value = false;

  if (!ok) {
    rateError.value = error.value || "Impossible d'enregistrer l'évaluation.";
  }
}

// ── Dialog de confirmation d'annulation (inline v-if) ──────────────
const showCancelDialog = ref(false);
const cancelling = ref(false);
const cancelError = ref(null);

function openCancelDialog() {
  cancelError.value = null;
  showCancelDialog.value = true;
}

function closeCancelDialog() {
  if (cancelling.value) return; // Ne pas fermer pendant l'appel
  showCancelDialog.value = false;
}

async function confirmCancel() {
  if (!currentRequest.value) return;
  cancelling.value = true;
  cancelError.value = null;
  const ok = await cancelRequest(currentRequest.value.name);
  cancelling.value = false;
  if (ok) {
    showCancelDialog.value = false;
    // Recharger le détail pour afficher le nouveau statut "Annulé"
    await reload();
  } else {
    cancelError.value = error.value || "Impossible d'annuler la demande.";
  }
}

// ── Clôture de la demande ──────────────────────────────────────────
const closing = ref(false);
const closeError = ref(null);

async function confirmClose() {
  if (!currentRequest.value || closing.value) return;
  closing.value = true;
  closeError.value = null;

  const ok = await closeRequest(currentRequest.value.name);
  closing.value = false;

  if (ok) {
    await reload();
  } else {
    closeError.value = error.value || "Impossible de clore la demande.";
  }
}

// ── Retour arrière ──────────────────────────────────────────────────
function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/support');
  }
}
</script>

<template>
  <div class="flex flex-col gap-6 max-w-3xl">
    <!-- Lien retour -->
    <button
      type="button"
      class="inline-flex items-center gap-1.5 text-sm text-ln-blue-900 hover:underline focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 rounded px-1 self-start min-h-[44px]"
      @click="goBack"
    >
      <ArrowLeft class="w-4 h-4" aria-hidden="true" />
      Mes demandes
    </button>

    <!-- État : chargement -->
    <BlockSkeleton v-if="isLoading && !currentRequest" :lines="6" />

    <!-- État : erreur -->
    <div v-else-if="error && !currentRequest" class="space-y-3">
      <BlockError
        title="Demande introuvable"
        :message="error"
        :retry="reload"
      />
      <button
        type="button"
        class="text-sm text-ln-blue-900 underline min-h-[44px] px-2"
        @click="goBack"
      >
        Retour à mes demandes
      </button>
    </div>

    <!-- État : demande chargée -->
    <article v-else-if="currentRequest" class="space-y-6">
      <!-- Header -->
      <header class="border-b border-ln-gray-200 pb-4">
        <div class="flex items-start justify-between gap-3 flex-wrap mb-2">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-xs font-mono text-ln-gray-500">[{{ currentRequest.name }}]</span>
            <StatusBadge
              v-if="statusMeta"
              :status="statusMeta.status"
              :label="statusMeta.label"
            />
          </div>
        </div>
        <h1 class="text-xl font-bold text-ln-gray-900 mb-1">{{ currentRequest.subject }}</h1>
        <p class="text-sm text-ln-gray-600">
          <span>{{ currentRequest.target_service }}</span>
          <span v-if="currentRequest.category"> · {{ currentRequest.category }}</span>
          <span v-if="currentRequest.creation">
            · Soumise le {{ formatDateTime(currentRequest.creation) }}
          </span>
        </p>
      </header>

      <!-- Section : message original -->
      <section>
        <h2 class="text-xs font-semibold text-ln-gray-600 uppercase tracking-wider mb-2">
          Votre message
        </h2>
        <p class="text-sm text-ln-gray-700 whitespace-pre-wrap">
          {{ currentRequest.message }}
        </p>

        <!-- Pièce jointe si présente (le backend peut retourner une URL) -->
        <div v-if="hasAttachment" class="mt-3">
          <a
            :href="safeAttachmentUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 text-sm text-ln-blue-900 hover:underline min-h-[44px] px-1"
          >
            <Paperclip class="w-4 h-4" aria-hidden="true" />
            Pièce jointe
          </a>
        </div>
      </section>

      <!-- Section : réponse de l'agent (si Répondu) -->
      <section v-if="showAgentResponse" class="border-t border-ln-gray-200 pt-4">
        <h2 class="text-xs font-semibold text-ln-gray-600 uppercase tracking-wider mb-2">
          Réponse du service
        </h2>
        <div class="bg-ln-gray-50 border border-ln-gray-200 rounded-md p-4">
          <p class="text-xs text-ln-gray-500 mb-2">
            <strong>{{ currentRequest.target_service }}</strong>
            <span v-if="currentRequest.responded_at">
              · {{ formatDateTime(currentRequest.responded_at) }}
            </span>
            <span v-if="currentRequest.responded_by"> · {{ currentRequest.responded_by }}</span>
          </p>
          <p class="text-sm text-ln-gray-700 whitespace-pre-wrap">
            {{ currentRequest.response }}
          </p>
        </div>

        <!-- Bouton "Marquer comme résolu" (uniquement si Répondu) -->
        <div v-if="canClose" class="mt-4">
          <AlertBlock
            v-if="closeError"
            severity="error"
            title="Clôture impossible"
            :description="closeError"
            class="mb-3"
          />
          <button
            type="button"
            :disabled="closing"
            class="inline-flex items-center gap-1.5 rounded-md border border-ln-gray-200 bg-white text-ln-gray-700 hover:border-success-300 hover:text-ln-success focus:outline-none focus:ring-2 focus:ring-success-500/25 text-sm font-medium px-4 py-2 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
            @click="confirmClose"
          >
            <CheckCircle2 class="w-4 h-4" aria-hidden="true" />
            <span v-if="closing">Clôture en cours…</span>
            <span v-else>Marquer comme résolu</span>
          </button>
          <p class="text-xs text-ln-gray-500 mt-2">
            Confirmez que vous avez reçu une réponse satisfaisante.
          </p>
        </div>
      </section>

      <!-- Section : évaluation (si Répondu ou Clos) -->
      <section v-if="canRate" class="border-t border-ln-gray-200 pt-4">
        <h2 class="text-xs font-semibold text-ln-gray-600 uppercase tracking-wider mb-2">
          Évaluer cette réponse
        </h2>

        <AlertBlock
          v-if="rateError"
          severity="error"
          title="Évaluation impossible"
          :description="rateError"
          class="mb-3"
        />

        <div
          class="flex items-center gap-1"
          role="radiogroup"
          :aria-label="currentRating ? `Note actuelle : ${currentRating} sur 5` : 'Évaluer la réponse'"
        >
          <button
            v-for="n in 5"
            :key="n"
            type="button"
            :disabled="isRating"
            :aria-label="`Note ${n} sur 5`"
            :title="`Attribuer ${n} étoile${n > 1 ? 's' : ''}`"
            class="p-1 rounded hover:bg-ln-gray-100 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            @mouseenter="hoverRating = n"
            @mouseleave="hoverRating = 0"
            @click="submitRating(n)"
          >
            <Star
              class="w-5 h-5"
              :class="(hoverRating || currentRating) >= n ? 'text-warning-500 fill-warning-500' : 'text-ln-gray-300'"
              aria-hidden="true"
            />
          </button>
          <span v-if="currentRating" class="text-xs text-ln-gray-500 ml-2">
            Votre note : {{ currentRating }}/5
          </span>
        </div>
      </section>

      <!-- Section : annulation (si statut Nouveau) -->
      <section v-if="canCancel" class="border-t border-ln-gray-200 pt-4">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-md border border-ln-gray-200 bg-white text-ln-gray-600 text-sm font-medium px-4 py-2 hover:border-error-300 hover:text-ln-error focus:outline-none focus:ring-2 focus:ring-error-500/25 min-h-[44px]"
          @click="openCancelDialog"
        >
          <XCircle class="w-4 h-4" aria-hidden="true" />
          Annuler cette demande
        </button>
        <p class="text-xs text-ln-gray-500 mt-2">
          Vous pouvez annuler tant que votre demande n'a pas été prise en charge.
        </p>
      </section>
    </article>

    <!-- Dialog inline de confirmation d'annulation -->
    <Teleport to="body">
      <div
        v-if="showCancelDialog"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        @click.self="closeCancelDialog"
      >
        <div
          class="bg-white rounded-xl border border-ln-gray-200 shadow-xl w-full max-w-md p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-dialog-title"
        >
          <h2 id="cancel-dialog-title" class="text-lg font-semibold text-ln-gray-900 mb-2">
            Confirmer l'annulation
          </h2>
          <p class="text-sm text-ln-gray-700 mb-4">
            Êtes-vous sûr de vouloir annuler cette demande&nbsp;? Cette action est irréversible.
          </p>

          <AlertBlock
            v-if="cancelError"
            severity="error"
            title="Annulation impossible"
            :description="cancelError"
          />

          <div class="flex gap-2 flex-wrap justify-end mt-4">
            <button
              type="button"
              :disabled="cancelling"
              class="rounded-md border border-ln-gray-200 bg-white text-ln-gray-700 text-sm font-medium px-4 py-2 hover:border-ln-gray-200 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
              @click="closeCancelDialog"
            >
              Garder la demande
            </button>
            <button
              type="button"
              :disabled="cancelling"
              class="rounded-md bg-ln-error text-white text-sm font-medium px-4 py-2 hover:bg-ln-error focus:outline-none focus:ring-2 focus:ring-error-500/25 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
              @click="confirmCancel"
            >
              <span v-if="cancelling">Annulation en cours…</span>
              <span v-else>Confirmer l'annulation</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
