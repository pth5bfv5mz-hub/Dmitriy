import Link from "next/link";
import { Section, SectionHeading } from "@/components/ui/Section";
import { faqForTag, type FaqItem } from "@/config/faq";
import { fillTokens } from "@/lib/tokens";
import { IconChevron } from "@/components/icons/Icons";

/**
 * FAQ на нативных <details> — без JavaScript.
 * Работает мгновенно, доступно с клавиатуры, ищется браузерным поиском
 * по странице и не добавляет ни байта в бандл.
 */
export function Faq({
  tag = "general",
  limit = 12,
  metalId,
  tone = "panel",
  title = "Частые вопросы",
}: {
  tag?: string;
  limit?: number;
  metalId?: string;
  tone?: "dark" | "panel";
  title?: string;
}) {
  const items = faqForTag(tag, limit);

  return (
    <Section id="faq" tone={tone}>
      <SectionHeading
        eyebrow="Вопросы и ответы"
        title={title}
        subtitle="Отвечаем так же, как ответили бы по телефону. Если вашего вопроса нет — просто позвоните."
      />

      <div className="mx-auto max-w-3xl divide-y divide-graphite-700 overflow-hidden rounded-xl border border-graphite-700 bg-graphite-850">
        {items.map((item: FaqItem) => (
          <details key={item.q} className="group">
            <summary className="flex items-start justify-between gap-4 p-5 text-left transition-colors hover:bg-graphite-800">
              <h3 className="text-base font-semibold text-white sm:text-lg">{fillTokens(item.q, metalId)}</h3>
              <IconChevron className="mt-0.5 h-5 w-5 shrink-0 text-spark-400 transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-5 pb-5 text-sm leading-relaxed text-graphite-300 sm:text-base">
              {fillTokens(item.a, metalId)}
            </div>
          </details>
        ))}
      </div>

      <p className="mx-auto mt-6 max-w-3xl text-center text-graphite-400">
        Остались вопросы?{" "}
        <Link href="#zayavka" className="font-semibold text-spark-400 underline underline-offset-2 hover:text-spark-300">
          Оставьте заявку
        </Link>{" "}
        — перезвоним и разберём ваш случай.
      </p>
    </Section>
  );
}
