<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300"
      enter-from-class="opacity-0 translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-4"
    >
      <div
        v-if="show"
        class="fixed bottom-4 right-4 left-4 md:left-auto md:max-w-sm z-40"
        role="alert"
        aria-live="polite"
      >
        <div
          class="rounded-lg p-4 shadow-elevated border"
          style="background-color: #FFFBEB; border-color: #B45309;"
        >
          <div class="flex items-start gap-3">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style="background-color: #FEF3C7;"
            >
              <Clock class="w-5 h-5" style="color: #B45309;" aria-hidden="true" />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-sm" style="color: #B45309;">
                Session bientôt expirée
              </h3>
              <p class="text-xs mt-1" style="color: #92400E;">
                Votre session expire dans {{ remaining }} minute{{ remaining > 1 ? 's' : '' }}.
              </p>
              <div class="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  @click="$emit('extend')"
                  class="px-3 py-1.5 text-xs font-medium text-white rounded-md min-h-[36px] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 hover:opacity-90"
                  style="background-color: #B45309;"
                >
                  Prolonger ma session
                </button>
                <button
                  type="button"
                  @click="$emit('dismiss')"
                  class="px-3 py-1.5 text-xs font-medium rounded-md min-h-[36px] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 hover:bg-[#FEF3C7]/50"
                  style="color: #92400E;"
                >
                  Ignorer
                </button>
              </div>
            </div>
            <button
              type="button"
              @click="$emit('dismiss')"
              class="p-1 rounded-md flex-shrink-0 transition-colors hover:bg-[#FEF3C7]/50"
              style="color: #B45309;"
              aria-label="Fermer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { Clock, X } from 'lucide-vue-next';

defineProps({
  show: { type: Boolean, required: true },
  remaining: { type: Number, required: true },
});

defineEmits(['extend', 'dismiss']);
</script>
