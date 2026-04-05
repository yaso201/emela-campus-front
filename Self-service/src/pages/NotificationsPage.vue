<script setup>
// NotificationsPage — vue dédiée notifications
import NotificationsBlock from '@/components/blocks/NotificationsBlock.vue';
</script>

<template>
  <div class="flex flex-col gap-6">
    <header>
      <h1 class="text-2xl font-bold text-neutral-950 mb-1">Notifications</h1>
      <p class="text-sm text-neutral-600">Toutes les notifications récentes liées à votre compte.</p>
    </header>
    <NotificationsBlock />
  </div>
</template>
