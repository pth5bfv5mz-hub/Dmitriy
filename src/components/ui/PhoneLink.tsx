"use client";

import { company, telegramUrl, whatsappUrl } from "@/config/company";
import { GOALS, reachGoal } from "@/lib/analytics";
import { IconPhone, IconTelegram, IconWhatsApp } from "@/components/icons/Icons";

/**
 * Телефон-ссылка. Всегда кликабельна (на мобильном это половина конверсий)
 * и всегда отправляет цель в Метрику — иначе Директ не сможет оптимизироваться
 * по звонкам.
 */
export function PhoneLink({
  className = "",
  showIcon = true,
  place,
}: {
  className?: string;
  showIcon?: boolean;
  /** Где именно нажали — попадает в параметры цели. */
  place: string;
}) {
  return (
    <a
      href={`tel:${company.phone.raw}`}
      onClick={() => reachGoal(GOALS.PHONE_CLICK, { place })}
      className={`tabular inline-flex items-center gap-2 whitespace-nowrap ${className}`}
    >
      {showIcon && <IconPhone className="h-5 w-5 shrink-0" />}
      <span>{company.phone.display}</span>
    </a>
  );
}

/** Кнопки мессенджеров. Показываются, только если заполнены в конфиге. */
export function MessengerLinks({ place, className = "" }: { place: string; className?: string }) {
  if (!whatsappUrl && !telegramUrl) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => reachGoal(GOALS.WHATSAPP_CLICK, { place })}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-graphite-700 bg-graphite-850 text-graphite-300 transition-colors hover:border-graphite-500 hover:text-white"
          aria-label="Написать в WhatsApp"
        >
          <IconWhatsApp className="h-5 w-5" />
        </a>
      )}
      {telegramUrl && (
        <a
          href={telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => reachGoal(GOALS.TELEGRAM_CLICK, { place })}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-graphite-700 bg-graphite-850 text-graphite-300 transition-colors hover:border-graphite-500 hover:text-white"
          aria-label="Написать в Telegram"
        >
          <IconTelegram className="h-5 w-5" />
        </a>
      )}
    </div>
  );
}
