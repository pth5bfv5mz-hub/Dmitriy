/**
 * Визуальная метка категории металла.
 *
 * Вместо фотостока — векторные знаки в единой сетке: у каждого металла свой
 * цвет (медь — красная, латунь — жёлтая, нержавейка — стальная) и своя форма
 * (труба, профиль, катушка кабеля, аккумулятор). Узнаётся мгновенно, весит
 * ноль байт и не ломается на ретине.
 */

const PALETTE: Record<string, { from: string; to: string }> = {
  ferrous: { from: "#8b959f", to: "#4a545e" },
  copper: { from: "#e08a4e", to: "#a8501f" },
  aluminium: { from: "#c9d2d9", to: "#8a949d" },
  brass: { from: "#e3c268", to: "#a8862c" },
  bronze: { from: "#cf9a67", to: "#8d5a2f" },
  stainless: { from: "#d6dee4", to: "#7e8a94" },
  lead: { from: "#9aa3ad", to: "#5c6570" },
  cable: { from: "#e08a4e", to: "#6b4a34" },
  batteries: { from: "#6f7c88", to: "#39424b" },
  structures: { from: "#96a0aa", to: "#4f5860" },
  pipes: { from: "#8b959f", to: "#4a545e" },
  rebar: { from: "#9aa4ae", to: "#535c65" },
  equipment: { from: "#8f99a3", to: "#474f57" },
};

export function MetalMark({ id, className = "h-12 w-12" }: { id: string; className?: string }) {
  const colors = PALETTE[id] ?? PALETTE.ferrous;
  const gradientId = `mm-${id}`;

  return (
    <span
      className={`flex items-center justify-center rounded-xl border border-graphite-700 bg-graphite-900 ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" className="h-[62%] w-[62%]">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colors.from} />
            <stop offset="100%" stopColor={colors.to} />
          </linearGradient>
        </defs>
        <Shape id={id} fill={`url(#${gradientId})`} />
      </svg>
    </span>
  );
}

function Shape({ id, fill }: { id: string; fill: string }) {
  switch (id) {
    /* Катушка кабеля */
    case "cable":
      return (
        <g fill={fill}>
          <path d="M6 4h3v24H6zM23 4h3v24h-3z" />
          <path d="M9 12h14v3H9zM9 18h14v3H9z" />
        </g>
      );

    /* Аккумулятор */
    case "batteries":
      return (
        <g fill={fill}>
          <rect x="4" y="9" width="24" height="16" rx="2" />
          <rect x="8" y="5" width="5" height="4" rx="1" />
          <rect x="19" y="5" width="5" height="4" rx="1" />
        </g>
      );

    /* Трубы — торцы */
    case "pipes":
      return (
        <g fill={fill}>
          <circle cx="11" cy="11" r="7" />
          <circle cx="22" cy="17" r="6" />
          <circle cx="12" cy="23" r="5" />
          <circle cx="11" cy="11" r="3" fill="#171b1f" />
          <circle cx="22" cy="17" r="2.6" fill="#171b1f" />
          <circle cx="12" cy="23" r="2.2" fill="#171b1f" />
        </g>
      );

    /* Арматура — прутки */
    case "rebar":
      return (
        <g stroke={fill} strokeWidth="3.4" strokeLinecap="round" fill="none">
          <path d="M5 27 17 5M13 27 25 5M21 27 29 12" />
        </g>
      );

    /* Металлоконструкции — ферма */
    case "structures":
      return (
        <g stroke={fill} strokeWidth="2.6" fill="none" strokeLinejoin="round">
          <path d="M3 24h26M3 24 8 9h16l5 15" />
          <path d="M8 9 16 24 24 9M16 9v15" />
        </g>
      );

    /* Оборудование — шестерня */
    case "equipment":
      return (
        <g fill={fill}>
          <path d="M16 3.5 18.6 7a11 11 0 0 1 2.6 1l4-1.2 2.4 4.2-2.9 3a11 11 0 0 1 0 2.8l2.9 3-2.4 4.2-4-1.2a11 11 0 0 1-2.6 1L16 28.5 13.4 25a11 11 0 0 1-2.6-1l-4 1.2-2.4-4.2 2.9-3a11 11 0 0 1 0-2.8l-2.9-3 2.4-4.2 4 1.2a11 11 0 0 1 2.6-1L16 3.5Z" />
          <circle cx="16" cy="16" r="4.6" fill="#171b1f" />
        </g>
      );

    /* Профиль-уголок — алюминий и нержавейка */
    case "aluminium":
    case "stainless":
      return (
        <g fill={fill}>
          <path d="M5 5h6v16h16v6H5z" />
          <path d="M14 5h13v6H14z" opacity="0.55" />
        </g>
      );

    /* Слитки — свинец, бронза */
    case "lead":
    case "bronze":
      return (
        <g fill={fill}>
          <path d="M4 20h13l2.5 7H6.5z" />
          <path d="M14 11h13l2.5 7h-13z" opacity="0.8" />
          <path d="M9 4h11l2 6H11z" opacity="0.6" />
        </g>
      );

    /* Провод/шина — медь */
    case "copper":
      return (
        <g fill="none" stroke={fill} strokeWidth="3.2" strokeLinecap="round">
          <path d="M4 10c4 0 4 5 8 5s4-5 8-5 4 5 8 5" />
          <path d="M4 21c4 0 4 5 8 5s4-5 8-5 4 5 8 5" opacity="0.6" />
        </g>
      );

    /* Кран/вентиль — латунь */
    case "brass":
      return (
        <g fill={fill}>
          <rect x="4" y="13" width="24" height="6" rx="1.5" />
          <rect x="13" y="4" width="6" height="10" rx="1.5" />
          <rect x="8" y="2.5" width="16" height="3.5" rx="1.75" />
        </g>
      );

    /* Швеллер — чермет по умолчанию */
    default:
      return (
        <g fill={fill}>
          <path d="M4 5h7v22H4zM4 5h24v6H4zM4 21h24v6H4z" />
        </g>
      );
  }
}
