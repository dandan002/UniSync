"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { formFileUrl, reviewForm } from "@/lib/actions/school";
import type { FormKey, FormStatus } from "@/lib/types";

export function FormCell({ studentId, formKey, status, path }: { studentId: string; formKey: FormKey; status: FormStatus; path: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  if (status === "approved") return <span style={{ color: "var(--accent)", fontWeight: 500 }}>Approved</span>;
  if (status === "missing") return <span style={{ color: "var(--faint)" }}>Missing</span>;
  return (
    <span className="flex items-center gap-2">
      {path ? (
        <button
          className="link-btn"
          style={{ height: 32, color: "var(--accent)", fontWeight: 500 }}
          onClick={() =>
            start(async () => {
              const res = await formFileUrl(path);
              if (res.ok) window.open(res.data.url, "_blank", "noopener");
              else setErr(res.error);
            })
          }
        >
          View
        </button>
      ) : (
        <span style={{ color: "var(--ink-2)" }}>Submitted</span>
      )}
      <button
        className="btn btn-sm"
        style={{ height: 32, padding: "0 10px" }}
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await reviewForm(studentId, formKey, true);
            if (!res.ok) setErr(res.error);
            router.refresh();
          })
        }
      >
        Approve
      </button>
      {err ? (
        <span role="alert" style={{ fontSize: 12, color: "var(--lilac-ink)" }}>
          {err}
        </span>
      ) : null}
    </span>
  );
}
