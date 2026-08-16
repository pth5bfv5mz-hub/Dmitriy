"use client";

import { useId, useRef, useState } from "react";
import { company } from "@/config/company";
import { metals } from "@/config/prices";
import { GOALS, reachGoal } from "@/lib/analytics";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_PHOTOS,
  MAX_PHOTO_BYTES,
  submitLead,
  validateLead,
} from "@/lib/leads";
import { IconCamera, IconCheck, IconPhone } from "@/components/icons/Icons";
import { PhoneLink } from "@/components/ui/PhoneLink";

type Status = "idle" | "sending" | "success" | "error";

/**
 * Форма заявки.
 *
 * Принципы, выведенные из анализа конкурентов:
 *  • обязательное поле ровно одно — телефон. Имя желательно, остальное опционально;
 *  • фото металла вынесено в заметное место, а не спрятано в «прикрепить файл»:
 *    большинство клиентов не знают ни сорт, ни вес, но сфотографировать могут;
 *  • адрес появляется только если нужен вывоз — не показываем лишние поля;
 *  • все состояния честные. Если заявка не ушла — так и написано, с телефоном.
 */
export function LeadForm({
  source,
  defaultMaterial = "",
  defaultPickup = false,
  submitLabel = "Получить расчёт",
  compact = false,
}: {
  /** Откуда заявка: «hero», «prices», «pickup» + слаг страницы */
  source: string;
  /** Предзаполненный металл (на страницах категорий) */
  defaultMaterial?: string;
  /** Предустановленная галочка «нужен вывоз» (на странице вывоза) */
  defaultPickup?: boolean;
  submitLabel?: string;
  /** Короткий вариант: без блока фото */
  compact?: boolean;
}) {
  const formId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [material, setMaterial] = useState(defaultMaterial);
  const [volume, setVolume] = useState("");
  const [needPickup, setNeedPickup] = useState(defaultPickup);
  const [address, setAddress] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState("");
  const [consent, setConsent] = useState(true);

  function handleFiles(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list);
    const accepted: File[] = [];
    let error = "";

    for (const file of incoming) {
      if (photoFiles.length + accepted.length >= MAX_PHOTOS) {
        error = `Можно приложить не больше ${MAX_PHOTOS} фото`;
        break;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        error = `«${file.name}» больше 8 МБ — снимите с меньшим разрешением`;
        continue;
      }
      if (file.type && !ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        error = `«${file.name}» — не изображение`;
        continue;
      }
      accepted.push(file);
    }

    setPhotoError(error);
    if (accepted.length > 0) {
      setPhotoFiles((prev) => [...prev, ...accepted]);
      reachGoal(GOALS.PHOTO_ATTACHED, { source, count: accepted.length });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePhoto(index: number) {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError("");

    const validation = validateLead({ name, phone });
    if (!consent) validation.consent = "Нужно согласие на обработку данных";
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setStatus("sending");

    const honeypot = (event.currentTarget.elements.namedItem("website") as HTMLInputElement | null)?.value ?? "";
    if (honeypot) {
      setStatus("success");
      return;
    }

    const result = await submitLead({
      name,
      phone,
      material: material || undefined,
      volume: volume || undefined,
      address: needPickup ? address || undefined : undefined,
      needPickup,
      source,
      photos: photoFiles,
    });

    if (result.ok) {
      setStatus("success");
      reachGoal(GOALS.FORM_SUBMIT, { source, withPhoto: photoFiles.length > 0 });
      if (needPickup) reachGoal(GOALS.PICKUP_ORDER, { source });
    } else {
      setStatus("error");
      setServerError(result.error);
    }
  }

  /* ------------------------------- УСПЕХ ------------------------------- */
  if (status === "success") {
    return (
      <div className="card p-6 text-center sm:p-8" role="status" aria-live="polite">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
          <IconCheck className="h-7 w-7" />
        </div>
        <h3 className="text-xl font-bold text-white">Заявка отправлена</h3>
        <p className="mx-auto mt-3 max-w-md text-graphite-300">
          Спасибо! Мы свяжемся с вами для уточнения стоимости.
          {company.workingHours.requests24h
            ? " Заявки принимаем круглосуточно, перезваниваем в рабочее время."
            : ` Перезвоним в рабочее время: ${company.workingHours.weekdays}.`}
        </p>
        <div className="mt-6 border-t border-graphite-700 pt-5">
          <p className="text-sm text-graphite-400">Если срочно — быстрее позвонить:</p>
          <PhoneLink
            place="form-success"
            className="mt-2 text-xl font-bold text-white hover:text-spark-400"
          />
        </div>
      </div>
    );
  }

  const sending = status === "sending";

  /* ------------------------------- ФОРМА ------------------------------- */
  return (
    <form onSubmit={handleSubmit} noValidate className="card p-5 sm:p-6">
      {/* Ловушка для ботов. Скрыта от людей и от скринридеров. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor={`${formId}-website`}>Не заполняйте это поле</label>
        <input id={`${formId}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id={`${formId}-name`}
          label="Как к вам обращаться"
          optional
          value={name}
          onChange={setName}
          error={errors.name}
          autoComplete="name"
          placeholder="Имя"
        />
        <Field
          id={`${formId}-phone`}
          label="Телефон"
          value={phone}
          onChange={setPhone}
          error={errors.phone}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+7 (___) ___-__-__"
          required
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`${formId}-material`}
            className="mb-1.5 block text-sm font-medium text-graphite-300"
          >
            Что сдаёте <span className="text-graphite-500">— необязательно</span>
          </label>
          <select
            id={`${formId}-material`}
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            className="h-12 w-full rounded-lg border border-graphite-600 bg-graphite-900 px-3 text-base text-white transition-colors focus:border-spark-400"
          >
            <option value="">Не знаю / смешанное</option>
            {metals.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <Field
          id={`${formId}-volume`}
          label="Примерный объём"
          optional
          value={volume}
          onChange={setVolume}
          placeholder="«две ванны», «около тонны»"
        />
      </div>

      {/* Вывоз */}
      <div className="mt-4 rounded-lg border border-graphite-700 bg-graphite-900/60 p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={needPickup}
            onChange={(e) => setNeedPickup(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-spark-500"
          />
          <span>
            <span className="block font-medium text-white">Нужен вывоз с адреса</span>
            <span className="mt-0.5 block text-sm text-graphite-400">
              Приедем своим транспортом и погрузим сами
            </span>
          </span>
        </label>

        {needPickup && (
          <div className="mt-4">
            <Field
              id={`${formId}-address`}
              label="Адрес, откуда забрать"
              optional
              value={address}
              onChange={setAddress}
              autoComplete="street-address"
              placeholder="Город, улица, ориентир"
            />
          </div>
        )}
      </div>

      {/* Фото — ключевой элемент, поэтому визуально выделен */}
      {!compact && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-graphite-300">
            Фото металла <span className="text-graphite-500">— необязательно, но так точнее</span>
          </p>

          <label
            htmlFor={`${formId}-photos`}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-graphite-600 bg-graphite-900/60 p-4 transition-colors hover:border-spark-400"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-spark-500/15 text-spark-400">
              <IconCamera className="h-6 w-6" />
            </span>
            <span className="text-sm">
              <span className="block font-medium text-white">Сфотографируйте металл</span>
              <span className="block text-graphite-400">
                По фото определим сорт и назовём цену. До {MAX_PHOTOS} снимков
              </span>
            </span>
          </label>
          <input
            ref={fileInputRef}
            id={`${formId}-photos`}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="sr-only"
          />

          {photoFiles.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {photoFiles.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex max-w-full items-center gap-2 rounded-md border border-graphite-600 bg-graphite-900 py-1.5 pl-3 pr-1.5 text-sm"
                >
                  <span className="truncate text-graphite-300">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-graphite-400 transition-colors hover:bg-graphite-700 hover:text-white"
                    aria-label={`Убрать фото ${file.name}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}

          {photoError && <p className="mt-2 text-sm text-danger">{photoError}</p>}
        </div>
      )}

      {/* Согласие */}
      <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-graphite-400">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-spark-500"
        />
        <span>
          Согласен на обработку персональных данных в соответствии с{" "}
          <a
            href={company.legal.privacyPolicyUrl}
            className="text-graphite-300 underline underline-offset-2 hover:text-white"
          >
            политикой конфиденциальности
          </a>
        </span>
      </label>
      {errors.consent && <p className="mt-1 text-sm text-danger">{errors.consent}</p>}

      {/* Ошибка отправки — с запасным каналом связи */}
      {status === "error" && (
        <div
          className="mt-4 rounded-lg border border-danger/40 bg-danger/10 p-4"
          role="alert"
          aria-live="assertive"
        >
          <p className="font-medium text-white">{serverError}</p>
          <p className="mt-1 text-sm text-graphite-300">
            Попробуйте отправить ещё раз или позвоните — так быстрее.
          </p>
          <a
            href={`tel:${company.phone.raw}`}
            onClick={() => reachGoal(GOALS.PHONE_CLICK, { place: "form-error" })}
            className="mt-3 inline-flex h-11 items-center gap-2 rounded-lg bg-white px-4 font-semibold text-graphite-950"
          >
            <IconPhone className="h-5 w-5" />
            {company.phone.display}
          </a>
        </div>
      )}

      <button
        type="submit"
        disabled={sending}
        className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-spark-500 text-base font-bold text-white transition-colors hover:bg-spark-400 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {sending ? (
          <>
            <Spinner />
            Отправляем…
          </>
        ) : (
          submitLabel
        )}
      </button>

      <p className="mt-3 text-center text-xs leading-relaxed text-graphite-500">
        Перезвоним, уточним детали и назовём цену. Без спама и рассылок.
      </p>
    </form>
  );
}

/* --------------------------- вспомогательные --------------------------- */

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
  required = false,
  optional = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "text" | "tel" | "numeric";
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-graphite-300">
        {label}
        {optional && <span className="text-graphite-500"> — необязательно</span>}
        {required && <span className="text-spark-400"> *</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`h-12 w-full rounded-lg border bg-graphite-900 px-3 text-base text-white placeholder:text-graphite-500 transition-colors focus:border-spark-400 ${
          error ? "border-danger" : "border-graphite-600"
        }`}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" fill="none" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}
