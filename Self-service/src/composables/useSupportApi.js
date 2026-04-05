// frontend/src/composables/useSupportApi.js
// Wrapper fetch pour les 4 endpoints CF-016 (portal_app.api.support.*)
// Refs : CF-016 §5 fiches F-CF-016a/b/c/d.

const BASE = '/api/method/portal_app.api.support';

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
          message = arr.map((m) => (typeof m === 'string' ? JSON.parse(m).message || m : m)).join(' — ');
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

export function useSupportApi() {
  return {
    getServiceDirectory: () => callApi('get_service_directory', {}, { method: 'GET' }),
    getMyRequests: (status = null) =>
      callApi('get_my_requests', status ? { status } : {}, { method: 'GET' }),
    getRequestDetail: (requestName) =>
      callApi('get_request_detail', { request_name: requestName }, { method: 'GET' }),
    createRequest: ({ targetService, subject, message, category = 'Information', priority = 'Normal' }) =>
      callApi('create_request', {
        target_service: targetService,
        subject,
        message,
        category,
        priority,
      }),
  };
}
