"use client";

import Link from "next/link";
import { useState } from "react";
import { company } from "@/config/company";
import { PhoneLink } from "@/components/ui/PhoneLink";
import { IconSpark } from "@/components/icons/Icons";

const navLinks = [
  { href: "/#ceny", label: "Цены" },
  { href: "/#chto-prinimaem", label: "Что принимаем" },
  { href: "/#vyvoz", label: "Вывоз" },
  { href: "/#kak-rabotaem", label: "Как работаем" },
  { href: "/#kontakty", label: "Контакты" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-graphite-800 bg-graphite-950/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:h-18 sm:px-6">
        {/* Логотип */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={`${company.name} — на главную`}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-spark-500 text-white">
            <IconSpark className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-base font-bold tracking-tight text-white">{company.name}</span>
            <span className="hidden text-[11px] text-graphite-400 sm:block">{company.tagline}</span>
          </span>
        </Link>

        {/* Десктопная навигация */}
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Основная навигация">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex h-11 items-center text-sm font-medium text-graphite-300 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Контакты и CTA */}
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <PhoneLink
              place="header"
              showIcon={false}
              className="text-base font-bold text-white hover:text-spark-400 sm:text-lg"
            />
            <p className="text-[11px] text-graphite-400">
              {company.workingHours.requests24h ? "Заявки — круглосуточно" : company.workingHours.weekdays}
            </p>
          </div>

          <Link
            href="/#zayavka"
            className="hidden h-11 items-center rounded-lg bg-spark-500 px-5 text-sm font-bold text-white transition-colors hover:bg-spark-400 md:inline-flex"
          >
            Узнать цену
          </Link>

          {/* Бургер только на мобильном */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-graphite-700 text-white lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              {open ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Мобильное меню */}
      {open && (
        <nav
          id="mobile-nav"
          className="border-t border-graphite-800 bg-graphite-900 lg:hidden"
          aria-label="Мобильная навигация"
        >
          <ul className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex h-13 items-center border-b border-graphite-800 py-3.5 text-base font-medium text-graphite-200"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="py-4">
              <PhoneLink place="mobile-menu" className="text-xl font-bold text-white" />
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
