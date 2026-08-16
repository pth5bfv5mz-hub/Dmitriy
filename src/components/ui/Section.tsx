import type { ReactNode } from "react";

/**
 * Секция страницы. Единая вертикальная ритмика и единая ширина контента —
 * это то, что отличает «сделано агентством» от «собрано из блоков».
 */
export function Section({
  id,
  children,
  className = "",
  tone = "dark",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  /** dark — основной фон, panel — чуть светлее для чередования */
  tone?: "dark" | "panel";
}) {
  const bg = tone === "panel" ? "bg-graphite-900" : "bg-graphite-950";
  return (
    <section id={id} className={`${bg} py-14 sm:py-20 ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">{children}</div>
    </section>
  );
}

/** Заголовок секции с необязательным подзаголовком и надзаголовком. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  align?: "left" | "center";
}) {
  const alignment = align === "center" ? "text-center mx-auto" : "";
  return (
    <div className={`mb-8 max-w-3xl sm:mb-12 ${alignment}`}>
      {eyebrow && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-spark-400">
          {eyebrow}
        </p>
      )}
      <h2 className="text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
        {title}
      </h2>
      {subtitle && <div className="mt-4 text-base leading-relaxed text-graphite-300">{subtitle}</div>}
    </div>
  );
}
