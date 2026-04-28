const BASE = import.meta.env.VITE_API_URL || '/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
};

export const api = {
  // Auth
  register: (body) => fetch(`${BASE}/auth/register`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handle),
  login: (body) => fetch(`${BASE}/auth/login`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handle),
  getMe: () => fetch(`${BASE}/auth/me`, { headers: getHeaders() }).then(handle),

  // Groups
  createGroup: (body) => fetch(`${BASE}/groups`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handle),
  getGroups: () => fetch(`${BASE}/groups`, { headers: getHeaders() }).then(handle),
  getGroup: (id) => fetch(`${BASE}/groups/${id}`, { headers: getHeaders() }).then(handle),
  addMember: (id, body) => fetch(`${BASE}/groups/${id}/members`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handle),
  deleteGroup: (id) => fetch(`${BASE}/groups/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handle),

  // Expenses
  addExpense: (body) => fetch(`${BASE}/expenses`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handle),
  getExpenses: (groupId) => fetch(`${BASE}/groups/${groupId}/expenses`, { headers: getHeaders() }).then(handle),
  deleteExpense: (id) => fetch(`${BASE}/expenses/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handle),
  settleUp: (body) => fetch(`${BASE}/expenses/settle`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handle),

  // Balances
  getBalances: (groupId) => fetch(`${BASE}/groups/${groupId}/balances`, { headers: getHeaders() }).then(handle),

  // AI
  categorize: (body) => fetch(`${BASE}/ai/categorize`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handle),
  insights: (body) => fetch(`${BASE}/ai/insights`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handle),
};
