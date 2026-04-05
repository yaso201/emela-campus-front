<script setup>
// SupportRequestDetailModal — affichage détail d'une Support Request
// Refs : CF-016 §4, §5 fiche F-CF-016d
import { computed } from 'vue';

const props = defineProps({
  request: { type: Object, default: null }, // null = fermé
});
defineEmits(['close']);

const statusColor = computed(() => {
  const map = {
    Nouveau: 'bg-blue-100 text-blue-800',
    'En cours': 'bg-amber-100 text-amber-800',
    Répondu: 'bg-green-100 text-green-800',
    Transféré: 'bg-purple-100 text-purple-800',
    Clos: 'bg-neutral-200 text-neutral-700',
    Annulé: 'bg-red-100 text-red-800',
  };
  return map[props.request?.status] || 'bg-neutral-100 text-neutral-700';
});

function formatDate(value) {
  if (!value) return '—';
  try {
    const d = new Date(value);
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="request"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="$emit('close')"
    >
      <div
        class="bg-white rounded-xl border border-subtle shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        <header class="flex items-start justify-between border-b border-subtle px-6 py-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <h2 class="text-lg font-semibold text-neutral-950">{{ request.subject }}</h2>
              <span class="inline-block text-xs font-medium rounded px-2 py-0.5" :class="statusColor">
                {{ request.status }}
              </span>
            </div>
            <p class="text-xs text-neutral-500">
              {{ request.name }} · {{ request.target_service }} · {{ request.category }}
            </p>
          </div>
          <button
            type="button"
            class="text-neutral-500 hover:text-neutral-900 p-1 rounded focus:outline-none focus:ring-2 focus:ring-brand-500/25"
            aria-label="Fermer"
            @click="$emit('close')"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div class="px-6 py-4 space-y-4">
          <section>
            <h3 class="text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">
              Votre message
            </h3>
            <p class="text-sm text-neutral-800 whitespace-pre-wrap">{{ request.message }}</p>
          </section>

          <section v-if="request.response">
            <h3 class="text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">
              Réponse du service
            </h3>
            <div class="bg-neutral-50 border border-subtle rounded-md p-3">
              <p class="text-sm text-neutral-800 whitespace-pre-wrap">{{ request.response }}</p>
              <p class="text-xs text-neutral-500 mt-2">
                Le {{ formatDate(request.responded_at) }} · {{ request.responded_by || '—' }}
              </p>
            </div>
          </section>

          <section>
            <h3 class="text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">
              Chronologie
            </h3>
            <ul class="space-y-1 text-xs text-neutral-600">
              <li>Créée le {{ formatDate(request.creation) }}</li>
              <li v-if="request.responded_at">Répondu le {{ formatDate(request.responded_at) }}</li>
              <li v-if="request.transferred_at">
                Transférée vers <strong>{{ request.transferred_to }}</strong> le
                {{ formatDate(request.transferred_at) }}
              </li>
              <li v-if="request.closed_at">Clôturée le {{ formatDate(request.closed_at) }}</li>
            </ul>
          </section>

          <section v-if="request.status === 'Clos' && !request.satisfaction_rating">
            <h3 class="text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">
              Évaluer le service reçu
            </h3>
            <p class="text-xs text-neutral-500">
              Vous pourrez bientôt évaluer ce service (Phase 2 CF-016).
            </p>
          </section>
        </div>
      </div>
    </div>
  </Teleport>
</template>
