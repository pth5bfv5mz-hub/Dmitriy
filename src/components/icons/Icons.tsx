/**
 * Набор иконок — инлайновый SVG вместо иконочного шрифта или библиотеки.
 * Ноль зависимостей, ноль дополнительных запросов, идеально масштабируется.
 * Все иконки в одной сетке 24×24 и наследуют currentColor.
 */

type IconProps = {
  className?: string;
  /** Иконки декоративные по умолчанию и скрыты от скринридеров. */
  title?: string;
};

const base = "h-6 w-6 shrink-0";

function svgProps({ className, title }: IconProps) {
  return {
    className: className ?? base,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": title ? undefined : (true as const),
    role: title ? ("img" as const) : undefined,
  };
}

export function IconPhone(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      {p.title && <title>{p.title}</title>}
      <path d="M6.5 3h-2A1.5 1.5 0 0 0 3 4.6C3 13.1 10.9 21 19.4 21A1.5 1.5 0 0 0 21 19.5v-2a1 1 0 0 0-.8-1l-3.3-.7a1 1 0 0 0-1 .4l-1 1.3a13.6 13.6 0 0 1-5.4-5.4l1.3-1a1 1 0 0 0 .4-1l-.7-3.3a1 1 0 0 0-1-.8Z" />
    </svg>
  );
}

export function IconScale(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      {p.title && <title>{p.title}</title>}
      <path d="M12 3v18M7 21h10M4 7h16M7 7l-3 6a3 3 0 0 0 6 0L7 7ZM17 7l-3 6a3 3 0 0 0 6 0l-3-6Z" />
      <path d="M12 5.5 4 7M12 5.5 20 7" />
    </svg>
  );
}

export function IconTruck(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      {p.title && <title>{p.title}</title>}
      <path d="M2 6.5h11v9H2zM13 9.5h4l3 3.2v2.8h-7z" />
      <circle cx="6.5" cy="17.5" r="2" />
      <circle cx="17" cy="17.5" r="2" />
      <path d="M8.5 17.5H15" />
    </svg>
  );
}

export function IconCash(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      {p.title && <title>{p.title}</title>}
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M6 9.5v5M18 9.5v5" />
    </svg>
  );
}

export function IconCamera(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      {p.title && <title>{p.title}</title>}
      <path d="M3 8.5h3.2l1.4-2.2h8.8l1.4 2.2H21a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13.5" r="3.4" />
    </svg>
  );
}

export function IconClipboard(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      {p.title && <title>{p.title}</title>}
      <path d="M9 4h6v2.5H9zM7 5.5H5.5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-13a1 1 0 0 0-1-1H17" />
      <path d="M8.5 11h7M8.5 14.5h7M8.5 18h4" />
    </svg>
  );
}

export function IconClock(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      {p.title && <title>{p.title}</title>}
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.2 2" />
    </svg>
  );
}

export function IconPin(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      {p.title && <title>{p.title}</title>}
      <path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

export function IconShield(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      {p.title && <title>{p.title}</title>}
      <path d="M12 3 5 5.8v5.4c0 4.4 3 8.3 7 9.8 4-1.5 7-5.4 7-9.8V5.8L12 3Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </svg>
  );
}

export function IconCheck(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      {p.title && <title>{p.title}</title>}
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

export function IconCut(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      {p.title && <title>{p.title}</title>}
      <circle cx="6" cy="18" r="2.4" />
      <circle cx="18" cy="18" r="2.4" />
      <path d="M7.7 16.3 18.5 4.5M16.3 16.3 5.5 4.5" />
    </svg>
  );
}

export function IconBuilding(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      {p.title && <title>{p.title}</title>}
      <path d="M3.5 21V6.5l7-3.5v18M10.5 9.5h10V21M3.5 21h17" />
      <path d="M13.5 13h1.5M17 13h1.5M13.5 16.5h1.5M17 16.5h1.5M6 9.5h1.5M6 13h1.5" />
    </svg>
  );
}

export function IconHome(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      {p.title && <title>{p.title}</title>}
      <path d="M3.5 10.5 12 3.5l8.5 7M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}

export function IconCrane(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      {p.title && <title>{p.title}</title>}
      <path d="M4 21V4h13M4 4l6 5M17 4v4M17 8l-3 2.5M14 10.5V16" />
      <path d="M11.5 16h5v3.5h-5z" />
    </svg>
  );
}

export function IconChevron(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      {p.title && <title>{p.title}</title>}
      <path d="m7 10 5 5 5-5" />
    </svg>
  );
}

export function IconArrowRight(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      {p.title && <title>{p.title}</title>}
      <path d="M4.5 12h15M14 6.5l5.5 5.5L14 17.5" />
    </svg>
  );
}

export function IconWhatsApp(p: IconProps) {
  return (
    <svg
      className={p.className ?? base}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden={p.title ? undefined : true}
      role={p.title ? "img" : undefined}
    >
      {p.title && <title>{p.title}</title>}
      <path d="M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 1.94.53 3.75 1.45 5.3L2 22.4l5.4-1.6a9.8 9.8 0 0 0 4.64 1.18h.01c5.43 0 9.84-4.4 9.84-9.84S17.47 2 12.04 2Zm5.74 13.9c-.24.68-1.4 1.3-1.94 1.34-.5.05-.97.23-3.26-.68-2.74-1.08-4.47-3.9-4.6-4.08-.14-.18-1.1-1.46-1.1-2.78 0-1.32.7-1.97.94-2.24.25-.27.54-.34.72-.34l.52.01c.17 0 .4-.06.62.48l.85 2.06c.07.14.12.31.02.5-.1.18-.14.29-.28.45l-.42.49c-.14.14-.28.3-.12.58.16.28.71 1.17 1.52 1.9 1.05.93 1.93 1.22 2.2 1.36.28.14.44.12.6-.07l.86-1c.2-.24.36-.19.6-.1l1.72.81c.25.12.41.18.47.28.07.1.07.6-.17 1.28Z" />
    </svg>
  );
}

export function IconTelegram(p: IconProps) {
  return (
    <svg
      className={p.className ?? base}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden={p.title ? undefined : true}
      role={p.title ? "img" : undefined}
    >
      {p.title && <title>{p.title}</title>}
      <path d="M21.6 4.3 3.2 11.4c-1.05.4-1.04 1 .1 1.34l4.5 1.4 1.75 5.35c.21.58.11.81.72.81.47 0 .68-.21.94-.47l2.27-2.2 4.72 3.5c.87.48 1.5.23 1.72-.8l3.1-14.66c.32-1.27-.48-1.84-1.42-1.4Zm-12.1 9.6 10.2-6.44c.5-.3.96-.14.58.2l-8.73 7.9-.34 3.63-1.7-5.3Z" />
    </svg>
  );
}

export function IconSpark(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      {p.title && <title>{p.title}</title>}
      <path d="M13 2 5 13.5h5.5L10 22l8-11.5h-5.5L13 2Z" />
    </svg>
  );
}
