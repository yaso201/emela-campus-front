<script setup>
// LeaveBlock — Solde de congés et prochains congés du salarié
// Statut : backend non disponible. Affiche un état dégradé explicite.
// Intégration prévue : Phase 3 (endpoint cross-site backoffice HRMS).
// Spec : U07 §4.17, DEC-132
import { Calendar, Plus } from 'lucide-vue-next';
</script>

<template>
  <section class="flex flex-col gap-3">
    <h2 class="text-sm font-semibold text-ln-gray-900">
      Mes congés
    </h2>

    <div class="bg-white rounded-lg border border-ln-gray-200 p-6 text-center">
      <Calendar class="w-8 h-8 text-ln-gray-300 mx-auto mb-3" aria-hidden="true" />
      <p class="text-sm font-medium text-ln-gray-500">
        Service congés indisponible
      </p>
      <p class="text-xs text-ln-gray-400 mt-1">
        L'intégration avec le système RH est en cours de mise en place.
      </p>
      <a
        href="/app-emela/support?type=conge"
        class="inline-flex items-center gap-1 mt-3 text-xs font-medium text-ln-blue-900 hover:text-ln-blue-700"
      >
        <Plus class="w-3.5 h-3.5" aria-hidden="true" />
        Demander un congé
      </a>
    </div>
  </section>
</template>
