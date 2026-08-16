"use client";

import { company } from "@/config/company";

/**
 * ============================================================================
 *  ЦЕЛИ ЯНДЕКС.МЕТРИКИ
 * ============================================================================
 *  Идентификаторы целей заведены здесь один раз. Ровно эти имена нужно
 *  создать в интерфейсе Метрики: Настройка → Цели → JavaScript-событие.
 *
 *  Без заведённых целей Директ не сможет оптимизировать кампании по
 *  конверсиям — а это единственный режим, в котором ниша окупается.
 * ============================================================================
 */
export const GOALS = {
  /** Клик по номеру телефона (любому на сайте) */
  PHONE_CLICK: "phone_click",
  /** Клик по WhatsApp */
  WHATSAPP_CLICK: "whatsapp_click",
  /** Клик по Telegram */
  TELEGRAM_CLICK: "telegram_click",
  /** Успешная отправка любой формы заявки */
  FORM_SUBMIT: "form_submit",
  /** Отправка формы именно с заказом вывоза */
  PICKUP_ORDER: "pickup_order",
  /** Пользователь прикрепил фото металла */
  PHOTO_ATTACHED: "photo_attached",
  /** Пользователь досчитал в калькуляторе (получил результат) */
  CALCULATOR_USED: "calculator_used",
  /** Переход из калькулятора в форму */
  CALCULATOR_TO_FORM: "calculator_to_form",
  /** Открытие полной таблицы цен */
  PRICES_VIEWED: "prices_viewed",
  /** Построение маршрута до площадки */
  ROUTE_CLICK: "route_click",
} as const;

export type GoalName = (typeof GOALS)[keyof typeof GOALS];

type YmFn = (id: number, action: string, ...args: unknown[]) => void;

declare global {
  interface Window {
    ym?: YmFn;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Отправка цели. Безопасна к вызову, когда счётчик не подключён:
 * в разработке просто пишет в консоль и ничего не ломает.
 */
export function reachGoal(goal: GoalName, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;

  const metrikaId = company.analytics.yandexMetrikaId;
  if (metrikaId && typeof window.ym === "function") {
    window.ym(Number(metrikaId), "reachGoal", goal, params);
  }

  if (company.analytics.googleAnalyticsId && typeof window.gtag === "function") {
    window.gtag("event", goal, params ?? {});
  }

  if (process.env.NODE_ENV === "development") {
    // Помогает проверить, что цели вообще срабатывают, до подключения счётчика.
    console.info(`[analytics] goal: ${goal}`, params ?? {});
  }
}
