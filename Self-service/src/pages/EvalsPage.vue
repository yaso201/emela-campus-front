<script setup>
import { computed, ref, watch } from 'vue';
import { useProfileStore } from '@/stores/profile';
import { useEvals } from '@/composables/useEvals';
import BlockError from '@/components/ui/BlockError.vue';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import EmptyState from '@/components/ui/EmptyState.vue';

const profile = useProfileStore();
const evals = useEvals();

const questionnaireError = ref(null);
const submitError = ref(null);
const showQuestionnaire = ref(false);
const currentCampaign = ref(null);
const currentQuestionnaire = ref(null);
const answers = ref({});

const campaigns = computed(() => evals.campaigns.value || []);
const isStudent = computed(() => profile.profile === 'student');
const showProfileGuard = computed(() => !profile.isLoading && !profile.isGuest && !isStudent.value);

watch(
  () => [profile.status, profile.profile],
  async ([status, currentProfile]) => {
    if (status === 'loaded' && currentProfile === 'student') {
      try {
        await evals.loadCampaigns();
      } catch {
        // evals.error already populated by the composable
      }
    }
  },
  { immediate: true },
);

function formatDate(date) {
  if (!date) {
    return '—';
  }

  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function completionBadgeClass(status) {
  const classes = {
    Soumise: 'bg-ln-success-bg text-ln-success',
    Brouillon: 'bg-ln-warning-bg text-ln-warning',
    'Non commencée': 'bg-ln-gray-100 text-ln-gray-700',
  };
  return classes[status] || 'bg-ln-gray-100 text-ln-gray-700';
}

function initialAnswerFor(question) {
  if (question.question_type === 'Choix multiple') {
    return Array.isArray(question.value) ? [...question.value] : [];
  }

  if (question.question_type === 'Texte libre') {
    return question.value || '';
  }

  return question.value ?? '';
}

function hydrateAnswers(questionnaire) {
  const nextAnswers = {};
  (questionnaire?.questions || []).forEach((question) => {
    nextAnswers[question.name] = initialAnswerFor(question);
  });
  answers.value = nextAnswers;
}

async function openQuestionnaire(campaign) {
  currentCampaign.value = campaign;
  currentQuestionnaire.value = null;
  questionnaireError.value = null;
  submitError.value = null;
  showQuestionnaire.value = true;

  try {
    const questionnaire = await evals.loadQuestionnaire(campaign.name);
    currentQuestionnaire.value = questionnaire;
    hydrateAnswers(questionnaire);
  } catch (error) {
    questionnaireError.value = error;
  }
}

function closeQuestionnaire() {
  showQuestionnaire.value = false;
  currentCampaign.value = null;
  currentQuestionnaire.value = null;
  questionnaireError.value = null;
  submitError.value = null;
  answers.value = {};
}

function toggleChoice(questionName, optionValue, checked) {
  const existing = Array.isArray(answers.value[questionName]) ? [...answers.value[questionName]] : [];
  if (checked) {
    if (!existing.includes(optionValue)) {
      existing.push(optionValue);
    }
  } else {
    const index = existing.indexOf(optionValue);
    if (index >= 0) {
      existing.splice(index, 1);
    }
  }
  answers.value[questionName] = existing;
}

async function submitEvaluation() {
  if (!currentCampaign.value) {
    return;
  }

  submitError.value = null;

  try {
    await evals.submitResponse(currentCampaign.value.name, answers.value);
    await evals.loadCampaigns();
    closeQuestionnaire();
  } catch (error) {
    submitError.value = error;
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <header>
      <h1 class="text-2xl font-bold text-ln-gray-900 mb-1">Évaluations pédagogiques</h1>
      <p class="text-sm text-ln-gray-600">
        Répondez aux campagnes teaching_eval ouvertes avant la clôture.
      </p>
    </header>

    <div
      v-if="showProfileGuard"
      class="bg-white rounded-lg border border-ln-gray-200 p-6 text-center"
    >
      <h2 class="text-base font-semibold text-ln-gray-900">Évaluations réservées aux étudiants</h2>
      <p class="text-sm text-ln-gray-600 mt-2">
        Cette page est disponible uniquement depuis un profil étudiant.
      </p>
    </div>

    <div v-else>
      <div v-if="profile.isLoading" class="grid gap-4">
        <BlockSkeleton :lines="4" :show-title="false" />
        <BlockSkeleton :lines="4" :show-title="false" />
      </div>

      <div
        v-else-if="profile.isGuest"
        class="bg-white rounded-lg border border-ln-gray-200 p-6 text-center"
      >
        <h2 class="text-base font-semibold text-ln-gray-900">Connexion requise</h2>
        <p class="text-sm text-ln-gray-600 mt-2">
          Connectez-vous avec votre compte étudiant pour répondre aux évaluations.
        </p>
      </div>

      <div v-else class="flex flex-col gap-4">
        <div v-if="evals.loading.value" class="grid gap-4">
          <BlockSkeleton :lines="4" :show-title="false" />
          <BlockSkeleton :lines="4" :show-title="false" />
        </div>

        <BlockError
          v-else-if="evals.error.value"
          title="Évaluations indisponibles"
          :message="evals.error.value.message || 'Erreur réseau'"
          :retry="() => evals.loadCampaigns()"
        />

        <div
          v-else-if="campaigns.length === 0"
          class="bg-white rounded-lg border border-ln-gray-200 p-6"
        >
          <EmptyState
            icon="FileText"
            label="Aucune évaluation en cours"
            description="Les campagnes ouvertes apparaîtront ici automatiquement."
          />
        </div>

        <section
          v-for="campaign in campaigns"
          :key="campaign.name"
          class="bg-white rounded-lg border border-ln-gray-200 p-5 md:p-6"
        >
          <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-lg font-semibold text-ln-gray-900">
                  {{ campaign.course_name }}
                </h2>
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
                  :class="completionBadgeClass(campaign.completion_status)"
                >
                  {{ campaign.completion_status }}
                </span>
              </div>
              <p class="text-sm text-ln-gray-600 mt-2">
                {{ campaign.campaign_type }} · Groupe {{ campaign.student_group }}
              </p>
              <p class="text-xs text-ln-gray-500 mt-1">
                Fenêtre ouverte du {{ formatDate(campaign.start_date) }} au {{ formatDate(campaign.end_date) }}
              </p>
              <p
                v-if="campaign.blocking_mode"
                class="text-xs text-ln-gray-500 mt-1"
              >
                Mode résultats : {{ campaign.blocking_mode }}
              </p>
            </div>

            <div class="flex items-center gap-3">
              <button
                v-if="campaign.completion_status !== 'Soumise'"
                type="button"
                class="inline-flex items-center justify-center gap-2 text-xs font-semibold text-white bg-ln-blue-900 hover:bg-ln-blue-700 px-5 py-2.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px]"
                @click="openQuestionnaire(campaign)"
              >
                {{ campaign.completion_status === 'Brouillon' ? 'Reprendre' : 'Répondre' }}
              </button>
              <span
                v-else
                class="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold bg-ln-success-bg text-ln-success"
              >
                Réponse enregistrée
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>

    <div
      v-if="showQuestionnaire"
      class="fixed inset-0 z-50 bg-black/50 px-4 py-6 md:px-8 md:py-10 overflow-y-auto"
    >
      <div class="min-h-full flex items-center justify-center">
        <div class="w-full max-w-3xl bg-white rounded-lg border border-ln-gray-200 shadow-card">
          <div class="flex items-start justify-between gap-4 p-5 border-b border-ln-gray-200">
            <div>
              <h2 class="text-lg font-semibold text-ln-gray-900">
                {{ currentQuestionnaire?.questionnaire_name || 'Questionnaire d’évaluation' }}
              </h2>
              <p class="text-sm text-ln-gray-600 mt-1">
                {{ currentCampaign?.course_name || currentCampaign?.course || 'Campagne en cours' }}
              </p>
            </div>
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-sm border border-ln-gray-200 px-3 py-2 text-xs font-semibold text-ln-gray-700 hover:border-ln-gray-300 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px]"
              @click="closeQuestionnaire"
            >
              Fermer
            </button>
          </div>

          <div class="p-5 md:p-6">
            <div v-if="evals.questionnaireLoading.value" class="grid gap-4">
              <BlockSkeleton :lines="5" :show-title="false" />
              <BlockSkeleton :lines="5" :show-title="false" />
            </div>

            <BlockError
              v-else-if="questionnaireError"
              title="Questionnaire indisponible"
              :message="questionnaireError.message || 'Impossible de charger cette campagne.'"
            />

            <div v-else-if="!(currentQuestionnaire?.questions || []).length" class="py-4">
              <EmptyState
                icon="AlertCircle"
                label="Questionnaire incomplet"
                description="Aucune question exploitable n’est disponible pour cette campagne."
              />
            </div>

            <div v-else class="flex flex-col gap-6">
              <div
                v-for="(question, index) in currentQuestionnaire.questions"
                :key="question.name"
                class="rounded-md-ln border border-ln-gray-200 p-4"
              >
                <div class="flex items-start gap-3">
                  <div class="w-7 h-7 rounded-full bg-ln-blue-50 text-ln-blue-900 flex items-center justify-center text-xs font-semibold shrink-0">
                    {{ index + 1 }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-semibold text-ln-gray-900">
                      {{ question.question_text }}
                      <span v-if="question.is_mandatory" class="text-ln-error">*</span>
                    </p>
                    <p
                      v-if="question.category"
                      class="text-xs text-ln-gray-500 mt-1"
                    >
                      {{ question.category }}
                    </p>

                    <div
                      v-if="question.question_type === 'Échelle 1-5' || question.question_type === 'Échelle 1-10'"
                      class="mt-4 flex flex-wrap gap-2"
                    >
                      <label
                        v-for="n in (question.question_type === 'Échelle 1-10' ? 10 : 5)"
                        :key="`${question.name}-${n}`"
                        class="inline-flex items-center gap-2 rounded-sm border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-700 hover:border-ln-blue-500 min-h-[44px]"
                      >
                        <input
                          v-model="answers[question.name]"
                          type="radio"
                          :name="question.name"
                          :value="n"
                          class="accent-ln-blue-900"
                        >
                        <span>{{ n }}</span>
                      </label>
                    </div>

                    <div
                      v-else-if="question.question_type === 'Choix simple'"
                      class="mt-4 flex flex-col gap-2"
                    >
                      <label
                        v-for="option in question.options || []"
                        :key="`${question.name}-${option}`"
                        class="inline-flex items-center gap-3 rounded-sm border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-700 hover:border-ln-blue-500 min-h-[44px]"
                      >
                        <input
                          v-model="answers[question.name]"
                          type="radio"
                          :name="question.name"
                          :value="option"
                          class="accent-ln-blue-900"
                        >
                        <span>{{ option }}</span>
                      </label>
                    </div>

                    <div
                      v-else-if="question.question_type === 'Choix multiple'"
                      class="mt-4 flex flex-col gap-2"
                    >
                      <label
                        v-for="option in question.options || []"
                        :key="`${question.name}-${option}`"
                        class="inline-flex items-center gap-3 rounded-sm border border-ln-gray-200 px-3 py-2 text-sm text-ln-gray-700 hover:border-ln-blue-500 min-h-[44px]"
                      >
                        <input
                          type="checkbox"
                          :checked="Array.isArray(answers[question.name]) && answers[question.name].includes(option)"
                          class="accent-ln-blue-900"
                          @change="toggleChoice(question.name, option, $event.target.checked)"
                        >
                        <span>{{ option }}</span>
                      </label>
                    </div>

                    <textarea
                      v-else
                      v-model="answers[question.name]"
                      rows="4"
                      class="mt-4 w-full rounded-sm border border-ln-gray-200 px-3 py-3 text-sm text-ln-gray-800 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 focus:border-ln-blue-500"
                      placeholder="Votre réponse"
                    />
                  </div>
                </div>
              </div>

              <div
                v-if="submitError"
                class="rounded-md-ln border border-ln-error bg-ln-error-bg px-4 py-3 text-sm text-ln-error"
              >
                {{ submitError.message || 'La soumission a échoué.' }}
              </div>
            </div>
          </div>

          <div class="flex flex-col-reverse gap-3 p-5 border-t border-ln-gray-200 sm:flex-row sm:justify-end">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-sm border border-ln-gray-200 px-4 py-2.5 text-sm font-semibold text-ln-gray-700 hover:border-ln-gray-300 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px]"
              @click="closeQuestionnaire"
            >
              Annuler
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-sm bg-ln-blue-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-ln-blue-700 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
              :disabled="evals.submitting.value || evals.questionnaireLoading.value || !currentQuestionnaire"
              @click="submitEvaluation"
            >
              {{ evals.submitting.value ? 'Soumission...' : 'Soumettre l’évaluation' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
