// frontend/src/composables/usePullToRefresh.js
// Détecte le geste pull-to-refresh sur mobile et déclenche un callback
// Référence : CORRECTIONS.md C-005, U06 §3.2
import { ref, onMounted, onUnmounted } from 'vue';

/**
 * @param {Function} onRefresh — callback appelé au déclenchement du refresh
 * @param {object} [options={}]
 * @param {number} [options.threshold=80] — px de tirage avant déclenchement
 * @param {number} [options.resistanceFactor=2.5] — résistance du glissement
 */
export function usePullToRefresh(onRefresh, options = {}) {
  const { threshold = 80, resistanceFactor = 2.5 } = options;

  const isRefreshing = ref(false);
  const pullDistance = ref(0);
  const isMobile = ref(false);

  let startY = 0;
  let isPulling = false;
  let touchStartTime = 0;

  function checkMobile() {
    isMobile.value = window.innerWidth < 1024;
  }

  function onTouchStart(e) {
    // Uniquement si on est en haut de la page et sur mobile
    if (!isMobile.value || window.scrollY > 0) return;

    startY = e.touches[0].clientY;
    touchStartTime = Date.now();
    isPulling = true;
  }

  function onTouchMove(e) {
    if (!isPulling || isRefreshing.value) return;

    const currentY = e.touches[0].clientY;
    const delta = currentY - startY;

    // Tirage vers le bas uniquement
    if (delta < 0) {
      isPulling = false;
      pullDistance.value = 0;
      return;
    }

    // Empêcher le scroll natif pendant le pull
    if (delta > 10) {
      e.preventDefault();
    }

    pullDistance.value = Math.min(delta / resistanceFactor, threshold * 1.5);
  }

  async function onTouchEnd() {
    if (!isPulling) return;
    isPulling = false;

    // Vérifier durée minimale (éviter les taps accidentels)
    const duration = Date.now() - touchStartTime;
    if (duration < 100) {
      pullDistance.value = 0;
      return;
    }

    if (pullDistance.value >= threshold) {
      isRefreshing.value = true;
      try {
        await onRefresh();
      } finally {
        // Petit délai pour l'indicateur visuel
        setTimeout(() => {
          isRefreshing.value = false;
          pullDistance.value = 0;
        }, 300);
      }
    } else {
      // Retour élastique si seuil non atteint
      pullDistance.value = 0;
    }
  }

  function onResize() {
    checkMobile();
  }

  onMounted(() => {
    checkMobile();
    window.addEventListener('resize', onResize);

    // Touch events en passive pour éviter les warnings
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });
  });

  onUnmounted(() => {
    window.removeEventListener('resize', onResize);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('touchcancel', onTouchEnd);
  });

  return { isRefreshing, pullDistance, threshold };
}
