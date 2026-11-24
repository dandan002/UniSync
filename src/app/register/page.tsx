import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand";
import { SetupNotice } from "@/components/shells";
import { getViewer, homeFor, SetupError } from "@/lib/viewer";
import { RegisterForm } from "./form";

export const metadata: Metadata = { title: "Register your company" };

export default async function RegisterPage() {
  let viewer;
  try {
    viewer = await getViewer();
  } catch (e) {
    if (e instanceof SetupError) return <SetupNotice />;
    throw e;
  }
  if (!viewer) redirect("/sign-in?as=employer");
  if (viewer.profile.role !== "supervisor" || viewer.profile.company_id) redirect(homeFor(viewer.profile, viewer.company));
  const email = viewer.profile.email ?? "";
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <header className="mx-auto flex w-full max-w-[1200px] items-center px-6" style={{ minHeight: 76 }}>
        <Logo />
      </header>
      <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col gap-6 px-6 pb-20 pt-[4vh]">
        <h1 className="display m-0" style={{ fontSize: "clamp(36px,5vw,52px)" }}>
          Register your company.
        </h1>
        <p className="m-0" style={{ fontSize: 17, color: "var(--muted)", lineHeight: 1.5 }}>
          We check your SEC or DTI registration, a work email and a phone number before your jobs go live. You can draft jobs while we review.
        </p>
        <RegisterForm email={email} />
      </main>
    </div>
  );
}
