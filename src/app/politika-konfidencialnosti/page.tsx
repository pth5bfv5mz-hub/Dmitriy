import type { Metadata } from "next";
import { company } from "@/config/company";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "Политика обработки персональных данных",
  description:
    "Как мы обрабатываем персональные данные, оставленные через формы на сайте, и на каких основаниях.",
  alternates: { canonical: "/politika-konfidencialnosti" },
  robots: { index: false, follow: true },
};

/**
 * Базовый текст политики обработки персональных данных.
 *
 * ⚠️ ВЛАДЕЛЬЦУ: перед запуском рекламы заполните реквизиты в
 * src/config/company.ts (legalName, inn, ogrn, address, email). Без указанного
 * оператора документ юридически неполон, а Яндекс Директ требует наличия
 * работающей политики на сайте с формами сбора данных.
 * Текст ниже — рабочая основа; при обработке данных за рамками описанного
 * его стоит согласовать с юристом.
 */
export default function PrivacyPolicyPage() {
  const operator = company.legalName || company.name;

  return (
    <Section tone="dark">
      <article className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Политика обработки персональных данных
        </h1>

        <div className="mt-8 space-y-6 leading-relaxed text-graphite-300">
          <p>
            Настоящая политика описывает, какие данные и с какой целью обрабатывает оператор —{" "}
            <strong className="text-white">{operator}</strong>
            {company.legal.inn && <> (ИНН {company.legal.inn})</>}, при использовании сайта{" "}
            {company.site.url.replace(/^https?:\/\//, "")}.
          </p>

          <Block title="Какие данные мы собираем">
            <p>
              Только те, которые вы сами указываете в форме заявки: имя, номер телефона и — по вашему
              желанию — вид металла, примерный объём, адрес вывоза и фотографии лома. Дополнительно
              сервисы веб-аналитики собирают обезличенные технические данные о посещении: тип устройства,
              источник перехода, просмотренные страницы.
            </p>
          </Block>

          <Block title="Зачем мы их обрабатываем">
            <p>
              Чтобы связаться с вами по вашей заявке, оценить стоимость лома, согласовать вывоз и
              выполнить обязательства перед вами. Данные веб-аналитики используются только для оценки
              работы сайта и рекламы.
            </p>
          </Block>

          <Block title="Основание обработки">
            <p>
              Ваше согласие, которое вы даёте, отмечая соответствующий пункт при отправке формы, а также
              необходимость исполнения договора, стороной которого вы являетесь.
            </p>
          </Block>

          <Block title="Кому передаются данные">
            <p>
              Мы не продаём и не передаём ваши данные третьим лицам для маркетинга. Данные могут
              обрабатываться нашими подрядчиками по хостингу и системам учёта заявок в объёме, необходимом
              для работы сайта, а также передаваться государственным органам в случаях, прямо
              предусмотренных законом.
            </p>
          </Block>

          <Block title="Сколько мы храним данные">
            <p>
              До достижения цели обработки, но не дольше срока, установленного законодательством. Вы
              можете отозвать согласие в любой момент — после этого данные удаляются, если нет иных
              законных оснований для их хранения.
            </p>
          </Block>

          <Block title="Ваши права">
            <p>
              Вы вправе запросить информацию об обработке своих данных, потребовать их уточнения,
              блокирования или удаления, а также отозвать согласие. Для этого напишите на{" "}
              <a href={`mailto:${company.email}`} className="text-spark-400 underline underline-offset-2">
                {company.email}
              </a>{" "}
              или позвоните по номеру {company.phone.display}.
            </p>
          </Block>

          <Block title="Файлы cookie и аналитика">
            <p>
              Сайт использует cookie для корректной работы и сбора обезличенной статистики посещений.
              Вы можете отключить cookie в настройках браузера — на работу форм это не повлияет.
            </p>
          </Block>

          <Block title="Контакты оператора">
            <p>
              {operator}
              {company.legal.ogrn && <>, ОГРН {company.legal.ogrn}</>}
              <br />
              Адрес: {company.address.full}
              <br />
              Телефон: {company.phone.display}
              <br />
              E-mail: {company.email}
            </p>
          </Block>
        </div>
      </article>
    </Section>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-xl font-bold text-white">{title}</h2>
      {children}
    </section>
  );
}
