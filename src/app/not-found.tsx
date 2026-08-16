import Link from "next/link";
import { landings } from "@/config/landings";
import { fillTokens } from "@/lib/tokens";
import { Section } from "@/components/ui/Section";
import { PhoneLink } from "@/components/ui/PhoneLink";

/**
 * 404. Не тупик, а развилка: у человека есть металл и намерение его сдать,
 * поэтому даём телефон и ссылки на основные направления вместо пустой страницы.
 */
export default function NotFound() {
  return (
    <Section tone="dark">
      <div className="mx-auto max-w-2xl text-center">
        <p className="tabular text-6xl font-extrabold text-graphite-800">404</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">Такой страницы нет</h1>
        <p className="mt-4 text-lg text-graphite-300">
          Возможно, страницу переименовали. Металл мы принимаем по-прежнему — позвоните или выберите
          нужное направление ниже.
        </p>

        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <PhoneLink
            place="404"
            className="h-13 justify-center rounded-lg bg-spark-500 px-6 font-bold text-white"
          />
          <Link
            href="/"
            className="flex h-13 items-center justify-center rounded-lg border border-graphite-600 px-6 font-bold text-white"
          >
            На главную
          </Link>
        </div>

        <ul className="mt-10 grid gap-2.5 text-left sm:grid-cols-2">
          {landings.slice(0, 8).map((landing) => (
            <li key={landing.slug}>
              <Link
                href={`/${landing.slug}`}
                className="card card-hover block p-4 text-sm font-medium text-graphite-200"
              >
                {fillTokens(landing.h1, landing.metalId)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
