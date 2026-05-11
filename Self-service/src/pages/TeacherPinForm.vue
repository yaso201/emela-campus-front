<script setup>
// TeacherPinForm — Gestion du PIN enseignant (Zone B écriture)
// DEC-INSTR-05 — portail pour TeacherPIN (Desk non accessible aux Instructors)
// Réf : D10-NRM-Enseignant.md §5, PROC-INSTR-09
import { ref, computed, onMounted } from 'vue';
import { KeyRound, Check, AlertCircle, Eye, EyeOff } from 'lucide-vue-next';
import Card from '@/components/ui/Card.vue';

const pin = ref('');
const confirmPin = ref('');
const showPin = ref(false);
const showConfirm = ref(false);
const loading = ref(false);
const error = ref('');
const success = ref(false);
const pinStatus = ref(null); // {has_pin, status} | null
const showForm = ref(false);

onMounted(() => { loadPinStatus(); });

async function loadPinStatus() {
  try {
    const response = await fetch(
      '/api/method/portal_app.api.teacher_pin.get_pin_status',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Frappe-CSRF-Token': window.csrf_token || '',
          'Accept': 'application/json',
        },
        body: '',
        credentials: 'same-origin',
      },
    );
    if (!response.ok) return;
    const json = await response.json();
    pinStatus.value = json.message;
    showForm.value = !pinStatus.value?.has_pin;
  } catch {
    showForm.value = true;
  }
}

const isValid = computed(() => {
  return /^\d{6}$/.test(pin.value) && pin.value === confirmPin.value;
});

async function submit() {
  error.value = '';
  success.value = false;
  if (!/^\d{6}$/.test(pin.value)) {
    error.value = 'Le PIN doit contenir exactement 6 chiffres.';
    return;
  }
  if (pin.value !== confirmPin.value) {
    error.value = 'Les deux saisies du PIN ne correspondent pas.';
    return;
  }

  loading.value = true;
  try {
    const formData = new URLSearchParams();
    formData.append('pin', pin.value);
    formData.append('pin_confirmation', confirmPin.value);

    const response = await fetch(
      '/api/method/portal_app.api.teacher_pin.create_pin',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Frappe-CSRF-Token': window.csrf_token || '',
          'Accept': 'application/json',
        },
        body: formData.toString(),
        credentials: 'same-origin',
      },
    );

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.exc) {
      const msg = data._server_messages || data.exception || data.exc || 'Erreur lors de la création du PIN.';
      throw new Error(String(msg).replace(/^\["|"\]$/g, ''));
    }

    success.value = true;
    showForm.value = false;
    pin.value = '';
    confirmPin.value = '';
    await loadPinStatus();
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="max-w-md mx-auto py-6 px-4">
    <header class="mb-6">
      <h1 class="text-xl font-bold text-ln-gray-900 flex items-center gap-2">
        <KeyRound class="w-5 h-5" />
        PIN enseignant
      </h1>
      <p class="text-sm text-ln-gray-500 mt-1">
        Ce PIN est requis pour certaines actions sensibles du portail (mode papier, corrections).
      </p>
    </header>

    <!-- Statut PIN actif -->
    <Card v-if="pinStatus?.has_pin && !showForm" class="mb-4">
      <div class="py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-full"
               :class="pinStatus.status === 'Active' ? 'bg-ln-success/10' : 'bg-ln-warning/10'">
            <Check v-if="pinStatus.status === 'Active'" class="w-5 h-5 text-ln-success" />
            <AlertCircle v-else class="w-5 h-5 text-ln-warning" />
          </div>
          <div>
            <div class="font-medium text-ln-gray-900">
              {{ pinStatus.status === 'Active' ? 'PIN actif' : 'Réinitialisation requise' }}
            </div>
            <div class="text-xs text-ln-gray-500">
              {{ pinStatus.status === 'Active'
                ? 'Votre PIN est configuré et actif.'
                : 'Un administrateur a réinitialisé votre PIN. Définissez-en un nouveau.' }}
            </div>
          </div>
        </div>
        <button
          type="button"
          class="text-sm text-ln-blue-800 hover:underline font-medium"
          @click="showForm = true; success = false"
        >
          Changer mon PIN
        </button>
      </div>
    </Card>

    <!-- Succès -->
    <Card v-if="success && !showForm">
      <div class="py-6 text-center space-y-3">
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ln-success/10">
          <Check class="w-6 h-6 text-ln-success" />
        </div>
        <div>
          <h2 class="text-lg font-semibold text-ln-gray-900">PIN configuré</h2>
          <p class="text-sm text-ln-gray-600 mt-1">Votre PIN a été enregistré avec succès.</p>
        </div>
      </div>
    </Card>

    <!-- Formulaire -->
    <Card v-if="showForm">
      <form @submit.prevent="submit" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-ln-gray-700 mb-1.5">
            Nouveau PIN (6 chiffres)
          </label>
          <div class="relative">
            <input
              :type="showPin ? 'text' : 'password'"
              v-model="pin"
              required
              maxlength="6"
              pattern="[0-9]{6}"
              inputmode="numeric"
              autocomplete="new-password"
              placeholder="••••••"
              class="w-full border border-ln-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 focus:border-ln-blue-600 tracking-widest"
            />
            <button
              type="button"
              @click="showPin = !showPin"
              class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-ln-gray-400 hover:text-ln-gray-600 rounded-md"
            >
              <Eye v-if="!showPin" class="w-4 h-4" />
              <EyeOff v-else class="w-4 h-4" />
            </button>
          </div>
          <p class="mt-1 text-xs text-ln-gray-500">Exactement 6 chiffres (0-9), sans lettres.</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-ln-gray-700 mb-1.5">
            Confirmer le PIN
          </label>
          <div class="relative">
            <input
              :type="showConfirm ? 'text' : 'password'"
              v-model="confirmPin"
              required
              maxlength="6"
              pattern="[0-9]{6}"
              inputmode="numeric"
              autocomplete="new-password"
              placeholder="••••••"
              class="w-full border border-ln-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 focus:border-ln-blue-600 tracking-widest"
              :class="confirmPin && confirmPin !== pin ? 'border-ln-error' : ''"
            />
            <button
              type="button"
              @click="showConfirm = !showConfirm"
              class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-ln-gray-400 hover:text-ln-gray-600 rounded-md"
            >
              <Eye v-if="!showConfirm" class="w-4 h-4" />
              <EyeOff v-else class="w-4 h-4" />
            </button>
          </div>
          <p v-if="confirmPin && confirmPin !== pin" class="mt-1 text-xs text-ln-error">
            Les deux saisies ne correspondent pas.
          </p>
        </div>

        <!-- Erreur -->
        <div
          v-if="error"
          class="p-3 rounded-lg text-sm flex items-start gap-2 bg-red-50 text-red-700"
        >
          <AlertCircle class="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{{ error }}</span>
        </div>

        <div class="flex items-center gap-3 pt-1">
          <button
            type="submit"
            :disabled="!isValid || loading"
            class="flex-1 py-2.5 px-4 bg-ln-blue-800 text-white rounded-lg hover:bg-ln-blue-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
          >
            {{ loading ? 'Enregistrement...' : (pinStatus?.has_pin ? 'Changer le PIN' : 'Définir mon PIN') }}
          </button>
          <button
            v-if="pinStatus?.has_pin"
            type="button"
            class="px-4 py-2.5 border border-ln-gray-200 rounded-lg text-sm text-ln-gray-600 hover:bg-ln-gray-50 min-h-[44px]"
            @click="showForm = false"
          >
            Annuler
          </button>
        </div>
      </form>
    </Card>
  </div>
</template>
