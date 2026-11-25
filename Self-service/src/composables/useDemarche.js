// useDemarche — la lecture d'une démarche de l'étudiant et ses actes (MANDAT-14, E-M1 à E-M6).
// P1 (VERDICT-MANDAT-14-PC1) : l'écran ne garde aucune machine. La lecture `get_my_*` rend, pour chaque dossier,
// les actes possibles MAINTENANT (`available_acts`, avec leur chemin) et ceux qui ne le sont pas, avec la phrase de
// la garde (`blocked_acts`) ; et l'ouverture d'une démarche (`open`). L'écran rend ce que le serveur dit.
import { nextTick, ref, watch } from 'vue';

export async function callApi(method, params = {}) {
  const body = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') body.append(key, value);
  });
  const response = await fetch(`/api/method/${method}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Frappe-CSRF-Token': window.csrf_token || '',
      Accept: 'application/json',
    },
    body: body.toString(),
    credentials: 'same-origin',
  });
  const text = await response.text();
  let payload = {};
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = { message: text }; }
  }
  if (!response.ok) {
    let message = payload?._server_messages || payload?.exc || payload?.message || `HTTP ${response.status}`;
    try {
      const list = JSON.parse(payload._server_messages);
      message = list.map((m) => JSON.parse(m).message).join(' ');
    } catch { /* message brut */ }
    throw new Error(Array.isArray(message) ? message.join(' ') : String(message));
  }
  return Object.prototype.hasOwnProperty.call(payload, 'message') ? payload.message : payload;
}

/** La lecture d'une démarche : `method` (un `get_my_*`), et la clé de ses dossiers dans la réponse. */
export function useDemarche(method, itemsKey = 'items') {
  const data = ref(null);
  const items = ref([]);
  const loading = ref(false);
  const error = ref('');
  // Conception (lot 7 bis, D-7) : un acte refusé s'affiche en haut de la page, loin de son bouton (au téléphone, hors de
  // l'écran). L'alerte est amenée à l'écran et prend le focus : le refus est vu, et lu par le lecteur d'écran.
  watch(error, (message) => {
    if (!message || typeof document === 'undefined') return;
    nextTick(() => {
      const alerte = document.querySelector('[role="alert"]');
      if (!alerte) return;
      alerte.setAttribute('tabindex', '-1');
      alerte.scrollIntoView?.({ block: 'center' });
      alerte.focus?.({ preventScroll: true });
    });
  });

  async function load() {
    loading.value = true;
    error.value = '';
    try {
      data.value = await callApi(method);
      items.value = data.value?.[itemsKey] || [];
    } catch (err) {
      data.value = null;
      items.value = [];
      error.value = err.message || 'Impossible de charger la démarche.';
    } finally {
      loading.value = false;
    }
  }

  /** Un acte rendu par le serveur : son chemin vient de la lecture, jamais de l'écran. */
  async function perform(act, params) {
    return callApi(act.method, params);
  }

  return { data, items, loading, error, load, perform };
}

/** P16 : une date au format français — « 23 nov. 2026 », « 1er déc. 2026 » ; jamais « 2026-11-23 ». */
export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(String(value).length === 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    .replace(/^1 /, '1er ');
}

/** P16 : un congé se nomme par sa période (« du 1er sept. 2026 au 31 janv. 2027 »), jamais par son
 *  identifiant, qui porte le sigle « COA ». `period` : `{ from_date, to_date }`. */
export function leavePeriod(period) {
  if (!period || (!period.from_date && !period.to_date)) return 'congé académique';
  return `du ${formatDate(period.from_date)} au ${formatDate(period.to_date)}`;
}

/** P16 : un nombre et son nom, accordés — « 1 jour », « 6 jours ouvrables » ; jamais « jour(s) ». */
export function plural(count, singular, pluralForm = `${singular}s`) {
  return `${count} ${Math.abs(Number(count)) >= 2 ? pluralForm : singular}`;
}
