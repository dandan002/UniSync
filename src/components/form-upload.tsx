"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Close } from "@/components/brand";
import { submitForm } from "@/lib/actions/student";
import { useSupabase } from "@/lib/supabase/browser";
import { FORM_LABELS, type FormKey } from "@/lib/types";

// Upload a CHED form to the private "forms" bucket, then mark it submitted.
export function FormUpload({ studentId, missing, label = "Upload", className = "btn btn-sm" }: { studentId: string; missing: FormKey[]; label?: string; className?: string }) {
  const router = useRouter();
  const supabase = useSupabase();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormKey | "">(missing[0] ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!missing.length) return null;

  async function upload() {
    if (!form || !file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("Upload a file under 10 MB.");
      return;
    }
    setBusy(true);
    setError("");
    const ext = (file.name.split(".").pop() || "pdf").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${studentId}/${form}-${Date.now()}.${ext}`;
    const up = await supabase.storage.from("forms").upload(path, file, { contentType: file.type || undefined, upsert: false });
    if (up.error) {
      setError(up.error.message.includes("mime") ? "Upload a PDF, JPG or PNG." : up.error.message);
      setBusy(false);
      return;
    }
    const res = await submitForm(form, path);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setOpen(false);
    setFile(null);
    router.refresh();
  }

  return (
    <>
      <button className={className} onClick={() => setOpen(true)}>
        {label}
      </button>
      <AnimatePresence>
        {open ? (
          <>
            <motion.button key="s" className="scrim" aria-label="Close upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.div
              key="d"
              role="dialog"
              aria-modal="true"
              aria-labelledby="up-h"
              className="dialog"
              initial={{ opacity: 0, scale: 0.94, x: "-50%", y: "-46%" }}
              animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
              exit={{ opacity: 0, scale: 0.96, x: "-50%", y: "-48%" }}
              style={{ transform: "none" }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <div className="flex items-start justify-between">
                <h2 id="up-h" className="display m-0" style={{ fontSize: 24 }}>
                  Upload a school form
                </h2>
                <button className="icon-btn" aria-label="Close" onClick={() => setOpen(false)}>
                  <Close />
                </button>
              </div>
              <label className="label">
                Form
                <select className="field" value={form} onChange={(e) => setForm(e.target.value as FormKey)}>
                  {missing.map((k) => (
                    <option key={k} value={k}>
                      {FORM_LABELS[k]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="label">
                File (PDF, JPG or PNG, up to 10 MB)
                <input className="field" type="file" accept="application/pdf,image/jpeg,image/png" onChange={(e) => setFile(e.target.files?.[0] ?? null)} style={{ paddingTop: 11 }} />
              </label>
              {error ? (
                <p role="alert" className="m-0" style={{ fontSize: 14, color: "var(--lilac-ink)" }}>
                  {error}
                </p>
              ) : null}
              <div className="flex justify-end gap-2 pt-1">
                <button className="btn" onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button className={`btn ${file ? "btn-p" : "btn-off"}`} disabled={!file || busy} onClick={() => void upload()}>
                  {busy ? "Uploading…" : "Upload"}
                </button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
