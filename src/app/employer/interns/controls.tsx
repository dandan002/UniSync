"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { approveHours, signMoa } from "@/lib/actions/employer";
import { spell } from "@/lib/format";

export function ApproveAll({ count }: { count: number }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  return (
    <span className="flex items-center gap-3">
      {msg ? (
        <span role="status" style={{ fontSize: 14, color: "var(--muted)" }}>
          {msg}
        </span>
      ) : null}
      <button
        className={`btn btn-sm ${count ? "btn-p" : ""}`}
        disabled={!count || pending}
        onClick={() =>
          start(async () => {
            const res = await approveHours();
            setMsg(res.ok ? `Approved ${spell(res.data.count)} time ${res.data.count === 1 ? "log" : "logs"}.` : res.error);
            router.refresh();
          })
        }
      >
        {count ? `Approve ${spell(count)} ${count === 1 ? "log" : "logs"}` : "All hours approved"}
      </button>
    </span>
  );
}

export function SignMoa({ schoolId }: { schoolId: string }) {
  const router = useRouter();
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  return (
    <span className="flex items-center gap-2">
      {err ? (
        <span role="alert" style={{ fontSize: 14, color: "var(--lilac-ink)" }}>
          {err}
        </span>
      ) : null}
      <button
        className="btn btn-sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await signMoa(schoolId);
            if (!res.ok) setErr(res.error);
            router.refresh();
          })
        }
      >
        {pending ? "Signing…" : "Sign MOA"}
      </button>
    </span>
  );
}
