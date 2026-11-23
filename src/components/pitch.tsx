import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand";
import { InView, Reveal } from "@/components/motion";

// Short audience pages linked from the landing nav.
export function Pitch({ title, lead, cta, points, children }: { title: ReactNode; lead: string; cta: { href: string; label: string }; points: Array<{ t: string; d: string }>; children?: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header>
        <div className="mx-auto flex min-h-[76px] max-w-[1200px] items-center gap-10 px-6">
          <Logo />
          <span className="flex-1" />
          <Link href="/sign-in" className="text-ink no-underline" style={{ fontSize: 15, fontWeight: 600 }}>
            Log in
          </Link>
        </div>
      </header>
      <section className="mx-auto flex max-w-[1200px] flex-col gap-6 px-6 pb-20 pt-12">
        <Reveal i={0} blur>
          <h1 className="display m-0 max-w-[900px]" style={{ fontSize: "clamp(44px,6vw,80px)" }}>
            {title}
          </h1>
        </Reveal>
        <Reveal i={1}>
          <p className="m-0 max-w-[560px]" style={{ fontSize: 18, lineHeight: 1.5, color: "var(--muted)" }}>
            {lead}
          </p>
        </Reveal>
        <Reveal i={2}>
          <Link href={cta.href} className="btn btn-p">
            {cta.label} <span aria-hidden="true">→</span>
          </Link>
        </Reveal>
      </section>
      <section style={{ background: "var(--surface)" }}>
        <div className="mx-auto grid max-w-[1200px] gap-5 px-6 py-20" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(280px,100%),1fr))" }}>
          {points.map((p, i) => (
            <InView key={p.t} i={i}>
              <div className="flex h-full flex-col gap-2 rounded-xl bg-paper p-6">
                <span style={{ fontSize: 18, fontWeight: 600 }}>{p.t}</span>
                <span style={{ fontSize: 15, lineHeight: 1.55, color: "var(--muted)" }}>{p.d}</span>
              </div>
            </InView>
          ))}
        </div>
      </section>
      {children}
    </div>
  );
}
