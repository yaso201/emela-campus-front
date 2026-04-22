<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-expired-title"
      >
        <div
          class="bg-white rounded-lg border border-ln-gray-200 p-6 mx-4 max-w-sm w-full"
          style="box-shadow: 0 10px 15px rgba(0, 0, 0, 0.08), 0 4px 6px rgba(0, 0, 0, 0.04);"
        >
          <div class="text-center">
            <div class="w-12 h-12 rounded-full bg-ln-blue-100 flex items-center justify-center mx-auto mb-4">
              <Clock class="w-6 h-6 text-ln-blue-800" aria-hidden="true" />
            </div>
            <h2
              id="session-expired-title"
              class="text-lg font-semibold text-ln-gray-900 mb-2"
            >
              Session expirée
            </h2>
            <p class="text-sm text-ln-gray-600 mb-6">
              Votre session a expiré pour des raisons de sécurité.
            </p>
            <button
              type="button"
              @click="$emit('reconnect')"
              class="w-full py-2.5 px-4 bg-ln-blue-800 text-white rounded-lg hover:bg-ln-blue-700 min-h-[44px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
            >
              Se reconnecter
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { Clock } from 'lucide-vue-next';

defineProps({
  isOpen: { type: Boolean, required: true },
});

defineEmits(['reconnect']);
</script>
