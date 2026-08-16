"use client";

import { company } from "@/config/company";
import { GOALS, reachGoal } from "@/lib/analytics";
import { IconPhone } from "@/components/icons/Icons";

/**
 * Фиксированная нижняя панель на мобильном.
 *
 * Большая часть трафика из Директа — мобильная, и там телефон должен быть
 * под большим пальцем в любой момент прокрутки. Панель видна только на
 * маленьких экранах; на десктопе телефон и так закреплён в шапке.
 *
 * Высота панели компенсируется отступом у <main> в layout.tsx, чтобы
 * панель никогда не перекрывала последний блок страницы.
 */
export function MobileCtaBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-graphite-700 bg-graphite-900/98 backdrop-blur md:hidden">
      <div
        className="flex items-stretch gap-2 p-2"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        <a
          href={`tel:${company.phone.raw}`}
          onClick={() => reachGoal(GOALS.PHONE_CLICK, { place: "mobile-bar" })}
          className="flex h-13 flex-1 items-center justify-center gap-2 rounded-lg border border-graphite-600 bg-graphite-850 py-3.5 text-base font-bold text-white"
        >
          <IconPhone className="h-5 w-5" />
          Позвонить
        </a>
        <a
          href="/#zayavka"
          className="flex h-13 flex-1 items-center justify-center rounded-lg bg-spark-500 py-3.5 text-base font-bold text-white"
        >
          Узнать цену
        </a>
      </div>
    </div>
  );
}
