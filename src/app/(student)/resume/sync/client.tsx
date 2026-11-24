"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { ResumeData } from "@/lib/types";

// The chat keeps its transcript in localStorage, so it renders only in the browser.
const SyncChat = dynamic(() => import("@/components/sync-chat").then((m) => m.SyncChat), {
  ssr: false,
  loading: () => <div style={{ minHeight: "calc(100dvh - 120px)" }} />,
});

export function SyncClient({ studentId, initial, firstName }: { studentId: string; initial: ResumeData; firstName: string }) {
  const router = useRouter();
  return (
    <SyncChat
      studentId={studentId}
      initial={initial}
      firstName={firstName}
      top={128}
      doneLabel="Done"
      onDone={() => {
        router.push("/resume");
        router.refresh();
      }}
    />
  );
}
