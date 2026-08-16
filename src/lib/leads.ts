/**
 * ============================================================================
 *  СЕРВИСНЫЙ СЛОЙ ЗАЯВОК
 * ============================================================================
 *  Формы на сайте не знают, куда уходит заявка — они вызывают submitLead().
 *  Это позволяет подключить реальный приём заявок, не трогая интерфейс.
 *
 *  КАК ПОДКЛЮЧИТЬ ПРИЁМ ЗАЯВОК (нужно сделать до запуска рекламы):
 *  1. Заведите переменную окружения LEAD_WEBHOOK_URL в .env.local / на хостинге.
 *  2. Направьте её на любой приёмник: Telegram-бот, amoCRM, Битрикс24,
 *     Make/n8n, обычный обработчик на почту.
 *  3. Всё. Обработчик /api/lead уже готов и переправит туда заявку.
 *
 *  Пока переменная не задана, заявка записывается в лог сервера, а
 *  пользователю честно показывается предложение позвонить — вместо
 *  фальшивого «спасибо, заявка принята» в никуда.
 * ============================================================================
 */

export interface LeadPayload {
  /** Имя клиента */
  name: string;
  /** Телефон — единственное по-настоящему обязательное поле */
  phone: string;
  /** Что сдаёт: id категории или свободный текст */
  material?: string;
  /** Примерный объём/вес свободным текстом: «две ванны», «около тонны» */
  volume?: string;
  /** Адрес — нужен только если требуется вывоз */
  address?: string;
  /** Нужен ли вывоз */
  needPickup?: boolean;
  /** Комментарий */
  comment?: string;
  /** Откуда пришла заявка: слаг страницы + название формы */
  source: string;
  /** Прикреплённые фото металла */
  photos?: File[];
}

export type LeadResult =
  | { ok: true }
  | { ok: false; error: string; /** true — заявка точно не доставлена */ fatal: boolean };

/** Максимальный размер одного фото, байт. */
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
/** Максимум фотографий в одной заявке. */
export const MAX_PHOTOS = 5;
/** Допустимые типы файлов. */
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

/** Приводим телефон к цифрам для проверки: +7 (999) 123-45-67 → 79991234567 */
export function normalizePhone(input: string): string {
  return input.replace(/\D/g, "");
}

/**
 * Проверка телефона. Намеренно мягкая: лучше принять заявку с кривым номером
 * и перезвонить, чем не принять живого клиента из-за строгой маски.
 */
export function isValidPhone(input: string): boolean {
  const digits = normalizePhone(input);
  return digits.length >= 10 && digits.length <= 15;
}

export function validateLead(lead: Pick<LeadPayload, "name" | "phone">): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!lead.phone.trim()) {
    errors.phone = "Без телефона мы не сможем перезвонить";
  } else if (!isValidPhone(lead.phone)) {
    errors.phone = "Проверьте номер — кажется, не хватает цифр";
  }
  if (lead.name.trim().length > 0 && lead.name.trim().length < 2) {
    errors.name = "Слишком короткое имя";
  }
  return errors;
}

/** Отправка заявки на сервер. Бросать исключения наружу не будет. */
export async function submitLead(lead: LeadPayload): Promise<LeadResult> {
  const form = new FormData();
  form.append("name", lead.name.trim());
  form.append("phone", lead.phone.trim());
  form.append("source", lead.source);
  if (lead.material) form.append("material", lead.material);
  if (lead.volume) form.append("volume", lead.volume);
  if (lead.address) form.append("address", lead.address);
  if (lead.comment) form.append("comment", lead.comment);
  form.append("needPickup", lead.needPickup ? "да" : "нет");
  form.append("page", typeof window !== "undefined" ? window.location.pathname : "");

  (lead.photos ?? []).slice(0, MAX_PHOTOS).forEach((file) => form.append("photos", file));

  try {
    const res = await fetch("/api/lead", { method: "POST", body: form });
    if (res.ok) return { ok: true };

    const data = (await res.json().catch(() => null)) as { error?: string; fatal?: boolean } | null;
    return {
      ok: false,
      error: data?.error ?? "Не получилось отправить заявку",
      fatal: data?.fatal ?? true,
    };
  } catch {
    return {
      ok: false,
      error: "Похоже, пропала связь. Попробуйте ещё раз или позвоните нам",
      fatal: true,
    };
  }
}
