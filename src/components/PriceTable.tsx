import Link from "next/link";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Calculator } from "@/components/Calculator";
import {
  formatNumber,
  formatPriceDate,
  metals,
  priceFactors,
  type MetalCategory,
} from "@/config/prices";
import { company } from "@/config/company";

/**
 * Блок цен.
 *
 * Ключевое отличие от конкурентов: показываем вилку и честно объясняем,
 * от чего она зависит. Витринная «максималка» одной цифрой даёт больше кликов
 * и больше отказов — а платим мы за клики.
 *
 * На десктопе — таблица, на мобильном — карточки. Таблица, которая уезжает
 * вбок на телефоне, стоит конверсии больше, чем любые «продающие» элементы.
 */
export function PriceTable({
  highlightId,
  tone = "panel",
}: {
  /** Подсветить строку конкретного металла (на страницах категорий) */
  highlightId?: string;
  tone?: "dark" | "panel";
}) {
  const ferrous = metals.filter((m) => m.group === "ferrous");
  const nonFerrous = metals.filter((m) => m.group === "nonferrous");

  return (
    <Section id="ceny" tone={tone}>
      <SectionHeading
        eyebrow="Прайс-лист"
        title="Актуальные цены на металлолом"
        subtitle={
          <>
            Цены действуют на <strong className="text-white">{formatPriceDate()}</strong> и обновляются{" "}
            {company.terms.priceUpdateFrequency}. Диапазон — не уловка: внутри одной категории сорта
            отличаются в разы, и мы показываем реальные границы, а не только верхнюю.
          </>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:gap-10">
        <div>
          <PriceGroup title="Цветной металл" metals={nonFerrous} highlightId={highlightId} />
          <PriceGroup title="Чёрный металл" metals={ferrous} highlightId={highlightId} className="mt-8" />

          <p className="mt-5 text-sm leading-relaxed text-graphite-400">
            Цены указаны за килограмм и не являются публичной офертой. Точная сумма определяется после
            определения сорта и взвешивания в вашем присутствии.
          </p>
        </div>

        {/* Калькулятор рядом с прайсом — человек сразу примеряет цифру на себя */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Calculator />
        </div>
      </div>

      {/* От чего зависит цена — блок, которого нет у конкурентов */}
      <div className="mt-12 sm:mt-16">
        <h3 className="text-xl font-bold text-white sm:text-2xl">От чего зависит цена</h3>
        <p className="mt-2 max-w-2xl text-graphite-400">
          Чтобы вы понимали, почему у одного металла две разные цены — и как получить верхнюю.
        </p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {priceFactors.map((factor, index) => (
            <li key={factor.title} className="card p-5">
              <span className="tabular text-sm font-bold text-spark-400">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h4 className="mt-1.5 font-semibold text-white">{factor.title}</h4>
              <p className="mt-1.5 text-sm leading-relaxed text-graphite-400">{factor.text}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10 flex flex-col items-center gap-3 rounded-xl border border-graphite-700 bg-graphite-850 p-6 text-center sm:flex-row sm:justify-between sm:p-7 sm:text-left">
        <div>
          <p className="text-lg font-bold text-white">Не знаете, какой у вас металл?</p>
          <p className="mt-1 text-graphite-400">
            Пришлите фото — определим сорт и назовём цену до того, как вы куда-то поедете.
          </p>
        </div>
        <Link
          href="#zayavka"
          className="flex h-13 shrink-0 items-center justify-center rounded-lg bg-spark-500 px-6 font-bold text-white transition-colors hover:bg-spark-400"
        >
          Узнать точную цену
        </Link>
      </div>
    </Section>
  );
}

function PriceGroup({
  title,
  metals: items,
  highlightId,
  className = "",
}: {
  title: string;
  metals: MetalCategory[];
  highlightId?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-graphite-400">{title}</h3>

      {/* Десктоп: таблица */}
      <div className="hidden overflow-hidden rounded-xl border border-graphite-700 sm:block">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">
            Цены на приём {title.toLowerCase()}а за килограмм
          </caption>
          <thead>
            <tr className="bg-graphite-800">
              <th scope="col" className="px-5 py-3 text-sm font-semibold text-graphite-300">
                Вид металла
              </th>
              <th scope="col" className="px-5 py-3 text-right text-sm font-semibold text-graphite-300">
                Цена от
              </th>
              <th scope="col" className="px-5 py-3 text-right text-sm font-semibold text-graphite-300">
                Цена до
              </th>
              <th scope="col" className="px-5 py-3 text-sm font-semibold text-graphite-300">
                Единица
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((metal) => {
              const active = metal.id === highlightId;
              return (
                <tr
                  key={metal.id}
                  className={`border-t border-graphite-700 ${active ? "bg-spark-500/8" : "bg-graphite-850"}`}
                >
                  <th scope="row" className="px-5 py-3.5 font-medium text-white">
                    {metal.landing ? (
                      <Link href={`/${metal.landing}`} className="hover:text-spark-400">
                        {metal.name}
                      </Link>
                    ) : (
                      metal.name
                    )}
                    <span className="mt-0.5 block text-xs font-normal text-graphite-500">{metal.short}</span>
                  </th>
                  <td className="tabular px-5 py-3.5 text-right text-graphite-300">
                    {formatNumber(metal.priceFrom)} ₽
                  </td>
                  <td className="tabular px-5 py-3.5 text-right text-lg font-bold text-spark-400">
                    {formatNumber(metal.priceTo)} ₽
                  </td>
                  <td className="px-5 py-3.5 text-sm text-graphite-500">за кг</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Мобильный: карточки вместо горизонтального скролла */}
      <ul className="grid gap-2.5 sm:hidden">
        {items.map((metal) => {
          const active = metal.id === highlightId;
          const rowClass = `flex items-center justify-between gap-3 rounded-xl border p-4 ${
            active ? "border-spark-500/50 bg-spark-500/8" : "border-graphite-700 bg-graphite-850"
          }`;
          const inner = (
            <>
              <span className="min-w-0">
                <span className="block font-semibold text-white">{metal.name}</span>
                <span className="mt-0.5 block text-xs text-graphite-500">{metal.short}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="tabular block text-lg font-extrabold text-spark-400">
                  {formatNumber(metal.priceTo)} ₽
                </span>
                <span className="tabular block text-xs text-graphite-400">
                  от {formatNumber(metal.priceFrom)} ₽/кг
                </span>
              </span>
            </>
          );

          return (
            <li key={metal.id}>
              {metal.landing ? (
                <Link href={`/${metal.landing}`} className={rowClass}>
                  {inner}
                </Link>
              ) : (
                <div className={rowClass}>{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
