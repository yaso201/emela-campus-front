<script setup>
// HrSelfServiceBlock — Bloc services RH pour le cockpit salarié
// Placeholder P1-B-003 : implémentation complète prévue en Phase 3
// Spec : U05 §2.2, U07 §4.11, DEC-132
// Endpoint prévu : portal_app.api.cockpit.get_hr_selfservice_summary
import { useFrappeCall } from '@/composables/useFrappeCall';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import BlockError from '@/components/ui/BlockError.vue';
import { Briefcase, FileText, Calendar, ChevronRight } from 'lucide-vue-next';

const hrData = useFrappeCall('portal_app.api.cockpit.get_hr_selfservice_summary');

const quickLinks = [
  { label: 'Demander un congé', icon: Calendar, url: '/app-emela/support?type=conge', highlight: true },
  { label: 'Mes bulletins', icon: FileText, url: '/app-emela/support?type=bulletin' },
  { label: 'Mes demandes', icon: Briefcase, url: '/app-emela/support' },
];
</script>

<template>
  <section class="flex flex-col gap-3">
    <h2 class="text-sm font-semibold text-ln-gray-900">
      Mes services RH
    </h2>

    <BlockSkeleton v-if="hrData.loading" :lines="3" :show-title="false" />

    <BlockError
      v-else-if="hrData.error"
      title="Services RH indisponibles"
      :message="hrData.error.message || 'Erreur réseau'"
      :retry="() => hrData.reload()"
    />

    <div v-else class="bg-white rounded-lg border border-ln-gray-200 p-4">
      <!-- Links rapides -->
      <div class="flex flex-col gap-2">
        <a
          v-for="link in quickLinks"
          :key="link.label"
          :href="link.url"
          class="flex items-center gap-3 p-2.5 rounded-md transition-colors"
          :class="link.highlight ? 'bg-ln-blue-50 hover:bg-ln-blue-100' : 'hover:bg-ln-gray-50'"
        >
          <div 
            class="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
            :class="link.highlight ? 'bg-ln-blue-100 text-ln-blue-700' : 'bg-ln-gray-100 text-ln-gray-600'"
          >
            <component :is="link.icon" class="w-4 h-4" aria-hidden="true" />
          </div>
          <span 
            class="text-sm font-medium flex-1"
            :class="link.highlight ? 'text-ln-blue-900' : 'text-ln-gray-900'"
          >
            {{ link.label }}
          </span>
          <ChevronRight class="w-4 h-4 text-ln-gray-500 flex-shrink-0" aria-hidden="true" />
        </a>
      </div>

      <!-- Message informatif -->
      <div class="mt-3 pt-3 border-t border-ln-gray-100 text-xs text-ln-gray-500">
        Accédez à vos demandes RH et suivez leur avancement.
      </div>
    </div>
  </section>
</template>
