import { company } from "@/config/company";
import {
  ferrousRange,
  formatNumber,
  formatRange,
  metalsById,
  topNonFerrousPrice,
  type MetalCategory,
} from "@/config/prices";

/**
 * Подстановка плейсхолдеров {{token}} в текстах конфигов.
 *
 * Благодаря этому в landings.ts и faq.ts можно писать «Приём меди в {{cityPrep}}
 * до {{priceTo}} ₽/кг», а при смене города или цены весь сайт обновится сам.
 */

export function buildTokens(metal?: MetalCategory): Record<string, string> {
  const base: Record<string, string> = {
    company: company.name,
    city: company.city.nominative,
    cityPrep: company.city.prepositional,
    region: company.city.region,
    phone: company.phone.display,
    email: company.email,
    address: company.address.full,
    serviceRadiusKm: String(company.serviceRadiusKm),
    pickupSpeed: company.terms.pickupSpeed,
    priceUpdateFrequency: company.terms.priceUpdateFrequency,
    freeFerrous: formatNumber(company.terms.freePickupFerrousKg),
    freeNonFerrous: formatNumber(company.terms.freePickupNonFerrousKg),
    freePickupFerrousKg: formatNumber(company.terms.freePickupFerrousKg),
    freePickupNonFerrousKg: formatNumber(company.terms.freePickupNonFerrousKg),
    craneFrom: formatNumber(company.terms.craneFromKg),
    ferrousRange: formatRange(ferrousRange.from, ferrousRange.to),
    topNonFerrous: formatNumber(topNonFerrousPrice),
  };

  if (metal) {
    base.metal = metal.name;
    base.priceFrom = formatNumber(metal.priceFrom);
    base.priceTo = formatNumber(metal.priceTo);
    base.priceRange = formatRange(metal.priceFrom, metal.priceTo);
  }

  return base;
}

/** Заменяет все {{token}} в строке. Неизвестные токены оставляет как есть. */
export function fillTokens(input: string, metalId?: string): string {
  const metal = metalId ? metalsById[metalId] : undefined;
  const tokens = buildTokens(metal);
  return input.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    key in tokens ? tokens[key] : match,
  );
}
