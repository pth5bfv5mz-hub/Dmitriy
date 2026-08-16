import Link from "next/link";
import { Section, SectionHeading } from "@/components/ui/Section";
import { company } from "@/config/company";
import { formatNumber } from "@/config/prices";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { IconCrane, IconCut, IconTruck, IconBuilding } from "@/components/icons/Icons";

/**
 * Блок вывоза — один из двух сильнейших на сайте (второй — цены).
 * Большая часть заявок в нише приходит именно отсюда: у человека есть металл,
 * но нет способа его увезти.
 */

const steps = [
  { n: 1, title: "Оставляете заявку", text: "Телефон, примерный объём и адрес. Фото — сильно ускоряет." },
  { n: 2, title: "Согласовываем", text: "Уточняем, что за металл, есть ли подъезд и нужна ли резка." },
  { n: 3, title: "Приезжает машина", text: `Подбираем транспорт под объём. Выезд ${company.terms.pickupSpeed}.` },
  { n: 4, title: "Грузим сами", text: "Свои грузчики. При необходимости режем на месте." },
  { n: 5, title: "Взвешиваем", text: "Открыто, при вас. Результат называем сразу." },
  { n: 6, title: "Рассчитываемся", text: "Наличные, перевод или безнал — как вам удобнее." },
];

export function Pickup() {
  const transport = [
    {
      icon: <IconTruck className="h-6 w-6" />,
      title: "Газель до 1,5 т",
      text: "Гараж, дача, квартира после ремонта. Небольшие партии цветмета.",
    },
    {
      icon: <IconTruck className="h-6 w-6" />,
      title: "Ломовоз до 20 т",
      text: "Стройплощадки, промышленные объёмы, регулярный вывоз с предприятий.",
    },
    {
      icon: <IconCrane className="h-6 w-6" />,
      title: "Манипулятор",
      text:
        company.terms.craneFromKg > 0
          ? `Крупногабарит и тяжёлые узлы — от ${formatNumber(company.terms.craneFromKg)} кг.`
          : "Крупногабарит и тяжёлые узлы, которые не поднять руками.",
    },
    {
      icon: <IconCut className="h-6 w-6" />,
      title: "Бригада с газорезкой",
      text: "Ангары, каркасы, ёмкости, эстакады — режем и грузим на месте.",
    },
  ];

  return (
    <Section id="vyvoz" tone="dark">
      <SectionHeading
        eyebrow="Вывоз"
        title="Заберём металлолом с вашего адреса"
        subtitle={
          <>
            Приезжаем своим транспортом, грузим сами, при необходимости режем на месте. Бесплатно от{" "}
            <strong className="text-white">{formatNumber(company.terms.freePickupFerrousKg)} кг</strong> чёрного
            и <strong className="text-white">{formatNumber(company.terms.freePickupNonFerrousKg)} кг</strong>{" "}
            цветного металла. Меньший объём тоже заберём — просто обсудим условия заранее, а не по факту.
          </>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:gap-12">
        {/* Шаги */}
        <div>
          <h3 className="mb-5 text-lg font-bold text-white">Как это проходит</h3>
          <ol className="relative space-y-5 border-l border-graphite-700 pl-7">
            {steps.map((step) => (
              <li key={step.n} className="relative">
                <span className="tabular absolute -left-[2.32rem] flex h-7 w-7 items-center justify-center rounded-full border border-spark-500/50 bg-graphite-950 text-xs font-bold text-spark-400">
                  {step.n}
                </span>
                <h4 className="font-semibold text-white">{step.title}</h4>
                <p className="mt-0.5 text-sm leading-relaxed text-graphite-400">{step.text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/vyvoz-metalloloma"
              className="flex h-13 items-center justify-center rounded-lg bg-spark-500 px-6 font-bold text-white transition-colors hover:bg-spark-400"
            >
              Заказать вывоз
            </Link>
            <Link
              href="/#zayavka"
              className="flex h-13 items-center justify-center rounded-lg border border-graphite-600 px-6 font-bold text-white transition-colors hover:border-graphite-400"
            >
              Сначала узнать цену
            </Link>
          </div>
        </div>

        {/* Транспорт + фото */}
        <div>
          <h3 className="mb-5 text-lg font-bold text-white">Чем вывозим</h3>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {transport.map((item) => (
              <li key={item.title} className="card flex gap-4 p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-spark-500/12 text-spark-400">
                  {item.icon}
                </span>
                <span>
                  <span className="block font-semibold text-white">{item.title}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-graphite-400">{item.text}</span>
                </span>
              </li>
            ))}
          </ul>

          <PhotoSlot
            slot="truck"
            className="mt-4 hidden h-44 w-full rounded-xl border border-graphite-800 lg:block"
            sizes="(max-width: 1024px) 100vw, 480px"
          />
        </div>
      </div>

      {/* Отдельная дорожка для организаций */}
      {company.terms.worksWithCompanies && (
        <div className="mt-10 flex flex-col gap-4 rounded-xl border border-graphite-700 bg-graphite-850 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-graphite-800 text-spark-400">
              <IconBuilding className="h-6 w-6" />
            </span>
            <div>
              <p className="text-lg font-bold text-white">Большие объёмы и работа с организациями</p>
              <p className="mt-1 max-w-xl text-graphite-400">
                Договор, безналичный расчёт, закрывающие документы и график регулярного вывоза под ваш
                производственный цикл.
              </p>
            </div>
          </div>
          <Link
            href="/lom-s-predpriyatiy"
            className="flex h-13 shrink-0 items-center justify-center rounded-lg border border-graphite-600 px-6 font-bold text-white transition-colors hover:border-graphite-400"
          >
            Условия для юрлиц
          </Link>
        </div>
      )}
    </Section>
  );
}
