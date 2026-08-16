import Link from "next/link";
import { company } from "@/config/company";
import { landings } from "@/config/landings";
import { fillTokens } from "@/lib/tokens";
import { formatPriceDate } from "@/config/prices";
import { PhoneLink } from "@/components/ui/PhoneLink";
import { IconSpark } from "@/components/icons/Icons";

export function Footer() {
  const metalPages = landings.filter((l) => l.metalId && l.slug !== "priem-metalloloma");
  const servicePages = landings.filter((l) => !l.metalId || l.slug === "priem-metalloloma");

  return (
    <footer className="border-t border-graphite-800 bg-graphite-900">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* О компании */}
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-spark-500 text-white">
                <IconSpark className="h-5 w-5" />
              </span>
              <span className="text-base font-bold text-white">{company.name}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-graphite-400">
              Приём и вывоз чёрного и цветного металлолома в {company.city.prepositional} и области.
              Взвешивание при вас, расчёт сразу.
            </p>
            <PhoneLink
              place="footer"
              className="mt-4 text-xl font-bold text-white hover:text-spark-400"
              showIcon={false}
            />
            <p className="mt-1 text-sm text-graphite-500">{company.workingHours.weekdays}</p>
          </div>

          {/* Металлы */}
          <nav aria-labelledby="footer-metals">
            <h2 id="footer-metals" className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite-300">
              Что принимаем
            </h2>
            <ul className="space-y-2">
              {metalPages.map((page) => (
                <li key={page.slug}>
                  <Link href={`/${page.slug}`} className="text-sm text-graphite-400 hover:text-white">
                    {fillTokens(page.h1, page.metalId).replace(/ в .*$/, "").replace(/ — цена за 1 кг$/, "")}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Услуги */}
          <nav aria-labelledby="footer-services">
            <h2 id="footer-services" className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite-300">
              Услуги
            </h2>
            <ul className="space-y-2">
              {servicePages.map((page) => (
                <li key={page.slug}>
                  <Link href={`/${page.slug}`} className="text-sm text-graphite-400 hover:text-white">
                    {fillTokens(page.h1, page.metalId)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Контакты */}
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-graphite-300">Контакты</h2>
            <address className="space-y-2 text-sm not-italic text-graphite-400">
              <p>{company.address.full}</p>
              <p>
                <a href={`mailto:${company.email}`} className="hover:text-white">
                  {company.email}
                </a>
              </p>
            </address>

            {company.serviceAreas.length > 0 && (
              <p className="mt-4 text-sm text-graphite-500">
                Выезжаем: {company.serviceAreas.slice(0, 5).join(", ")}
                {company.serviceAreas.length > 5 ? " и другие направления" : ""}.
              </p>
            )}
          </div>
        </div>

        {/* Нижняя строка */}
        <div className="mt-10 border-t border-graphite-800 pt-6">
          <p className="text-xs leading-relaxed text-graphite-500">
            Цены на сайте актуальны на {formatPriceDate()} и не являются публичной офертой. Итоговая
            стоимость определяется после определения сорта и взвешивания. Приём лома от физических лиц
            осуществляется по документу, удостоверяющему личность.
          </p>

          <div className="mt-4 flex flex-col gap-3 text-xs text-graphite-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} {company.legalName || company.name}
              {company.legal.inn && ` · ИНН ${company.legal.inn}`}
            </p>
            <Link href={company.legal.privacyPolicyUrl} className="hover:text-graphite-300">
              Политика обработки персональных данных
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
