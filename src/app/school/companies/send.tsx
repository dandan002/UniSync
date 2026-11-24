"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { sendMoas } from "@/lib/actions/school";
import { spell } from "@/lib/format";

export function SendMoaButton({ disabled }: { disabled: boolean }) {
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
        className="btn btn-sm btn-p"
        disabled={disabled || pending}
        onClick={() =>
          start(async () => {
            const res = await sendMoas();
            setMsg(res.ok ? `Sent ${spell(res.data.count)} ${res.data.count === 1 ? "MOA" : "MOAs"}.` : res.error);
            router.refresh();
          })
        }
      >
        {pending ? "Sending…" : "Send MOAs"}
      </button>
    </span>
  );
}
