<template>
  <div :class="cardClasses">
    <div v-if="$slots.header || title" class="card-header">
      <h3 v-if="title" class="card-title">{{ title }}</h3>
      <slot name="header" />
    </div>
    <div :class="bodyClasses">
      <slot />
    </div>
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  /**
   * Active l'effet d'ombre au survol
   */
  hoverable: { type: Boolean, default: false },
  /**
   * Niveau de padding : sm (12px), md (16px), lg (24px)
   */
  padding: { type: String, default: 'md' },
  /**
   * Titre optionnel affiché dans le header
   */
  title: { type: String, default: null },
  /**
   * Variante visuelle
   */
  variant: { type: String, default: 'default' }, // default | outlined | flat
});

const cardClasses = computed(() => [
  // Base
  'bg-white rounded-md-ln border',
  // Bordure
  props.variant === 'flat' ? 'border-transparent' : 'border-ln-gray-200',
  // Ombre
  props.variant === 'flat' ? 'shadow-none' : 'shadow-card',
  // Hover
  props.hoverable && props.variant !== 'flat' ? 'hover:shadow-card-hover transition-shadow duration-150' : '',
  // Overflow pour les coins arrondis
  'overflow-hidden',
]);

const bodyClasses = computed(() => {
  const paddingMap = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };
  return paddingMap[props.padding] || 'p-4';
});
</script>

<style scoped>
/* Header et Footer avec bordures subtiles */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4, 16px) var(--space-5, 20px);
  border-bottom: 1px solid #F0F2F5; /* ln-gray-100 */
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827; /* ln-gray-900 */
  margin: 0;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: var(--space-3, 12px) var(--space-4, 16px);
  border-top: 1px solid #F0F2F5; /* ln-gray-100 */
  background-color: #FAFBFC; /* ln-gray-50 */
}
</style>
