<script setup>
// NotificationsBlock — 5 dernières notifications utilisateur avec mark-as-read
// Phase 5 — switched from get_cockpit_block("notifications") to get_my_notifications
// pour exposer name + is_read nécessaires au mark-as-read
// Backend :
//   - portal_app.api.notifications.get_my_notifications (lecture)
//   - portal_app.api.notifications.mark_notification_read (write, sur clic)
import { computed } from 'vue';
import { useFrappeCall } from '@/composables/useFrappeCall';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import BlockError from '@/components/ui/BlockError.vue';
import NotificationItem from '@/components/ui/NotificationItem.vue';

const notifications = useFrappeCall(
  'portal_app.api.notifications.get_my_notifications',
  { limit: 5 },
);

const items = computed(() => {
  const data = notifications.data;
  // get_my_notifications returns an array directly
  if (Array.isArray(data)) return data;
  return [];
});

function formatTimestamp(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffHours = Math.floor((now - d) / (1000 * 60 * 60));
  if (diffHours < 1) return 'Il y a quelques minutes';
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

async function markAsRead(name) {
  // Optimistic update : passer en lu localement tout de suite
  const item = items.value.find((i) => i.name === name);
  if (!item || item.is_read) return;
  item.is_read = true;

  // Fire-and-forget backend call (rollback if failure)
  try {
    const formData = new URLSearchParams();
    formData.append('notification_name', name);
    await fetch(
      '/api/method/portal_app.api.notifications.mark_notification_read',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Frappe-CSRF-Token': window.csrf_token || '',
        },
        body: formData.toString(),
        credentials: 'same-origin',
      },
    );
  } catch {
    // Rollback optimistic update
    item.is_read = false;
  }
}
</script>

<template>
  <section class="flex flex-col gap-3">
    <h2 class="text-sm font-semibold text-ln-gray-900">
      Notifications
    </h2>

    <BlockSkeleton v-if="notifications.loading" :lines="3" :show-title="false" />

    <BlockError
      v-else-if="notifications.error"
      title="Notifications indisponibles"
      :message="notifications.error.message || 'Erreur réseau'"
      :retry="() => notifications.reload()"
    />

    <div
      v-else-if="items.length === 0"
      class="bg-white rounded-lg border border-ln-gray-200 p-6 text-sm text-ln-gray-500"
    >
      Aucune notification récente.
    </div>

    <div v-else class="bg-white rounded-lg border border-ln-gray-200 overflow-hidden">
      <button
        v-for="item in items"
        :key="item.name"
        type="button"
        class="w-full text-left block focus:outline-none focus:bg-ln-blue-50/30 focus:ring-2 focus:ring-inset focus:ring-ln-blue-500/25"
        @click="markAsRead(item.name)"
      >
        <NotificationItem
          :title="item.title"
          :timestamp="formatTimestamp(item.created_at)"
          :read="item.is_read"
        />
      </button>
    </div>
  </section>
</template>
