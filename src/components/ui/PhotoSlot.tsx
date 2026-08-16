import Image from "next/image";
import { photos, type PhotoKey } from "@/config/media";

/**
 * Показывает фотографию владельца, если путь указан в src/config/media.ts.
 * Пока фото нет — рисует графическую заглушку «в фактуре сайта»,
 * чтобы макет выглядел цельным, а не сломанным.
 */
export function PhotoSlot({
  slot,
  className = "",
  priority = false,
  sizes = "100vw",
}: {
  slot: PhotoKey;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const photo = photos[slot];

  if (photo.src) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      </div>
    );
  }

  return <PhotoPlaceholder label={photo.alt} className={className} />;
}

/**
 * Заглушка: слои металлолома, нарисованные вектором. Весит меньше килобайта,
 * выглядит как часть дизайна и не притворяется настоящей фотографией.
 */
export function PhotoPlaceholder({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div
      className={`texture-brushed relative overflow-hidden bg-graphite-800 ${className}`}
      role="img"
      aria-label={label}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="ps-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#242a30" />
            <stop offset="100%" stopColor="#171b1f" />
          </linearGradient>
          <linearGradient id="ps-heap" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4a545e" />
            <stop offset="100%" stopColor="#2b3238" />
          </linearGradient>
        </defs>

        <rect width="400" height="300" fill="url(#ps-sky)" />

        {/* дальний план — силуэт ангара */}
        <path d="M0 168h150v-38l40-22 40 22v38h170v132H0z" fill="#1b2025" />
        <path d="M150 130h80v10h-80z" fill="#20262c" />

        {/* куча лома */}
        <path d="M20 300s34-72 74-84 62 22 96 6 58-40 96-24 74 102 74 102z" fill="url(#ps-heap)" />

        {/* отдельные балки и трубы */}
        <g stroke="#5f6a75" strokeWidth="4" strokeLinecap="round" opacity="0.9">
          <path d="M62 268 130 226" />
          <path d="M104 284 168 244" />
          <path d="M196 250 258 268" />
          <path d="M240 232 300 254" />
          <path d="M292 268 344 246" />
        </g>
        <g stroke="#39424b" strokeWidth="7" strokeLinecap="round">
          <path d="M78 290 148 256" />
          <path d="M214 274 282 288" />
        </g>

        {/* искра акцента */}
        <circle cx="330" cy="70" r="46" fill="#f05a0f" opacity="0.1" />
      </svg>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-graphite-950/90 to-transparent p-3">
        <p className="text-[11px] leading-tight text-graphite-400">
          Здесь будет фотография компании
        </p>
      </div>
    </div>
  );
}
