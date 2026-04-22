import { ref } from 'vue';

const BASE = '/api/method/portal_app.api.eval_api';

async function unwrap(response) {
  if (!response.ok) {
    const text = await response.text();
    let message = `HTTP ${response.status}`;

    try {
      const json = JSON.parse(text);
      message = json._server_messages || json.exc || json.message || message;
      if (typeof message === 'string' && message.startsWith('[')) {
        try {
          const entries = JSON.parse(message);
          message = entries
            .map((entry) => (typeof entry === 'string' ? (JSON.parse(entry).message || entry) : entry))
            .join(' — ');
        } catch {
          // keep the original serialized payload
        }
      }
    } catch {
      // keep HTTP fallback
    }

    throw new Error(message);
  }

  const json = await response.json();
  return json.message !== undefined ? json.message : json;
}

async function callApi(methodName, params = {}) {
  const formData = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
  });

  const response = await fetch(`${BASE}.${methodName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Frappe-CSRF-Token': window.csrf_token || '',
      Accept: 'application/json',
    },
    body: formData.toString(),
    credentials: 'same-origin',
  });

  return unwrap(response);
}

export function useEvals() {
  const campaigns = ref([]);
  const error = ref(null);
  const loading = ref(false);
  const questionnaireLoading = ref(false);
  const submitting = ref(false);

  async function loadCampaigns() {
    loading.value = true;
    error.value = null;
    try {
      const payload = await callApi('get_my_evaluations');
      campaigns.value = payload?.campaigns || [];
      return campaigns.value;
    } catch (err) {
      error.value = err;
      campaigns.value = [];
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function loadQuestionnaire(campaignName) {
    questionnaireLoading.value = true;
    try {
      return await callApi('get_questionnaire', { campaign_name: campaignName });
    } finally {
      questionnaireLoading.value = false;
    }
  }

  async function submitResponse(campaignName, answers) {
    submitting.value = true;
    try {
      return await callApi('submit_evaluation_response', {
        campaign_name: campaignName,
        answers,
      });
    } finally {
      submitting.value = false;
    }
  }

  return {
    campaigns,
    error,
    loading,
    questionnaireLoading,
    submitting,
    loadCampaigns,
    loadQuestionnaire,
    submitResponse,
  };
}
