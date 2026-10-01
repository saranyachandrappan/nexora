const API_BASE = '/api';

export async function fetchSummary() {
  const res = await fetch(`${API_BASE}/summary`);
  return res.json();
}

export async function fetchCategories() {
  const res = await fetch(`${API_BASE}/categories`);
  return res.json();
}

export async function fetchTransactions(filters = {}) {
  const params = new URLSearchParams();
  if (filters.type && filters.type !== 'all') params.append('type', filters.type);
  if (filters.category && filters.category !== 'all') params.append('category', filters.category);
  if (filters.search) params.append('search', filters.search);
  if (filters.startDate) params.append('start_date', filters.startDate);
  if (filters.endDate) params.append('end_date', filters.endDate);
  if (filters.sortBy) params.append('sort_by', filters.sortBy);
  if (filters.order) params.append('order', filters.order);

  const res = await fetch(`${API_BASE}/transactions?${params.toString()}`);
  return res.json();
}

export async function createTransaction(payload) {
  const res = await fetch(`${API_BASE}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function updateTransaction(id, payload) {
  const res = await fetch(`${API_BASE}/transactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function deleteTransaction(id) {
  const res = await fetch(`${API_BASE}/transactions/${id}`, {
    method: 'DELETE'
  });
  return res.json();
}

export async function resetSampleData() {
  const res = await fetch(`${API_BASE}/reset-sample`, {
    method: 'POST'
  });
  return res.json();
}
