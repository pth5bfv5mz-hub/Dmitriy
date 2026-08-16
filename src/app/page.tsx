import type { Metadata } from "next";
import { company } from "@/config/company";
import { ferrousRange, formatNumber, formatRange, topNonFerrousPrice } from "@/config/prices";
import { Hero } from "@/components/Hero";
import { PriceTable } from "@/components/PriceTable";
import { Categories } from "@/components/Categories";
import { Pickup } from "@/components/Pickup";
import { Process } from "@/components/Process";
import { Advantages } from "@/components/Advantages";
import { Audiences } from "@/components/Audiences";
import { Trust } from "@/components/Trust";
import { Reviews } from "@/components/Reviews";
import { MapBlock } from "@/components/MapBlock";
import { Faq } from "@/components/Faq";
import { FinalCta } from "@/components/FinalCta";
import { JsonLd } from "@/components/JsonLd";
import { faqSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: `Приём металлолома в ${company.city.prepositional} — цены за кг, вывоз в день заявки`,
  description:
    `Принимаем чёрный и цветной металлолом в ${company.city.prepositional} и области. ` +
    `Чермет ${formatRange(ferrousRange.from, ferrousRange.to)}, цветмет до ${formatNumber(topNonFerrousPrice)} ₽/кг. ` +
    `Взвешивание при вас, расчёт сразу, вывоз своим транспортом. ${company.phone.display}`,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero
        h1={`Приём металлолома в ${company.city.prepositional} по выгодной цене`}
        offer="Чёрный и цветной металл. Быстрая оценка — по телефону или по фото. При необходимости заберём с вашего адреса своим транспортом."
        bullets={[
          "Взвешиваем при вас, перевесить можно всегда",
          "Расчёт наличными или на карту сразу после весов",
          `Вывоз бесплатно от ${formatNumber(company.terms.freePickupFerrousKg)} кг чермета`,
          "Работаем с частными лицами и организациями",
        ]}
        ctaLabel="Рассчитать стоимость"
        source="home-hero"
      />

      <PriceTable tone="panel" />
      <Categories tone="dark" />
      <Pickup />
      <Process />
      <Advantages />
      <Audiences />
      <Trust />
      <Reviews />
      <Faq tone="dark" limit={14} />
      <MapBlock />
      <FinalCta />

      <JsonLd data={faqSchema("general", 14)} />
    </>
  );
}
