/**
 * MANDAT-14 (D-FRONT-DIALOGUES-FOCUS-01) — LE FOCUS DES FENÊTRES, UNE FOIS POUR TOUTES.
 *
 * Le front de gestion compte une vingtaine de fenêtres (`role="dialog"`, `role="alertdialog"`) : formulaires
 * d'ouverture de dossier, de séance, de module, confirmations en ligne. Aucune ne prenait le focus, aucune ne se
 * fermait par Échap, aucune ne rendait le focus au bouton qui l'avait ouverte : au clavier, on perdait sa place.
 *
 * Plutôt qu'une correction par fenêtre (qu'une fenêtre de plus oublierait), un observateur unique :
 *   - à l'APPARITION d'une fenêtre : elle défile dans la vue, et le focus va à son élément `[autofocus]`, sinon à
 *     son premier élément focalisable, sinon à elle-même ;
 *   - ÉCHAP déclenche son bouton d'échappée — `[data-dialog-cancel]`, sinon le bouton « Annuler », « Fermer »,
 *     « Revenir » ou « Retour » : la fenêtre se ferme par SON geste, rien n'est contourné ;
 *   - TABULATION : dans une fenêtre MODALE (`aria-modal="true"`), le focus tourne à l'intérieur ; une confirmation
 *     en ligne ne piège pas la page ;
 *   - à la DISPARITION : le focus revient à l'élément qui l'avait avant l'ouverture, s'il est encore là.
 * Rien n'est ajouté au design system partagé : c'est un comportement du front de gestion.
 */
const SELECTOR = '[role="dialog"], [role="alertdialog"]';
const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), '
  + 'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
// Le libellé EXACT d'une échappée : « Annuler la séance… » commence par « Annuler » mais c'est un ACTE — Échap ne
// doit jamais le déclencher. Une échappée au libellé plus long se marque `data-dialog-cancel`.
export const ESCAPE_LABEL = /^(annuler|fermer|revenir|retour|fermer le rapport)$/i;

const opened = new Map();   // fenêtre → élément qui avait le focus avant elle

function focusables(dialog) {
  return [...dialog.querySelectorAll(FOCUSABLE)].filter((e) => e.getClientRects().length > 0);
}

export function escapeButton(dialog) {
  return dialog.querySelector('[data-dialog-cancel]')
    || [...dialog.querySelectorAll('button')].find((b) => ESCAPE_LABEL.test((b.textContent || '').trim()))
    || null;
}

function open(dialog) {
  if (opened.has(dialog)) return;
  opened.set(dialog, document.activeElement);
  requestAnimationFrame(() => {
    if (!document.contains(dialog)) return;
    if (typeof dialog.scrollIntoView === 'function') dialog.scrollIntoView({ block: 'nearest' });
    if (dialog.contains(document.activeElement) && document.activeElement !== dialog) return;
    const target = dialog.querySelector('[autofocus]') || focusables(dialog)[0];
    if (target) {
      target.focus({ preventScroll: true });
    } else {
      if (!dialog.hasAttribute('tabindex')) dialog.setAttribute('tabindex', '-1');
      dialog.focus({ preventScroll: true });
    }
  });
}

function close(dialog) {
  const before = opened.get(dialog);
  opened.delete(dialog);
  const active = document.activeElement;
  const lost = !active || active === document.body || !document.contains(active);
  if (lost && before && document.contains(before) && typeof before.focus === 'function') {
    before.focus({ preventScroll: true });
  }
}

/** La fenêtre ouverte en dernier, encore présente. */
function topmost() {
  const live = [...opened.keys()].filter((d) => document.contains(d));
  return live[live.length - 1] || null;
}

function onKeydown(event) {
  const dialog = topmost();
  if (!dialog) return;
  if (event.key === 'Escape') {
    const button = escapeButton(dialog);
    if (button && !button.disabled) {
      event.preventDefault();
      button.click();
    }
    return;
  }
  if (event.key !== 'Tab' || dialog.getAttribute('aria-modal') !== 'true') return;
  const items = focusables(dialog);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (!dialog.contains(document.activeElement)) {
    event.preventDefault();
    first.focus();
  } else if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function scan() {
  document.querySelectorAll(SELECTOR).forEach(open);
  for (const dialog of [...opened.keys()]) {
    if (!document.contains(dialog)) close(dialog);
  }
}

/** À appeler une fois, après le montage de l'application. Rend la fonction qui le défait (tests). */
export function installDialogFocus() {
  const observer = new MutationObserver(scan);
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('keydown', onKeydown);
  scan();
  return () => {
    observer.disconnect();
    document.removeEventListener('keydown', onKeydown);
    opened.clear();
  };
}
