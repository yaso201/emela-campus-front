<script setup>
// SupportServiceTile — tuile CF-016 : icône + nom + description + SLA badge
// Réf : CF-016 §3 (annuaire des services).
defineProps({
  service: {
    type: Object,
    required: true,
    // { service_code, service_name, description, icon, response_sla_hours }
  },
  selected: { type: Boolean, default: false },
});
defineEmits(['select']);
</script>

<template>
  <button
    type="button"
    class="text-left bg-white rounded-lg border p-4 flex flex-col gap-2 focus:outline-none focus:ring-2 focus:ring-brand-500/25 min-h-[120px] transition-colors"
    :class="selected ? 'border-brand-500 ring-2 ring-brand-500/30' : 'border-subtle hover:border-default'"
    @click="$emit('select', service)"
  >
    <div class="flex items-center gap-2">
      <span class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-brand-50 text-brand-900">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v.01M12 8a2 2 0 012 2c0 1-.5 1.5-1.5 2s-1 1-1 2" />
        </svg>
      </span>
      <h3 class="text-sm font-semibold text-neutral-950">{{ service.service_name }}</h3>
    </div>
    <p class="text-xs text-neutral-600 line-clamp-3">{{ service.description }}</p>
    <div v-if="service.response_sla_hours" class="mt-auto">
      <span class="inline-block text-[10px] font-medium text-neutral-500 bg-neutral-100 rounded px-2 py-0.5">
        Réponse sous {{ service.response_sla_hours }} h
      </span>
    </div>
  </button>
</template>
