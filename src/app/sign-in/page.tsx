import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand";
import { SignInPanel } from "./panel";

export const metadata: Metadata = { title: "Log in" };

function safeNext(v: string | string[] | undefined): string {
  const s = Array.isArray(v) ? v[0] : v;
  if (!s) return "/welcome";
  try {
    // Clerk passes absolute redirect_url values; keep only same-site paths.
    const u = new URL(s, "http://x");
    const path = `${u.pathname}${u.search}`;
    return path.startsWith("/") && !path.startsWith("//") ? path : "/welcome";
  } catch {
    return "/welcome";
  }
}

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const sp = await searchParams;
  const next = safeNext(sp.redirect_url ?? sp.next);
  const { userId } = await auth();
  if (userId) redirect(next);
  const as = sp.as === "employer" ? "employer" : sp.as === "school" ? "school" : "student";
  const email = typeof sp.email === "string" ? sp.email : "";
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <header className="mx-auto flex w-full max-w-[1200px] items-center px-6" style={{ minHeight: 76 }}>
        <Logo />
      </header>
      <main className="mx-auto flex w-full max-w-[460px] flex-1 flex-col gap-6 px-6 pb-20 pt-[6vh]">
        <SignInPanel next={as === "employer" ? `/welcome?as=employer` : next} as={as} email={email} demos={process.env.DEMO_LOGINS === "on"} />
      </main>
    </div>
  );
}
