import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { landings, landingsBySlug } from "@/config/landings";
import { company } from "@/config/company";
import { formatNumber, formatPriceDate, metalsById } from "@/config/prices";
import { fillTokens } from "@/lib/tokens";
import { breadcrumbSchema, faqSchema, serviceSchema } from "@/lib/schema";
import { Hero } from "@/components/Hero";
import { PriceTable } from "@/components/PriceTable";
import { Categories } from "@/components/Categories";
import { Pickup } from "@/components/Pickup";
import { Process } from "@/components/Process";
import { Advantages } from "@/components/Advantages";
import { Trust } from "@/components/Trust";
import { MapBlock } from "@/components/MapBlock";
import { Faq } from "@/components/Faq";
import { FinalCta } from "@/components/FinalCta";
import { JsonLd } from "@/components/JsonLd";
import { Section, SectionHeading } from "@/components/ui/Section";
import { MetalMark } from "@/components/ui/MetalMark";
import { IconArrowRight } from "@/components/icons/Icons";

/**
 * Посадочная страница под группу объявлений Яндекс Директа.
 *
 * Одна страница на группу, содержимое собирается из src/config/landings.ts.
 * Все страницы статически генерируются на сборке — отдаются мгновенно,
 * что важно и для конверсии, и для показателя качества в Директе.
 */

export function generateStaticParams() {
  return landings.map((landing) => ({ slug: landing.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const landing = landingsBySlug[slug];
  if (!landing) return {};

  const title = fillTokens(landing.title, landing.metalId);
  const description = fillTokens(landing.description, landing.metalId);

  return {
    title,
    description,
    alternates: { canonical: `/${landing.slug}` },
    openGraph: {
      type: "article",
      locale: "ru_RU",
      url: `/${landing.slug}`,
      title,
      description,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
  };
}

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const landing = landingsBySlug[slug];
  if (!landing) notFound();

  const metal = landing.metalId ? metalsById[landing.metalId] : undefined;
  const h1 = fillTokens(landing.h1, landing.metalId);
  const offer = fillTokens(landing.offer, landing.metalId);
  const bullets = landing.bullets.map((b) => fillTokens(b, landing.metalId));

  return (
    <>
      {/* Хлебные крошки — помогают и пользователю, и поиску */}
      <nav aria-label="Хлебные крошки" className="border-b border-graphite-800 bg-graphite-950">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-3 text-sm text-graphite-500 sm:px-6">
          <Link href="/" className="hover:text-graphite-300">
            Главная
          </Link>
          <span aria-hidden="true">/</span>
          <span className="truncate text-graphite-300">{h1}</span>
        </div>
      </nav>

      <Hero
        h1={h1}
        offer={offer}
        bullets={bullets}
        ctaLabel={landing.ctaLabel}
        source={`landing-${landing.slug}`}
        defaultMaterial={metal?.name}
        defaultPickup={landing.slug === "vyvoz-metalloloma"}
        priceLabel={metal ? metal.name : undefined}
        priceValue={metal ? `${formatNumber(metal.priceFrom)} – ${formatNumber(metal.priceTo)} ₽/кг` : undefined}
      />

      {/* Вводный текст — по-человечески, а не SEO-простыня */}
      <Section tone="panel">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div>
            <h2 className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">
              {landing.intro.title}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-graphite-300">
              {fillTokens(landing.intro.text, landing.metalId)}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#zayavka"
                className="flex h-13 items-center justify-center rounded-lg bg-spark-500 px-6 font-bold text-white transition-colors hover:bg-spark-400"
              >
                {landing.ctaLabel}
              </Link>
              <a
                href={`tel:${company.phone.raw}`}
                className="flex h-13 items-center justify-center rounded-lg border border-graphite-600 px-6 font-bold text-white transition-colors hover:border-graphite-400"
              >
                {company.phone.display}
              </a>
            </div>
          </div>

          {/* Сорта — самая полезная таблица на странице категории */}
          {metal && (
            <div className="card overflow-hidden">
              <div className="flex items-center gap-3 border-b border-graphite-700 bg-graphite-800 px-5 py-4">
                <MetalMark id={metal.id} className="h-11 w-11" />
                <div>
                  <h3 className="font-bold text-white">{metal.name}: цены по сортам</h3>
                  <p className="text-xs text-graphite-400">на {formatPriceDate()}, ₽ за кг</p>
                </div>
              </div>
              <ul className="divide-y divide-graphite-700">
                {metal.grades.map((grade) => (
                  <li key={grade.name} className="flex items-start justify-between gap-4 px-5 py-3.5">
                    <span>
                      <span className="block text-sm font-medium text-white">{grade.name}</span>
                      {grade.note && (
                        <span className="mt-0.5 block text-xs text-graphite-500">{grade.note}</span>
                      )}
                    </span>
                    <span className="tabular shrink-0 font-bold text-spark-400">
                      {formatNumber(grade.price)} ₽
                    </span>
                  </li>
                ))}
              </ul>
              <p className="border-t border-graphite-700 px-5 py-3.5 text-xs leading-relaxed text-graphite-500">
                Сорт определяем при вас. Итоговая цена зависит от засора и объёма партии.
              </p>
            </div>
          )}
        </div>
      </Section>

      {/* Для страниц услуг подробный блок вывоза важнее прайса */}
      {landing.metalId ? (
        <>
          <PriceTable highlightId={landing.metalId} tone="dark" />
          <Pickup />
        </>
      ) : (
        <>
          <Pickup />
          <PriceTable tone="dark" />
        </>
      )}

      <Process />
      <Advantages />

      {landing.relatedMetalIds && landing.relatedMetalIds.length > 0 && (
        <Categories
          only={landing.relatedMetalIds}
          eyebrow="Что ещё принимаем"
          title="Другие виды лома"
          subtitle="Если в партии есть что-то ещё — привозите вместе, рассортируем и посчитаем каждый вид отдельно."
          tone="panel"
        />
      )}

      <Trust />
      <Faq tag={landing.faqTag} metalId={landing.metalId} limit={10} tone="panel" />
      <MapBlock />

      {/* Перелинковка между посадочными */}
      <Section tone="panel">
        <SectionHeading eyebrow="Все направления" title="Что мы ещё принимаем и делаем" />
        <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {landings
            .filter((l) => l.slug !== landing.slug)
            .map((other) => (
              <li key={other.slug}>
                <Link
                  href={`/${other.slug}`}
                  className="card card-hover flex items-center justify-between gap-3 p-4 text-sm font-medium text-graphite-200"
                >
                  {fillTokens(other.h1, other.metalId)}
                  <IconArrowRight className="h-4 w-4 shrink-0 text-spark-400" />
                </Link>
              </li>
            ))}
        </ul>
      </Section>

      <FinalCta />

      <JsonLd
        data={[
          serviceSchema({
            name: h1,
            description: fillTokens(landing.description, landing.metalId),
            slug: landing.slug,
            metalId: landing.metalId,
          }),
          faqSchema(landing.faqTag, 10, landing.metalId),
          breadcrumbSchema([
            { name: "Главная", url: "/" },
            { name: h1, url: `/${landing.slug}` },
          ]),
        ]}
      />
    </>
  );
}
