const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function apiFetch(path, options = {}) {
  const url = `${API_URL}${path}`;
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    return res.json();
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('API server unreachable. Is the backend running on port 3001?');
    }
    throw err;
  }
}

// Health
export const getHealth = () => apiFetch('/api/health');

// Protocols
export const getProtocols = () => apiFetch('/api/protocols');
export const getProtocol = (docId) => apiFetch(`/api/protocols/${docId}`);
export const searchProtocols = (query, topK = 4) =>
  apiFetch('/api/protocols/search', {
    method: 'POST',
    body: JSON.stringify({ query, topK }),
  });

// Encounters
export const getEncounters = () => apiFetch('/api/encounters');
export const getEncounter = (id) => apiFetch(`/api/encounters/${id}`);
export const createEncounter = (data) =>
  apiFetch('/api/encounters', { method: 'POST', body: JSON.stringify(data) });
export const updateEncounter = (id, data) =>
  apiFetch(`/api/encounters/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

// Guidance
export const getGuidance = (encounterId) => apiFetch(`/api/guidance/${encounterId}`);
export const generateGuidance = (encounterId) =>
  apiFetch('/api/guidance', { method: 'POST', body: JSON.stringify({ encounter_id: encounterId }) });

// Referrals
export const getReferral = (encounterId) => apiFetch(`/api/referrals/${encounterId}`);
export const generateReferral = (encounterId) =>
  apiFetch('/api/referrals', { method: 'POST', body: JSON.stringify({ encounter_id: encounterId }) });
export const updateReferral = (id, data) =>
  apiFetch(`/api/referrals/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

// Chat
export const sendChatMessage = (message, history = [], attachments = []) =>
  apiFetch('/api/chat', { method: 'POST', body: JSON.stringify({ message, history, attachments }) });

// Stock
export const getStock = () => apiFetch('/api/stock');
export const createStockItem = (data) =>
  apiFetch('/api/stock', { method: 'POST', body: JSON.stringify(data) });
export const updateStockItem = (id, data) =>
  apiFetch(`/api/stock/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const adjustStock = (id, delta) =>
  apiFetch(`/api/stock/${id}/adjust`, { method: 'POST', body: JSON.stringify({ delta }) });
export const deleteStockItem = (id) =>
  apiFetch(`/api/stock/${id}`, { method: 'DELETE' });
