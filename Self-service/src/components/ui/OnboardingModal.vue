<script setup>
// OnboardingModal — 3 écrans d'accueil pour nouveaux utilisateurs
// UX-PROFIL — Phase 3
import { ref } from 'vue';
import { X } from 'lucide-vue-next';

const props = defineProps({
  isOpen: { type: Boolean, required: true },
});

const emit = defineEmits(['close']);

const step = ref(1);
const totalSteps = 3;
const saving = ref(false);

async function finish() {
  saving.value = true;
  try {
    // Marquer onboarding comme terminé
    await fetch('/api/method/frappe.client.set_value', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Frappe-CSRF-Token': window.csrf_token || '',
      },
      body: JSON.stringify({
        doctype: 'User',
        name: window.user,
        fieldname: 'custom_onboarding_done',
        value: 1,
      }),
      credentials: 'same-origin',
    });
  } catch (e) {
    console.warn('[OnboardingModal] Failed to save:', e);
  } finally {
    saving.value = false;
    emit('close');
  }
}

function next() {
  if (step.value < totalSteps) {
    step.value++;
  }
}

function prev() {
  if (step.value > 1) {
    step.value--;
  }
}

const titles = [
  '',
  'Bienvenue sur emela.',
  'Vos services',
  'Besoin d\'aide ?',
];

const descriptions = [
  '',
  'Votre espace campus unifié pour suivre vos cours, consulter vos résultats et gérer vos démarches.',
  'Accédez facilement à votre planning, vos notes, et tous les services de la vie étudiante.',
  'Une question ? Utilisez le bouton "Support" pour contacter nos équipes. Nous sommes là pour vous aider.',
];
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        role="dialog"
        aria-modal="true"
      >
        <div
          class="bg-white rounded-lg p-6 max-w-md w-full relative"
          style="box-shadow: 0 10px 15px rgba(0, 0, 0, 0.08), 0 4px 6px rgba(0, 0, 0, 0.04);"
        >
          <!-- Bouton fermer (optionnel) -->
          <button
            type="button"
            @click="emit('close')"
            class="absolute top-4 right-4 p-1 rounded-md text-ln-gray-500 hover:text-ln-gray-600 hover:bg-ln-gray-100 transition-colors"
            aria-label="Fermer"
          >
            <X class="w-5 h-5" />
          </button>

          <!-- Contenu -->
          <div class="text-center py-4">
            <!-- Émoji illustratif -->
            <div class="text-5xl mb-4">
              {{ step === 1 ? '👋' : step === 2 ? '📚' : '💡' }}
            </div>

            <h2 class="text-xl font-bold text-ln-gray-900 mb-2">
              {{ titles[step] }}
            </h2>
            <p class="text-sm text-ln-gray-600">
              {{ descriptions[step] }}
            </p>

            <!-- Liste pour écran 2 -->
            <ul v-if="step === 2" class="text-left text-sm text-ln-gray-600 space-y-2 mt-4 mx-4">
              <li class="flex items-center gap-2">
                <span
                  class="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                  style="background-color: #ECFDF5; color: #047857;"
                >✓</span>
                Consultez votre planning de cours
              </li>
              <li class="flex items-center gap-2">
                <span
                  class="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                  style="background-color: #ECFDF5; color: #047857;"
                >✓</span>
                Suivez vos résultats et vos crédits
              </li>
              <li class="flex items-center gap-2">
                <span
                  class="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                  style="background-color: #ECFDF5; color: #047857;"
                >✓</span>
                Contactez l'administration facilement
              </li>
            </ul>
          </div>

          <!-- Navigation -->
          <div class="flex items-center justify-between mt-6">
            <!-- Indicateurs -->
            <div class="flex gap-1.5">
              <span
                v-for="s in totalSteps"
                :key="s"
                class="w-2 h-2 rounded-full transition-colors"
                :class="s === step ? 'bg-ln-blue-800' : 'bg-ln-gray-300'"
              />
            </div>

            <!-- Boutons -->
            <div class="flex gap-2">
              <button
                v-if="step > 1"
                type="button"
                @click="prev"
                class="px-4 py-2 text-sm text-ln-gray-600 hover:text-ln-gray-900 min-h-[44px] rounded-lg transition-colors"
              >
                Retour
              </button>
              <button
                v-if="step < totalSteps"
                type="button"
                @click="next"
                class="px-4 py-2 text-sm bg-ln-blue-800 text-white rounded-lg hover:bg-ln-blue-700 min-h-[44px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
              >
                Suivant
              </button>
              <button
                v-else
                type="button"
                @click="finish"
                :disabled="saving"
                class="px-4 py-2 text-sm bg-ln-blue-800 text-white rounded-lg hover:bg-ln-blue-700 min-h-[44px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 disabled:opacity-50"
              >
                {{ saving ? 'Enregistrement...' : 'Commencer' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
