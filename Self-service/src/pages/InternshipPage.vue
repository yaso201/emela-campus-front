<script setup>
// InternshipPage — Page stage étudiant (L6-E05)
// Mode automatique : vue détail si stage existe, formulaire sinon
// Ref: U03 §8.6, D04 §5

import { computed, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, Briefcase, Calendar, MapPin, User } from 'lucide-vue-next';

import { useFrappeCall } from '@/composables/useFrappeCall';
import { useInternship } from '@/composables/useInternship';
import { useProfileStore } from '@/stores/profile';

import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import BlockError from '@/components/ui/BlockError.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import PhaseIndicator from '@/components/ui/PhaseIndicator.vue';
import AlertBlock from '@/components/ui/AlertBlock.vue';

const router = useRouter();
const profile = useProfileStore();

// ── Mode détail : useInternship ────────────────────────────────────
const {
  isLoading: internshipLoading,
  error: internshipError,
  internship,
  hasInternship,
  currentPhase,
  statusLabel,
  statusBadgeStatus,
  nextAction,
  phaseLabels,
  loadInternship,
} = useInternship();

// ── Mode formulaire : données existantes ────────────────────────────
const tutorsResource = useFrappeCall(
  'internship_app.api.portal_internship.list_academic_tutors',
);

const form = reactive({
  company_name: '',
  company_sector: '',
  company_address: '',
  company_city: '',
  company_country: 'Bénin',
  company_supervisor_name: '',
  company_supervisor_email: '',
  company_supervisor_phone: '',
  academic_tutor: '',
  start_date: '',
  end_date: '',
  mission_title: '',
  mission_description: '',
  mission_location: '',
});

const errors = reactive({});
const isSubmitting = ref(false);
const submitError = ref(null);
const submitSuccess = ref(null);

const sectors = [
  'Informatique',
  'Télécommunications',
  'Banque / Finance',
  'Santé',
  'Éducation',
  'Industrie',
  'Commerce',
  'Administration publique',
  'Autre',
];

const locations = ['Même ville', 'Autre ville', 'Étranger'];

const isStudent = computed(() => profile.profile === 'student');
const showProfileGuard = computed(() => !profile.isLoading && !profile.isGuest && !isStudent.value);
const tutors = computed(() => tutorsResource.data?.tutors || []);

// ── Logique de chargement initial ─────────────────────────────────
const pageLoading = computed(() => profile.isLoading || internshipLoading.value);
const pageError = computed(() => internshipError.value);

// Charger les données au montage
watch(() => profile.isLoading, (loading) => {
  if (!loading && isStudent.value) {
    loadInternship();
  }
}, { immediate: true });

// ── Helpers formulaire ────────────────────────────────────────────
function clearErrors() {
  Object.keys(errors).forEach((key) => delete errors[key]);
}

function validatePhone(value) {
  return /^\+\d{8,15}$/.test(value || '');
}

function validate() {
  clearErrors();
  submitError.value = null;

  if (!form.company_name.trim()) errors.company_name = 'Obligatoire';
  if (!form.company_sector) errors.company_sector = 'Obligatoire';
  if (!form.company_address.trim()) errors.company_address = 'Obligatoire';
  if (!form.company_city.trim()) errors.company_city = 'Obligatoire';
  if (!form.company_supervisor_name.trim()) errors.company_supervisor_name = 'Obligatoire';
  if (!form.company_supervisor_email.trim()) errors.company_supervisor_email = 'Obligatoire';
  if (!form.company_supervisor_phone.trim()) {
    errors.company_supervisor_phone = 'Obligatoire';
  } else if (!validatePhone(form.company_supervisor_phone)) {
    errors.company_supervisor_phone = 'Format international requis (+229...)';
  }
  if (!form.academic_tutor) errors.academic_tutor = 'Obligatoire';
  if (!form.start_date) errors.start_date = 'Obligatoire';
  if (!form.end_date) errors.end_date = 'Obligatoire';
  if (!form.mission_title.trim()) {
    errors.mission_title = 'Obligatoire';
  } else if (form.mission_title.length > 300) {
    errors.mission_title = '300 caractères maximum';
  }
  if (!form.mission_description.trim()) {
    errors.mission_description = 'Obligatoire';
  } else if (form.mission_description.trim().length < 100) {
    errors.mission_description = '100 caractères minimum';
  }
  if (!form.mission_location) errors.mission_location = 'Obligatoire';

  return Object.keys(errors).length === 0;
}

async function submitForm() {
  if (!validate()) return;

  isSubmitting.value = true;
  submitError.value = null;

  try {
    const body = new URLSearchParams();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        body.append(key, value);
      }
    });

    const response = await fetch(
      '/api/method/internship_app.api.portal_internship.submit_internship_form',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Frappe-CSRF-Token': window.csrf_token || '',
          Accept: 'application/json',
        },
        body: body.toString(),
        credentials: 'same-origin',
      },
    );

    const json = await response.json();
    if (!response.ok || json.exc) {
      throw new Error(json.message || json.exc || `HTTP ${response.status}`);
    }

    submitSuccess.value = json.message || json;
    // Recharger le stage après soumission réussie
    setTimeout(() => loadInternship(), 500);
  } catch (error) {
    submitError.value = error.message || 'Erreur lors de la soumission';
  } finally {
    isSubmitting.value = false;
  }
}

// ── Helpers mode détail ───────────────────────────────────────────
function formatDate(isoDate) {
  if (!isoDate) return '—';
  const d = new Date(isoDate);
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function goBack() {
  router.push('/');
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Header commun -->
    <header>
      <button
        type="button"
        class="inline-flex items-center text-sm text-ln-gray-600 hover:text-ln-gray-900 mb-2 min-h-[44px]"
        @click="goBack"
      >
        <ArrowLeft class="w-4 h-4 mr-1" aria-hidden="true" />
        Tableau de bord
      </button>
      <h1 class="text-2xl font-bold text-ln-gray-900">Mon stage</h1>
    </header>

    <!-- Loading -->
    <div v-if="pageLoading" class="flex flex-col gap-4">
      <BlockSkeleton :lines="5" :show-title="false" />
      <BlockSkeleton :lines="6" :show-title="false" />
    </div>

    <!-- Error -->
    <BlockError
      v-else-if="pageError"
      title="Impossible de charger le statut de stage"
      :message="pageError"
      :retry="loadInternship"
    />

    <!-- Guard profil non-étudiant -->
    <div
      v-else-if="showProfileGuard"
      class="bg-white rounded-lg border border-ln-gray-200 p-6 text-center"
    >
      <Briefcase class="w-12 h-12 text-ln-gray-300 mx-auto mb-3" aria-hidden="true" />
      <h2 class="text-base font-semibold text-ln-gray-900">Espace réservé aux étudiants</h2>
      <p class="text-sm text-ln-gray-600 mt-2">
        Cette page est accessible uniquement depuis un profil étudiant.
      </p>
    </div>

    <!-- Guest -->
    <div
      v-else-if="profile.isGuest"
      class="bg-white rounded-lg border border-ln-gray-200 p-6 text-center"
    >
      <h2 class="text-base font-semibold text-ln-gray-900">Connexion requise</h2>
      <p class="text-sm text-ln-gray-600 mt-2">
        Connectez-vous avec votre compte étudiant pour accéder à votre espace stage.
      </p>
    </div>

    <!-- Mode DÉTAIL : Stage existe -->
    <div v-else-if="hasInternship" class="flex flex-col gap-6">
      <!-- Carte principale : Statut + Entreprise -->
      <section class="bg-white rounded-lg border border-ln-gray-200 p-6">
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <StatusBadge :status="statusBadgeStatus" :label="statusLabel" />
        </div>
        
        <h2 class="text-lg font-semibold text-ln-gray-900">
          {{ internship.company_name }}
        </h2>
        
        <div class="flex items-center gap-2 text-sm text-ln-gray-600 mt-2">
          <Calendar class="w-4 h-4" aria-hidden="true" />
          <span>Du {{ formatDate(internship.start_date) }} au {{ formatDate(internship.end_date) }}</span>
        </div>
      </section>

      <!-- Avancement : 5 phases -->
      <section class="bg-white rounded-lg border border-ln-gray-200 p-6">
        <h3 class="text-sm font-semibold text-ln-gray-900 uppercase tracking-wider mb-4">
          Avancement
        </h3>
        <PhaseIndicator :current-phase="currentPhase || 0" :labels="phaseLabels" />
      </section>

      <!-- Détails du stage -->
      <section class="bg-white rounded-lg border border-ln-gray-200 p-6">
        <h3 class="text-sm font-semibold text-ln-gray-900 uppercase tracking-wider mb-4">
          Détails du stage
        </h3>
        
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="flex items-start gap-3">
            <Briefcase class="w-5 h-5 text-ln-gray-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div>
              <p class="text-xs text-ln-gray-500">Entreprise</p>
              <p class="text-sm font-medium text-ln-gray-900">{{ internship.company_name }}</p>
            </div>
          </div>
          
          <div class="flex items-start gap-3">
            <User class="w-5 h-5 text-ln-gray-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div>
              <p class="text-xs text-ln-gray-500">Tuteur académique</p>
              <p class="text-sm font-medium text-ln-gray-900">{{ internship.academic_tutor_name || '—' }}</p>
            </div>
          </div>
          
          <div class="flex items-start gap-3">
            <MapPin class="w-5 h-5 text-ln-gray-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div>
              <p class="text-xs text-ln-gray-500">Lieu</p>
              <p class="text-sm font-medium text-ln-gray-900">{{ internship.company_city || '—' }}</p>
            </div>
          </div>
          
          <div class="flex items-start gap-3">
            <Calendar class="w-5 h-5 text-ln-gray-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div>
              <p class="text-xs text-ln-gray-500">Période</p>
              <p class="text-sm font-medium text-ln-gray-900">
                {{ formatDate(internship.start_date) }} – {{ formatDate(internship.end_date) }}
              </p>
            </div>
          </div>
        </div>

        <div v-if="internship.mission_title" class="mt-4 pt-4 border-t border-ln-gray-100">
          <p class="text-xs text-ln-gray-500">Mission</p>
          <p class="text-sm text-ln-gray-900 mt-1">{{ internship.mission_title }}</p>
        </div>
      </section>

      <!-- Prochaine étape (affiché seulement si nextAction existe) -->
      <AlertBlock
        v-if="nextAction"
        severity="info"
        :title="nextAction.label"
        :description="nextAction.route ? 'Cliquez ci-dessous pour accéder à la page concernée.' : ''"
        :action-label="nextAction.route ? 'Accéder' : ''"
        :on-action="nextAction.route ? () => router.push(nextAction.route) : null"
      />
    </div>

    <!-- Mode FORMULAIRE : Pas de stage -->
    <div v-else>
      <!-- Succès soumission -->
      <div
        v-if="submitSuccess"
        class="bg-white rounded-lg border border-emerald-200 p-6"
      >
        <h2 class="text-base font-semibold text-emerald-900">Fiche soumise</h2>
        <p class="text-sm text-emerald-800 mt-2">
          Votre fiche de stage a été enregistrée sous le numéro
          <strong>{{ submitSuccess.internship }}</strong>.
        </p>
        <p class="text-sm text-emerald-800 mt-1">
          Statut courant : {{ submitSuccess.status }}.
        </p>
        <button
          type="button"
          class="mt-4 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
          @click="loadInternship"
        >
          Actualiser le statut →
        </button>
      </div>

      <!-- Formulaire dépôt -->
      <form
        v-else
        class="bg-white rounded-lg border border-ln-gray-200 p-5 md:p-6 flex flex-col gap-6"
        @submit.prevent="submitForm"
        novalidate
      >
        <section class="grid gap-4 md:grid-cols-2">
          <div class="md:col-span-2">
            <h2 class="text-base font-semibold text-ln-gray-900">Entreprise</h2>
            <p class="text-sm text-ln-gray-600 mt-1">
              Renseignez les informations de la structure d'accueil.
            </p>
          </div>

          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium text-ln-gray-900">Nom de l'entreprise *</span>
            <input v-model="form.company_name" type="text" class="rounded border border-ln-gray-300 px-3 py-2 min-h-[44px]" />
            <span v-if="errors.company_name" class="text-xs text-red-600">{{ errors.company_name }}</span>
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium text-ln-gray-900">Secteur *</span>
            <select v-model="form.company_sector" class="rounded border border-ln-gray-300 px-3 py-2 min-h-[44px]">
              <option value="">Choisir</option>
              <option v-for="sector in sectors" :key="sector" :value="sector">{{ sector }}</option>
            </select>
            <span v-if="errors.company_sector" class="text-xs text-red-600">{{ errors.company_sector }}</span>
          </label>

          <label class="md:col-span-2 flex flex-col gap-1">
            <span class="text-sm font-medium text-ln-gray-900">Adresse *</span>
            <textarea v-model="form.company_address" rows="3" class="rounded border border-ln-gray-300 px-3 py-2" />
            <span v-if="errors.company_address" class="text-xs text-red-600">{{ errors.company_address }}</span>
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium text-ln-gray-900">Ville *</span>
            <input v-model="form.company_city" type="text" class="rounded border border-ln-gray-300 px-3 py-2 min-h-[44px]" />
            <span v-if="errors.company_city" class="text-xs text-red-600">{{ errors.company_city }}</span>
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium text-ln-gray-900">Pays *</span>
            <input v-model="form.company_country" type="text" class="rounded border border-ln-gray-300 px-3 py-2 min-h-[44px]" />
          </label>
        </section>

        <section class="grid gap-4 md:grid-cols-2">
          <div class="md:col-span-2">
            <h2 class="text-base font-semibold text-ln-gray-900">Tuteur entreprise</h2>
          </div>

          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium text-ln-gray-900">Nom complet *</span>
            <input v-model="form.company_supervisor_name" type="text" class="rounded border border-ln-gray-300 px-3 py-2 min-h-[44px]" />
            <span v-if="errors.company_supervisor_name" class="text-xs text-red-600">{{ errors.company_supervisor_name }}</span>
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium text-ln-gray-900">Email *</span>
            <input v-model="form.company_supervisor_email" type="email" class="rounded border border-ln-gray-300 px-3 py-2 min-h-[44px]" />
            <span v-if="errors.company_supervisor_email" class="text-xs text-red-600">{{ errors.company_supervisor_email }}</span>
          </label>

          <label class="md:col-span-2 flex flex-col gap-1">
            <span class="text-sm font-medium text-ln-gray-900">Mobile du tuteur *</span>
            <input v-model="form.company_supervisor_phone" type="tel" placeholder="+22997000000" class="rounded border border-ln-gray-300 px-3 py-2 min-h-[44px]" />
            <span v-if="errors.company_supervisor_phone" class="text-xs text-red-600">{{ errors.company_supervisor_phone }}</span>
          </label>
        </section>

        <section class="grid gap-4 md:grid-cols-2">
          <div class="md:col-span-2">
            <h2 class="text-base font-semibold text-ln-gray-900">Encadrement académique</h2>
          </div>

          <div class="md:col-span-2">
            <BlockSkeleton v-if="tutorsResource.loading" :lines="2" :show-title="false" />
            <BlockError
              v-else-if="tutorsResource.error"
              title="Liste des tuteurs indisponible"
              :message="tutorsResource.error.message || 'Erreur réseau'"
              :retry="() => tutorsResource.reload()"
            />
            <label v-else class="flex flex-col gap-1">
              <span class="text-sm font-medium text-ln-gray-900">Tuteur académique *</span>
              <select v-model="form.academic_tutor" class="rounded border border-ln-gray-300 px-3 py-2 min-h-[44px]">
                <option value="">Choisir</option>
                <option v-for="tutor in tutors" :key="tutor.name" :value="tutor.name">
                  {{ tutor.instructor_name }} ({{ tutor.name }})
                </option>
              </select>
              <span v-if="errors.academic_tutor" class="text-xs text-red-600">{{ errors.academic_tutor }}</span>
            </label>
          </div>
        </section>

        <section class="grid gap-4 md:grid-cols-2">
          <div class="md:col-span-2">
            <h2 class="text-base font-semibold text-ln-gray-900">Mission</h2>
          </div>

          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium text-ln-gray-900">Date de début *</span>
            <input v-model="form.start_date" type="date" class="rounded border border-ln-gray-300 px-3 py-2 min-h-[44px]" />
            <span v-if="errors.start_date" class="text-xs text-red-600">{{ errors.start_date }}</span>
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium text-ln-gray-900">Date de fin *</span>
            <input v-model="form.end_date" type="date" class="rounded border border-ln-gray-300 px-3 py-2 min-h-[44px]" />
            <span v-if="errors.end_date" class="text-xs text-red-600">{{ errors.end_date }}</span>
          </label>

          <label class="md:col-span-2 flex flex-col gap-1">
            <span class="text-sm font-medium text-ln-gray-900">
              Intitulé de la mission * <span class="text-ln-gray-500">({{ form.mission_title.length }}/300)</span>
            </span>
            <input v-model="form.mission_title" maxlength="300" type="text" class="rounded border border-ln-gray-300 px-3 py-2 min-h-[44px]" />
            <span v-if="errors.mission_title" class="text-xs text-red-600">{{ errors.mission_title }}</span>
          </label>

          <label class="md:col-span-2 flex flex-col gap-1">
            <span class="text-sm font-medium text-ln-gray-900">
              Description des missions * <span class="text-ln-gray-500">({{ form.mission_description.length }} caractères)</span>
            </span>
            <textarea v-model="form.mission_description" rows="6" class="rounded border border-ln-gray-300 px-3 py-2" />
            <span v-if="errors.mission_description" class="text-xs text-red-600">{{ errors.mission_description }}</span>
          </label>

          <label class="md:col-span-2 flex flex-col gap-1">
            <span class="text-sm font-medium text-ln-gray-900">Lieu *</span>
            <select v-model="form.mission_location" class="rounded border border-ln-gray-300 px-3 py-2 min-h-[44px]">
              <option value="">Choisir</option>
              <option v-for="location in locations" :key="location" :value="location">{{ location }}</option>
            </select>
            <span v-if="errors.mission_location" class="text-xs text-red-600">{{ errors.mission_location }}</span>
          </label>
        </section>

        <div v-if="submitError" class="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {{ submitError }}
        </div>

        <div class="flex items-center justify-end">
          <button
            type="submit"
            class="inline-flex items-center justify-center gap-2 text-xs font-semibold text-white bg-ln-blue-900 hover:bg-ln-blue-700 px-5 py-2.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px] disabled:opacity-60 transition-colors"
            :disabled="isSubmitting || tutorsResource.loading"
          >
            {{ isSubmitting ? 'Envoi en cours...' : 'Soumettre ma fiche' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
