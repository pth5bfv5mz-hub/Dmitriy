/**
 * Прямое обращение к Anthropic API из браузера.
 *
 * Нужно для варианта без сервера (GitHub Pages и любой статический хостинг):
 * ключ хранится в этом браузере и уходит только на api.anthropic.com.
 * Заголовок anthropic-dangerous-direct-browser-access включает CORS —
 * без него браузер запрос не выпустит.
 */

export const MODEL = 'claude-sonnet-4-6';

const KEY_STORAGE = 'english-reader:key:v1';
const BASE_STORAGE = 'english-reader:api-base'; // подмена адреса для отладки

export function getKey() {
  try {
    return localStorage.getItem(KEY_STORAGE) ?? '';
  } catch {
    return '';
  }
}

export function setKey(key) {
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key.trim());
    else localStorage.removeItem(KEY_STORAGE);
  } catch {
    /* приватный режим браузера — ключ не сохранится */
  }
}

export function looksLikeKey(key) {
  return /^sk-ant-[\w-]{20,}$/.test(key.trim());
}

function baseUrl() {
  try {
    return localStorage.getItem(BASE_STORAGE) || 'https://api.anthropic.com';
  } catch {
    return 'https://api.anthropic.com';
  }
}

export async function ask({ system, messages, maxTokens = 2000, effort = 'medium' }) {
  const key = getKey();
  if (!key) throw new Error('Не задан ключ Anthropic. Откройте «Ключ» вверху страницы.');

  let response;
  try {
    response = await fetch(`${baseUrl()}/v1/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        output_config: { effort },
        system,
        messages,
      }),
    });
  } catch {
    throw new Error('Не удалось связаться с Anthropic. Проверьте интернет и попробуйте ещё раз.');
  }

  if (!response.ok) {
    let detail = '';
    try {
      detail = (await response.json())?.error?.message ?? '';
    } catch {
      /* тело не разобралось */
    }

    if (response.status === 401) {
      throw new Error('Anthropic не принял ключ. Проверьте его в настройках («Ключ» вверху).');
    }
    if (response.status === 400 && /credit|balance|billing/i.test(detail)) {
      throw new Error('На счёте Anthropic закончились деньги — пополните баланс в консоли.');
    }
    if (response.status === 429) {
      throw new Error('Слишком много запросов подряд. Подождите минуту и попробуйте снова.');
    }
    throw new Error(detail || `Anthropic вернул ошибку ${response.status}.`);
  }

  const data = await response.json();
  return (data.content ?? [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();
}

export function parseJson(raw) {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : raw).trim();

  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.search(/[[{]/);
    const end = Math.max(candidate.lastIndexOf('}'), candidate.lastIndexOf(']'));
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1));
      } catch {
        /* падаем ниже */
      }
    }
    throw new Error('Не удалось разобрать ответ модели. Попробуйте ещё раз.');
  }
}

export async function askJson(options) {
  return parseJson(await ask(options));
}
