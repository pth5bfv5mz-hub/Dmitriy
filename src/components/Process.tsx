import { Section, SectionHeading } from "@/components/ui/Section";
import { company } from "@/config/company";
import { IconCash, IconClipboard, IconScale, IconTruck, IconCamera } from "@/components/icons/Icons";

/**
 * «Как происходит приём»: Заявка → Оценка → Приезд → Взвешивание → Расчёт.
 * Пять шагов, ни одного лишнего. Человек должен понять весь путь до денег
 * за десять секунд чтения.
 */

const steps = [
  {
    icon: <IconClipboard className="h-6 w-6" />,
    title: "Заявка",
    text: "Звонок или форма. Нужен только телефон и примерное описание металла.",
  },
  {
    icon: <IconCamera className="h-6 w-6" />,
    title: "Оценка",
    text: "По описанию или фото называем вилку цены — до того, как вы куда-то поехали.",
  },
  {
    icon: <IconTruck className="h-6 w-6" />,
    title: "Приезд",
    text: `Вы приезжаете на площадку или мы к вам — выезд ${company.terms.pickupSpeed}.`,
  },
  {
    icon: <IconScale className="h-6 w-6" />,
    title: "Взвешивание",
    text: "Сортируем и взвешиваем при вас. Не согласны с весом — перевешиваем.",
  },
  {
    icon: <IconCash className="h-6 w-6" />,
    title: "Расчёт",
    text: "Деньги сразу после весов: наличными, на карту или безналом для юрлиц.",
  },
];

export function Process() {
  return (
    <Section id="kak-rabotaem" tone="panel">
      <SectionHeading
        eyebrow="Порядок работы"
        title="Как происходит приём"
        subtitle="Пять шагов от вашего звонка до денег в руках. Никаких скрытых этапов и вычетов «за оформление» в конце."
      />

      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-3">
        {steps.map((step, index) => (
          <li key={step.title} className="card relative flex h-full flex-col p-5">
            <span className="tabular absolute right-4 top-4 text-3xl font-extrabold leading-none text-graphite-800">
              {index + 1}
            </span>
            <span className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-xl bg-spark-500/12 text-spark-400">
              {step.icon}
            </span>
            <h3 className="font-bold text-white">{step.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-graphite-400">{step.text}</p>
          </li>
        ))}
      </ol>

      <p className="mt-6 text-sm text-graphite-400">
        На площадке всё вместе занимает обычно 15–30 минут. При вывозе от заявки до расчёта чаще всего
        проходит один день.
      </p>
    </Section>
  );
}
