import Link from "next/link";
import { Section, SectionHeading } from "@/components/ui/Section";
import { formatNumber } from "@/config/prices";
import { company } from "@/config/company";
import { IconHome, IconBuilding, IconCrane, IconClipboard, IconArrowRight } from "@/components/icons/Icons";

/**
 * Аудитории.
 *
 * У частника, прораба, снабженца и собственника участка разные боли, и
 * универсальный текст не попадает ни в одну. Этот блок работает как
 * навигация: человек находит «свой» абзац и идёт по нужной ссылке.
 */
export function Audiences() {
  const groups = [
    {
      icon: <IconHome className="h-6 w-6" />,
      title: "Частным лицам",
      pain: "Есть металл, но нет ни машины, ни понимания цены.",
      text: "Гараж, дача, старая ванна и батареи после ремонта, ворота, забор, холодильник. Приедем и заберём, если объём подходит, — или подскажем, что выгоднее привезти самому.",
      points: [
        "Нужен только паспорт",
        "Расчёт наличными или на карту сразу",
        "Оценка по фото — не надо ничего вычислять",
      ],
      href: "/priem-metalloloma",
      cta: "Как сдать частнику",
    },
    {
      icon: <IconCrane className="h-6 w-6" />,
      title: "Строительным компаниям",
      pain: "Лом копится на объекте и мешает работать.",
      text: "Обрезки арматуры, остатки труб и профиля, опалубочный металл, демонтированные конструкции. Забираем регулярно, чтобы площадка не зарастала.",
      points: [
        `Вывоз от ${formatNumber(company.terms.freePickupFerrousKg)} кг бесплатно`,
        "Резка негабарита прямо на объекте",
        "Можно работать по договору с закрывающими",
      ],
      href: "/cherniy-metall",
      cta: "Цены на чермет",
    },
    {
      icon: <IconBuilding className="h-6 w-6" />,
      title: "Предприятиям",
      pain: "Нужна предсказуемость и документы, а не разовая сделка.",
      text: "Производственные отходы, стружка, списанное оборудование, неликвиды. Договор с фиксированными условиями и график вывоза под ваш цикл.",
      points: [
        "Безналичный расчёт",
        "Полный пакет закрывающих документов",
        "График регулярного вывоза",
      ],
      href: "/lom-s-predpriyatiy",
      cta: "Условия для юрлиц",
    },
    {
      icon: <IconClipboard className="h-6 w-6" />,
      title: "Владельцам помещений и территорий",
      pain: "Нужно освободить площадку, а демонтаж стоит денег.",
      text: "Ангары, каркасы, эстакады, резервуары, старое оборудование в цеху. Считаем взаимозачётом: стоимость работ вычитается из стоимости лома.",
      points: [
        "Часто вы получаете деньги, а не платите",
        "Своя бригада, газорезка и техника",
        "Убираем мусор и оставляем площадку чистой",
      ],
      href: "/demontazh-metallokonstrukciy",
      cta: "Про демонтаж",
    },
  ];

  return (
    <Section tone="panel">
      <SectionHeading
        eyebrow="Кому подходит"
        title="С кем мы работаем"
        subtitle="Найдите свой случай — там написано, что конкретно вам стоит сделать дальше."
      />

      <ul className="grid gap-4 md:grid-cols-2">
        {groups.map((group) => (
          <li key={group.title} className="card flex h-full flex-col p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-spark-500/12 text-spark-400">
                {group.icon}
              </span>
              <h3 className="text-lg font-bold text-white">{group.title}</h3>
            </div>

            <p className="mt-4 text-sm font-medium text-spark-300">{group.pain}</p>
            <p className="mt-2 text-sm leading-relaxed text-graphite-300">{group.text}</p>

            <ul className="mt-4 space-y-1.5">
              {group.points.map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm text-graphite-400">
                  <svg
                    className="mt-1 h-3.5 w-3.5 shrink-0 text-spark-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    aria-hidden="true"
                  >
                    <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {point}
                </li>
              ))}
            </ul>

            <Link
              href={group.href}
              className="mt-5 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-spark-400 hover:text-spark-300"
            >
              {group.cta}
              <IconArrowRight className="h-4 w-4" />
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
