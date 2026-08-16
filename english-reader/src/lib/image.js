/**
 * Иллюстрация к тексту.
 *
 * Claude рисовать не умеет, поэтому картинку рисует бесплатный сервис
 * pollinations.ai прямо по ссылке — без ключа и без регистрации.
 * Запрос уходит из браузера читателя, наш сервер в этом не участвует.
 * Если сервис недоступен, картинка просто не показывается.
 */

const SETTING_KEY = 'english-reader:images:v1';

export function imagesEnabled() {
  try {
    return localStorage.getItem(SETTING_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setImagesEnabled(enabled) {
  try {
    localStorage.setItem(SETTING_KEY, enabled ? 'on' : 'off');
  } catch {
    /* не критично */
  }
}

/** Стабильное число из id: у одного текста всегда одна и та же картинка. */
function seedFrom(id = '') {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash % 1000000;
}

export function imageUrl(text, { width = 1024, height = 512 } = {}) {
  const subject = text.imagePrompt || `${text.title}, ${text.topic ?? ''}`;
  if (!subject.trim()) return null;

  const style = text.imageStyle || 'atmospheric editorial photograph, soft natural light';
  const prompt = `${subject}, ${style}, no text, no letters, no watermark`.slice(0, 400);

  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    nologo: 'true',
    model: 'flux',
    seed: String(seedFrom(text.id)),
  });

  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}`;
}
