import { company } from "@/config/company";
import { LeadForm } from "@/components/LeadForm";
import { PhoneLink, MessengerLinks } from "@/components/ui/PhoneLink";
import { IconCamera, IconClock, IconScale } from "@/components/icons/Icons";

/**
 * Финальный блок заявки.
 *
 * Человек, доскроллевший донизу, уже всё прочитал — ему нужна не новая
 * аргументация, а форма под рукой. Поэтому здесь короткий текст и полная форма,
 * а не ещё один список преимуществ.
 */
export function FinalCta() {
  return (
    <section id="zayavka-final" className="relative overflow-hidden border-t border-graphite-800 bg-graphite-950">
      <div className="texture-grid absolute inset-0" aria-hidden="true" />
      <div className="glow-spark absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.95fr] lg:gap-12">
          <div>
            <h2 className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
              Назовите металл и примерный вес — скажем, сколько выйдет
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-graphite-300">
              Не знаете, что за металл и сколько он весит? Это нормально — сфотографируйте кучу и
              приложите к заявке. Определим сорт и назовём вилку цены до того, как вы куда-то поедете.
            </p>

            <ul className="mt-7 space-y-3.5">
              <Bullet icon={<IconCamera className="h-5 w-5" />} title="Оценка по фото">
                Достаточно снимка на телефон: общий план и один кусок крупно.
              </Bullet>
              <Bullet icon={<IconScale className="h-5 w-5" />} title="Никаких сюрпризов на весах">
                Вилку называем заранее и объясняем, что на что влияет.
              </Bullet>
              <Bullet icon={<IconClock className="h-5 w-5" />} title={`Выезд ${company.terms.pickupSpeed}`}>
                Если объём подходит — заберём сами и погрузим своими силами.
              </Bullet>
            </ul>

            <div className="mt-8 border-t border-graphite-800 pt-6">
              <p className="text-sm text-graphite-400">Быстрее всего — просто позвонить:</p>
              <div className="mt-2 flex flex-wrap items-center gap-4">
                <PhoneLink place="final-cta" className="text-2xl font-extrabold text-white hover:text-spark-400" />
                <MessengerLinks place="final-cta" />
              </div>
              <p className="mt-2 text-sm text-graphite-500">
                {company.workingHours.weekdays}
                {company.workingHours.requests24h && " · заявки на сайте — круглосуточно"}
              </p>
            </div>
          </div>

          <div>
            <LeadForm source="final-cta" submitLabel="Получить расчёт" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Bullet({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-spark-500/12 text-spark-400">
        {icon}
      </span>
      <span>
        <span className="block font-semibold text-white">{title}</span>
        <span className="mt-0.5 block text-sm leading-relaxed text-graphite-400">{children}</span>
      </span>
    </li>
  );
}
