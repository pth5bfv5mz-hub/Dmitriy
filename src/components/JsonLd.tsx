/**
 * Вставка микроразметки JSON-LD. Данные формируются в src/lib/schema.ts.
 * Рендерится на сервере, в клиентский бандл ничего не попадает.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
