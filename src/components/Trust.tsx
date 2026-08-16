import { Section, SectionHeading } from "@/components/ui/Section";
import { company, filledStats } from "@/config/company";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { IconShield, IconClipboard, IconScale } from "@/components/icons/Icons";

/**
 * «Почему нам доверяют».
 *
 * Блок построен так, что показывает только заполненные данные. Если владелец
 * не указал стаж, автопарк или лицензию — соответствующие элементы просто
 * исчезают. Выдуманная лицензия — это не «маркетинг», это состав правонарушения,
 * а выдуманный стаж проверяется по ЕГРЮЛ за тридцать секунд.
 */
export function Trust() {
  const hasStats = filledStats.length > 0;
  const hasLegal = Boolean(company.legal.inn || company.legal.ogrn || company.legal.license);

  return (
    <Section tone="dark">
      <SectionHeading
        eyebrow="Доверие"
        title="Почему нам можно верить"
        subtitle="Проверяемые вещи вместо обещаний: как устроено взвешивание, какие документы оформляем и на каких основаниях работаем."
      />

      {/* Цифры — только настоящие */}
      {hasStats && (
        <ul className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filledStats.map((stat) => (
            <li key={stat.label} className="card p-5 text-center">
              <p className="tabular text-3xl font-extrabold text-spark-400 sm:text-4xl">{stat.value}</p>
              <p className="mt-1.5 text-sm text-graphite-400">{stat.label}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="card p-6">
          <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-spark-500/12 text-spark-400">
            <IconScale className="h-6 w-6" />
          </span>
          <h3 className="text-lg font-bold text-white">Открытое взвешивание</h3>
          <p className="mt-2 text-sm leading-relaxed text-graphite-400">
            Вы присутствуете при взвешивании и видите показания. Тара учитывается отдельно и при вас.
            Просьба перевесить — нормальная ситуация, а не повод для спора.
          </p>
        </article>

        <article className="card p-6">
          <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-spark-500/12 text-spark-400">
            <IconClipboard className="h-6 w-6" />
          </span>
          <h3 className="text-lg font-bold text-white">Документы по закону</h3>
          <p className="mt-2 text-sm leading-relaxed text-graphite-400">
            Приём от физлица оформляется приёмо-сдаточным актом по паспорту — так требует
            Постановление Правительства РФ № 980. Юрлицам выдаём полный комплект закрывающих документов.
          </p>
        </article>

        <article className="card p-6">
          <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-spark-500/12 text-spark-400">
            <IconShield className="h-6 w-6" />
          </span>
          <h3 className="text-lg font-bold text-white">Лицензированная деятельность</h3>
          <p className="mt-2 text-sm leading-relaxed text-graphite-400">
            {company.legal.license ? (
              <>
                Работаем по лицензии на заготовку, хранение, переработку и реализацию лома чёрных и
                цветных металлов № {company.legal.license}
                {company.legal.licenseIssuer ? `, выдана: ${company.legal.licenseIssuer}` : ""}.
              </>
            ) : (
              <>
                Обращение с ломом чёрных и цветных металлов лицензируется. Номер лицензии и реквизиты
                предоставляем по запросу — спрашивайте при первом обращении, это нормальный вопрос.
              </>
            )}
          </p>
        </article>
      </div>

      {/* Реквизиты — если заполнены */}
      {hasLegal && (
        <dl className="mt-4 grid gap-x-8 gap-y-2 rounded-xl border border-graphite-700 bg-graphite-850 p-6 sm:grid-cols-2 lg:grid-cols-3">
          {company.legalName && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-graphite-500">Организация</dt>
              <dd className="text-sm text-graphite-200">{company.legalName}</dd>
            </div>
          )}
          {company.legal.inn && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-graphite-500">ИНН</dt>
              <dd className="tabular text-sm text-graphite-200">{company.legal.inn}</dd>
            </div>
          )}
          {company.legal.ogrn && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-graphite-500">ОГРН</dt>
              <dd className="tabular text-sm text-graphite-200">{company.legal.ogrn}</dd>
            </div>
          )}
        </dl>
      )}

      <div className="mt-4 overflow-hidden rounded-xl border border-graphite-800">
        <PhotoSlot slot="yard" className="h-56 w-full sm:h-72" sizes="100vw" />
      </div>
    </Section>
  );
}
