import { company } from "@/config/company";
import { faqForTag } from "@/config/faq";
import { metals, priceUpdatedAt } from "@/config/prices";
import { fillTokens } from "@/lib/tokens";

/**
 * Микроразметка Schema.org.
 *
 * Ставим только то, что действительно описывает страницу:
 *  • LocalBusiness — площадка с адресом, телефоном и режимом работы;
 *  • FAQPage — там, где реально есть блок вопросов;
 *  • Service + Offer — для страниц услуг и категорий металла.
 *
 * Разметку Product и AggregateRating сознательно НЕ используем: мы не продаём
 * товар и у нас нет собранных оценок. Разметка, не соответствующая содержимому
 * страницы, приводит к ручным санкциям, а не к красивому сниппету.
 */

const siteUrl = company.site.url.replace(/\/$/, "");

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteUrl}/#organization`,
    name: company.legalName || company.name,
    alternateName: company.name,
    description: `Приём и вывоз чёрного и цветного металлолома в ${company.city.prepositional} и области.`,
    url: siteUrl,
    telephone: company.phone.raw,
    email: company.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: company.address.street,
      addressLocality: company.city.nominative,
      addressRegion: company.city.region,
      postalCode: company.address.postalCode,
      addressCountry: "RU",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: company.coordinates.lat,
      longitude: company.coordinates.lon,
    },
    openingHoursSpecification: company.workingHours.schema.map((slot) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: slot.days,
      opens: slot.opens,
      closes: slot.closes,
    })),
    areaServed: company.serviceAreas.map((area) => ({ "@type": "Place", name: area })),
    priceRange: "₽₽",
    currenciesAccepted: "RUB",
    paymentAccepted: company.terms.payment.join(", "),
    ...(company.legal.inn ? { taxID: company.legal.inn } : {}),
  };
}

export function faqSchema(tag = "general", limit = 12, metalId?: string) {
  const items = faqForTag(tag, limit);
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: fillTokens(item.q, metalId),
      acceptedAnswer: {
        "@type": "Answer",
        text: fillTokens(item.a, metalId),
      },
    })),
  };
}

/**
 * Услуга приёма конкретного металла. Offer с ценой — корректный случай:
 * мы действительно публикуем расценки закупки, и они привязаны к дате.
 */
export function serviceSchema({
  name,
  description,
  slug,
  metalId,
}: {
  name: string;
  description: string;
  slug: string;
  metalId?: string;
}) {
  const metal = metalId ? metals.find((m) => m.id === metalId) : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    serviceType: metal ? `Приём лома: ${metal.name}` : "Приём и вывоз металлолома",
    url: `${siteUrl}/${slug}`,
    provider: { "@id": `${siteUrl}/#organization` },
    areaServed: {
      "@type": "City",
      name: company.city.nominative,
    },
    ...(metal
      ? {
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "RUB",
            lowPrice: metal.priceFrom,
            highPrice: metal.priceTo,
            unitText: "кг",
            offerCount: metal.grades.length,
            priceValidUntil: priceValidUntil(),
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.url}`,
    })),
  };
}

/** Прайс живёт неделями — ставим срок годности оффера в 30 дней от даты прайса. */
function priceValidUntil(): string {
  const date = new Date(`${priceUpdatedAt}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 30);
  return date.toISOString().slice(0, 10);
}
