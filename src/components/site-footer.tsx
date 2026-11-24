import Link from "next/link";
import { Mark } from "@/components/brand";

// Footer for the public pages.
export function SiteFooter({ extra }: { extra?: Array<{ href: string; label: string }> }) {
  const links = [
    { href: "/schools", label: "Schools" },
    { href: "/employers", label: "Employers" },
    ...(extra ?? []),
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
  ];
  return (
    <footer style={{ borderTop: "1px solid var(--line)" }}>
      <div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-4 p-6" style={{ fontSize: 14, color: "var(--muted)" }}>
        <span className="flex items-center gap-2">
          <Mark size={18} color="var(--muted)" /> Made for students in the Philippines.
        </span>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          {links.map((l) =>
            l.href.startsWith("#") ? (
              <a key={l.href} href={l.href} className="text-muted no-underline hover:text-ink">
                {l.label}
              </a>
            ) : (
              <Link key={l.href} href={l.href} className="text-muted no-underline hover:text-ink">
                {l.label}
              </Link>
            ),
          )}
        </nav>
      </div>
    </footer>
  );
}

// "By continuing, you agree to…" under sign-up and submit buttons.
export function AgreeLine({ action, className = "" }: { action: string; className?: string }) {
  return (
    <span className={className} style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
      By {action}, you agree to the{" "}
      <Link href="/terms" target="_blank">
        Terms of Service
      </Link>{" "}
      and confirm you&apos;ve read the{" "}
      <Link href="/privacy" target="_blank">
        Privacy Policy
      </Link>
      .
    </span>
  );
}
