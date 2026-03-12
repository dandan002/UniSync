import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// ─── Icons ────────────────────────────────────────────────────────────────────

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638l-3.96-3.96a.75.75 0 1 1 1.06-1.06l5.25 5.25a.75.75 0 0 1 0 1.06l-5.25 5.25a.75.75 0 1 1-1.06-1.06l3.96-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0-6a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z" clipRule="evenodd" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
    </svg>
  );
}

// ─── Paper background ─────────────────────────────────────────────────────────

function PaperBg() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.4]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="lines" x="0" y="0" width="1" height="32" patternUnits="userSpaceOnUse">
            <line x1="0" y1="31.5" x2="10000" y2="31.5" stroke="oklch(0.7 0 0)" strokeWidth="0.5" />
          </pattern>
          <linearGradient id="linefade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="70%" stopColor="white" stopOpacity="0" />
            <stop offset="100%" stopColor="white" stopOpacity="1" />
          </linearGradient>
          <mask id="linemask">
            <rect width="100%" height="100%" fill="white" />
            <rect width="100%" height="100%" fill="url(#linefade)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#lines)" mask="url(#linemask)" />
      </svg>
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: LinkedInIcon,
    label: "01.",
    title: "Import from anywhere",
    description:
      "Connect LinkedIn, GitHub, or upload an existing resume. We parse and unify it all into one structured profile — no copy-pasting required.",
  },
  {
    icon: FileTextIcon,
    label: "02.",
    title: "Refine with AI",
    description:
      "Rewrite bullets for impact, quantify achievements, and tailor language to specific job descriptions — all within the editor.",
  },
  {
    icon: FileTextIcon,
    label: "03.",
    title: "Export LaTeX PDFs",
    description:
      "Generate typographically precise PDFs from battle-tested LaTeX templates. ATS-friendly, professionally formatted, ready to send.",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen bg-background">

      {/* ── Masthead bar ─────────────────────────────────────────────────── */}
      <div className="border-b-2 border-foreground">
        <div className="mx-auto max-w-5xl px-6 py-2 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Resume Builder
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Early Access — 2025
          </span>
        </div>
      </div>

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
          <span className="font-display text-xl font-700 tracking-tight text-foreground">
            UniSync
          </span>
          <div className="flex items-center gap-1">
            <Show when="signed-out">
              <SignInButton>
                <Button variant="ghost" size="sm" className="text-muted-foreground text-xs">
                  Log in
                </Button>
              </SignInButton>
              <SignUpButton>
                <Button size="sm" className="rounded-sm text-xs font-semibold">
                  Get started free
                </Button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "size-7",
                  },
                }}
              />
            </Show>
          </div>
        </nav>
      </header>

      <main>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-border">
          <PaperBg />
          <div className="relative mx-auto max-w-5xl px-6 pt-20 pb-24 lg:pt-28 lg:pb-32">

            {/* Overline label */}
            <div className="animate-fade-up mb-8 flex items-center gap-3">
              <div className="h-px w-8 bg-foreground" />
              <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                The last resume tool you&apos;ll need
              </span>
            </div>

            {/* Main heading */}
            <h1 className="animate-fade-up stagger-1 font-display text-[clamp(3rem,8vw,6rem)] font-800 leading-[0.96] tracking-tight text-foreground">
              Your whole career,
              <br />
              <em className="italic font-400">one profile.</em>
            </h1>

            {/* Sub copy + CTA side by side on large screens */}
            <div className="animate-fade-up stagger-2 mt-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground lg:max-w-xs">
                Import from LinkedIn, GitHub, and existing resumes. Edit with
                AI. Export pixel-perfect LaTeX PDFs tailored for every role.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end xl:flex-row">
                <SignUpButton>
                  <Button size="lg" className="rounded-sm h-10 gap-2 px-5 font-semibold text-sm">
                    Start for free
                    <ArrowRight className="size-3.5" />
                  </Button>
                </SignUpButton>
                <Button variant="outline" size="lg" className="rounded-sm h-10 px-5 text-sm">
                  See how it works
                </Button>
              </div>
            </div>

          </div>
        </section>

        {/* ── Source strip ─────────────────────────────────────────────────── */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-5xl px-6 py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">
              Import from
            </span>
            <div className="flex items-center gap-8">
              {[
                { icon: LinkedInIcon, label: "LinkedIn" },
                { icon: GitHubIcon, label: "GitHub" },
                { icon: FileTextIcon, label: "PDF / DOCX" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-muted-foreground">
                  <Icon className="size-4" />
                  <span className="text-xs font-medium">{label}</span>
                </div>
              ))}
            </div>
            <Badge variant="outline" className="rounded-sm text-[10px] tracking-widest uppercase font-normal border-border text-muted-foreground w-fit">
              More coming soon
            </Badge>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────────────────────── */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-5xl px-6 py-16 lg:py-20">

            {/* Section header */}
            <div className="mb-12 flex items-baseline justify-between border-b border-border pb-4">
              <h2 className="animate-fade-up font-display text-2xl font-700 tracking-tight text-foreground">
                How it works
              </h2>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Three features
              </span>
            </div>

            <div className="grid gap-px border border-border bg-border md:grid-cols-3">
              {features.map((f) => (
                <Card
                  key={f.title}
                  className="animate-fade-up rounded-none border-0 bg-background p-0 shadow-none"
                >
                  <CardHeader className="px-6 pt-6 pb-4">
                    <span className="text-xs text-muted-foreground mb-4 block font-mono">
                      {f.label}
                    </span>
                    <CardTitle className="font-display text-lg font-600 leading-snug">
                      {f.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-8">
                    <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                      {f.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>

          </div>
        </section>

        {/* ── Process ──────────────────────────────────────────────────────── */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-5xl px-6 py-16 lg:py-20">

            <div className="mb-12 flex items-baseline justify-between border-b border-border pb-4">
              <h2 className="animate-fade-up font-display text-2xl font-700 tracking-tight text-foreground">
                The process
              </h2>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Start to finish
              </span>
            </div>

            <div className="space-y-0">
              {[
                {
                  n: "I.",
                  title: "Connect your sources",
                  desc: "Link LinkedIn, paste your GitHub username, or upload an existing resume. We handle the extraction and structure it automatically.",
                },
                {
                  n: "II.",
                  title: "Build your unified profile",
                  desc: "Review imported data, fill in gaps, and use AI to polish your bullet points, summary, and skills.",
                },
                {
                  n: "III.",
                  title: "Export and apply",
                  desc: "Pick a LaTeX template, tailor it to the role, and download a print-ready PDF in seconds.",
                },
              ].map((step, i) => (
                <div
                  key={step.n}
                  className={`animate-fade-up stagger-${i + 1} flex gap-8 border-b border-border py-8 last:border-b-0`}
                >
                  <span className="font-display text-sm font-400 italic text-muted-foreground w-8 shrink-0 pt-0.5">
                    {step.n}
                  </span>
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:gap-16">
                    <h3 className="font-display text-base font-600 text-foreground sm:w-52 shrink-0">
                      {step.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-muted-foreground max-w-sm">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <section>
          <div className="mx-auto max-w-5xl px-6 py-16 lg:py-20">
            <div className="animate-fade-up flex flex-col gap-10 border border-foreground p-10 lg:flex-row lg:items-center lg:justify-between lg:p-14">
              <div>
                <h2 className="font-display text-3xl font-700 leading-tight tracking-tight text-foreground lg:text-4xl mb-4">
                  Ready to take control?
                </h2>
                <ul className="space-y-2">
                  {[
                    "Import from LinkedIn, GitHub & existing PDFs",
                    "AI-powered bullet point rewriting",
                    "LaTeX export — ATS-friendly templates",
                    "Free to start, no credit card required",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                      <CheckIcon className="size-3.5 shrink-0 text-foreground" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-2 lg:items-end shrink-0">
                <SignUpButton>
                  <Button size="lg" className="rounded-sm h-11 gap-2 px-6 font-semibold w-full lg:w-auto">
                    Get started free
                    <ArrowRight className="size-4" />
                  </Button>
                </SignUpButton>
                <span className="text-[10px] text-muted-foreground lg:text-right">
                  Takes 2 minutes to set up
                </span>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div className="border-t-2 border-foreground">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <span className="font-display text-sm font-600 text-foreground">UniSync</span>
          <div className="flex gap-5 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
            <a href="#" className="transition-colors hover:text-foreground">Privacy</a>
            <a href="#" className="transition-colors hover:text-foreground">Terms</a>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
