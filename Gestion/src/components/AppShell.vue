<template>
  <div class="min-h-screen bg-white font-sans text-body text-ln-gray-700">
    <!-- Barre supérieure -->
    <header class="sticky top-0 z-30 flex h-14 items-center gap-5 bg-ln-blue-900 px-5 text-white">
      <button v-if="compact" type="button" class="grid place-items-center text-white" aria-label="Ouvrir la navigation" @click="emit('toggle-nav')">
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </button>
      <a href="#" class="flex flex-shrink-0 items-baseline gap-2 text-[15px] font-bold tracking-tight text-white no-underline" @click.prevent="emit('navigate', 'home')">
        emela <small class="text-micro font-medium uppercase tracking-wider text-white/60">gestion</small>
      </a>

      <button v-if="!compact" type="button" class="flex h-[34px] max-w-md flex-1 items-center gap-2 rounded-sm-ln border border-white/15 bg-white/10 px-3 text-body-sm text-white/70" @click="emit('search')">
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
        Rechercher un étudiant, une UE, un groupe…
      </button>

      <div class="ml-auto flex flex-shrink-0 items-center gap-3">
        <!-- La bascule ne s'affiche que si la personne A un espace personnel.
             Exposition D-01 : sans elle, le bouton mène parfois nulle part. -->
        <button v-if="hasPersonalSpace" type="button"
                class="flex h-8 items-center gap-2 rounded-sm-ln border border-white/25 px-3 text-body-sm font-medium text-white hover:bg-white/10"
                @click="emit('switch-space')">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h13l-3-3M20 16H7l3 3" /></svg>
          <span v-if="!compact">Mon espace</span>
        </button>
        <button type="button" class="relative grid h-8 w-8 place-items-center rounded-sm-ln" :aria-label="notificationLabel" @click="emit('navigate', 'notifications')">
          <svg class="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9Z" /><path d="M10 18.5a2 2 0 0 0 4 0" /></svg>
          <span v-if="unread" class="absolute right-1.5 top-1.5 h-[7px] w-[7px] rounded-full border-[1.5px] border-ln-blue-900 bg-[#F59E0B]"></span>
        </button>
        <span class="grid h-[30px] w-[30px] place-items-center rounded-full bg-ln-blue-600 text-caption font-bold text-white">{{ user.initials }}</span>
      </div>
    </header>

    <slot name="context" />

    <div class="grid min-h-0" :style="shellColumns">
      <!-- Navigation par domaine. Rail automatique sur les écrans denses :
           c'est ce qui fait tenir le tableau de délibération dans 1280 px. -->
      <nav v-if="!compact" class="flex flex-col gap-5 border-r border-ln-gray-200 bg-white" :class="rail ? 'items-center px-2 py-4' : 'gap-5 px-3 py-4'" aria-label="Navigation principale">
        <div v-for="group in navGroups" :key="group.key" class="flex w-full flex-col gap-0.5" :class="group.key === 'bottom' ? 'mt-auto border-t border-ln-gray-200 pt-3' : ''">
          <p v-if="group.title && !rail" class="px-3 pb-2 text-micro font-semibold uppercase tracking-wider text-ln-gray-500">{{ group.title }}</p>
          <a v-for="item in group.items" :key="item.key" href="#"
             class="relative flex items-center gap-3 rounded-sm-ln text-body-sm font-medium no-underline"
             :class="itemClass(item)"
             :aria-current="item.key === current ? 'page' : undefined"
             @click.prevent="emit('navigate', item.key)">
            <component :is="item.icon" v-if="item.icon" class="h-4 w-4 flex-shrink-0" />
            <span v-if="!rail">{{ item.label }}</span>
            <span v-if="item.count" :class="countClass(item)">{{ item.count }}</span>
            <span v-if="rail" class="sr-only">{{ item.label }}</span>
          </a>
        </div>
        <p v-if="!rail" class="mt-auto border-t border-ln-gray-200 pt-3 text-caption leading-snug text-ln-gray-500">
          {{ user.name }}<br />{{ rolesLabel }}
        </p>
      </nav>

      <main class="min-w-0 bg-white px-5 pb-10 pt-6 md:px-6">
        <slot />
      </main>
    </div>

    <!-- Barre inférieure mobile : quatre cibles de 44 px, jamais six comprimées. -->
    <nav v-if="compact" class="sticky bottom-0 flex border-t border-ln-gray-200 bg-white" aria-label="Navigation">
      <a v-for="item in bottomItems" :key="item.key" href="#"
         class="relative flex min-h-[44px] flex-1 flex-col items-center justify-center gap-[3px] py-1.5 text-[10.5px] font-semibold no-underline"
         :class="item.key === current ? 'text-ln-blue-900' : 'text-ln-gray-500'"
         @click.prevent="emit('navigate', item.key)">
        <component :is="item.icon" v-if="item.icon" class="h-[19px] w-[19px]" />
        {{ item.label }}
        <span v-if="item.count" class="absolute right-1/4 top-1 rounded-lg bg-ln-error px-1 text-[9.5px] font-bold leading-[15px] text-white">{{ item.count }}</span>
      </a>
    </nav>
  </div>
</template>

<script setup>
/**
 * 1 · Châssis — barre, contexte, navigation, zone de travail.
 * Réf : lot 1 §6. Navigation PAR OBJET, jamais par acteur : le cumul de rôles
 * rend les modes intenables, et le serveur ne connaît pas de mode, seulement
 * des permissions évaluées à chaque appel.
 *
 * Props : navGroups[] · bottomItems[] · current · user · hasPersonalSpace
 *         unread · rail (densité) · compact (mobile)
 * Événements : navigate(key) · switch-space · search · toggle-nav
 * Slots : context (le bandeau de contexte) · défaut (la page)
 *
 * Aucune route en dur : le composant émet, la coquille route.
 */
import { computed } from 'vue';

const props = defineProps({
  navGroups: { type: Array, default: () => [] },  // [{ key, title, items: [{ key, label, path, icon, count, overdue }] }]
  bottomItems: { type: Array, default: () => [] },  // [{ key, label, icon, count, overdue }]
  current: { type: String, default: '' },
  user: { type: Object, required: true },
  roles: { type: Array, default: () => [] },
  hasPersonalSpace: { type: Boolean, default: false },
  unread: { type: Boolean, default: false },
  rail: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
});
const emit = defineEmits(['navigate', 'switch-space', 'search', 'toggle-nav']);

const shellColumns = computed(() => {
  if (props.compact) return { gridTemplateColumns: '1fr' };
  return { gridTemplateColumns: (props.rail ? '56px' : '236px') + ' 1fr' };
});
const rolesLabel = computed(() => props.roles.join(' · '));
const notificationLabel = computed(() => (props.unread ? 'Notifications, non lues' : 'Notifications'));

function itemClass(item) {
  const base = props.rail ? 'h-10 w-10 justify-center p-0' : 'min-h-[36px] px-3';
  const active = item.key === props.current
    ? 'bg-ln-blue-100 font-semibold text-ln-blue-900'
    : 'text-ln-gray-700 hover:bg-ln-gray-50 hover:text-ln-gray-900';
  return [base, active].join(' ');
}
function countClass(item) {
  const pos = props.rail ? 'absolute right-0 top-0.5 min-w-[16px] px-1 text-[10px]' : 'ml-auto min-w-[22px] px-1.5 text-[11.5px]';
  const tone = item.overdue ? 'bg-[#FDE7E7] text-ln-error' : 'bg-ln-gray-100 text-ln-gray-500';
  return [pos, tone, 'rounded-lg text-center font-semibold leading-[17px]'].join(' ');
}
</script>
