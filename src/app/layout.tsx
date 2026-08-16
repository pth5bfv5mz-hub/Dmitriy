import type { Metadata, Viewport } from "next";
import "./globals.css";
import { company } from "@/config/company";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileCtaBar } from "@/components/MobileCtaBar";
import { YandexMetrika } from "@/components/YandexMetrika";
import { JsonLd } from "@/components/JsonLd";
import { localBusinessSchema } from "@/lib/schema";

const siteUrl = company.site.url.replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `Приём металлолома в ${company.city.prepositional} — цены за кг, вывоз | ${company.name}`,
    template: `%s | ${company.name}`,
  },
  description: `Приём чёрного и цветного металлолома в ${company.city.prepositional} и области. Взвешивание при вас, расчёт сразу после весов, вывоз своим транспортом. ${company.phone.display}`,
  applicationName: company.name,
  authors: [{ name: company.name }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: company.name,
    url: siteUrl,
    title: `Приём металлолома в ${company.city.prepositional} — цены за кг, вывоз`,
    description: `Чёрный и цветной металл. Быстрая оценка, при необходимости — вывоз с вашего адреса. Взвешивание при вас, расчёт сразу.`,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: `${company.name} — приём металлолома` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Приём металлолома в ${company.city.prepositional}`,
    description: "Чёрный и цветной металл. Оценка по фото, вывоз своим транспортом, расчёт сразу.",
    images: ["/og.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml", sizes: "any" },
    ],
    apple: "/apple-icon.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  formatDetection: { telephone: true },
};

export const viewport: Viewport = {
  themeColor: "#0b0d0f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /**
     * Никакого ручного <head> здесь быть не должно: в App Router его формирует
     * сам Next, и собственный <head> вытесняет вставляемые им теги стилей.
     * Всё, что нужно в <head>, объявляется через metadata или через <link>
     * внутри компонентов — React 19 поднимает такие теги в head сам.
     */
    <html lang="ru">
      <body className="min-h-screen antialiased">
        {/* Ссылка для клавиатурной навигации и скринридеров */}
        <a
          href="#main"
          className="sr-only-focusable absolute left-4 top-4 z-[60] rounded-lg bg-spark-500 px-4 py-2 font-semibold text-white"
        >
          Перейти к содержимому
        </a>

        <Header />

        {/* pb-24 на мобильном — чтобы фиксированная панель CTA не закрывала контент */}
        <main id="main" className="pb-24 md:pb-0">
          {children}
        </main>

        <Footer />
        <MobileCtaBar />

        <JsonLd data={localBusinessSchema()} />
        <YandexMetrika />
      </body>
    </html>
  );
}
