<script setup>
// SupportRequestPage — CF-016 Contact Services Administratifs
// 3 onglets : Annuaire · Nouvelle demande · Mes demandes
// Refs : CF-016 §3-5, T03 F-CF-016a/b/c/d
import { computed, onMounted, reactive, ref } from 'vue';
import { useSupportApi } from '@/composables/useSupportApi';
import SupportServiceTile from '@/components/ui/SupportServiceTile.vue';
import SupportRequestDetailModal from '@/components/ui/SupportRequestDetailModal.vue';

const api = useSupportApi();

const tab = ref('directory'); // 'directory' | 'new' | 'mine'

// ── Annuaire ─────────────────────────────────────────────────────
const services = ref([]);
const servicesLoading = ref(false);
const servicesError = ref(null);

async function loadServices() {
  servicesLoading.value = true;
  servicesError.value = null;
  try {
    services.value = (await api.getServiceDirectory()) || [];
  } catch (err) {
    servicesError.value = err.message || 'Erreur de chargement';
  } finally {
    servicesLoading.value = false;
  }
}

// ── Formulaire Nouvelle demande ──────────────────────────────────
const form = reactive({
  service: null,
  subject: '',
  message: '',
  category: 'Information',
  priority: 'Normal',
});
const formSubmitting = ref(false);
const formError = ref(null);
const formSuccess = ref(null);

const subjectCount = computed(() => form.subject.length);
const messageCount = computed(() => form.message.length);

const canSubmit = computed(() =>
  !formSubmitting.value &&
  !!form.service &&
  form.subject.trim().length > 0 &&
  form.subject.length <= 200 &&
  form.message.trim().length > 0 &&
  form.message.length <= 5000,
);

function selectServiceForForm(svc) {
  form.service = svc;
  tab.value = 'new';
}

async function submitForm() {
  if (!canSubmit.value) return;
  formSubmitting.value = true;
  formError.value = null;
  formSuccess.value = null;
  try {
    const result = await api.createRequest({
      targetService: form.service.service_code,
      subject: form.subject.trim(),
      message: form.message.trim(),
      category: form.category,
      priority: form.priority,
    });
    formSuccess.value = `Votre demande ${result.name} a été envoyée.`;
    form.subject = '';
    form.message = '';
    form.category = 'Information';
    form.priority = 'Normal';
    await loadMine();
  } catch (err) {
    formError.value = err.message || "Impossible d'envoyer la demande.";
  } finally {
    formSubmitting.value = false;
  }
}

// ── Mes demandes ─────────────────────────────────────────────────
const myRequests = ref([]);
const myRequestsLoading = ref(false);
const myRequestsError = ref(null);
const selectedRequest = ref(null);

async function loadMine() {
  myRequestsLoading.value = true;
  myRequestsError.value = null;
  try {
    myRequests.value = (await api.getMyRequests()) || [];
  } catch (err) {
    myRequestsError.value = err.message || 'Erreur de chargement';
  } finally {
    myRequestsLoading.value = false;
  }
}

async function openDetail(req) {
  try {
    selectedRequest.value = await api.getRequestDetail(req.name);
  } catch (err) {
    selectedRequest.value = null;
    myRequestsError.value = err.message || 'Détail indisponible';
  }
}

function closeDetail() {
  selectedRequest.value = null;
}

function statusBadge(status) {
  const map = {
    Nouveau: 'bg-blue-100 text-blue-800',
    'En cours': 'bg-amber-100 text-amber-800',
    Répondu: 'bg-green-100 text-green-800',
    Transféré: 'bg-purple-100 text-purple-800',
    Clos: 'bg-neutral-200 text-neutral-700',
    Annulé: 'bg-red-100 text-red-800',
  };
  return map[status] || 'bg-neutral-100 text-neutral-700';
}

onMounted(() => {
  loadServices();
  loadMine();
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <header>
      <h1 class="text-2xl font-bold text-neutral-950 mb-1">Contacter un service</h1>
      <p class="text-sm text-neutral-600">
        Choisissez un service administratif, rédigez votre demande et suivez son état depuis votre cockpit.
      </p>
    </header>

    <nav
      class="flex gap-1 border-b border-subtle"
      role="tablist"
      aria-label="Sections support"
    >
      <button
        type="button"
        role="tab"
        :aria-selected="tab === 'directory'"
        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/25"
        :class="tab === 'directory' ? 'border-brand-500 text-brand-900' : 'border-transparent text-neutral-600 hover:text-neutral-900'"
        @click="tab = 'directory'"
      >
        Annuaire
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="tab === 'new'"
        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/25"
        :class="tab === 'new' ? 'border-brand-500 text-brand-900' : 'border-transparent text-neutral-600 hover:text-neutral-900'"
        @click="tab = 'new'"
      >
        Nouvelle demande
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="tab === 'mine'"
        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/25"
        :class="tab === 'mine' ? 'border-brand-500 text-brand-900' : 'border-transparent text-neutral-600 hover:text-neutral-900'"
        @click="tab = 'mine'"
      >
        Mes demandes
        <span
          v-if="myRequests.length"
          class="ml-1 inline-block text-[10px] font-semibold bg-brand-50 text-brand-900 rounded-full px-1.5 py-0.5 align-middle"
        >
          {{ myRequests.length }}
        </span>
      </button>
    </nav>

    <!-- Annuaire -->
    <section v-if="tab === 'directory'" role="tabpanel">
      <div v-if="servicesLoading" class="text-sm text-neutral-500">Chargement des services…</div>
      <div v-else-if="servicesError" class="text-sm text-red-600">{{ servicesError }}</div>
      <div v-else-if="!services.length" class="text-sm text-neutral-500">
        Aucun service disponible pour votre profil.
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <SupportServiceTile
          v-for="svc in services"
          :key="svc.service_code"
          :service="svc"
          :selected="form.service?.service_code === svc.service_code"
          @select="selectServiceForForm"
        />
      </div>
    </section>

    <!-- Formulaire -->
    <section v-if="tab === 'new'" role="tabpanel" class="space-y-4">
      <div v-if="!form.service" class="text-sm text-neutral-600">
        Commencez par choisir un service dans l'annuaire.
        <button
          type="button"
          class="text-brand-900 underline focus:outline-none"
          @click="tab = 'directory'"
        >
          Voir l'annuaire
        </button>
      </div>

      <form v-else class="space-y-4" @submit.prevent="submitForm">
        <div class="bg-neutral-50 border border-subtle rounded-md p-3 text-sm">
          <strong>{{ form.service.service_name }}</strong>
          <p class="text-xs text-neutral-600 mt-1">{{ form.service.description }}</p>
        </div>

        <div>
          <label class="block text-xs font-semibold text-neutral-700 mb-1" for="sreq-category">
            Catégorie
          </label>
          <select
            id="sreq-category"
            v-model="form.category"
            class="block w-full rounded-md border border-subtle bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/25"
          >
            <option value="Information">Information</option>
            <option value="Réclamation">Réclamation</option>
            <option value="Demande document">Demande de document</option>
            <option value="Autre">Autre</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-neutral-700 mb-1" for="sreq-subject">
            Objet <span class="text-neutral-500">({{ subjectCount }}/200)</span>
          </label>
          <input
            id="sreq-subject"
            v-model="form.subject"
            type="text"
            maxlength="200"
            required
            class="block w-full rounded-md border border-subtle bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/25"
            placeholder="Résumé en une phrase"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-neutral-700 mb-1" for="sreq-message">
            Message <span class="text-neutral-500">({{ messageCount }}/5000)</span>
          </label>
          <textarea
            id="sreq-message"
            v-model="form.message"
            maxlength="5000"
            rows="8"
            required
            class="block w-full rounded-md border border-subtle bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/25"
            placeholder="Décrivez votre demande avec le plus de détails utiles."
          ></textarea>
        </div>

        <div v-if="formError" class="text-sm text-red-600">{{ formError }}</div>
        <div v-if="formSuccess" class="text-sm text-green-700">{{ formSuccess }}</div>

        <div class="flex gap-2">
          <button
            type="submit"
            :disabled="!canSubmit"
            class="rounded-md bg-brand-900 text-white text-sm font-medium px-4 py-2 hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-500/25"
          >
            <span v-if="formSubmitting">Envoi en cours…</span>
            <span v-else>Envoyer la demande</span>
          </button>
          <button
            type="button"
            class="rounded-md border border-subtle bg-white text-neutral-700 text-sm font-medium px-4 py-2 hover:border-default focus:outline-none focus:ring-2 focus:ring-brand-500/25"
            @click="form.service = null; tab = 'directory'"
          >
            Changer de service
          </button>
        </div>
      </form>
    </section>

    <!-- Mes demandes -->
    <section v-if="tab === 'mine'" role="tabpanel">
      <div v-if="myRequestsLoading" class="text-sm text-neutral-500">Chargement…</div>
      <div v-else-if="myRequestsError" class="text-sm text-red-600">{{ myRequestsError }}</div>
      <div v-else-if="!myRequests.length" class="text-sm text-neutral-500">
        Vous n'avez pas encore envoyé de demande.
      </div>
      <ul v-else class="flex flex-col gap-2">
        <li
          v-for="req in myRequests"
          :key="req.name"
          class="bg-white rounded-lg border border-subtle p-4 flex items-start justify-between gap-4 hover:border-default cursor-pointer transition-colors"
          role="button"
          tabindex="0"
          @click="openDetail(req)"
          @keydown.enter="openDetail(req)"
          @keydown.space.prevent="openDetail(req)"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-medium rounded px-2 py-0.5" :class="statusBadge(req.status)">
                {{ req.status }}
              </span>
              <span class="text-xs text-neutral-500 truncate">{{ req.target_service }}</span>
            </div>
            <h3 class="text-sm font-semibold text-neutral-950 truncate">{{ req.subject }}</h3>
            <p class="text-xs text-neutral-500 mt-0.5">{{ req.name }} · {{ req.category }}</p>
          </div>
          <svg class="w-5 h-5 text-neutral-400 flex-shrink-0 mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </li>
      </ul>
    </section>

    <SupportRequestDetailModal :request="selectedRequest" @close="closeDetail" />
  </div>
</template>
