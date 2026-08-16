/**
 * Обращения к серверу. Сервер сам ничего не хранит — он только
 * посредник между браузером и Anthropic API.
 */

async function request(url, body) {
  let response;
  try {
    response = await fetch(url, {
      method: body === undefined ? 'GET' : 'POST',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error('Нет связи с сервером. Проверьте интернет и обновите страницу.');
  }

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

export const api = {
  health: () => request('/api/health'),
  genres: () => request('/api/genres'),

  generate: ({ genre, topic }) => request('/api/generate', { genre, topic }),

  translateWord: ({ word, sentence, title, genre }) =>
    request('/api/word', { word, sentence, title, genre }),

  checkRetelling: ({ title, text, retelling }) =>
    request('/api/retelling', { title, text, retelling }),

  chat: ({ title, text, genre, history, message }) =>
    request('/api/chat', { title, text, genre, history, message }),

  chatSummary: ({ title, history }) => request('/api/chat/summary', { title, history }),
};
