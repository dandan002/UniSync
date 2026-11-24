import Link from "next/link";

const RAYS = [0, 45, 90, 135, 180, 225, 270, 315];

export function Mark({ size = 28, color = "currentColor", dot = "#A99BF0", className }: { size?: number; color?: string; dot?: string; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <g fill={color}>
        {RAYS.map((r) => (
          <rect key={r} x="14.5" y="1" width="3" height="7" rx="1.5" transform={r ? `rotate(${r} 16 16)` : undefined} />
        ))}
      </g>
      <circle cx="16" cy="16" r="5" fill={dot} />
    </svg>
  );
}

export function Logo({ href = "/", size = 28, text = 20 }: { href?: string; size?: number; text?: number }) {
  return (
    <Link href={href} aria-label="Unisync home" className="flex items-center gap-2 text-ink no-underline hover:text-ink">
      <Mark size={size} />
      <span style={{ fontSize: text, fontWeight: 600, letterSpacing: "-0.01em" }}>unisync</span>
    </Link>
  );
}

// Placeholder company marks from the mockups, keyed by companies.logo.
export function CompanyMark({ logo, bg, size = 52, glyph = 26 }: { logo: string; bg: string; size?: number; glyph?: number }) {
  return (
    <span
      className="flex flex-none items-center justify-center"
      style={{ width: size, height: size, borderRadius: size >= 52 ? 10 : 13, background: bg }}
      aria-hidden="true"
    >
      <Glyph logo={logo} size={glyph} />
    </span>
  );
}

function Glyph({ logo, size }: { logo: string; size: number }) {
  switch (logo) {
    case "kalye":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#6A5DC2" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 18l5-6-5-6M12 18l5-6-5-6" />
        </svg>
      );
    case "mabuhay":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path d="M5 19C5 10 11 5 20 4c-1 9-6 15-15 15z" fill="#4A55A8" />
          <path d="M5 19l8-8" stroke="#E8EBFF" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "banaba":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <g fill="#6A5DC2">
            <circle cx="12" cy="6.5" r="4.5" />
            <circle cx="17.5" cy="12" r="4.5" />
            <circle cx="12" cy="17.5" r="4.5" />
            <circle cx="6.5" cy="12" r="4.5" />
          </g>
          <circle cx="12" cy="12" r="2.6" fill="#F1EDFF" />
        </svg>
      );
    case "tanglaw":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <path d="M12 3l3 6 6 3-6 3-3 6-3-6-6-3 6-3z" fill="#7C88DC" />
        </svg>
      );
    case "halo":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24">
          <circle cx="12" cy="7" r="4" fill="#7C88DC" />
          <circle cx="12" cy="13" r="4" fill="#B8C1FA" />
          <path d="M6 15h12l-2 6H8z" fill="#7C88DC" />
        </svg>
      );
    case "pulo":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#6A5DC2" strokeWidth="2.4" strokeLinecap="round">
          <path d="M3 10c3-3 6 3 9 0s6 3 9 0M3 16c3-3 6 3 9 0s6 3 9 0" />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#7C88DC" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
      );
  }
}

export function Verified({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label="Verified">
      <circle cx="12" cy="12" r="10" fill="#7C88DC" />
      <path d="M8 12.5l2.6 2.6L16 9.7" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Avatar({ name, size = 38, bg = "var(--soft)", fg = "var(--accent)" }: { name: string; size?: number; bg?: string; fg?: string }) {
  const ini = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <span
      className="flex flex-none items-center justify-center rounded-full"
      style={{ width: size, height: size, background: bg, color: fg, fontSize: size > 50 ? 20 : 13, fontWeight: 500 }}
      aria-hidden="true"
    >
      {ini || "?"}
    </span>
  );
}

export function Close() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function Arrow() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
