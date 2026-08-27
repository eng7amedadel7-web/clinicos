let brandIdCounter = 0;

export function BrandMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  const uid = `bm${++brandIdCounter}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Meruna"
    >
      <defs>
        <linearGradient id={`${uid}-a`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b7cfe3" />
          <stop offset="1" stopColor="#2a4a6b" />
        </linearGradient>
        <linearGradient id={`${uid}-b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9fc0da" />
          <stop offset="1" stopColor="#1d3a5a" />
        </linearGradient>
        <linearGradient id={`${uid}-c`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fb4d2" />
          <stop offset="1" stopColor="#16324e" />
        </linearGradient>
        <linearGradient id={`${uid}-d`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7ea6c8" />
          <stop offset="1" stopColor="#142e48" />
        </linearGradient>
      </defs>
      <path d="M28.5 28 C34 30.5 42 37 48.5 43.5 C44 48.5 37 49.5 32.5 45.5 C28.5 41.5 27.5 33.5 28.5 28 Z" fill={`url(#${uid}-a)`} />
      <path d="M69.5 28 C70.5 35 68 41.5 62 46.5 L48 56 C44.5 58.3 41.5 57 42.5 53.8 L44.5 51 C51 43 60.5 33.5 69.5 28 Z" fill={`url(#${uid}-b)`} />
      <path d="M27.5 42 C36 49 38.5 65 30.5 76.5 L27.5 77.5 Z" fill={`url(#${uid}-c)`} />
      <path d="M68.5 42 C60 49 57.5 65 65.5 76.5 L68.5 77.5 Z" fill={`url(#${uid}-d)`} />
    </svg>
  );
}

export function BrandLockup({ markSize = 30, className = "", textClassName = "" }: { markSize?: number; className?: string; textClassName?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <BrandMark size={markSize} />
      <strong className={`text-lg font-extrabold tracking-[0.14em] ${textClassName}`}>MERUNA</strong>
    </span>
  );
}
