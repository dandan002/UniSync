import type { ReactNode } from "react";
import { Logo, Mark } from "@/components/brand";
import { AccountMenu, NavTabs, SideLinks } from "@/components/nav";

export function StudentShell({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-8 px-6">
          <div className="flex h-[72px] items-center">
            <Logo href="/home" size={26} text={18} />
          </div>
          <NavTabs
            items={[
              { href: "/home", label: "Home" },
              { href: "/jobs", label: "Jobs" },
              { href: "/resume", label: "Resume" },
            ]}
          />
          <AccountMenu name={name} />
        </div>
      </header>
      {children}
    </div>
  );
}

export function ConsoleShell({
  top,
  links,
  footer,
  children,
}: {
  top: ReactNode;
  links: Array<{ href: string; label: string; exact?: boolean; download?: boolean }>;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-wrap bg-paper text-ink">
      <nav
        aria-label="Console"
        className="side flex flex-col gap-1"
        style={{ flex: "1 1 240px", maxWidth: 260, background: "var(--surface-2)", borderRight: "1px solid var(--line)", padding: "20px 12px", boxSizing: "border-box" }}
      >
        <div style={{ padding: "0 8px 20px" }}>{top}</div>
        <SideLinks items={links} />
        <div style={{ marginTop: "auto", padding: 12 }}>{footer}</div>
      </nav>
      <main className="flex min-w-0 flex-col gap-8" style={{ flex: "999 1 640px", padding: "40px 40px 96px", boxSizing: "border-box" }}>
        {children}
      </main>
    </div>
  );
}

export function SchoolTop() {
  return <Logo href="/school" size={26} text={18} />;
}

export function PageHead({ kicker, title, actions }: { kicker?: string; title: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        {kicker ? <span style={{ fontSize: 15, fontWeight: 500, color: "var(--muted)" }}>{kicker}</span> : null}
        <h1 className="display m-0" style={{ fontSize: "clamp(30px, 3.4vw, 40px)" }}>
          {title}
        </h1>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function SetupNotice() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[640px] flex-col justify-center gap-5 px-6 py-16">
      <Mark size={48} color="var(--ink)" />
      <h1 className="display m-0" style={{ fontSize: 40 }}>
        One setup step left.
      </h1>
      <p className="m-0" style={{ fontSize: 17, lineHeight: 1.6, color: "var(--muted)" }}>
        You&apos;re signed in with Clerk, but Supabase doesn&apos;t accept Clerk sign-ins yet. In the Supabase dashboard, open Authentication, then Sign In / Providers,
        then Third-Party Auth. Add Clerk and enter this app&apos;s Clerk domain.
      </p>
      <p className="m-0" style={{ fontSize: 15, color: "var(--muted)" }}>Reload this page when it&apos;s done.</p>
    </main>
  );
}
