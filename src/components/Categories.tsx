import Link from "next/link";
import { Section, SectionHeading } from "@/components/ui/Section";
import { formatNumber, metals, type MetalCategory } from "@/config/prices";
import { MetalMark } from "@/components/ui/MetalMark";
import { IconArrowRight } from "@/components/icons/Icons";

/**
 * «Что принимаем» — карточки категорий.
 * У каждой: визуальная метка, название, короткое описание, что именно берём,
 * цена и переход на свою посадочную страницу (если она есть).
 */
export function Categories({
  only,
  title = "Что принимаем",
  eyebrow = "Категории лома",
  subtitle,
  tone = "dark",
}: {
  /** Показать только указанные id (для блока «что ещё принимаем») */
  only?: string[];
  title?: string;
  eyebrow?: string;
  subtitle?: React.ReactNode;
  tone?: "dark" | "panel";
}) {
  const items = only ? (only.map((id) => metals.find((m) => m.id === id)).filter(Boolean) as MetalCategory[]) : metals;

  return (
    <Section id="chto-prinimaem" tone={tone}>
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        subtitle={
          subtitle ?? (
            <>
              Берём почти всё, что содержит металл. Если вашей позиции нет в списке — позвоните, скорее
              всего примем и её.
            </>
          )
        }
      />

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((metal) => (
          <li key={metal.id}>
            <CategoryCard metal={metal} />
          </li>
        ))}
      </ul>
    </Section>
  );
}

function CategoryCard({ metal }: { metal: MetalCategory }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <MetalMark id={metal.id} className="h-12 w-12" />
        <div className="text-right">
          <p className="tabular text-lg font-extrabold leading-none text-spark-400">
            до {formatNumber(metal.priceTo)} ₽
          </p>
          <p className="tabular mt-1 text-xs text-graphite-500">от {formatNumber(metal.priceFrom)} ₽/кг</p>
        </div>
      </div>

      <h3 className="mt-4 text-lg font-bold text-white">{metal.name}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-graphite-400">{metal.short}</p>

      <ul className="mt-3.5 space-y-1">
        {metal.examples.slice(0, 4).map((example) => (
          <li key={example} className="flex items-start gap-2 text-sm text-graphite-400">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-graphite-500" aria-hidden="true" />
            {example}
          </li>
        ))}
      </ul>

      <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-spark-400">
        {metal.landing ? "Подробнее и цены" : "Уточнить цену"}
        <IconArrowRight className="h-4 w-4" />
      </p>
    </>
  );

  const className = "card card-hover flex h-full flex-col p-5";

  return metal.landing ? (
    <Link href={`/${metal.landing}`} className={className}>
      {body}
    </Link>
  ) : (
    <Link href="/#zayavka" className={className}>
      {body}
    </Link>
  );
}
