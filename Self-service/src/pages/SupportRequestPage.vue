<script setup>
// SupportRequestPage — CF-016 Contact Services Administratifs
// 3 onglets : Annuaire · Nouvelle demande · Mes demandes
// Refs : D05 §10, U03 §8.5, U07 §4.16
// DEC : DEC-097 (pas de messagerie), DEC-119 (quota 5), DEC-122 (info réclamation),
//       DEC-127 (composable custom fetch), DEC-139 (pas de congés), DEC-140 (pas SupportBlock)

import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { useRoute } from 'vue-router';
import { MessageCircle, ChevronRight, Paperclip, X } from 'lucide-vue-next';
import {
  useSupportApi,
  SUPPORT_CATEGORIES,
  SUPPORT_PRIORITIES,
  STATUS_FILTER_OPTIONS,
  MAX_OPEN_REQUESTS,
} from '@/composables/useSupportApi';
import SupportServiceTile from '@/components/ui/SupportServiceTile.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import AlertBlock from '@/components/ui/AlertBlock.vue';

const api = useSupportApi();
const route = useRoute();

// Destructuration : les refs / reactive / computed restent réactifs,
// les fonctions opèrent sur le singleton partagé du domaine support.
const {
  services,
  requests,
  filteredRequests,
  statusFilter,
  openCount,
  isLoading,
  isSubmitting,
  error,
  submitError,
  form,
  charCount,
  canSubmit,
  quotaReached,
  loadServices,
  loadMyRequests,
  submitRequest,
  resetForm,
  mapRequestStatus,
} = api;

const tab = ref('directory'); // 'directory' | 'new' | 'mine'
const fileInput = ref(null);
const attachmentError = ref('');

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
const ACCEPTED_ATTACHMENT_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
const QUERY_TYPE_SERVICE = {
  conge: 'RH',
  congé: 'RH',
  bulletin: 'RH',
  rh: 'RH',
  scolarite: 'SCOLARITE',
  scolarité: 'SCOLARITE',
  finance: 'FINANCE',
  technique: 'SUPPORT_TECH',
};

// ── Toast succès (AlertBlock inline + auto-hide 4s) ────────────────
const showSuccess = ref(false);
let successTimer = null;

async function onSubmit() {
  if (!canSubmit.value || attachmentError.value) return;
  const ok = await submitRequest();
  if (ok) {
    clearAttachment();
    showSuccess.value = true;
    if (successTimer) clearTimeout(successTimer);
    successTimer = setTimeout(() => {
      showSuccess.value = false;
      successTimer = null;
    }, 4000);
  }
}

onBeforeUnmount(() => {
  if (successTimer) clearTimeout(successTimer);
});

// ── Sélection de service depuis l'annuaire ─────────────────────────
const selectedService = computed(
  () => services.value.find((s) => s.service_code === form.service) || null,
);

function selectServiceForForm(svc) {
  form.service = svc.service_code;
  tab.value = 'new';
}

function clearSelectedService() {
  form.service = '';
  tab.value = 'directory';
}

function openAttachmentPicker() {
  fileInput.value?.click();
}

function clearAttachment() {
  form.attachment = null;
  attachmentError.value = '';
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}

function handleAttachmentChange(event) {
  attachmentError.value = '';
  const file = event?.target?.files?.[0] || null;

  if (!file) {
    clearAttachment();
    return;
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ACCEPTED_ATTACHMENT_EXTENSIONS.includes(extension)) {
    clearAttachment();
    attachmentError.value =
      'Format non pris en charge. Utilisez PDF, JPG, PNG, DOC ou DOCX.';
    return;
  }

  if (file.size > MAX_ATTACHMENT_SIZE) {
    clearAttachment();
    attachmentError.value = 'La pièce jointe ne doit pas dépasser 5 Mo.';
    return;
  }

  form.attachment = file;
}

// ── Service Scolarité (pour lien DEC-122 Réclamation) ──────────────
const scolariteService = computed(
  () => services.value.find((s) => s.service_code === 'SCOLARITE') || null,
);

function switchToScolarite() {
  if (scolariteService.value) {
    form.service = scolariteService.value.service_code;
  }
}

function applyQueryType() {
  const rawType = String(route.query.type || '').trim().toLowerCase();
  const serviceCode = QUERY_TYPE_SERVICE[rawType];
  if (!serviceCode) return;
  if (!services.value.some((svc) => svc.service_code === serviceCode)) return;
  form.service = serviceCode;
  tab.value = 'new';
}

// ── Quota (DEC-119) ─────────────────────────────────────────────────
const quotaStatus = computed(() => {
  if (openCount.value >= MAX_OPEN_REQUESTS) return 'blocked';
  if (openCount.value >= MAX_OPEN_REQUESTS - 1) return 'compensated';
  return 'quota';
});

const quotaLabel = computed(
  () => `${openCount.value}/${MAX_OPEN_REQUESTS} ouverte${openCount.value > 1 ? 's' : ''}`,
);

// ── Compteur sujet (rouge si > 190) ─────────────────────────────────
const subjectCountClass = computed(() =>
  charCount.value > 190 ? 'text-ln-error font-semibold' : 'text-ln-gray-500',
);

// ── Longueur message (indicateur min 20) ───────────────────────────
const messageLen = computed(() => form.message.length);
const messageCountClass = computed(() =>
  messageLen.value > 0 && messageLen.value < 20 ? 'text-ln-warning' : 'text-ln-gray-500',
);

// ── État vide global ────────────────────────────────────────────────
const showEmptyState = computed(
  () =>
    !isLoading.value &&
    requests.value.length === 0 &&
    openCount.value === 0 &&
    statusFilter.value === 'all',
);

// ── Format date relative (fr, sans dépendance externe) ─────────────
function formatRelative(iso) {
  if (!iso) return '';
  try {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '';
    const diffSec = Math.round((Date.now() - then) / 1000);
    if (diffSec < 60) return "à l'instant";
    const diffMin = Math.round(diffSec / 60);
    if (diffMin < 60) return `il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`;
    const diffH = Math.round(diffMin / 60);
    if (diffH < 24) return `il y a ${diffH} heure${diffH > 1 ? 's' : ''}`;
    const diffD = Math.round(diffH / 24);
    if (diffD < 30) return `il y a ${diffD} jour${diffD > 1 ? 's' : ''}`;
    const diffMo = Math.round(diffD / 30);
    if (diffMo < 12) return `il y a ${diffMo} mois`;
    const diffY = Math.round(diffMo / 12);
    return `il y a ${diffY} an${diffY > 1 ? 's' : ''}`;
  } catch {
    return '';
  }
}

onMounted(async () => {
  await loadServices();
  applyQueryType();
  await loadMyRequests();
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <header>
      <h1 class="text-2xl font-bold text-ln-gray-900 mb-1">Contact services administratifs</h1>
      <p class="text-sm text-ln-gray-600">
        Choisissez un service, rédigez votre demande et suivez son état depuis votre cockpit.
      </p>
    </header>

    <!-- Toast succès inline (auto-hide 4s) -->
    <Transition name="fade">
      <AlertBlock
        v-if="showSuccess"
        severity="success"
        title="Demande envoyée"
        description="Nous vous répondrons sous 48h."
      />
    </Transition>

    <!-- Onglets -->
    <nav
      class="flex gap-1 border-b border-ln-gray-200"
      role="tablist"
      aria-label="Sections support"
    >
      <button
        type="button"
        role="tab"
        :aria-selected="tab === 'directory'"
        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px]"
        :class="tab === 'directory' ? 'border-ln-blue-500 text-ln-blue-900' : 'border-transparent text-ln-gray-600 hover:text-ln-gray-900'"
        @click="tab = 'directory'"
      >
        Annuaire
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="tab === 'new'"
        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px]"
        :class="tab === 'new' ? 'border-ln-blue-500 text-ln-blue-900' : 'border-transparent text-ln-gray-600 hover:text-ln-gray-900'"
        @click="tab = 'new'"
      >
        Nouvelle demande
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="tab === 'mine'"
        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px]"
        :class="tab === 'mine' ? 'border-ln-blue-500 text-ln-blue-900' : 'border-transparent text-ln-gray-600 hover:text-ln-gray-900'"
        @click="tab = 'mine'"
      >
        Mes demandes
        <span
          v-if="requests.length"
          class="ml-1 inline-block text-[10px] font-semibold bg-ln-blue-50 text-ln-blue-900 rounded-full px-1.5 py-0.5 align-middle"
        >
          {{ requests.length }}
        </span>
      </button>
    </nav>

    <!-- Onglet Annuaire -->
    <section v-if="tab === 'directory'" role="tabpanel">
      <div v-if="isLoading && !services.length" class="text-sm text-ln-gray-500">
        Chargement des services…
      </div>
      <div v-else-if="error && !services.length" class="text-sm text-ln-error">
        {{ error }}
      </div>
      <div v-else-if="!services.length" class="text-sm text-ln-gray-500">
        Aucun service disponible pour votre profil.
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <SupportServiceTile
          v-for="svc in services"
          :key="svc.service_code"
          :service="svc"
          :selected="svc.service_code === form.service"
          @select="selectServiceForForm"
        />
      </div>
    </section>

    <!-- Onglet Nouvelle demande -->
    <section v-if="tab === 'new'" role="tabpanel" class="space-y-4">
      <!-- En-tête avec quota -->
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <h2 class="text-sm font-semibold text-ln-gray-900">Nouvelle demande</h2>
        <StatusBadge :status="quotaStatus" :label="quotaLabel" />
      </div>

      <!-- Alerte quota atteint (remplace le bouton Envoyer) -->
      <AlertBlock
        v-if="quotaReached"
        severity="error"
        title="Limite de demandes ouvertes atteinte"
        description="Vous avez déjà 5 demandes ouvertes. Clôturez ou annulez une demande existante pour en créer une nouvelle."
      />

      <!-- Invite à choisir un service -->
      <div v-if="!form.service" class="text-sm text-ln-gray-600">
        Commencez par choisir un service dans l'annuaire.
        <button
          type="button"
          class="text-ln-blue-900 underline focus:outline-none"
          @click="tab = 'directory'"
        >
          Voir l'annuaire
        </button>
      </div>

      <!-- Formulaire -->
      <form v-else class="space-y-4" @submit.prevent="onSubmit">
        <fieldset :disabled="quotaReached || isSubmitting" class="space-y-4">
          <!-- Rappel service -->
          <div class="bg-ln-gray-50 border border-ln-gray-200 rounded-md p-3 text-sm">
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1 min-w-0">
                <strong>{{ selectedService?.service_name }}</strong>
                <p class="text-xs text-ln-gray-600 mt-1">{{ selectedService?.description }}</p>
              </div>
              <button
                type="button"
                class="text-xs text-ln-blue-900 underline flex-shrink-0 min-h-[44px] px-2"
                @click="clearSelectedService"
              >
                Changer
              </button>
            </div>
          </div>

          <!-- Catégorie -->
          <div>
            <label for="sreq-category" class="block text-xs font-semibold text-ln-gray-700 mb-1">
              Catégorie <span class="text-ln-error">*</span>
            </label>
            <select
              id="sreq-category"
              v-model="form.category"
              class="block w-full rounded-md border border-ln-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px]"
            >
              <option v-for="cat in SUPPORT_CATEGORIES" :key="cat.value" :value="cat.value">
                {{ cat.label }}
              </option>
            </select>
          </div>

          <!-- Info-box DEC-122 si Réclamation -->
          <AlertBlock
            v-if="form.category === 'Réclamation'"
            severity="info"
            title="Processus formel de réclamation"
            description="Pour une réclamation de note, suivez la procédure formelle définie par la Scolarité. Le support n'est pas le canal approprié (DEC-122)."
            :action-label="scolariteService && form.service !== 'SCOLARITE' ? 'Contacter la Scolarité' : ''"
            :on-action="scolariteService && form.service !== 'SCOLARITE' ? switchToScolarite : null"
          />

          <!-- Sujet -->
          <div>
            <label for="sreq-subject" class="block text-xs font-semibold text-ln-gray-700 mb-1">
              Sujet <span class="text-ln-error">*</span>
              <span :class="subjectCountClass">({{ charCount }}/200)</span>
            </label>
            <input
              id="sreq-subject"
              v-model="form.subject"
              type="text"
              maxlength="200"
              required
              placeholder="Résumé en une phrase (3 caractères minimum)"
              class="block w-full rounded-md border border-ln-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px]"
            />
          </div>

          <!-- Message -->
          <div>
            <label for="sreq-message" class="block text-xs font-semibold text-ln-gray-700 mb-1">
              Message <span class="text-ln-error">*</span>
              <span :class="messageCountClass">({{ messageLen }} caractères — min. 20)</span>
            </label>
            <textarea
              id="sreq-message"
              v-model="form.message"
              rows="6"
              maxlength="5000"
              required
              placeholder="Décrivez votre demande avec le plus de détails utiles."
              class="block w-full rounded-md border border-ln-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
            ></textarea>
          </div>

          <!-- Pièce jointe -->
          <div>
            <label for="sreq-attachment" class="block text-xs font-semibold text-ln-gray-700 mb-1">
              Pièce jointe <span class="text-ln-gray-500">(optionnel)</span>
            </label>
            <input
              id="sreq-attachment"
              ref="fileInput"
              type="file"
              class="sr-only"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              @change="handleAttachmentChange"
            />
            <div class="space-y-2">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-md border border-dashed border-ln-gray-200 bg-ln-gray-50 px-3 py-2 text-sm text-ln-gray-700 hover:border-ln-gray-200 hover:bg-white focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px]"
                @click="openAttachmentPicker"
              >
                <Paperclip class="w-4 h-4" aria-hidden="true" />
                <span>{{ form.attachment ? 'Remplacer la pièce jointe' : 'Ajouter une pièce jointe' }}</span>
              </button>
              <p class="text-xs text-ln-gray-500">
                Formats acceptés : PDF, JPG, PNG, DOC, DOCX. Taille maximale : 5 Mo.
              </p>
              <AlertBlock
                v-if="attachmentError"
                severity="error"
                title="Pièce jointe refusée"
                :description="attachmentError"
              />
              <div
                v-if="form.attachment"
                class="flex items-center gap-2 text-sm text-ln-gray-600"
              >
                <Paperclip class="w-4 h-4" aria-hidden="true" />
                <span class="min-w-0 flex-1 truncate">{{ form.attachment.name }}</span>
                <button
                  type="button"
                  class="text-ln-gray-500 hover:text-ln-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Supprimer la pièce jointe"
                  @click="clearAttachment"
                >
                  <X class="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          <!-- Priorité -->
          <div>
            <label class="block text-xs font-semibold text-ln-gray-700 mb-1">Priorité</label>
            <div class="flex gap-4" role="radiogroup" aria-label="Priorité de la demande">
              <label
                v-for="prio in SUPPORT_PRIORITIES"
                :key="prio.value"
                class="flex items-center gap-2 text-sm text-ln-gray-700 min-h-[44px]"
              >
                <input
                  type="radio"
                  :value="prio.value"
                  v-model="form.priority"
                  class="accent-ln-blue-500"
                />
                {{ prio.label }}
              </label>
            </div>
          </div>
        </fieldset>

        <!-- Erreur submit -->
        <div
          v-if="submitError"
          class="text-sm text-ln-error bg-ln-error-bg border-l-[3px] border-l-ln-error rounded p-3"
          role="alert"
        >
          {{ submitError }}
        </div>

        <!-- Boutons d'action (masqués si quota atteint) -->
        <div v-if="!quotaReached" class="flex gap-2 flex-wrap">
          <button
            type="submit"
            :disabled="!canSubmit"
            class="rounded-md bg-ln-blue-900 text-white text-sm font-medium px-4 py-2 hover:bg-ln-blue-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px]"
          >
            <span v-if="isSubmitting">Envoi en cours…</span>
            <span v-else>Envoyer la demande</span>
          </button>
          <button
            type="button"
            class="rounded-md border border-ln-gray-200 bg-white text-ln-gray-700 text-sm font-medium px-4 py-2 hover:border-ln-gray-200 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px]"
            @click="clearSelectedService"
          >
            Changer de service
          </button>
        </div>
      </form>
    </section>

    <!-- Onglet Mes demandes -->
    <section v-if="tab === 'mine'" role="tabpanel">
      <div class="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <h2 class="text-sm font-semibold text-ln-gray-900">Mes demandes</h2>
        <div class="flex items-center gap-2">
          <label for="sreq-filter" class="text-xs text-ln-gray-600">Filtrer :</label>
          <select
            id="sreq-filter"
            v-model="statusFilter"
            class="rounded-md border border-ln-gray-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[36px]"
          >
            <option v-for="opt in STATUS_FILTER_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
      </div>

      <div v-if="isLoading && !requests.length" class="text-sm text-ln-gray-500">
        Chargement…
      </div>
      <div v-else-if="error && !requests.length" class="text-sm text-ln-error">
        {{ error }}
      </div>

      <!-- Empty state général -->
      <div
        v-else-if="showEmptyState"
        class="flex flex-col items-center justify-center py-12 px-4 text-center"
      >
        <MessageCircle class="w-8 h-8 text-ln-gray-300 mb-3" aria-hidden="true" />
        <p class="text-sm font-medium text-ln-gray-500">Aucune demande en cours</p>
        <p class="text-xs text-ln-gray-500 mt-1">Posez votre première question ci-dessus.</p>
        <button
          type="button"
          class="mt-4 text-sm text-ln-blue-900 underline min-h-[44px] px-2"
          @click="tab = 'directory'"
        >
          Parcourir les services
        </button>
      </div>

      <!-- Filtre appliqué mais aucun résultat -->
      <div
        v-else-if="!filteredRequests.length"
        class="text-sm text-ln-gray-500 py-6 text-center"
      >
        Aucune demande correspondant à ce filtre.
      </div>

      <!-- Liste -->
      <ul v-else class="flex flex-col gap-2">
        <li v-for="req in filteredRequests" :key="req.name">
          <router-link
            :to="`/support/${req.name}`"
            class="bg-white rounded-lg border border-ln-gray-200 p-4 flex items-start justify-between gap-4 hover:border-ln-gray-200 transition-colors no-underline"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <StatusBadge
                  :status="mapRequestStatus(req.status).status"
                  :label="mapRequestStatus(req.status).label"
                />
                <span class="text-xs text-ln-gray-500 truncate">{{ req.target_service }}</span>
              </div>
              <h3 class="text-sm font-semibold text-ln-gray-900 truncate">{{ req.subject }}</h3>
              <p class="text-xs text-ln-gray-500 mt-0.5">
                {{ req.name }} · {{ req.category }}<span v-if="req.creation"> · {{ formatRelative(req.creation) }}</span>
              </p>
            </div>
            <ChevronRight class="w-5 h-5 text-ln-gray-500 flex-shrink-0 mt-1" aria-hidden="true" />
          </router-link>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>
