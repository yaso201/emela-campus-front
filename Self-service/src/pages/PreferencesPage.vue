<script setup>
// PreferencesPage — Préférences utilisateur
// UX-PROFIL — Phase 3
import { ref, onMounted } from 'vue';
import Card from '@/components/ui/Card.vue';
import { AlertCircle, Check, Globe, Bell } from 'lucide-vue-next';

const language = ref('fr');
const notifyEmail = ref(true);
const notifySms = ref(false);
const attendanceNotifyInApp = ref(true);
const attendanceNotifyEmail = ref(true);
const saved = ref(false);
const loading = ref(false);
const errorMessage = ref('');

onMounted(async () => {
  // Récupérer les préférences existantes
  try {
    errorMessage.value = '';
    const response = await fetch('/api/method/portal_app.api.user_api.get_user_preferences', {
      method: 'GET',
      headers: {
        'X-Frappe-CSRF-Token': window.csrf_token || '',
        'Accept': 'application/json',
      },
      credentials: 'same-origin',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();
    const prefs = json.message || {};
    language.value = prefs.language || 'fr';
    notifyEmail.value = prefs.notify_email !== 0;
    notifySms.value = prefs.notify_sms === 1;
    attendanceNotifyInApp.value = prefs.attendance_notifications?.in_app !== false;
    attendanceNotifyEmail.value = prefs.attendance_notifications?.email !== false;
  } catch (e) {
    errorMessage.value = "Impossible de charger les préférences.";
  }
});

async function save() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const response = await fetch('/api/method/portal_app.api.user_api.update_user_preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Frappe-CSRF-Token': window.csrf_token || '',
      },
      body: JSON.stringify({
        language: language.value,
        notify_email: notifyEmail.value ? 1 : 0,
        notify_sms: notifySms.value ? 1 : 0,
        attendance_notify_in_app: attendanceNotifyInApp.value ? 1 : 0,
        attendance_notify_email: attendanceNotifyEmail.value ? 1 : 0,
      }),
      credentials: 'same-origin',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    saved.value = true;
    setTimeout(() => saved.value = false, 3000);
  } catch (e) {
    errorMessage.value = "Impossible d'enregistrer les préférences.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="max-w-md mx-auto py-6 px-4 space-y-6">
    <header>
      <h1 class="text-xl font-bold text-ln-gray-900">Préférences</h1>
      <p class="text-sm text-ln-gray-500 mt-1">
        Personnalisez votre expérience sur emela.
      </p>
    </header>

    <div
      v-if="errorMessage"
      class="p-3 rounded-lg text-sm flex items-center gap-2"
      style="background-color: #FEF2F2; color: #B91C1C;"
      role="alert"
    >
      <AlertCircle class="w-4 h-4 flex-shrink-0" />
      {{ errorMessage }}
    </div>

    <!-- Langue -->
    <Card title="Langue" padding="md">
      <div class="flex items-center gap-3 mb-4">
        <Globe class="w-5 h-5 text-ln-gray-400" />
        <span class="text-sm text-ln-gray-600">Langue d'affichage</span>
      </div>
      <select
        v-model="language"
        @change="save"
        class="w-full border border-ln-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25 focus:border-ln-blue-600 min-h-[44px]"
      >
        <option value="fr">Français</option>
        <option value="en">English</option>
      </select>
    </Card>

    <!-- Notifications -->
    <Card title="Notifications" padding="md">
      <div class="space-y-4">
        <label class="flex items-center justify-between cursor-pointer">
          <div class="flex items-center gap-3">
            <Bell class="w-5 h-5 text-ln-gray-400" />
            <div>
              <span class="text-sm font-medium text-ln-gray-900 block">Notifications par email</span>
              <span class="text-xs text-ln-gray-500">Recevoir les alertes par email</span>
            </div>
          </div>
          <input
            type="checkbox"
            v-model="notifyEmail"
            @change="save"
            class="w-5 h-5 accent-ln-blue-800 cursor-pointer"
          />
        </label>

        <label class="flex items-center justify-between cursor-pointer pt-4 border-t border-ln-gray-100">
          <div class="flex items-center gap-3">
            <Bell class="w-5 h-5 text-ln-gray-400" />
            <div>
              <span class="text-sm font-medium text-ln-gray-900 block">Notifications par SMS</span>
              <span class="text-xs text-ln-gray-500">Recevoir les alertes par SMS</span>
            </div>
          </div>
          <input
            type="checkbox"
            v-model="notifySms"
            @change="save"
            class="w-5 h-5 accent-ln-blue-800 cursor-pointer"
          />
        </label>
      </div>
    </Card>

    <Card title="Notifications attendance" padding="md">
      <div class="space-y-4">
        <label class="flex items-center justify-between cursor-pointer">
          <div class="flex items-center gap-3">
            <Bell class="w-5 h-5 text-ln-gray-400" />
            <div>
              <span class="text-sm font-medium text-ln-gray-900 block">Afficher dans emela</span>
              <span class="text-xs text-ln-gray-500">Alertes attendance non critiques</span>
            </div>
          </div>
          <input
            type="checkbox"
            v-model="attendanceNotifyInApp"
            @change="save"
            class="w-5 h-5 accent-ln-blue-800 cursor-pointer"
          />
        </label>

        <label class="flex items-center justify-between cursor-pointer pt-4 border-t border-ln-gray-100">
          <div class="flex items-center gap-3">
            <Bell class="w-5 h-5 text-ln-gray-400" />
            <div>
              <span class="text-sm font-medium text-ln-gray-900 block">Emails attendance</span>
              <span class="text-xs text-ln-gray-500">Si le canal email institutionnel est actif</span>
            </div>
          </div>
          <input
            type="checkbox"
            v-model="attendanceNotifyEmail"
            @change="save"
            class="w-5 h-5 accent-ln-blue-800 cursor-pointer"
          />
        </label>

        <p class="text-xs leading-relaxed text-ln-gray-500">
          Les alertes critiques restent actives même si ces options sont désactivées.
        </p>
      </div>
    </Card>

    <!-- Message succès -->
    <Transition
      enter-active-class="transition-all duration-300"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="saved"
        class="p-3 rounded-lg text-sm flex items-center gap-2"
        style="background-color: #ECFDF5; color: #047857;"
      >
        <Check class="w-4 h-4 flex-shrink-0" />
        Préférences enregistrées.
      </div>
    </Transition>
  </div>
</template>
