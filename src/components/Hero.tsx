import Link from "next/link";
import { company } from "@/config/company";
import { ferrousRange, formatNumber, formatRange, topNonFerrousPrice, formatPriceDate } from "@/config/prices";
import { LeadForm } from "@/components/LeadForm";
import { PhoneLink, MessengerLinks } from "@/components/ui/PhoneLink";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { IconCash, IconScale, IconTruck, IconClock } from "@/components/icons/Icons";

/**
 * Первый экран.
 *
 * Задача — за 3–5 секунд ответить на пять вопросов человека, пришедшего
 * из Директа: что принимают, где, сколько платят, почему этим, куда звонить.
 * Поэтому цена и телефон здесь, а не «где-то ниже по странице».
 */
export function Hero({
  h1,
  offer,
  bullets,
  ctaLabel = "Получить расчёт",
  source = "hero",
  defaultMaterial,
  defaultPickup,
  priceLabel,
  priceValue,
}: {
  h1: string;
  offer: string;
  bullets: string[];
  ctaLabel?: string;
  source?: string;
  defaultMaterial?: string;
  defaultPickup?: boolean;
  /** Подпись к плашке цены. По умолчанию — общий оффер по чермету/цветмету. */
  priceLabel?: string;
  priceValue?: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-graphite-800 bg-graphite-950">
      {/* Фон: сетка + свечение. Ноль изображений — первый экран грузится мгновенно. */}
      <div className="texture-grid absolute inset-0" aria-hidden="true" />
      <div className="glow-spark absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-16 lg:py-20">
        <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          {/* ---------------------------- Оффер ---------------------------- */}
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-graphite-700 bg-graphite-900 px-3.5 py-1.5 text-xs font-medium text-graphite-300">
              <span className="h-1.5 w-1.5 rounded-full bg-spark-400" aria-hidden="true" />
              {company.city.nominative} и область · приём и вывоз
            </p>

            <h1 className="text-pretty text-3xl font-extrabold leading-[1.12] tracking-tight text-white sm:text-4xl lg:text-5xl">
              {h1}
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-graphite-300">{offer}</p>

            {/* Плашка цены — самое главное число на экране */}
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <PriceChip
                label={priceLabel ?? "Чёрный металл"}
                value={priceValue ?? formatRange(ferrousRange.from, ferrousRange.to)}
              />
              {!priceValue && (
                <PriceChip label="Цветной металл" value={`до ${formatNumber(topNonFerrousPrice)} ₽/кг`} accent />
              )}
            </div>
            <p className="mt-2.5 text-xs text-graphite-500">
              Цены на {formatPriceDate()} Точная сумма — после оценки и взвешивания.{" "}
              <Link href="/#ceny" className="underline underline-offset-2 hover:text-graphite-300">
                Весь прайс
              </Link>
            </p>

            {/* Действия */}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="#zayavka"
                className="flex h-14 items-center justify-center rounded-lg bg-spark-500 px-7 text-base font-bold text-white transition-colors hover:bg-spark-400"
              >
                {ctaLabel}
              </Link>
              {/* PhoneLink сам по себе <a> — вкладывать его в другую ссылку нельзя */}
              <PhoneLink
                place="hero"
                className="h-14 justify-center whitespace-nowrap rounded-lg border border-graphite-600 bg-graphite-900 px-6 text-base font-bold text-white transition-colors hover:border-graphite-400"
              />
              <MessengerLinks place="hero" />
            </div>

            {/* Короткие преимущества */}
            <ul className="mt-8 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2.5 text-sm text-graphite-300">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-spark-500/15 text-spark-400">
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" aria-hidden="true">
                      <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {bullet}
                </li>
              ))}
            </ul>

            {/* Мини-полоса доверия */}
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-graphite-800 pt-6">
              <TrustPill icon={<IconScale className="h-4 w-4" />} text="Взвешиваем при вас" />
              <TrustPill icon={<IconCash className="h-4 w-4" />} text="Расчёт сразу" />
              <TrustPill icon={<IconTruck className="h-4 w-4" />} text="Свой транспорт" />
              <TrustPill icon={<IconClock className="h-4 w-4" />} text={`Выезд ${company.terms.pickupSpeed}`} />
            </div>
          </div>

          {/* ---------------------------- Форма ---------------------------- */}
          <div id="zayavka" className="scroll-mt-24">
            <div className="mb-3">
              <h2 className="text-xl font-bold text-white">Узнать цену за 5 минут</h2>
              <p className="mt-1 text-sm text-graphite-400">
                Достаточно телефона. Можно приложить фото — так точнее.
              </p>
            </div>
            <LeadForm
              source={source}
              defaultMaterial={defaultMaterial}
              defaultPickup={defaultPickup}
              submitLabel="Получить расчёт"
            />
          </div>
        </div>

        {/* Визуал площадки — под контентом, чтобы не тормозить первый экран */}
        <div className="mt-10 hidden overflow-hidden rounded-xl border border-graphite-800 lg:block">
          <PhotoSlot slot="hero" className="h-56 w-full" sizes="(max-width: 1024px) 100vw, 1152px" priority />
        </div>
      </div>
    </section>
  );
}

function PriceChip({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-xl border px-4 py-3.5 ${
        accent ? "border-spark-500/40 bg-spark-500/8" : "border-graphite-700 bg-graphite-900"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-graphite-400">{label}</p>
      <p className={`tabular mt-1 text-xl font-extrabold sm:text-2xl ${accent ? "text-spark-400" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function TrustPill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="flex items-center gap-2 text-sm text-graphite-400">
      <span className="text-spark-400">{icon}</span>
      {text}
    </span>
  );
}
