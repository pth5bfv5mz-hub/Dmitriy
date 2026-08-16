"use client";

import Script from "next/script";
import { company } from "@/config/company";

/**
 * Яндекс.Метрика.
 *
 * Подключается только если в src/config/company.ts заполнен yandexMetrikaId —
 * пустой счётчик не грузится и не тратит трафик на мобильном.
 *
 * strategy="afterInteractive" — счётчик не блокирует отрисовку первого экрана,
 * но успевает поймать визит. Это важно: LCP первого экрана напрямую влияет
 * на стоимость конверсии в Директе.
 *
 * ЦЕЛИ, которые нужно создать в интерфейсе Метрики (тип «JavaScript-событие»),
 * идентификаторы перечислены в src/lib/analytics.ts:
 *   phone_click, whatsapp_click, telegram_click, form_submit, pickup_order,
 *   photo_attached, calculator_used, calculator_to_form, prices_viewed,
 *   route_click.
 */
export function YandexMetrika() {
  const id = company.analytics.yandexMetrikaId;
  if (!id) return null;

  return (
    <>
      {/* React 19 поднимает link в <head>. Прогрев соединения экономит ~100 мс на мобильном. */}
      <link rel="preconnect" href="https://mc.yandex.ru" crossOrigin="" />

      <Script id="yandex-metrika" strategy="afterInteractive">
        {`
          (function(m,e,t,r,i,k,a){
            m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for (var j = 0; j < document.scripts.length; j++) {
              if (document.scripts[j].src === r) { return; }
            }
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],
            k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
          })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

          ym(${Number(id)}, "init", {
            clickmap: true,
            trackLinks: true,
            accurateTrackBounce: true,
            webvisor: ${company.analytics.metrikaWebvisor}
          });
        `}
      </Script>
      <noscript>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://mc.yandex.ru/watch/${Number(id)}`}
            style={{ position: "absolute", left: "-9999px" }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}
