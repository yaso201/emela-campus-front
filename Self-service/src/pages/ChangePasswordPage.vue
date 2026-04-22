<script setup>
// ChangePasswordPage — Page de modification du mot de passe
// UX-AUTH — Phase 3
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Lock, Eye, EyeOff, Check, AlertCircle, Home } from 'lucide-vue-next';
import Card from '@/components/ui/Card.vue';

const router = useRouter();

const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const showCurrent = ref(false);
const showNew = ref(false);
const showConfirm = ref(false);
const loading = ref(false);
const error = ref('');
const success = ref(false);

// Calcul force mot de passe (0-5)
const strength = computed(() => {
  const pwd = newPassword.value;
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
});

const strengthPercent = computed(() => Math.min((strength.value / 5) * 100, 100));

const strengthColor = computed(() => {
  if (strength.value <= 1) return 'bg-ln-error';
  if (strength.value <= 3) return 'bg-ln-warning';
  return 'bg-ln-success';
});

const strengthLabel = computed(() => {
  if (!newPassword.value) return '';
  if (strength.value <= 1) return 'Faible';
  if (strength.value <= 3) return 'Moyen';
  return 'Fort';
});

const isSameAsOld = computed(() =>
  currentPassword.value !== '' &&
  newPassword.value !== '' &&
  newPassword.value === currentPassword.value,
);

const canSubmit = computed(() => {
  return currentPassword.value &&
    newPassword.value &&
    confirmPassword.value &&
    newPassword.value === confirmPassword.value &&
    !isSameAsOld.value &&
    strength.value >= 2 &&
    !loading.value;
});

function parseServerMessage(payload) {
  let message = payload?._server_messages || payload?.exception || payload?.exc || payload?.message || '';

  if (typeof message === 'string' && message.startsWith('[')) {
    try {
      const entries = JSON.parse(message);
      message = entries
        .map((entry) => (typeof entry === 'string' ? (JSON.parse(entry).message || entry) : entry))
        .join(' — ');
    } catch {
      // garder le message brut
    }
  }

  return String(message || '').trim();
}

function normalizeErrorMessage(message) {
  const raw = String(message || '').trim();
  const lowered = raw.toLowerCase();

  if (!raw) {
    return 'Une erreur technique est survenue. Veuillez réessayer.';
  }
  if (lowered.includes('incorrect') || lowered.includes('invalid old password') || lowered.includes('mot de passe actuel')) {
    return 'Le mot de passe actuel est incorrect.';
  }
  if (lowered.includes('same as current')) {
    return 'Le nouveau mot de passe doit être différent de l\'ancien.';
  }
  if (lowered.includes('password') && lowered.includes('weak')) {
    return 'Le nouveau mot de passe ne respecte pas la politique de sécurité.';
  }

  return raw;
}

async function submit() {
  error.value = '';
  success.value = false;

  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Les mots de passe ne correspondent pas.';
    return;
  }

  if (isSameAsOld.value) {
    error.value = 'Le nouveau mot de passe doit être différent de l\'ancien.';
    return;
  }

  if (strength.value < 2) {
    error.value = 'Le nouveau mot de passe est trop faible.';
    return;
  }

  loading.value = true;
  try {
    const response = await fetch('/api/method/frappe.core.doctype.user.user.update_password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Frappe-CSRF-Token': window.csrf_token || '',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        old_password: currentPassword.value,
        new_password: newPassword.value,
      }),
      credentials: 'same-origin',
    });

    const data = await response.json().catch(() => ({}));
    const serverMessage = parseServerMessage(data);

    if (!response.ok || data.exc || data.exception) {
      throw new Error(normalizeErrorMessage(serverMessage));
    }

    success.value = true;
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
  } catch (e) {
    error.value = normalizeErrorMessage(e.message);
  } finally {
    loading.value = false;
  }
}

function goHome() {
  router.push({ name: 'cockpit' });
}
</script>

<template>
  <div class="max-w-md mx-auto py-6 px-4">
    <header class="mb-6">
      <h1 class="text-xl font-bold text-ln-gray-900">Modifier mon mot de passe</h1>
      <p class="text-sm text-ln-gray-500 mt-1">
        Changez votre mot de passe de connexion à LaNEM.
      </p>
    </header>

    <!-- État succès — formulaire masqué -->
    <Card v-if="success">
      <div class="py-6 text-center space-y-4">
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ln-success/10">
          <Check class="w-6 h-6 text-ln-success" aria-hidden="true" />
        </div>
        <div>
          <h2 class="text-lg font-semibold text-ln-gray-900">Mot de passe modifié</h2>
          <p class="text-sm text-ln-gray-600 mt-1">
            Votre mot de passe a été modifié avec succès.
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 py-2.5 px-6 bg-ln-blue-800 text-white rounded-lg hover:bg-ln-blue-700 min-h-[44px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          @click="goHome"
        >
          <Home class="w-4 h-4" aria-hidden="true" />
          Retourner à l'accueil
        </button>
      </div>
    </Card>

    <!-- Formulaire -->
    <template v-else>
      <Card>
        <form @submit.prevent="submit" class="space-y-5">
          <!-- Mot de passe actuel -->
          <div>
            <label class="block text-sm font-medium text-ln-gray-700 mb-1.5">
              Mot de passe actuel
            </label>
            <div class="relative">
              <input
                :type="showCurrent ? 'text' : 'password'"
                v-model="currentPassword"
                required
                autocomplete="current-password"
                class="w-full border border-ln-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 focus:border-ln-blue-600 transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                @click="showCurrent = !showCurrent"
                class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-ln-gray-400 hover:text-ln-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
                :aria-label="showCurrent ? 'Masquer' : 'Afficher'"
              >
                <Eye v-if="!showCurrent" class="w-4 h-4" />
                <EyeOff v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Nouveau mot de passe -->
          <div>
            <label class="block text-sm font-medium text-ln-gray-700 mb-1.5">
              Nouveau mot de passe
            </label>
            <div class="relative">
              <input
                :type="showNew ? 'text' : 'password'"
                v-model="newPassword"
                required
                autocomplete="new-password"
                class="w-full border border-ln-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 focus:border-ln-blue-600 transition-colors"
                placeholder="••••••••"
                :class="isSameAsOld ? 'border-ln-error' : ''"
              />
              <button
                type="button"
                @click="showNew = !showNew"
                class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-ln-gray-400 hover:text-ln-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
                :aria-label="showNew ? 'Masquer' : 'Afficher'"
              >
                <Eye v-if="!showNew" class="w-4 h-4" />
                <EyeOff v-else class="w-4 h-4" />
              </button>
            </div>

            <!-- Alerte identique à l'ancien -->
            <p
              v-if="isSameAsOld"
              class="mt-1.5 text-xs text-ln-error"
            >
              Le nouveau mot de passe doit être différent de l'ancien.
            </p>

            <!-- Indicateur force -->
            <div class="mt-2" v-if="!isSameAsOld">
              <div class="h-1.5 rounded-full bg-ln-gray-200 overflow-hidden">
                <div
                  :class="strengthColor"
                  class="h-full rounded-full transition-all duration-300"
                  :style="{ width: strengthPercent + '%' }"
                />
              </div>
              <div class="flex items-center justify-between mt-1.5">
                <span class="text-xs text-ln-gray-500">{{ strengthLabel }}</span>
                <span class="text-[10px] text-ln-gray-400">
                  8+ caractères, majuscule, chiffre
                </span>
              </div>
            </div>
          </div>

          <!-- Confirmation -->
          <div>
            <label class="block text-sm font-medium text-ln-gray-700 mb-1.5">
              Confirmer le nouveau mot de passe
            </label>
            <div class="relative">
              <input
                :type="showConfirm ? 'text' : 'password'"
                v-model="confirmPassword"
                required
                autocomplete="new-password"
                class="w-full border border-ln-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 focus:border-ln-blue-600 transition-colors"
                placeholder="••••••••"
                :class="confirmPassword && confirmPassword !== newPassword ? 'border-ln-error' : ''"
              />
              <button
                type="button"
                @click="showConfirm = !showConfirm"
                class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-ln-gray-400 hover:text-ln-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
                :aria-label="showConfirm ? 'Masquer' : 'Afficher'"
              >
                <Eye v-if="!showConfirm" class="w-4 h-4" />
                <EyeOff v-else class="w-4 h-4" />
              </button>
            </div>
            <p
              v-if="confirmPassword && confirmPassword !== newPassword"
              class="mt-1.5 text-xs text-ln-error"
            >
              Les mots de passe ne correspondent pas.
            </p>
          </div>

          <!-- Erreur -->
          <div
            v-if="error"
            class="p-3 rounded-lg text-sm flex items-start gap-2"
            style="background-color: #FEF2F2; color: #B91C1C;"
          >
            <AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span>{{ error }}</span>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3 pt-2">
            <button
              type="submit"
              :disabled="!canSubmit"
              class="flex-1 py-2.5 px-4 bg-ln-blue-800 text-white rounded-lg hover:bg-ln-blue-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 flex items-center justify-center gap-2"
            >
              <Lock v-if="!loading" class="w-4 h-4" aria-hidden="true" />
              <span>{{ loading ? 'Modification...' : 'Modifier le mot de passe' }}</span>
            </button>
          </div>
        </form>
      </Card>

      <!-- Conseils -->
      <div class="mt-6 p-4 bg-ln-gray-50 rounded-lg">
        <h3 class="text-sm font-medium text-ln-gray-700 mb-2 flex items-center gap-2">
          <Lock class="w-4 h-4" aria-hidden="true" />
          Conseils de sécurité
        </h3>
        <ul class="text-xs text-ln-gray-600 space-y-1">
          <li class="flex items-center gap-1.5">
            <Check class="w-3 h-3 text-ln-success" aria-hidden="true" />
            Utilisez au moins 12 caractères
          </li>
          <li class="flex items-center gap-1.5">
            <Check class="w-3 h-3 text-ln-success" aria-hidden="true" />
            Mélangez lettres, chiffres et symboles
          </li>
          <li class="flex items-center gap-1.5">
            <Check class="w-3 h-3 text-ln-success" aria-hidden="true" />
            N'utilisez pas le même mot de passe sur plusieurs sites
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>
