<script setup>
// NotificationItem — item de notification avec état lu/non lu
// Réf visuelle : specs-interfaces/mela_component_library_reference.html §NotificationItem
defineProps({
  title: { type: String, required: true },
  timestamp: { type: String, required: true },
  read: { type: Boolean, default: false },
});
</script>

<template>
  <div
    class="px-4 py-3.5 flex items-start gap-2.5 border-b border-subtle last:border-b-0"
    :class="{ 'bg-brand-50/30': !read }"
  >
    <span
      class="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
      :class="read ? 'border border-neutral-300 bg-transparent' : 'bg-brand-500'"
      :aria-label="read ? 'Lu' : 'Non lu'"
    ></span>
    <div class="flex-1 min-w-0">
      <div
        class="text-sm"
        :class="read ? 'text-neutral-600' : 'text-neutral-950 font-medium'"
      >
        {{ title }}
      </div>
      <div class="text-xs text-neutral-400 mt-0.5">{{ timestamp }}</div>
    </div>
  </div>
</template>
