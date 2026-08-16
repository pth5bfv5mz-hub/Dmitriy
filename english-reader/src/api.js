async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    ...options,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    /* пустое тело — не страшно */
  }

  if (!response.ok) {
    throw new Error(payload?.error || `Ошибка запроса (${response.status})`);
  }
  return payload;
}

const json = (body) => ({ method: 'POST', body: JSON.stringify(body) });

export const api = {
  health: () => request('/api/health'),
  genres: () => request('/api/genres'),

  listTexts: () => request('/api/texts'),
  getText: (id) => request(`/api/texts/${id}`),
  createText: (body) => request('/api/texts', json(body)),
  deleteText: (id) => request(`/api/texts/${id}`, { method: 'DELETE' }),

  saveProgress: (id, body) =>
    request(`/api/texts/${id}/progress`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),

  translate: (id, body) => request(`/api/texts/${id}/word`, json(body)),
  submitQuiz: (id, answers) => request(`/api/texts/${id}/quiz`, json({ answers })),
  checkRetelling: (id, retelling) => request(`/api/texts/${id}/retelling`, json({ retelling })),
  chat: (id, message) => request(`/api/texts/${id}/chat`, json({ message })),
  chatSummary: (id) => request(`/api/texts/${id}/chat/summary`, json({})),
};
