"use client";

import { motion } from "motion/react";
import { useEffect, useId, useState, type ReactNode } from "react";

// Confirmation for destructive actions. With a phrase, the confirm button
// stays off until the person types it.
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  busyLabel = "Deleting…",
  phrase,
  onConfirm,
  onClose,
}: {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  busyLabel?: string;
  phrase?: string;
  // Gets what was typed. Resolves to an error message to show, or nothing on success.
  onConfirm: (typed: string) => Promise<string | void>;
  onClose: () => void;
}) {
  const id = useId();
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ready = !phrase || typed.trim().toUpperCase() === phrase;

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [busy, onClose]);

  async function confirm() {
    if (!ready || busy) return;
    setBusy(true);
    setError("");
    const err = await onConfirm(typed).catch(() => "Something went wrong. Try again.");
    if (err) {
      setError(err);
      setBusy(false);
    }
  }

  return (
    <>
      <motion.button type="button" aria-label="Close" className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => !busy && onClose()} />
      <motion.div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-body`}
        className="dialog"
        // Motion owns the transform, so the centering from .dialog goes through it too.
        style={{ transform: "none" }}
        initial={{ opacity: 0, scale: 0.96, x: "-50%", y: "-46%" }}
        animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
      >
        <h2 id={`${id}-title`} className="m-0" style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em" }}>
          {title}
        </h2>
        <div id={`${id}-body`} className="flex flex-col gap-2" style={{ fontSize: 15, lineHeight: 1.55, color: "var(--ink-2)" }}>
          {children}
        </div>
        {phrase ? (
          <label className="label">
            Type {phrase} to confirm
            <input
              className="field"
              value={typed}
              autoFocus
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              disabled={busy}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void confirm()}
            />
          </label>
        ) : null}
        {error ? (
          <p role="alert" className="m-0" style={{ fontSize: 14, color: "var(--lilac-ink)" }}>
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <button type="button" className="btn" disabled={busy} onClick={onClose} autoFocus={!phrase}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" disabled={!ready || busy} onClick={() => void confirm()}>
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </motion.div>
    </>
  );
}
