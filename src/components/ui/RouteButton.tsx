"use client";

import { routeUrl } from "@/config/company";
import { GOALS, reachGoal } from "@/lib/analytics";

/**
 * Кнопка «Построить маршрут». Вынесена в отдельный клиентский компонент,
 * чтобы весь блок с картой мог остаться серверным и не попадал в JS-бандл.
 */
export function RouteButton({ place = "contacts" }: { place?: string }) {
  return (
    <a
      href={routeUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => reachGoal(GOALS.ROUTE_CLICK, { place })}
      className="mt-3 inline-flex h-11 items-center rounded-lg bg-spark-500 px-5 text-sm font-bold text-white transition-colors hover:bg-spark-400"
    >
      Построить маршрут
    </a>
  );
}
