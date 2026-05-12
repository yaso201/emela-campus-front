<script setup>
// LeaveBlock — Solde de congés et prochains congés du salarié
// Spec : U07 §4.17, DEC-132
import { computed } from 'vue';
import { AlertCircle, Calendar, CheckCircle2, Plus } from 'lucide-vue-next';
import { useFrappeCall } from '@/composables/useFrappeCall';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import BlockError from '@/components/ui/BlockError.vue';

const leaveData = useFrappeCall('portal_app.api.cockpit.get_leave_summary');

const balance = computed(() => leaveData.data?.leave_balance || []);
const nextLeave = computed(() => leaveData.data?.upcoming_leaves?.[0] || null);
const pendingCount = computed(() => leaveData.data?.pending_count || 0);
const requestUrl = computed(() => leaveData.data?.request_url || '/my-hr/leave');

function progressPercent(item) {
  if (!item.total_days) return 0;
  return Math.max(0, Math.min(100, Math.round((item.remaining_days / item.total_days) * 100)));
}
</script>

<template>
  <section class="flex flex-col gap-3">
    <h2 class="text-sm font-semibold text-ln-gray-900">
      Mes congés
    </h2>

    <BlockSkeleton v-if="leaveData.loading" :lines="3" :show-title="false" />

    <BlockError
      v-else-if="leaveData.error"
      title="Congés indisponibles"
      :message="leaveData.error.message || 'Erreur réseau'"
      :retry="() => leaveData.reload()"
    />

    <div v-else class="bg-white rounded-lg border border-ln-gray-200 p-4">
      <div v-if="balance.length" class="flex flex-col gap-3">
        <div v-for="item in balance" :key="item.leave_type" class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between gap-3">
            <span class="text-sm font-medium text-ln-gray-900">{{ item.leave_type }}</span>
            <span class="text-xs text-ln-gray-500">
              {{ item.remaining_days }} j / {{ item.total_days }} j
            </span>
          </div>
          <div class="h-2 rounded-full bg-ln-gray-100 overflow-hidden">
            <div
              class="h-full rounded-full bg-ln-blue-700"
              :style="{ width: `${progressPercent(item)}%` }"
            />
          </div>
        </div>
      </div>

      <div v-else class="flex items-start gap-3 rounded-md border border-ln-gray-100 bg-ln-gray-50 p-3">
        <AlertCircle class="w-4 h-4 text-ln-gray-400 mt-0.5" aria-hidden="true" />
        <p class="text-sm text-ln-gray-500">
          Aucun solde de congé actif.
        </p>
      </div>

      <div v-if="nextLeave" class="mt-4 rounded-md border border-ln-green-100 bg-ln-green-50 p-3">
        <div class="flex items-start gap-2">
          <CheckCircle2 class="w-4 h-4 text-ln-green-700 mt-0.5" aria-hidden="true" />
          <div class="min-w-0">
            <p class="text-sm font-medium text-ln-gray-900">
              Prochain congé : {{ nextLeave.from_date }} → {{ nextLeave.to_date }}
            </p>
            <p class="text-xs text-ln-gray-500 mt-0.5">
              {{ nextLeave.leave_type }} · {{ nextLeave.total_days }} jours · {{ nextLeave.status }}
            </p>
          </div>
        </div>
      </div>

      <p v-if="pendingCount" class="mt-3 text-xs text-ln-gray-500">
        {{ pendingCount }} demande(s) en attente.
      </p>

      <a
        :href="requestUrl"
        class="inline-flex items-center gap-1 mt-3 text-xs font-medium text-ln-blue-900 hover:text-ln-blue-700"
      >
        <Plus class="w-3.5 h-3.5" aria-hidden="true" />
        Demander un congé
      </a>
    </div>
  </section>
</template>
