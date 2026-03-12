import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Nav */}
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
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
          <Link href="/" className="font-display text-xl font-700 tracking-tight text-foreground">
            UniSync
          </Link>
          <span className="text-xs text-muted-foreground">
            Have an account?{" "}
            <Link href="/sign-in" className="text-foreground underline underline-offset-2">
              Sign in
            </Link>
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px w-8 bg-foreground" />
              <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Free to start
              </span>
            </div>
            <h1 className="font-display text-4xl font-800 leading-tight tracking-tight text-foreground">
              Build your career<br />
              <em className="italic font-400">profile.</em>
            </h1>
          </div>

          <SignUp
            appearance={{
              variables: {
                colorBackground: "oklch(0.982 0.003 80)",
                colorInputBackground: "oklch(1 0 0)",
                colorText: "oklch(0.09 0 0)",
                colorTextSecondary: "oklch(0.46 0 0)",
                colorPrimary: "oklch(0.09 0 0)",
                colorInputText: "oklch(0.09 0 0)",
                colorNeutral: "oklch(0.09 0 0)",
                borderRadius: "0.25rem",
                fontFamily: "var(--font-mono), ui-monospace, monospace",
                fontSize: "13px",
              },
              elements: {
                card: "shadow-none border border-border bg-background rounded-sm",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                header: "hidden",
                socialButtonsBlockButton:
                  "border border-border rounded-sm text-xs font-medium bg-background hover:bg-secondary transition-colors",
                socialButtonsBlockButtonText: "font-medium",
                dividerLine: "bg-border",
                dividerText: "text-muted-foreground text-[10px] uppercase tracking-widest",
                formFieldLabel: "text-[11px] uppercase tracking-widest text-muted-foreground",
                formFieldInput:
                  "rounded-sm border-border text-xs bg-background focus:ring-1 focus:ring-foreground focus:border-foreground transition-shadow",
                formButtonPrimary:
                  "bg-foreground text-background hover:bg-foreground/90 rounded-sm text-xs font-semibold transition-opacity",
                footerActionText: "text-[11px] text-muted-foreground",
                footerActionLink: "text-foreground text-[11px] underline underline-offset-2 font-medium",
                identityPreviewEditButton: "text-foreground",
                formResendCodeLink: "text-foreground",
                otpCodeFieldInput: "rounded-sm border-border",
                alert: "rounded-sm text-xs",
                alertText: "text-xs",
              },
            }}
          />
        </div>
      </main>

      {/* Footer */}
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
