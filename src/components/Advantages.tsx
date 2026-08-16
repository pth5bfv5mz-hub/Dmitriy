import { Section, SectionHeading } from "@/components/ui/Section";
import { company } from "@/config/company";
import { formatNumber, formatPriceDate } from "@/config/prices";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { IconCash, IconClock, IconScale, IconShield, IconTruck, IconClipboard } from "@/components/icons/Icons";

/**
 * Преимущества.
 *
 * Правило блока: каждое преимущество — с числом, условием или проверяемым
 * фактом. «Индивидуальный подход» и «высокое качество» здесь запрещены:
 * их пишут все, и поэтому им никто не верит.
 */
export function Advantages() {
  const items = [
    {
      icon: <IconScale className="h-6 w-6" />,
      title: "Взвешивание при вас",
      text: "Вы стоите у весов и видите табло. Сомневаетесь — перевешиваем, это обычная просьба, а не конфликт.",
    },
    {
      icon: <IconCash className="h-6 w-6" />,
      title: "Расчёт сразу после весов",
      text: `${company.terms.payment.join(". ")}. Без «приезжайте завтра» и без удержаний после взвешивания.`,
    },
    {
      icon: <IconClipboard className="h-6 w-6" />,
      title: `Прайс обновляется ${company.terms.priceUpdateFrequency}`,
      text: `Цены на сайте актуальны на ${formatPriceDate()} — дата стоит прямо над таблицей, а не «где-то в прошлом году».`,
    },
    {
      icon: <IconTruck className="h-6 w-6" />,
      title: "Свой транспорт и грузчики",
      text: `Вывоз бесплатно от ${formatNumber(company.terms.freePickupFerrousKg)} кг чермета и ${formatNumber(
        company.terms.freePickupNonFerrousKg,
      )} кг цветмета. За погрузку отдельно не берём.`,
    },
    {
      icon: <IconClock className="h-6 w-6" />,
      title: `Выезд ${company.terms.pickupSpeed}`,
      text: company.workingHours.requests24h
        ? "Заявки принимаем круглосуточно, машину согласовываем в рабочее время."
        : `Заявки принимаем в рабочее время: ${company.workingHours.weekdays}.`,
    },
    {
      icon: <IconShield className="h-6 w-6" />,
      title: "Физлица и организации",
      text: company.terms.worksWithCompanies
        ? "Частнику — паспорт и наличные. Юрлицу — договор, безнал и полный пакет закрывающих документов."
        : "Работаем с физическими лицами. Для приёма нужен паспорт — это требование закона.",
    },
  ];

  return (
    <Section tone="dark">
      <SectionHeading
        eyebrow="Почему к нам"
        title="Условия, которые можно проверить"
        subtitle="Здесь нет «индивидуального подхода» и «высокого качества». Только то, что вы можете проверить на площадке в день сдачи."
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_0.7fr] lg:gap-10">
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.title} className="card p-5">
              <span className="mb-3.5 flex h-11 w-11 items-center justify-center rounded-lg bg-spark-500/12 text-spark-400">
                {item.icon}
              </span>
              <h3 className="font-bold text-white">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-graphite-400">{item.text}</p>
            </li>
          ))}
        </ul>

        {/* Отдельный акцент на весах — главный страх клиента в этой нише */}
        <div className="card overflow-hidden">
          <PhotoSlot slot="scales" className="h-52 w-full" sizes="(max-width: 1024px) 100vw, 420px" />
          <div className="p-5">
            <h3 className="text-lg font-bold text-white">Про обвес — коротко</h3>
            <p className="mt-2 text-sm leading-relaxed text-graphite-300">
              Самый частый страх при сдаче металла — что обвесят. Поэтому у нас всё взвешивание открытое:
              вы видите табло, знаете тару, и можете попросить перевесить. Если цифра на весах вас не
              устраивает — вы забираете металл и уезжаете, никто ничего не удерживает.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-graphite-400">
              При вывозе взвешивание происходит на площадке, и вы можете поехать вместе с грузом.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
