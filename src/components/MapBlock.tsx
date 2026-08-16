import { Section, SectionHeading } from "@/components/ui/Section";
import { company } from "@/config/company";
import { PhoneLink, MessengerLinks } from "@/components/ui/PhoneLink";
import { RouteButton } from "@/components/ui/RouteButton";
import { IconPin, IconClock, IconTruck } from "@/components/icons/Icons";

/**
 * «Где нас найти».
 *
 * Карта — виджет Яндекс.Карт в iframe с lazy-загрузкой: не тянет
 * стороннего JavaScript и не портит показатели скорости на мобильном.
 * Координаты и адрес берутся из конфига — меняются в одном месте.
 */
export function MapBlock() {
  const { lat, lon } = company.coordinates;
  const mapSrc =
    `https://yandex.ru/map-widget/v1/?ll=${lon}%2C${lat}&z=16` +
    `&pt=${lon}%2C${lat}%2Cpm2rdm&lang=ru_RU`;

  return (
    <Section id="kontakty" tone="dark">
      <SectionHeading
        eyebrow="Контакты"
        title="Где нас найти"
        subtitle={`Площадка в ${company.city.prepositional}. Если везти самому неудобно — приедем сами, посмотрите условия вывоза выше.`}
      />

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        {/* Реквизиты и контакты */}
        <div className="space-y-4">
          <InfoCard icon={<IconPin className="h-6 w-6" />} title="Адрес площадки">
            <p className="text-graphite-200">{company.address.full}</p>
            {company.address.landmark && (
              <p className="mt-1 text-sm text-graphite-400">{company.address.landmark}</p>
            )}
            <RouteButton />
          </InfoCard>

          <InfoCard icon={<IconClock className="h-6 w-6" />} title="Режим работы">
            <p className="text-graphite-200">{company.workingHours.weekdays}</p>
            {company.workingHours.weekend && (
              <p className="text-graphite-200">{company.workingHours.weekend}</p>
            )}
            {company.workingHours.requests24h && (
              <p className="mt-1.5 text-sm text-graphite-400">
                Заявки через сайт и мессенджеры принимаем круглосуточно.
              </p>
            )}
          </InfoCard>

          <div className="card p-5">
            <h3 className="mb-3 font-bold text-white">Связаться</h3>
            <PhoneLink place="contacts" className="text-2xl font-extrabold text-white hover:text-spark-400" />
            {company.phoneB2B.display && (
              <p className="mt-2 text-sm text-graphite-400">
                Для организаций:{" "}
                <a href={`tel:${company.phoneB2B.raw}`} className="text-graphite-200 hover:text-white">
                  {company.phoneB2B.display}
                </a>
              </p>
            )}
            <a
              href={`mailto:${company.email}`}
              className="mt-2 block text-sm text-graphite-400 hover:text-white"
            >
              {company.email}
            </a>
            <MessengerLinks place="contacts" className="mt-4" />
          </div>

          {/* Зона выезда */}
          {company.serviceAreas.length > 0 && (
            <InfoCard icon={<IconTruck className="h-6 w-6" />} title={`Выезжаем по ${company.city.dative} и области`}>
              <ul className="flex flex-wrap gap-1.5">
                {company.serviceAreas.map((area) => (
                  <li
                    key={area}
                    className="rounded-md border border-graphite-700 bg-graphite-900 px-2.5 py-1 text-sm text-graphite-300"
                  >
                    {area}
                  </li>
                ))}
              </ul>
              {company.serviceRadiusKm > 0 && (
                <p className="mt-3 text-sm text-graphite-400">
                  Обычная зона выезда — около {company.serviceRadiusKm} км от площадки. Дальше выезжаем при
                  достаточном объёме: позвоните и уточните, это решаемо.
                </p>
              )}
            </InfoCard>
          )}
        </div>

        {/* Карта */}
        <div className="overflow-hidden rounded-xl border border-graphite-700">
          <iframe
            src={mapSrc}
            title={`Схема проезда: ${company.address.full}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-[420px] w-full lg:h-full lg:min-h-[520px]"
            style={{ border: 0 }}
          />
        </div>
      </div>
    </Section>
  );
}

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="mb-2.5 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-spark-500/12 text-spark-400">
          {icon}
        </span>
        <h3 className="font-bold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}
