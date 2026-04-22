// frontend/src/composables/useSupportApi.js
// Composable support : état réactif + form + actions + mapping statuts.
// Refs : CF-016 §5 (T03 F-CF-016a/b/c/d), D05 §10, U03 §8.5, U07 §4.16,
//        DEC-097, DEC-119, DEC-122, DEC-127, DEC-140.

import { ref, reactive, computed } from 'vue';

const BASE = '/api/method/portal_app.api.support';

// --- Low-level HTTP helpers -------------------------------------------------

async function callApi(methodName, params = {}, { method = 'POST' } = {}) {
  const url = `${BASE}.${methodName}`;
  const options = {
    method,
    headers: {
      'X-Frappe-CSRF-Token': window.csrf_token || '',
      Accept: 'application/json',
    },
    credentials: 'same-origin',
  };

  if (method === 'GET') {
    const qs = new URLSearchParams(params).toString();
    const response = await fetch(qs ? `${url}?${qs}` : url, options);
    return unwrap(response);
  }

  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) body.append(k, String(v));
  }
  options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
  options.body = body.toString();
  const response = await fetch(url, options);
  return unwrap(response);
}

async function unwrap(response) {
  if (!response.ok) {
    const text = await response.text();
    let message = `HTTP ${response.status}`;
    try {
      const json = JSON.parse(text);
      message = json._server_messages || json.exc || json.message || message;
      if (typeof message === 'string' && message.startsWith('[')) {
        try {
          const arr = JSON.parse(message);
          message = arr
            .map((m) => (typeof m === 'string' ? (JSON.parse(m).message || m) : m))
            .join(' — ');
        } catch {
          // keep raw message
        }
      }
    } catch {
      // not JSON → keep HTTP status
    }
    throw new Error(message);
  }
  const json = await response.json();
  return json.message !== undefined ? json.message : json;
}

async function uploadAttachment(file) {
  const formData = new FormData();
  formData.append('file', file, file.name);
  formData.append('is_private', '1');

  const response = await fetch('/api/method/upload_file', {
    method: 'POST',
    headers: {
      'X-Frappe-CSRF-Token': window.csrf_token || '',
      Accept: 'application/json',
    },
    credentials: 'same-origin',
    body: formData,
  });

  const result = await unwrap(response);
  const fileUrl = result?.file_url || result?.message?.file_url;
  if (!fileUrl) {
    throw new Error("La pièce jointe n'a pas pu être téléversée.");
  }
  return fileUrl;
}

// --- Mapping statuts backend (FR) → badge UI --------------------------------

const STATUS_MAP = {
  Nouveau: { status: 'pending', label: 'Nouveau' },
  'En cours': { status: 'in-review', label: 'En cours' },
  Répondu: { status: 'validated', label: 'Répondu' },
  Transféré: { status: 'in-review', label: 'Transféré' },
  Clos: { status: 'closed', label: 'Clos' },
  Annulé: { status: 'withdrawn', label: 'Annulé' },
};

export function mapRequestStatus(frappeStatus) {
  return STATUS_MAP[frappeStatus] || { status: frappeStatus || 'pending', label: frappeStatus || 'Inconnu' };
}

// --- Catégories et priorités (D05 §10.4, backend support.py) ----------------

export const SUPPORT_CATEGORIES = [
  { value: 'Information', label: 'Information' },
  { value: 'Réclamation', label: 'Réclamation' },
  { value: 'Document', label: 'Document' },
  { value: 'Problème technique', label: 'Problème technique' },
  { value: 'Autre', label: 'Autre' },
];

export const SUPPORT_PRIORITIES = [
  { value: 'Normale', label: 'Normale' },
  { value: 'Urgente', label: 'Urgente' },
];

// Groupes de filtrage frontend pour l'onglet "Mes demandes"
// Le backend accepte un statut exact — on filtre côté UI pour les groupes.
const FILTER_GROUPS = {
  all: null,
  open: ['Nouveau', 'En cours', 'Transféré'],
  responded: ['Répondu'],
  closed: ['Clos', 'Annulé'],
};

export const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Toutes' },
  { value: 'open', label: 'Ouvertes' },
  { value: 'responded', label: 'Répondues' },
  { value: 'closed', label: 'Closes' },
];

// Quota anti-spam (DEC-119)
export const MAX_OPEN_REQUESTS = 5;

// --- Composable singleton ---------------------------------------------------

const services = ref([]);
const requests = ref([]);
const openCount = ref(0);
const currentRequest = ref(null);
const isLoading = ref(false);
const isSubmitting = ref(false);
const error = ref(null);
const submitError = ref(null);
const statusFilter = ref('all');

const form = reactive({
  service: '',
  category: 'Information',
  subject: '',
  message: '',
  priority: 'Normale',
  attachment: null,
});

const charCount = computed(() => form.subject.length);

const canSubmit = computed(
  () =>
    Boolean(form.service) &&
    Boolean(form.category) &&
    form.subject.trim().length >= 3 &&
    form.message.trim().length >= 20 &&
    openCount.value < MAX_OPEN_REQUESTS &&
    !isSubmitting.value,
);

const quotaReached = computed(() => openCount.value >= MAX_OPEN_REQUESTS);

const filteredRequests = computed(() => {
  const group = FILTER_GROUPS[statusFilter.value];
  if (!group) return requests.value;
  return requests.value.filter((request) => group.includes(request.status));
});

async function loadServices() {
  isLoading.value = true;
  error.value = null;
  try {
    const res = await callApi('get_service_directory', {}, { method: 'GET' });
    services.value = Array.isArray(res) ? res : (res?.services || []);
  } catch (e) {
    error.value = e?.message || String(e);
    services.value = [];
  } finally {
    isLoading.value = false;
  }
}

async function loadMyRequests(backendStatusFilter = null) {
  isLoading.value = true;
  error.value = null;
  try {
    const params = backendStatusFilter ? { status_filter: backendStatusFilter } : {};
    const res = await callApi('get_my_support_requests', params, { method: 'GET' });
    requests.value = Array.isArray(res?.requests) ? res.requests : [];
    openCount.value = Number.isFinite(res?.open_count) ? res.open_count : 0;
  } catch (e) {
    error.value = e?.message || String(e);
    requests.value = [];
  } finally {
    isLoading.value = false;
  }
}

async function loadDetail(requestName) {
  isLoading.value = true;
  error.value = null;
  currentRequest.value = null;
  try {
    const res = await callApi(
      'get_request_detail',
      { request_name: requestName },
      { method: 'GET' },
    );
    currentRequest.value = res || null;
  } catch (e) {
    error.value = e?.message || String(e);
  } finally {
    isLoading.value = false;
  }
}

/**
 * Soumission d'une Support Request avec pièce jointe.
 * Flux en 2 étapes (pattern Frappe standard) :
 *   1. upload_file → retourne file_url
 *   2. submit_support_request(attachment=file_url)
 * Le backend submit_support_request ne gère pas les fichiers bruts —
 * ne pas tenter de fusionner en un seul appel.
 */
async function submitRequest() {
  if (!canSubmit.value) return false;
  isSubmitting.value = true;
  submitError.value = null;
  try {
    let attachment = null;
    if (form.attachment) {
      attachment = await uploadAttachment(form.attachment);
    }

    await callApi('submit_support_request', {
      target_service: form.service,
      subject: form.subject.trim(),
      message: form.message.trim(),
      category: form.category,
      priority: form.priority || 'Normale',
      attachment,
    });
    resetForm();
    await loadMyRequests();
    return true;
  } catch (e) {
    const msg = e?.message || String(e);
    if (/maximum/i.test(msg) || /\b5\s*demandes?\b/i.test(msg)) {
      submitError.value =
        'Vous avez atteint la limite de 5 demandes ouvertes. Clôturez ou annulez une demande existante pour en créer une nouvelle.';
    } else {
      submitError.value = msg;
    }
    return false;
  } finally {
    isSubmitting.value = false;
  }
}

async function cancelRequest(requestName) {
  error.value = null;
  try {
    await callApi(
      'cancel_support_request',
      { request_name: requestName },
      { method: 'POST' },
    );
    await loadMyRequests();
    if (currentRequest.value?.name === requestName) {
      await loadDetail(requestName);
    }
    return true;
  } catch (e) {
    error.value = e?.message || String(e);
    return false;
  }
}

/**
 * Clôt une Support Request (transition Répondu → Clos).
 * P4-FRONT-002 : accessible uniquement au demandeur, si statut = "Répondu".
 */
async function closeRequest(requestName) {
  error.value = null;
  try {
    await callApi(
      'close_support_request',
      { request_name: requestName },
      { method: 'POST' },
    );
    await loadMyRequests();
    if (currentRequest.value?.name === requestName) {
      await loadDetail(requestName);
    }
    return true;
  } catch (e) {
    error.value = e?.message || String(e);
    return false;
  }
}

/**
 * Enregistre la note de satisfaction (1 à 5) pour une Support Request.
 * P4-FRONT-002 : accessible uniquement au demandeur, si statut ∈ {"Répondu", "Clos"}.
 */
async function rateRequest(requestName, rating) {
  error.value = null;
  try {
    await callApi(
      'rate_support_request',
      { request_name: requestName, rating },
      { method: 'POST' },
    );
    // Recharger le détail pour afficher la note enregistrée
    if (currentRequest.value?.name === requestName) {
      await loadDetail(requestName);
    }
    return true;
  } catch (e) {
    error.value = e?.message || String(e);
    return false;
  }
}

function resetForm() {
  form.service = '';
  form.category = 'Information';
  form.subject = '';
  form.message = '';
  form.priority = 'Normale';
  form.attachment = null;
  submitError.value = null;
}

export function useSupportApi() {
  return {
    services,
    requests,
    filteredRequests,
    statusFilter,
    openCount,
    currentRequest,
    isLoading,
    isSubmitting,
    error,
    submitError,
    form,
    charCount,
    canSubmit,
    quotaReached,
    loadServices,
    loadMyRequests,
    loadDetail,
    submitRequest,
    cancelRequest,
    closeRequest,
    rateRequest,
    resetForm,
    mapRequestStatus,
    getServiceDirectory: () => callApi('get_service_directory', {}, { method: 'GET' }),
    getMyRequests: async (status = null) => {
      const res = await callApi(
        'get_my_support_requests',
        status ? { status_filter: status } : {},
        { method: 'GET' },
      );
      return Array.isArray(res?.requests) ? res.requests : [];
    },
    getRequestDetail: (requestName) =>
      callApi('get_request_detail', { request_name: requestName }, { method: 'GET' }),
    createRequest: async ({
      targetService,
      subject,
      message,
      category = 'Information',
      priority = 'Normale',
      attachment = null,
    }) => {
      const attachmentUrl =
        attachment instanceof File ? await uploadAttachment(attachment) : attachment;

      return callApi('submit_support_request', {
        target_service: targetService,
        subject,
        message,
        category,
        priority,
        attachment: attachmentUrl,
      });
    },
  };
}
