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

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M15.98 1.804a1 1 0 0 0-1.96 0l-.24 1.192a1 1 0 0 1-.784.785l-1.192.238a1 1 0 0 0 0 1.962l1.192.238a1 1 0 0 1 .785.785l.238 1.192a1 1 0 0 0 1.962 0l.238-1.192a1 1 0 0 1 .785-.785l1.192-.238a1 1 0 0 0 0-1.962l-1.192-.238a1 1 0 0 1-.785-.785l-.238-1.192ZM6.949 5.684a1 1 0 0 0-1.898 0l-.683 2.051a1 1 0 0 1-.633.633l-2.051.683a1 1 0 0 0 0 1.898l2.051.684a1 1 0 0 1 .633.632l.683 2.051a1 1 0 0 0 1.898 0l.683-2.051a1 1 0 0 1 .633-.633l2.051-.683a1 1 0 0 0 0-1.898l-2.051-.683a1 1 0 0 1-.633-.633L6.95 5.684ZM13.949 13.684a1 1 0 0 0-1.898 0l-.184.551a1 1 0 0 1-.632.633l-.551.183a1 1 0 0 0 0 1.898l.551.184a1 1 0 0 1 .633.632l.183.551a1 1 0 0 0 1.898 0l.184-.551a1 1 0 0 1 .632-.632l.551-.184a1 1 0 0 0 0-1.898l-.551-.183a1 1 0 0 1-.633-.633l-.183-.551Z" />
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

// ─── Background SVG ───────────────────────────────────────────────────────────

function HeroBg() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Dot grid */}
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="dots"
            x="0"
            y="0"
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1.5" cy="1.5" r="1.5" fill="oklch(0.7 0.04 260 / 0.35)" />
          </pattern>
          <radialGradient id="fade" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="100%" stopColor="white" stopOpacity="1" />
          </radialGradient>
          <mask id="dotmask">
            <rect width="100%" height="100%" fill="white" />
            <rect width="100%" height="100%" fill="url(#fade)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" mask="url(#dotmask)" />
      </svg>

      {/* Soft indigo glow top-right */}
      <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[80px]" />
      <div className="absolute top-20 left-1/3 h-[300px] w-[300px] rounded-full bg-primary/5 blur-[60px]" />
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: LinkedInIcon,
    title: "Import from anywhere",
    description:
      "Connect LinkedIn, GitHub, or upload an existing resume. We parse and unify it all into one clean profile — no copy-pasting required.",
  },
  {
    icon: SparkleIcon,
    title: "Refine with AI",
    description:
      "Rewrite bullets for impact, quantify achievements, and tailor your language to specific job descriptions — right in the editor.",
  },
  {
    icon: FileTextIcon,
    title: "Export LaTeX PDFs",
    description:
      "Generate typographically precise PDFs from proven LaTeX templates. ATS-friendly, professional, and ready to submit.",
  },
];

const steps = [
  {
    number: "1",
    title: "Connect your sources",
    description:
      "Link LinkedIn, paste your GitHub username, or upload an existing resume. We handle the extraction.",
  },
  {
    number: "2",
    title: "Build your profile",
    description:
      "Review your imported data, fill in gaps, and use AI to polish your bullet points and summary.",
  },
  {
    number: "3",
    title: "Export and apply",
    description:
      "Pick a template, tailor the resume to the role, and download a print-ready PDF in seconds.",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground leading-none">U</span>
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              UniSync
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              Log in
            </Button>
            <Button size="sm" className="font-semibold">
              Get started free
            </Button>
          </div>
        </nav>
      </header>

      <main>
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <HeroBg />
          <div className="relative mx-auto max-w-5xl px-6 pb-24 pt-24 text-center lg:pt-36">
            <div className="animate-fade-up">
              <Badge
                variant="secondary"
                className="mb-6 gap-1.5 px-3 py-1 text-xs font-medium"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                Now in early access
              </Badge>
            </div>

            <h1 className="animate-fade-up stagger-1 font-display text-5xl font-900 leading-[1.06] tracking-tight text-foreground sm:text-6xl lg:text-[4.5rem]">
              Your whole career,
              <br />
              <em className="not-italic text-primary">one profile.</em>
            </h1>

            <p className="animate-fade-up stagger-2 mx-auto mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground lg:text-base">
              Import from LinkedIn, GitHub, and existing resumes. Edit with AI.
              Export pixel-perfect LaTeX PDFs tailored for every role.
            </p>

            <div className="animate-fade-up stagger-3 mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" className="h-11 gap-2 px-6 font-semibold">
                Start for free
                <ArrowRight className="size-4" />
              </Button>
              <Button variant="outline" size="lg" className="h-11 px-6">
                See how it works
              </Button>
            </div>

            <p className="animate-fade-up stagger-4 mt-4 text-sm text-muted-foreground">
              No credit card required · Takes 2 minutes to set up
            </p>
          </div>
        </section>

        <Separator className="mx-auto max-w-5xl px-6" />

        {/* ── Source logos strip ─────────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-6 py-10">
          <p className="animate-fade-up mb-6 text-center text-sm text-muted-foreground font-medium">
            Import from your existing accounts
          </p>
          <div className="animate-fade-up stagger-1 flex items-center justify-center gap-10 opacity-60">
            <div className="flex items-center gap-2 text-foreground">
              <LinkedInIcon className="size-5" />
              <span className="font-semibold text-sm">LinkedIn</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <GitHubIcon className="size-5" />
              <span className="font-semibold text-sm">GitHub</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <FileTextIcon className="size-5" />
              <span className="font-semibold text-sm">PDF / DOCX</span>
            </div>
          </div>
        </section>

        <Separator className="mx-auto max-w-5xl px-6" />

        {/* ── Features ──────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-6 py-20 lg:py-28">
          <div className="mb-14 text-center">
            <h2 className="animate-fade-up font-display text-3xl font-700 leading-tight tracking-tight text-foreground sm:text-4xl">
              Everything you need,{" "}
              <span className="italic text-muted-foreground font-400">nothing you don&apos;t</span>
            </h2>
            <p className="animate-fade-up stagger-1 mt-3 text-xs text-muted-foreground max-w-lg mx-auto tracking-wide uppercase">
              A focused tool built for one job: helping you put your best foot
              forward on every application.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {features.map((feature, i) => (
              <Card
                key={feature.title}
                className={`animate-fade-up stagger-${i + 2} border-border/60 shadow-sm transition-shadow hover:shadow-md`}
              >
                <CardHeader className="pb-3">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                    <feature.icon className="size-5 text-primary" />
                  </div>
                  <CardTitle className="font-display text-lg font-600 leading-snug">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs leading-relaxed tracking-wide">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator className="mx-auto max-w-5xl px-6" />

        {/* ── How it works ──────────────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-6 py-20 lg:py-28">
          <div className="mb-14 text-center">
            <h2 className="animate-fade-up font-display text-3xl font-700 leading-tight tracking-tight text-foreground sm:text-4xl">
              Three steps to your{" "}
              <span className="italic">best resume</span>
            </h2>
            <p className="animate-fade-up stagger-1 mt-3 text-xs text-muted-foreground max-w-md mx-auto tracking-wide uppercase">
              Stop rewriting from scratch for every application. Build once,
              tailor endlessly.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className={`animate-fade-up stagger-${i + 2} flex flex-col gap-4`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary/20 bg-secondary text-sm font-bold text-primary">
                  {step.number}
                </div>
                <div>
                  <h3 className="font-display font-600 text-base leading-snug text-foreground mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-xs leading-relaxed tracking-wide text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Separator className="mx-auto max-w-5xl px-6" />

        {/* ── CTA ───────────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-6 py-20 lg:py-28">
          <Card className="animate-fade-up border-primary/10 bg-secondary/40 shadow-none">
            <CardContent className="flex flex-col items-center gap-8 py-14 text-center md:flex-row md:items-start md:text-left md:py-12 md:px-14">
              <div className="flex-1">
                <h2 className="font-display text-2xl font-700 leading-tight tracking-tight text-foreground sm:text-3xl mb-3">
                  Ready to take control of your resume?
                </h2>
                <ul className="mt-4 space-y-2.5 text-xs text-muted-foreground tracking-wide">
                  {[
                    "Import from LinkedIn, GitHub & existing PDFs",
                    "AI-powered bullet point rewriting",
                    "LaTeX export with ATS-friendly templates",
                    "Free to start — no credit card required",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <CheckIcon className="size-4 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col items-center gap-3 md:items-start md:justify-center md:pt-2 shrink-0">
                <Button size="lg" className="h-11 gap-2 px-6 font-semibold w-full md:w-auto">
                  Get started free
                  <ArrowRight className="size-4" />
                </Button>
                <p className="text-xs text-muted-foreground">
                  Takes 2 minutes to set up
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-7">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
              <span className="text-xs font-bold text-primary-foreground leading-none">U</span>
            </div>
            <span className="text-sm text-muted-foreground">
              UniSync &copy; {new Date().getFullYear()}
            </span>
          </div>
          <div className="flex gap-5 text-sm text-muted-foreground">
            <a href="#" className="transition-colors hover:text-foreground">Privacy</a>
            <a href="#" className="transition-colors hover:text-foreground">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
