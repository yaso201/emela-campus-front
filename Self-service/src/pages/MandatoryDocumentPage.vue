<script setup>
// MandatoryDocumentPage — Page de validation des documents obligatoires (CF-002)
// Ref: D05 §6, §8.4 — DEC-098, DEC-125
// Cette page s'affiche en PRIORITÉ 1 à la place du cockpit si un document obligatoire
// n'est pas validé.
//
// Flux : reading → quiz (opt) → signature → submitting → done

import { ref, computed, watch, nextTick } from 'vue';
import DOMPurify from 'dompurify';
import { FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-vue-next';

import { useMandatoryDocuments } from '@/composables/useMandatoryDocuments';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import BlockError from '@/components/ui/BlockError.vue';

const props = defineProps({
  document: {
    type: Object,
    required: true,
    description: 'Document obligatoire à valider (du backend)',
  },
});

const emit = defineEmits(['validated']);

// ── Récupération du composable — initialisé avec le document du parent ──
const {
  isLoading,
  error,
  currentStep,
  scrollCompleted,
  quizQuestions,
  quizAnswers,
  quizError,
  signatureText,
  acceptChecked,
  needsQuiz,
  needsSignature,
  canSubmitQuiz,
  canSubmitSignature,
  onScrollComplete,
  onReadingComplete,
  submitAnswers,
  submitValidation,
  setPendingDocument,
  loadQuiz,
} = useMandatoryDocuments(props.document);

// Resynchroniser si le parent passe un autre document
watch(
  () => props.document?.name,
  (newName, oldName) => {
    if (newName && newName !== oldName) {
      setPendingDocument(props.document);
    }
  }
);

// ── Refs pour le scroll ─────────────────────────────────────────────
const contentRef = ref(null);
const sentinelRef = ref(null);
let scrollObserver = null;

// ── IntersectionObserver pour détecter la fin du scroll ─────────────
function setupScrollObserver() {
  if (!sentinelRef.value || !window.IntersectionObserver) {
    // Fallback : activer le bouton après un délai si pas d'IntersectionObserver
    setTimeout(() => onScrollComplete(), 3000);
    return;
  }

  scrollObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          onScrollComplete();
        }
      });
    },
    {
      root: contentRef.value,
      threshold: 0.5,
    }
  );

  scrollObserver.observe(sentinelRef.value);
}

// ── Watchers ────────────────────────────────────────────────────────
watch(
  () => currentStep.value,
  async (newStep) => {
    if (newStep === 'reading') {
      await nextTick();
      setupScrollObserver();
    }
  },
  { immediate: true }
);

watch(
  () => currentStep.value,
  (newStep) => {
    if (newStep === 'done') {
      // Émettre l'événement pour que le parent recharge l'état
      setTimeout(() => emit('validated'), 1500);
    }
  }
);

// ── Helpers ─────────────────────────────────────────────────────────

// Vague 0.5: sanitize HTML content to prevent XSS
// Allowlist preserves legitimate document formatting while blocking scripts/handlers
const sanitizedContent = computed(() => {
  if (!props.document.content) return '';
  return DOMPurify.sanitize(props.document.content, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
      'ul', 'ol', 'li', 'dl', 'dt', 'dd',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
      'strong', 'em', 'b', 'i', 'u', 's', 'sub', 'sup', 'mark', 'small',
      'a', 'img', 'figure', 'figcaption',
      'blockquote', 'pre', 'code',
      'div', 'span', 'section', 'article',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'title', 'width', 'height',
      'class', 'id', 'style', 'colspan', 'rowspan', 'scope',
    ],
    ALLOW_DATA_ATTR: false,
  });
});

const hasContent = computed(() => {
  return !!props.document.content;
});

const hasContentUrl = computed(() => {
  return !!props.document.content_url;
});

function handleReadingComplete() {
  if (!scrollCompleted.value) return;
  onReadingComplete();
}

function handleQuizSubmit() {
  if (!canSubmitQuiz.value) return;
  submitAnswers();
}

function handleSignatureSubmit() {
  if (!canSubmitSignature.value) return;
  submitValidation();
}

// ── Style des boutons ───────────────────────────────────────────────
const buttonBaseClasses =
  'w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[48px]';

const buttonEnabledClasses =
  'bg-ln-blue-900 text-white hover:bg-ln-blue-700';

const buttonDisabledClasses =
  'bg-ln-gray-200 text-ln-gray-500 cursor-not-allowed';

const secondaryButtonClasses =
  'w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold bg-white border border-ln-gray-200 text-ln-gray-700 hover:bg-ln-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 min-h-[48px]';
</script>

<template>
  <div class="min-h-screen bg-ln-gray-50">
    <!-- Header fixe -->
    <header class="sticky top-0 z-10 bg-white border-b border-ln-gray-200 px-4 py-4 md:px-6">
      <div class="max-w-2xl mx-auto">
        <div class="flex items-center gap-2 mb-1">
          <FileText class="w-5 h-5 text-ln-blue-900" aria-hidden="true" />
          <span class="text-xs font-medium text-ln-gray-500 uppercase tracking-wide">
            Document obligatoire
          </span>
        </div>
        <h1 class="text-lg font-semibold text-ln-gray-900">{{ document.title }}</h1>
        <p class="text-sm text-ln-gray-500">Version {{ document.version }}</p>
      </div>
    </header>

    <!-- Contenu principal -->
    <main class="px-4 py-6 md:px-6">
      <div class="max-w-2xl mx-auto space-y-6">
        <!-- État d'erreur global -->
        <BlockError
          v-if="error && currentStep !== 'submitting'"
          title="Erreur"
          :message="error"
          :retry="() => window.location.reload()"
        />

        <!-- ÉTAPE 1 : Lecture -->
        <section
          v-if="currentStep === 'reading'"
          class="bg-white rounded-lg border border-ln-gray-200 overflow-hidden"
        >
          <div
            ref="contentRef"
            class="max-h-[24rem] overflow-y-auto p-4 md:p-6 space-y-4 text-ln-gray-700 text-sm leading-relaxed"
          >
            <!-- Contenu HTML du document -->
            <div v-if="hasContent" v-html="sanitizedContent"></div>

            <!-- Fallback PDF/URL -->
            <div v-else-if="hasContentUrl" class="space-y-4">
              <p>Ce document est disponible en téléchargement :</p>
              <a
                :href="document.content_url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 text-ln-blue-900 hover:underline"
              >
                <FileText class="w-4 h-4" />
                Télécharger le document (PDF)
              </a>
              <p class="text-xs text-ln-gray-500">
                Après lecture, cochez la case ci-dessous pour continuer.
              </p>
            </div>

            <!-- Pas de contenu -->
            <div v-else class="text-ln-gray-500">
              Le contenu de ce document n'est pas disponible. Veuillez contacter le support.
            </div>

            <!-- Sentinel pour IntersectionObserver -->
            <div ref="sentinelRef" class="h-2"></div>
          </div>

          <!-- Barre d'action lecture -->
          <div class="p-4 md:p-6 border-t border-ln-gray-200 bg-ln-gray-50">
            <label class="flex items-start gap-3 mb-4 cursor-pointer">
              <input
                v-model="scrollCompleted"
                type="checkbox"
                :disabled="!scrollCompleted"
                class="mt-0.5 w-4 h-4 text-ln-blue-900 border-ln-gray-300 rounded focus:ring-ln-blue-500"
                aria-label="J'ai lu ce document en entier"
              />
              <span class="text-sm text-ln-gray-700">
                J'ai lu ce document en entier
              </span>
            </label>

            <button
              type="button"
              :disabled="!scrollCompleted"
              :class="[
                buttonBaseClasses,
                scrollCompleted ? buttonEnabledClasses : buttonDisabledClasses,
              ]"
              :aria-disabled="!scrollCompleted"
              @click="handleReadingComplete"
            >
              <CheckCircle class="w-4 h-4" aria-hidden="true" />
              {{ needsQuiz ? 'Continuer vers le quiz' : needsSignature ? 'Continuer vers la signature' : 'Valider la lecture' }}
            </button>
          </div>
        </section>

        <!-- ÉTAPE 2 : Quiz -->
        <section
          v-if="currentStep === 'quiz' && needsQuiz"
          class="bg-white rounded-lg border border-ln-gray-200 overflow-hidden"
        >
          <div class="p-4 md:p-6 border-b border-ln-gray-200">
            <h2 class="text-base font-semibold text-ln-gray-900">Vérification de lecture</h2>
            <p class="text-sm text-ln-gray-500 mt-1">
              Répondez aux 2 questions ci-dessous pour valider votre lecture.
            </p>
          </div>

          <div class="p-4 md:p-6 space-y-6">
            <!-- Erreur quiz -->
            <div
              v-if="quizError"
              class="bg-error-50 border border-error-200 rounded-lg p-4 flex items-start gap-3"
              role="alert"
            >
              <AlertCircle class="w-5 h-5 text-ln-error flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p class="text-sm font-medium text-ln-error">{{ quizError }}</p>
                <button
                  type="button"
                  :class="secondaryButtonClasses + ' mt-3'"
                  @click="loadQuiz"
                >
                  Réessayer avec de nouvelles questions
                </button>
              </div>
            </div>

            <!-- Questions -->
            <div
              v-for="(question, index) in quizQuestions"
              :key="question.name"
              class="space-y-3"
            >
              <p class="text-sm font-medium text-ln-gray-900">
                {{ index + 1 }}. {{ question.question_text }}
              </p>
              <div class="space-y-2">
                <label
                  v-for="choice in ['a', 'b', 'c', 'd']"
                  :key="choice"
                  class="flex items-center gap-3 p-3 rounded-lg border border-ln-gray-200 hover:bg-ln-gray-50 cursor-pointer transition-colors"
                  :class="quizAnswers[question.name] === choice.toUpperCase() ? 'bg-ln-blue-50 border-ln-blue-300' : ''"
                >
                  <input
                    v-model="quizAnswers[question.name]"
                    type="radio"
                    :name="question.name"
                    :value="choice.toUpperCase()"
                    class="w-4 h-4 text-ln-blue-900 border-ln-gray-300 focus:ring-ln-blue-500"
                  />
                  <span class="text-sm text-ln-gray-700">
                    {{ question[`choice_${choice}`] }}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <!-- Barre d'action quiz -->
          <div class="p-4 md:p-6 border-t border-ln-gray-200 bg-ln-gray-50">
            <button
              type="button"
              :disabled="!canSubmitQuiz || isLoading"
              :class="[
                buttonBaseClasses,
                canSubmitQuiz && !isLoading ? buttonEnabledClasses : buttonDisabledClasses,
              ]"
              :aria-disabled="!canSubmitQuiz || isLoading"
              @click="handleQuizSubmit"
            >
              <Loader2 v-if="isLoading" class="w-4 h-4 motion-safe:animate-spin" aria-hidden="true" />
              <CheckCircle v-else class="w-4 h-4" aria-hidden="true" />
              {{ isLoading ? 'Vérification...' : needsSignature ? 'Continuer vers la signature' : 'Valider mes réponses' }}
            </button>
          </div>
        </section>

        <!-- ÉTAPE 3 : Signature -->
        <section
          v-if="currentStep === 'signature' && needsSignature"
          class="bg-white rounded-lg border border-ln-gray-200 overflow-hidden"
        >
          <div class="p-4 md:p-6 border-b border-ln-gray-200">
            <h2 class="text-base font-semibold text-ln-gray-900">Signature</h2>
            <p class="text-sm text-ln-gray-500 mt-1">
              Pour finaliser votre validation, saisissez votre nom complet et cochez la case d'acceptation.
            </p>
          </div>

          <div class="p-4 md:p-6 space-y-6">
            <!-- Case d'acceptation -->
            <label class="flex items-start gap-3 cursor-pointer">
              <input
                v-model="acceptChecked"
                type="checkbox"
                class="mt-0.5 w-4 h-4 text-ln-blue-900 border-ln-gray-300 rounded focus:ring-ln-blue-500"
                aria-required="true"
              />
              <span class="text-sm text-ln-gray-700">
                J'ai lu et j'accepte les termes de ce document. Je comprends que cette validation est définitive.
              </span>
            </label>

            <!-- Champ signature (nom complet) -->
            <div class="space-y-2">
              <label for="signature" class="block text-sm font-medium text-ln-gray-900">
                Votre nom complet <span class="text-ln-error">*</span>
              </label>
              <input
                id="signature"
                v-model="signatureText"
                type="text"
                placeholder="Prénom Nom"
                :aria-required="true"
                class="w-full px-3 py-2 border border-ln-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 focus:border-ln-blue-500"
              />
              <p class="text-xs text-ln-gray-500">
                Ce nom sera enregistré comme preuve de votre validation.
              </p>
            </div>
          </div>

          <!-- Barre d'action signature -->
          <div class="p-4 md:p-6 border-t border-ln-gray-200 bg-ln-gray-50">
            <button
              type="button"
              :disabled="!canSubmitSignature || isLoading"
              :class="[
                buttonBaseClasses,
                canSubmitSignature && !isLoading ? buttonEnabledClasses : buttonDisabledClasses,
              ]"
              :aria-disabled="!canSubmitSignature || isLoading"
              @click="handleSignatureSubmit"
            >
              <Loader2 v-if="isLoading" class="w-4 h-4 motion-safe:animate-spin" aria-hidden="true" />
              <CheckCircle v-else class="w-4 h-4" aria-hidden="true" />
              {{ isLoading ? 'Validation en cours...' : 'Signer et valider' }}
            </button>
          </div>
        </section>

        <!-- ÉTAPE 4 : Submitting -->
        <section
          v-if="currentStep === 'submitting'"
          class="bg-white rounded-lg border border-ln-gray-200 p-8"
        >
          <div class="flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 class="w-8 h-8 text-ln-blue-900 motion-safe:animate-spin" aria-hidden="true" />
            <div>
              <p class="text-base font-medium text-ln-gray-900">Validation en cours...</p>
              <p class="text-sm text-ln-gray-500 mt-1">Veuillez patienter quelques instants.</p>
            </div>
          </div>
        </section>

        <!-- ÉTAPE 5 : Done -->
        <section
          v-if="currentStep === 'done'"
          class="bg-white rounded-lg border border-ln-gray-200 p-8"
        >
          <div class="flex flex-col items-center justify-center text-center space-y-4">
            <div class="w-12 h-12 rounded-full bg-ln-success-bg flex items-center justify-center">
              <CheckCircle class="w-6 h-6 text-ln-success" aria-hidden="true" />
            </div>
            <div>
              <p class="text-base font-semibold text-ln-gray-900">Validation réussie !</p>
              <p class="text-sm text-ln-gray-500 mt-1">
                Votre validation a été enregistrée. Redirection vers votre espace...
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>
