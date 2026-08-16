import { directApi } from './lib/direct.js';

/**
 * Приложение работает в двух режимах:
 *
 * 1. «Сервер» — рядом есть наш Express (локальный запуск или хостинг вроде
 *    Render). Ключ лежит на сервере, браузер о нём не знает.
 * 2. «Напрямую» — сайт лежит на статическом хостинге (GitHub Pages), сервера
 *    нет. Ключ хранится в браузере и уходит прямо в Anthropic.
 *
 * Режим определяется один раз: если /api/health не отвечает — значит второй.
 */

let modePromise = null;

async function detectMode() {
  try {
    const response = await fetch('api/health', { headers: { accept: 'application/json' } });
    if (response.ok) {
      const data = await response.json();
      if (data?.ok) return 'server';
    }
  } catch {
    /* сервера нет — работаем напрямую */
  }
  return 'direct';
}

export function getMode() {
  modePromise ??= detectMode();
  return modePromise;
}

async function serverRequest(url, body) {
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

/** Один вызов — либо на сервер, либо напрямую в Anthropic. */
async function call(name, serverCall, args) {
  const mode = await getMode();
  return mode === 'direct' ? directApi[name](args) : serverCall(args);
}

export const api = {
  health: () => call('health', () => serverRequest('api/health')),
  genres: () => call('genres', () => serverRequest('api/genres')),

  generate: (args) => call('generate', (body) => serverRequest('api/generate', body), args),

  translateWord: (args) => call('translateWord', (body) => serverRequest('api/word', body), args),

  checkRetelling: (args) =>
    call('checkRetelling', (body) => serverRequest('api/retelling', body), args),

  chat: (args) => call('chat', (body) => serverRequest('api/chat', body), args),

  chatSummary: (args) => call('chatSummary', (body) => serverRequest('api/chat/summary', body), args),
};
