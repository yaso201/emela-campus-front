<script setup>
// ServicesBlock — Liste des services du portail, enrichie par le profil résolu.
// Réf : U07 §4.8, CORRECTIONS.md B-005
import { computed } from 'vue';
import { useFrappeCall } from '@/composables/useFrappeCall';
import BlockSkeleton from '@/components/ui/BlockSkeleton.vue';
import BlockError from '@/components/ui/BlockError.vue';
import ServiceTile from '@/components/ui/ServiceTile.vue';
import { isExternalUrl, normalizePortalRoute } from '@/utils/portalUrls';
import {
  Calendar,
  BookOpen,
  Star,
  BarChart3,
  HelpCircle,
  Briefcase,
  FileText,
  GraduationCap,
  Mail,
  Phone,
  ExternalLink
} from 'lucide-vue-next';

const servicesResource = useFrappeCall('portal_app.api.cockpit.get_my_portal_services');

// Mapping des icônes par code d'icône
const iconComponents = {
  calendar: Calendar,
  book: BookOpen,
  book_open: BookOpen,
  star: Star,
  chart: BarChart3,
  help: HelpCircle,
  help_circle: HelpCircle,
  briefcase: Briefcase,
  file_text: FileText,
  graduation_cap: GraduationCap,
  mail: Mail,
  phone: Phone,
};

// Normalise les services de l'API
const normalizedServices = computed(() => {
  if (!servicesResource.data) return [];
  
  // L'API retourne directement un tableau ou un objet avec une propriété services
  const rawServices = Array.isArray(servicesResource.data) 
    ? servicesResource.data 
    : (servicesResource.data.services || []);
  
  return rawServices.map(svc => ({
    name: svc.name || svc.service_code || '',
    title: svc.service_name || svc.label || 'Service',
    url: normalizePortalRoute(svc.target_url || svc.url || ''),
    icon: svc.icon || 'help',
    external: isExternalUrl(svc.target_url || svc.url || ''),
  }));
});

// Récupère le composant d'icône approprié
function getIconComponent(iconName) {
  if (!iconName) return iconComponents.help;
  const key = iconName.toLowerCase().replace(/-/g, '_');
  return iconComponents[key] || iconComponents.help;
}

function isMoodleService(service) {
  const url = (service.url || '').toLowerCase();
  return url.includes('moodle') || url.includes('formation');
}
</script>

<template>
  <section class="flex flex-col gap-3">
    <h2 class="text-sm font-semibold text-ln-gray-900">
      Mes services
    </h2>

    <!-- État loading -->
    <BlockSkeleton v-if="servicesResource.loading" :lines="2" :show-title="false" />

    <!-- État erreur -->
    <BlockError
      v-else-if="servicesResource.error"
      title="Services indisponibles"
      :message="servicesResource.error.message || 'Erreur réseau'"
      :retry="() => servicesResource.reload()"
    />

    <!-- État vide -->
    <div
      v-else-if="normalizedServices.length === 0"
      class="bg-white rounded-lg border border-ln-gray-200 p-6 text-sm text-ln-gray-500"
    >
      Aucun service disponible pour votre profil.
    </div>

    <!-- Liste des services -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <ServiceTile
        v-for="service in normalizedServices"
        :key="service.name"
        :title="service.title"
        :url="service.url"
        :external="service.external"
      >
        <template #icon>
          <component
            :is="getIconComponent(service.icon)"
            class="w-5 h-5 text-ln-blue-900"
            aria-hidden="true"
          />
        </template>
        <template #subtitle v-if="isMoodleService(service)">
          <span class="text-xs text-ln-gray-500 flex items-center justify-center gap-1 mt-0.5">
            <ExternalLink class="w-3 h-3" />
            Connexion séparée requise
          </span>
        </template>
      </ServiceTile>
    </div>
  </section>
</template>
