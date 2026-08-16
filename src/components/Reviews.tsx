import { Section, SectionHeading } from "@/components/ui/Section";
import { hasReviews, hasReviewSources, reviews, reviewSources } from "@/config/reviews";
import { PhoneLink } from "@/components/ui/PhoneLink";

/**
 * Отзывы.
 *
 * Пока настоящих отзывов нет, блок НЕ показывает выдуманные. Вместо этого он
 * честно объясняет ситуацию и ведёт на внешние площадки, где отзывы нельзя
 * подделать. Пустая честная секция стоит дешевле, чем пойманный на фальшивке
 * сайт: в этой нише пользователь особенно недоверчив.
 *
 * Как только в src/config/reviews.ts появятся записи, блок сам превратится
 * в полноценную секцию отзывов.
 */
export function Reviews() {
  return (
    <Section id="otzyvy" tone="panel">
      <SectionHeading
        eyebrow="Отзывы"
        title={hasReviews ? "Что говорят клиенты" : "Отзывы"}
        subtitle={
          hasReviews
            ? "Отзывы клиентов, которые разрешили их опубликовать."
            : undefined
        }
      />

      {hasReviews ? (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review, index) => (
            <li key={`${review.author}-${index}`} className="card flex h-full flex-col p-6">
              {review.rating && (
                <p className="mb-3 text-spark-400" aria-label={`Оценка ${review.rating} из 5`}>
                  {"★".repeat(review.rating)}
                  <span className="text-graphite-600">{"★".repeat(5 - review.rating)}</span>
                </p>
              )}
              <blockquote className="flex-1 text-sm leading-relaxed text-graphite-200">
                {review.text}
              </blockquote>
              <footer className="mt-4 border-t border-graphite-700 pt-3.5 text-sm">
                <p className="font-semibold text-white">{review.author}</p>
                {review.role && <p className="text-graphite-500">{review.role}</p>}
                {review.sourceUrl && review.sourceName && (
                  <a
                    href={review.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="mt-1 inline-block text-graphite-400 underline underline-offset-2 hover:text-white"
                  >
                    {review.sourceName}
                  </a>
                )}
              </footer>
            </li>
          ))}
        </ul>
      ) : (
        <div className="card p-6 sm:p-8">
          <h3 className="text-lg font-bold text-white">Здесь будут настоящие отзывы</h3>
          <p className="mt-3 max-w-2xl leading-relaxed text-graphite-300">
            Мы не публикуем придуманные отзывы. Их легко узнать, и доверия они не добавляют — скорее
            наоборот. Как только клиенты оставят отзывы на независимых площадках, они появятся здесь
            со ссылкой на первоисточник.
          </p>
          <p className="mt-3 max-w-2xl leading-relaxed text-graphite-400">
            А пока предлагаем проверить нас самым надёжным способом: позвоните и задайте любые
            неудобные вопросы — про весы, про сортность, про документы. По ответам о компании обычно
            всё понятно быстрее, чем по отзывам.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <PhoneLink
              place="reviews"
              className="h-13 rounded-lg bg-spark-500 px-6 font-bold text-white transition-colors hover:bg-spark-400"
            />

            {hasReviewSources && (
              <div className="flex flex-wrap gap-3">
                {reviewSources.yandexMaps && (
                  <ExternalSource href={reviewSources.yandexMaps} label="Мы на Яндекс.Картах" />
                )}
                {reviewSources.twoGis && <ExternalSource href={reviewSources.twoGis} label="Мы в 2ГИС" />}
                {reviewSources.google && <ExternalSource href={reviewSources.google} label="Отзывы Google" />}
              </div>
            )}
          </div>
        </div>
      )}
    </Section>
  );
}

function ExternalSource({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="inline-flex h-13 items-center rounded-lg border border-graphite-600 px-5 font-semibold text-white transition-colors hover:border-graphite-400"
    >
      {label}
    </a>
  );
}
