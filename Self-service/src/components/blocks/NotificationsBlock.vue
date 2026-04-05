<script setup>
// NotificationsBlock — 5 dernières notifications utilisateur
// Backend : portal_app.api.cockpit.get_cockpit_block("notifications")
// Note : le backend simplifie (pas d'info is_read séparé), on affiche toutes comme "non lu" par défaut.
// Pour la gestion read/unread fine, voir portal_app.api.notifications.get_my_notifications (Phase 3).
import { useCockpitBlock } from '@/composables/useCockpitBlock';
import CockpitBlockWrapper from './CockpitBlockWrapper.vue';
import NotificationItem from '@/components/ui/NotificationItem.vue';

const notifications = useCockpitBlock('notifications');
</script>

<template>
  <CockpitBlockWrapper :resource="notifications" title="Notifications">
    <template #default="{ payload }">
      <div class="bg-white rounded-lg border border-subtle overflow-hidden">
        <NotificationItem
          v-for="(item, i) in payload.items"
          :key="i"
          :title="item.title"
          :timestamp="item.badge || ''"
          :read="false"
        />
      </div>
    </template>
  </CockpitBlockWrapper>
</template>
