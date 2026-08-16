import Anthropic from '@anthropic-ai/sdk';

// Модель задана в требованиях к проекту.
export const MODEL = 'claude-sonnet-4-6';

let client = null;

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new ApiError(
      500,
      'Не задан ANTHROPIC_API_KEY. Скопируйте .env.example в .env и впишите ключ.',
    );
  }
  client ??= new Anthropic();
  return client;
}

/**
 * Один запрос к Claude. Возвращает собранный текст ответа.
 * effort: low | medium | high | max — управляет глубиной размышления и расходом токенов.
 */
export async function ask({ system, messages, maxTokens = 2000, effort = 'medium' }) {
  try {
    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      output_config: { effort },
      system,
      messages,
    });
    return response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Anthropic.AuthenticationError) {
      throw new ApiError(500, 'Anthropic отклонил ключ: проверьте ANTHROPIC_API_KEY.');
    }
    if (error instanceof Anthropic.RateLimitError) {
      throw new ApiError(429, 'Слишком много запросов к Anthropic. Попробуйте через минуту.');
    }
    if (error instanceof Anthropic.APIError) {
      throw new ApiError(502, `Ошибка Anthropic API (${error.status}): ${error.message}`);
    }
    throw error;
  }
}

/**
 * Запрос, ответ на который ожидается в JSON.
 * Sonnet 4.6 не поддерживает structured outputs, поэтому просим JSON в промпте
 * и аккуратно достаём его из ответа (модель иногда оборачивает в ```json).
 */
export async function askJson(options) {
  const raw = await ask(options);
  return parseJson(raw);
}

export function parseJson(raw) {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : raw).trim();

  try {
    return JSON.parse(candidate);
  } catch {
    // Иногда вокруг JSON остаётся пояснительный текст — вырезаем внешние скобки.
    const start = candidate.search(/[[{]/);
    const end = Math.max(candidate.lastIndexOf('}'), candidate.lastIndexOf(']'));
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1));
      } catch {
        /* падаем ниже */
      }
    }
    throw new ApiError(502, 'Не удалось разобрать ответ модели как JSON.');
  }
}
