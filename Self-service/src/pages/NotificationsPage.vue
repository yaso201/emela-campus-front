<script setup>
// NotificationsPage — vue dédiée notifications
import { Archive, Check, RefreshCw } from 'lucide-vue-next';
import { computed, onMounted, ref } from 'vue';
import BlockError from '@/components/ui/BlockError.vue';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import EmptyState from '@/components/ui/EmptyState.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';

const loading = ref(false);
const error = ref('');
const showArchived = ref(false);
const unreadOnly = ref(false);
const items = ref([]);

const visibleModeLabel = computed(() => (showArchived.value ? 'Archives' : 'Récentes'));

onMounted(loadNotifications);

async function callApi(method, params = {}) {
  const formData = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) formData.append(key, value);
  });

  const response = await fetch(`/api/method/${method}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Frappe-CSRF-Token': window.csrf_token || '',
      Accept: 'application/json',
    },
    body: formData.toString(),
    credentials: 'same-origin',
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(payload?._server_messages || payload?.exc || payload?.message || `HTTP ${response.status}`);
  }
  return Object.prototype.hasOwnProperty.call(payload, 'message') ? payload.message : payload;
}

async function loadNotifications() {
  loading.value = true;
  error.value = '';
  try {
    items.value = await callApi('portal_app.api.notifications.get_my_notifications', {
      limit: 50,
      unread_only: unreadOnly.value ? 1 : 0,
      include_archived: showArchived.value ? 1 : 0,
    });
  } catch (err) {
    items.value = [];
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

async function markAsRead(item) {
  if (item.is_read) return;
  await callApi('portal_app.api.notifications.mark_notification_read', { notification_name: item.name });
  item.is_read = true;
  item.read_at = new Date().toISOString();
}

async function archiveItem(item) {
  await callApi('portal_app.api.notifications.archive_notification', { notification_name: item.name });
  item.is_read = true;
  item.archived_at = new Date().toISOString();
  if (!showArchived.value) {
    items.value = items.value.filter((row) => row.name !== item.name);
  }
}

function toggleArchived(value) {
  showArchived.value = value;
  loadNotifications();
}

function toggleUnreadOnly() {
  unreadOnly.value = !unreadOnly.value;
  loadNotifications();
}

function statusForType(type) {
  if (type === 'Blocage') return 'failed';
  if (type === 'Avertissement') return 'overdue';
  if (type === 'Action') return 'in-review';
  return 'pending';
}

function formatDate(value) {
  if (!value) return 'N/A';
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(String(value).replace(' ', 'T')));
}
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-ln-gray-900">Notifications</h1>
        <p class="mt-1 text-sm text-ln-gray-600">Toutes les notifications liées à votre compte.</p>
      </div>
      <button
        type="button"
        class="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md-ln border border-ln-gray-200 bg-white px-4 py-2 text-sm font-semibold text-ln-gray-700 hover:border-ln-blue-500 hover:text-ln-blue-900 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
        :disabled="loading"
        @click="loadNotifications"
      >
        <RefreshCw class="h-4 w-4" :class="{ 'motion-safe:animate-spin': loading }" />
        Actualiser
      </button>
    </header>

    <section class="flex flex-col gap-3 rounded-md-ln border border-ln-gray-200 bg-white p-3 md:flex-row md:items-center md:justify-between">
      <div class="inline-grid grid-cols-2 rounded-md-ln border border-ln-gray-200 bg-ln-gray-50 p-1">
        <button
          type="button"
          class="min-h-[40px] rounded-md-ln px-4 text-sm font-semibold"
          :class="!showArchived ? 'bg-white text-ln-blue-900 shadow-sm' : 'text-ln-gray-600'"
          @click="toggleArchived(false)"
        >
          Récentes
        </button>
        <button
          type="button"
          class="min-h-[40px] rounded-md-ln px-4 text-sm font-semibold"
          :class="showArchived ? 'bg-white text-ln-blue-900 shadow-sm' : 'text-ln-gray-600'"
          @click="toggleArchived(true)"
        >
          Archives
        </button>
      </div>
      <button
        type="button"
        class="inline-flex min-h-[44px] items-center justify-center rounded-md-ln border border-ln-gray-200 px-4 py-2 text-sm font-semibold"
        :class="unreadOnly ? 'border-ln-blue-500 bg-ln-blue-50 text-ln-blue-900' : 'bg-white text-ln-gray-700'"
        @click="toggleUnreadOnly"
      >
        Non lues uniquement
      </button>
    </section>

    <BlockError v-if="error" title="Notifications indisponibles" :message="error" :retry="loadNotifications" />

    <div v-if="loading" class="space-y-3">
      <BlockSkeleton v-for="idx in 3" :key="idx" :lines="3" :show-title="false" />
    </div>

    <section v-else class="overflow-hidden rounded-md-ln border border-ln-gray-200 bg-white">
      <div class="border-b border-ln-gray-100 px-4 py-3">
        <h2 class="text-sm font-semibold text-ln-gray-900">{{ visibleModeLabel }}</h2>
      </div>

      <EmptyState
        v-if="items.length === 0"
        icon="Inbox"
        label="Aucune notification"
        description="Aucune notification ne correspond aux filtres."
      />

      <div v-else class="divide-y divide-ln-gray-100">
        <article v-for="item in items" :key="item.name" class="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_160px_170px]">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-sm font-semibold text-ln-gray-900">{{ item.title }}</h3>
              <span v-if="!item.is_read" class="h-2 w-2 rounded-full bg-ln-blue-600" aria-label="Non lu" />
            </div>
            <p class="mt-1 text-sm leading-relaxed text-ln-gray-600">{{ item.message }}</p>
            <p class="mt-2 text-xs text-ln-gray-500">{{ formatDate(item.created_at) }}</p>
          </div>
          <div class="flex items-start">
            <StatusBadge :status="statusForType(item.notification_type)" :label="item.notification_type" size="sm" />
          </div>
          <div class="flex flex-wrap items-start justify-start gap-2 md:justify-end">
            <button
              type="button"
              class="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-md-ln border border-ln-gray-200 text-ln-blue-800 hover:border-ln-blue-700 focus:outline-none focus:ring-2 focus:ring-ln-blue-500/25"
              :disabled="item.is_read"
              aria-label="Marquer comme lue"
              @click="markAsRead(item)"
            >
              <Check class="h-4 w-4" />
            </button>
            <button
              v-if="!item.archived_at"
              type="button"
              class="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-md-ln border border-ln-gray-200 text-ln-gray-700 hover:border-ln-gray-500 focus:outline-none focus:ring-2 focus:ring-ln-gray-300"
              aria-label="Archiver"
              @click="archiveItem(item)"
            >
              <Archive class="h-4 w-4" />
            </button>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
