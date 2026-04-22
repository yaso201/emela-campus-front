<script setup>
// EmptyState — état vide standardisé pour les blocs et pages
// P6-Ph5 : Fix DETTE-01 — import nominatif lucide (pas wildcard *)
// Ref: U07 §2.8
//
// Usage:
//   <EmptyState icon="FileQuestion" label="Aucun document obligatoire" />
//   <EmptyState icon="Inbox" label="Aucune notification" description="Vous êtes à jour !" />

import { computed } from 'vue';
// Import nominatif des icônes réellement utilisées (fix DETTE-01)
import {
  FileQuestion,
  Inbox,
  Briefcase,
  Calendar,
  BookOpen,
  Clock,
  Bell,
  Users,
  BarChart3,
  FileText,
  GraduationCap,
  Search,
  AlertCircle,
} from 'lucide-vue-next';

// Mapping des icônes disponibles
const iconMap = {
  FileQuestion,
  Inbox,
  Briefcase,
  Calendar,
  BookOpen,
  Clock,
  Bell,
  Users,
  BarChart3,
  FileText,
  GraduationCap,
  Search,
  AlertCircle,
};

const props = defineProps({
  icon: {
    type: String,
    default: 'FileQuestion',
    description: 'Nom de l\'icône Lucide à afficher',
  },
  label: {
    type: String,
    required: true,
    description: 'Message principal (obligatoire)',
  },
  description: {
    type: String,
    default: null,
    description: 'Message secondaire optionnel',
  },
});

// Résolution de l'icône depuis le mapping (pas de wildcard import)
const iconComponent = computed(() => {
  return iconMap[props.icon] ?? FileQuestion;
});
</script>

<template>
  <div class="flex flex-col items-center justify-center py-10 px-4 text-center gap-3">
    <component
      :is="iconComponent"
      class="w-6 h-6 text-ln-gray-400"
      aria-hidden="true"
    />
    <p class="text-sm font-medium text-ln-gray-600">{{ label }}</p>
    <p v-if="description" class="text-xs text-ln-gray-400">{{ description }}</p>
  </div>
</template>
