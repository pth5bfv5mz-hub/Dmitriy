"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { calculatorMetals, formatNumber } from "@/config/prices";
import { GOALS, reachGoal } from "@/lib/analytics";

/**
 * Калькулятор предварительной оценки.
 *
 * Осознанно НЕ создаём ложную точность: результат — это вилка «от и до»,
 * посчитанная по границам прайса, и подписан он как предварительный.
 * Одна «точная» цифра здесь означала бы, что клиент приедет с ожиданием,
 * которое весы не подтвердят. Такие сделки срываются на площадке, и
 * рекламный бюджет уходит впустую.
 */

const QUICK_WEIGHTS = [10, 50, 100, 500, 1000];

export function Calculator() {
  const fieldId = useId();
  const [metalId, setMetalId] = useState(calculatorMetals[0]?.id ?? "");
  const [weight, setWeight] = useState<string>("100");

  const metal = useMemo(
    () => calculatorMetals.find((m) => m.id === metalId) ?? calculatorMetals[0],
    [metalId],
  );

  const parsedWeight = Number.parseFloat(weight.replace(",", "."));
  const validWeight = Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : 0;

  const low = validWeight * (metal?.priceFrom ?? 0);
  const high = validWeight * (metal?.priceTo ?? 0);
  const hasResult = validWeight > 0 && Boolean(metal);

  /* Цель в Метрике — но не на каждое нажатие клавиши, а один раз после паузы. */
  useEffect(() => {
    if (!hasResult) return;
    const timer = setTimeout(() => {
      reachGoal(GOALS.CALCULATOR_USED, { metal: metal?.id, weight: validWeight });
    }, 1200);
    return () => clearTimeout(timer);
  }, [hasResult, metal?.id, validWeight]);

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-graphite-700 bg-graphite-800 px-5 py-4">
        <h3 className="text-lg font-bold text-white">Предварительный расчёт</h3>
        <p className="mt-0.5 text-sm text-graphite-400">Прикиньте сумму за минуту</p>
      </div>

      <div className="p-5">
        <label htmlFor={`${fieldId}-metal`} className="mb-1.5 block text-sm font-medium text-graphite-300">
          Вид металла
        </label>
        <select
          id={`${fieldId}-metal`}
          value={metalId}
          onChange={(e) => setMetalId(e.target.value)}
          className="h-12 w-full rounded-lg border border-graphite-600 bg-graphite-900 px-3 text-base text-white focus:border-spark-400"
        >
          {calculatorMetals.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <label htmlFor={`${fieldId}-weight`} className="mb-1.5 mt-4 block text-sm font-medium text-graphite-300">
          Примерный вес, кг
        </label>
        <input
          id={`${fieldId}-weight`}
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="tabular h-12 w-full rounded-lg border border-graphite-600 bg-graphite-900 px-3 text-base text-white focus:border-spark-400"
        />

        <div className="mt-2.5 flex flex-wrap gap-2">
          {QUICK_WEIGHTS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWeight(String(w))}
              className={`tabular h-9 rounded-md border px-3 text-sm font-medium transition-colors ${
                weight === String(w)
                  ? "border-spark-500 bg-spark-500/15 text-spark-300"
                  : "border-graphite-600 bg-graphite-900 text-graphite-300 hover:border-graphite-500"
              }`}
            >
              {formatNumber(w)} кг
            </button>
          ))}
        </div>

        {/* Результат */}
        <div className="mt-5 rounded-xl border border-spark-500/35 bg-spark-500/8 p-5" aria-live="polite">
          <p className="text-xs font-medium uppercase tracking-wide text-graphite-400">
            Ориентировочно вы получите
          </p>
          {hasResult ? (
            <p className="tabular mt-1.5 text-2xl font-extrabold leading-tight text-white sm:text-3xl">
              {formatNumber(low)} – {formatNumber(high)} ₽
            </p>
          ) : (
            <p className="mt-1.5 text-2xl font-extrabold text-graphite-500">— ₽</p>
          )}
          <p className="mt-2.5 text-xs leading-relaxed text-graphite-400">
            Это предварительная оценка по границам прайса, а не итоговая сумма. Реальная цена зависит от
            сорта, засора и объёма — определяем при взвешивании в вашем присутствии.
          </p>
        </div>

        <Link
          href="#zayavka"
          onClick={() => reachGoal(GOALS.CALCULATOR_TO_FORM, { metal: metal?.id, weight: validWeight })}
          className="mt-4 flex h-13 w-full items-center justify-center rounded-lg bg-spark-500 font-bold text-white transition-colors hover:bg-spark-400"
        >
          Узнать точную цену
        </Link>
      </div>
    </div>
  );
}
