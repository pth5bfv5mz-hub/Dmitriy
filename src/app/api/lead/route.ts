import { NextResponse } from "next/server";
import { ACCEPTED_IMAGE_TYPES, MAX_PHOTOS, MAX_PHOTO_BYTES, isValidPhone } from "@/lib/leads";

export const runtime = "nodejs";

/**
 * Приём заявки с сайта.
 *
 * Поведение зависит от переменной окружения LEAD_WEBHOOK_URL:
 *  • задана   — заявка уходит POST-запросом на этот адрес (CRM, бот, Make/n8n);
 *  • не задана — заявка пишется в лог сервера, а клиенту возвращается честная
 *                ошибка с предложением позвонить. Мы намеренно НЕ показываем
 *                «спасибо», если заявка никуда не ушла.
 */
export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Не удалось прочитать форму", fatal: true }, { status: 400 });
  }

  const phone = String(form.get("phone") ?? "").trim();
  if (!isValidPhone(phone)) {
    return NextResponse.json(
      { error: "Проверьте номер телефона", fatal: true },
      { status: 400 },
    );
  }

  // Простейшая защита от ботов: скрытое поле, которое человек не заполняет.
  if (String(form.get("website") ?? "").trim().length > 0) {
    // Ботам отвечаем успехом, чтобы они не подбирали обход.
    return NextResponse.json({ ok: true });
  }

  const photos = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (photos.length > MAX_PHOTOS) {
    return NextResponse.json(
      { error: `Максимум ${MAX_PHOTOS} фотографий`, fatal: true },
      { status: 400 },
    );
  }
  for (const photo of photos) {
    if (photo.size > MAX_PHOTO_BYTES) {
      return NextResponse.json(
        { error: `Файл «${photo.name}» больше 8 МБ`, fatal: true },
        { status: 400 },
      );
    }
    if (photo.type && !ACCEPTED_IMAGE_TYPES.includes(photo.type)) {
      return NextResponse.json(
        { error: `Формат файла «${photo.name}» не поддерживается`, fatal: true },
        { status: 400 },
      );
    }
  }

  const lead = {
    name: String(form.get("name") ?? "").trim() || "не указано",
    phone,
    material: String(form.get("material") ?? "").trim(),
    volume: String(form.get("volume") ?? "").trim(),
    address: String(form.get("address") ?? "").trim(),
    needPickup: String(form.get("needPickup") ?? ""),
    comment: String(form.get("comment") ?? "").trim(),
    source: String(form.get("source") ?? "").trim(),
    page: String(form.get("page") ?? "").trim(),
    photoCount: photos.length,
    receivedAt: new Date().toISOString(),
  };

  const webhook = process.env.LEAD_WEBHOOK_URL;

  if (!webhook) {
    console.warn(
      "[lead] LEAD_WEBHOOK_URL не задан — заявка НЕ доставлена. Данные заявки:",
      JSON.stringify(lead),
    );
    return NextResponse.json(
      {
        error: "Приём заявок ещё не подключён",
        fatal: true,
      },
      { status: 503 },
    );
  }

  try {
    // Фотографии пересылаем как есть, чтобы приёмник получил их вместе с заявкой.
    const outgoing = new FormData();
    Object.entries(lead).forEach(([key, value]) => outgoing.append(key, String(value)));
    photos.forEach((photo) => outgoing.append("photos", photo, photo.name));

    const res = await fetch(webhook, { method: "POST", body: outgoing });
    if (!res.ok) throw new Error(`Webhook ответил ${res.status}`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[lead] Ошибка доставки заявки:", err, JSON.stringify(lead));
    return NextResponse.json(
      { error: "Заявка не ушла. Позвоните нам, пожалуйста", fatal: true },
      { status: 502 },
    );
  }
}
