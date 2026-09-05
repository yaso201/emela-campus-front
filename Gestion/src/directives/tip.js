/**
 * v-tip — LE mécanisme d'infobulle partagé (M3 AN-10).
 *
 * Une directive, zéro texte dupliqué : le libellé existant (item.label,
 * aria-label…) alimente l'infobulle. Elle s'affiche au SURVOL **et** au FOCUS
 * CLAVIER (le `title` natif ne couvre pas le focus — c'est pourquoi ce n'est
 * pas un simple attribut). Sur un élément sans texte visible (icône seule),
 * la directive pose aussi `aria-label` si absent.
 *
 * Styles en ligne sur jetons `--ln-*` : le design system n'est pas touché
 * (write-set M3 — `src/styles/**` interdit).
 */

let bubble = null;

function ensureBubble() {
  if (bubble) return bubble;
  bubble = document.createElement('div');
  bubble.setAttribute('role', 'tooltip');
  bubble.style.cssText = [
    'position:fixed', 'z-index:70', 'pointer-events:none',
    'max-width:280px', 'padding:4px 10px', 'border-radius:4px',
    'background:var(--ln-gray-900, #111827)', 'color:#fff',
    'font-size:12px', 'line-height:1.35', 'font-weight:500',
    'box-shadow:0 2px 8px rgba(0,0,0,.25)', 'display:none',
  ].join(';');
  document.body.appendChild(bubble);
  return bubble;
}

function show(el) {
  const text = el.__tipText;
  if (!text) return;
  const b = ensureBubble();
  b.textContent = text;
  b.style.display = 'block';
  const r = el.getBoundingClientRect();
  // sous l'élément, centré, sans sortir de l'écran
  const top = Math.min(r.bottom + 6, window.innerHeight - 34);
  b.style.top = top + 'px';
  b.style.left = '0px';
  const bw = b.getBoundingClientRect().width;
  const left = Math.max(6, Math.min(r.left + r.width / 2 - bw / 2, window.innerWidth - bw - 6));
  b.style.left = left + 'px';
}

function hide() { if (bubble) bubble.style.display = 'none'; }

function bind(el, value) {
  el.__tipText = typeof value === 'string' ? value.trim() : '';
  // Icône seule : l'accessibilité reçoit le même libellé (jamais dupliqué à la main).
  if (el.__tipText && !el.getAttribute('aria-label') && !(el.textContent || '').trim()) {
    el.setAttribute('aria-label', el.__tipText);
  }
}

export const tip = {
  mounted(el, binding) {
    bind(el, binding.value);
    el.__tipShow = () => show(el);
    el.__tipHide = hide;
    el.addEventListener('mouseenter', el.__tipShow);
    el.addEventListener('mouseleave', el.__tipHide);
    el.addEventListener('focus', el.__tipShow);
    el.addEventListener('blur', el.__tipHide);
    el.addEventListener('click', el.__tipHide);
  },
  updated(el, binding) { bind(el, binding.value); },
  unmounted(el) {
    hide();
    el.removeEventListener('mouseenter', el.__tipShow);
    el.removeEventListener('mouseleave', el.__tipHide);
    el.removeEventListener('focus', el.__tipShow);
    el.removeEventListener('blur', el.__tipHide);
    el.removeEventListener('click', el.__tipHide);
  },
};
