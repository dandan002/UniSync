import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand";
import { SiteFooter } from "@/components/site-footer";
import { LEGAL } from "@/lib/legal";

export type LegalSection = { id: string; heading: string; body: ReactNode };

// Long-form layout for the privacy policy and terms: a contents list, then
// numbered sections with anchors.
export function LegalPage({ title, intro, sections }: { title: string; intro: ReactNode; sections: LegalSection[] }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <header>
        <div className="mx-auto flex min-h-[76px] max-w-[1200px] items-center gap-10 px-6">
          <Logo />
          <span className="flex-1" />
          <Link href="/sign-in" className="text-ink no-underline" style={{ fontSize: 15, fontWeight: 600 }}>
            Log in
          </Link>
        </div>
      </header>
      <main className="legal mx-auto flex w-full max-w-[760px] flex-1 flex-col gap-8 px-6 pb-24 pt-10" style={{ boxSizing: "border-box" }}>
        <div className="flex flex-col gap-3">
          <h1 className="display m-0" style={{ fontSize: "clamp(36px,5vw,56px)" }}>
            {title}
          </h1>
          <span style={{ fontSize: 15, color: "var(--muted)" }}>Effective {LEGAL.effective}</span>
        </div>
        <div className="flex flex-col gap-4">{intro}</div>
        <nav aria-label="On this page" className="panel flex flex-col gap-2 p-5">
          <span className="eyebrow">On this page</span>
          <ol className="m-0 grid gap-x-6 gap-y-1 pl-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(260px,100%),1fr))", fontSize: 15 }}>
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="no-underline hover:underline">
                  {s.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        {sections.map((s, i) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="flex flex-col gap-4" style={{ scrollMarginTop: 24 }}>
            <h2 id={`${s.id}-h`} className="m-0" style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.015em" }}>
              {i + 1}. {s.heading}
            </h2>
            {s.body}
          </section>
        ))}
      </main>
      <SiteFooter />
    </div>
  );
}

// The privacy contact, or a visible note that it hasn't been set.
export function ContactEmail() {
  if (!LEGAL.email) {
    return <span style={{ color: "var(--lilac-ink)", fontWeight: 600 }}>(contact email not set: add NEXT_PUBLIC_LEGAL_EMAIL)</span>;
  }
  return <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>;
}
