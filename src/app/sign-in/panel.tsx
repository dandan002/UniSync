"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CodeAuth, useTicketSignIn } from "@/components/code-auth";
import { Reveal } from "@/components/motion";

const DEMOS = [
  { persona: "student", name: "Bea Santos", role: "Student with applications" },
  { persona: "newstudent", name: "Nina Garcia", role: "New student" },
  { persona: "coordinator", name: "Maria Reyes", role: "OJT coordinator" },
  { persona: "admin", name: "Ramon Cruz", role: "School admin" },
  { persona: "employer", name: "Liza Ocampo", role: "Employer, verified" },
  { persona: "pending", name: "Tess Navarro", role: "Employer, in review" },
];

export function SignInPanel({ next, as, email, demos }: { next: string; as: "student" | "school" | "employer"; email: string; demos: boolean }) {
  const router = useRouter();
  const [channel, setChannel] = useState<"email" | "phone">("email");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const ticket = useTicketSignIn();

  const heading = as === "employer" ? "Hire school-verified interns." : as === "school" ? "Log in to your school console." : "Log in to Unisync.";
  const sub =
    as === "employer"
      ? "Sign in with your work email. Then register your company so we can verify it."
      : "We'll send you a code. No password needed.";

  return (
    <>
      <Reveal i={0}>
        <h1 className="display m-0" style={{ fontSize: "clamp(36px,5vw,52px)" }}>
          {heading}
        </h1>
      </Reveal>
      <Reveal i={1}>
        <p className="m-0" style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.5 }}>
          {sub}
        </p>
      </Reveal>
      <Reveal i={2} className="flex flex-col gap-4">
        <CodeAuth key={channel} channel={channel} initial={channel === "email" ? email : ""} autoFocus onDone={() => router.push(next)} />
        <div className="flex items-center gap-3" style={{ fontSize: 14, color: "var(--faint)" }}>
          <span className="hairline flex-1" />
          or
          <span className="hairline flex-1" />
        </div>
        <button type="button" className="btn" onClick={() => setChannel(channel === "email" ? "phone" : "email")}>
          {channel === "email" ? "Use my mobile number" : "Use my email"}
        </button>
      </Reveal>

      {demos ? (
        <Reveal i={3} className="flex flex-col gap-3 pt-4">
          <div className="flex items-baseline justify-between">
            <h2 className="m-0" style={{ fontSize: 16, fontWeight: 600 }}>
              Try a demo account
            </h2>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>Sample data</span>
          </div>
          <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))" }}>
            {DEMOS.map((d) => (
              <button
                key={d.persona}
                type="button"
                className="card flex cursor-pointer flex-col items-start gap-0.5 p-3 text-left text-ink"
                style={{ font: "inherit", background: "var(--paper)" }}
                disabled={!!busy}
                onClick={async () => {
                  setBusy(d.persona);
                  setError("");
                  try {
                    await ticket(d.persona);
                    router.push("/welcome");
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Demo sign-in failed.");
                    setBusy("");
                  }
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 500 }}>{busy === d.persona ? "Signing in…" : d.name}</span>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>{d.role}</span>
              </button>
            ))}
          </div>
          {error ? (
            <p role="alert" className="m-0" style={{ fontSize: 14, color: "var(--lilac-ink)" }}>
              {error}
            </p>
          ) : null}
        </Reveal>
      ) : null}
    </>
  );
}
