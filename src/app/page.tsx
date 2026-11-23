import Link from "next/link";
import { CompanyMark, Logo, Mark } from "@/components/brand";
import { InView } from "@/components/motion";
import { Hero } from "./hero";

export default function Landing() {
  return (
    <div className="overflow-hidden bg-paper text-ink">
      <header>
        <div className="mx-auto flex min-h-[76px] max-w-[1200px] flex-wrap items-center gap-x-10 gap-y-3 px-6">
          <Logo />
          <nav aria-label="Main" className="flex flex-1 flex-wrap justify-end gap-x-6 gap-y-1" style={{ flexBasis: 300 }}>
            <Link href="/schools" className="text-muted no-underline hover:text-ink" style={{ fontSize: 15, fontWeight: 500 }}>
              For schools
            </Link>
            <Link href="/employers" className="text-muted no-underline hover:text-ink" style={{ fontSize: 15, fontWeight: 500 }}>
              For employers
            </Link>
            <Link href="/sign-in" className="text-ink no-underline" style={{ fontSize: 15, fontWeight: 600 }}>
              Log in
            </Link>
          </nav>
        </div>
      </header>

      <Hero />

      <section aria-labelledby="how" style={{ background: "var(--surface)" }}>
        <div className="mx-auto flex max-w-[1200px] flex-col gap-12 px-6 py-24">
          <InView>
            <h2 id="how" className="display m-0" style={{ fontSize: "clamp(32px,4vw,52px)", lineHeight: 1 }}>
              How it works
            </h2>
          </InView>
          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(300px,100%),1fr))" }}>
            <InView i={1}>
              <figure className="m-0 flex flex-col gap-4">
                <div className="flex min-h-[240px] flex-col gap-2 rounded-xl bg-paper p-5">
                  <Bubble side="left">What did you build for your capstone?</Bubble>
                  <Bubble side="right">Inventory system para sa canteen. Ako sa database.</Bubble>
                  <Bubble side="left">Added to your resume.</Bubble>
                </div>
                <figcaption style={{ fontSize: 16, fontWeight: 600 }}>Answer questions in English or Filipino.</figcaption>
              </figure>
            </InView>
            <InView i={2}>
              <figure className="m-0 flex flex-col gap-4">
                <div className="flex min-h-[240px] flex-col gap-2 rounded-xl bg-paper p-6">
                  <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em" }}>Bea Santos</span>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>BS Information Technology</span>
                  <span style={{ height: 2, background: "var(--ink)", margin: "4px 0" }} />
                  <span style={{ fontSize: 15, fontWeight: 600 }}>Canteen inventory system</span>
                  <span style={{ fontSize: 14, color: "var(--muted)" }}>Designed the database for a four-person team.</span>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>Treasurer, IT Society</span>
                  <span style={{ fontSize: 14, color: "var(--muted)" }}>Managed dues for 120 members.</span>
                </div>
                <figcaption style={{ fontSize: 16, fontWeight: 600 }}>Sync turns your answers into a resume.</figcaption>
              </figure>
            </InView>
            <InView i={3}>
              <figure className="m-0 flex flex-col gap-4">
                <div className="flex min-h-[240px] flex-col gap-3 rounded-xl bg-paper p-6">
                  <div className="flex items-center gap-3">
                    <CompanyMark logo="briefcase" bg="var(--soft)" size={44} glyph={22} />
                    <span className="flex flex-col gap-0.5">
                      <span style={{ fontWeight: 600 }}>Data intern</span>
                      <span style={{ fontSize: 14, color: "var(--accent)", fontWeight: 600 }}>Verified company</span>
                    </span>
                  </div>
                  <span style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.5 }}>See the allowance, hours and location before you apply.</span>
                  <span className="btn btn-p mt-auto" aria-hidden="true">
                    Apply
                  </span>
                </div>
                <figcaption style={{ fontSize: 16, fontWeight: 600 }}>Apply to verified companies.</figcaption>
              </figure>
            </InView>
          </div>
        </div>
      </section>

      <section aria-labelledby="safety-h">
        <div className="mx-auto grid max-w-[1200px] items-end gap-12 px-6 py-[120px]" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(420px,100%),1fr))" }}>
          <InView>
            <h2 id="safety-h" className="display m-0" style={{ fontSize: "clamp(44px,6vw,84px)" }}>
              We verify
              <br />
              every company.
            </h2>
          </InView>
          <InView i={1}>
            <div className="flex max-w-[440px] flex-col gap-4" style={{ fontSize: 16, lineHeight: 1.5, color: "var(--muted)" }}>
              <p className="m-0">Companies must show SEC or DTI registration, a work email and a phone number before they can post.</p>
              <p className="m-0">Messages stay on Unisync. We block anyone who asks for money.</p>
              <p className="m-0">We don&apos;t filter by age, gender or photo.</p>
            </div>
          </InView>
        </div>
      </section>

      <section aria-labelledby="cta" className="px-6 pb-24">
        <InView>
          <div className="mx-auto flex max-w-[1144px] flex-col items-center gap-5 rounded-xl px-12 py-20 text-center" style={{ background: "var(--lilac-soft)" }}>
            <h2 id="cta" className="display m-0" style={{ fontSize: "clamp(36px,4.8vw,64px)", lineHeight: 1 }}>
              Start your resume.
            </h2>
            <Link href="/start" className="btn btn-p">
              Build my resume <span aria-hidden="true">→</span>
            </Link>
            <span style={{ fontSize: 14, color: "var(--muted)" }}>Free for students. No account needed to start.</span>
          </div>
        </InView>
      </section>

      <footer style={{ borderTop: "1px solid var(--line)" }}>
        <div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-4 p-6" style={{ fontSize: 14, color: "var(--muted)" }}>
          <span className="flex items-center gap-2">
            <Mark size={18} color="var(--muted)" /> Made for students in the Philippines.
          </span>
          <nav aria-label="Footer" className="flex gap-6">
            <Link href="/schools" className="text-muted no-underline hover:text-ink">
              Schools
            </Link>
            <Link href="/employers" className="text-muted no-underline hover:text-ink">
              Employers
            </Link>
            <a href="#safety-h" className="text-muted no-underline hover:text-ink">
              Safety
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function Bubble({ side, children }: { side: "left" | "right"; children: React.ReactNode }) {
  const left = side === "left";
  return (
    <div
      style={{
        alignSelf: left ? "flex-start" : "flex-end",
        maxWidth: "88%",
        background: left ? "var(--surface)" : "var(--primary)",
        borderRadius: left ? "6px 18px 18px 18px" : "12px 6px 18px 18px",
        padding: 12,
        fontSize: 15,
        lineHeight: 1.45,
      }}
    >
      {children}
    </div>
  );
}
