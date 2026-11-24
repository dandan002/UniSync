"use client";

import { useRef, useState } from "react";

type Recognition = {
  lang: string;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
};
type RecognitionCtor = new () => Recognition;

function recognizer(): RecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition;
}

// Voice note via the browser's speech recognition, where available.
export function Dictate({ lang, onText, compact = false }: { lang: string; onText: (t: string) => void; compact?: boolean }) {
  const [supported] = useState(() => !!recognizer());
  const [on, setOn] = useState(false);
  const rec = useRef<Recognition | null>(null);
  if (!supported) return null;
  const label = on ? "Listening… tap to stop" : "Record a voice note";
  return (
    <button
      type="button"
      className={compact ? "icon-btn" : "btn self-start"}
      aria-pressed={on}
      aria-label={compact ? label : undefined}
      title={compact ? label : undefined}
      onClick={() => {
        if (on) {
          rec.current?.stop();
          return;
        }
        const R = recognizer()!;
        const r = new R();
        r.lang = lang;
        r.interimResults = false;
        r.onresult = (e) => {
          const t = Array.from(e.results)
            .map((x) => x[0]?.transcript ?? "")
            .join(" ");
          if (t.trim()) onText(t.trim());
        };
        r.onend = () => setOn(false);
        rec.current = r;
        setOn(true);
        r.start();
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0014 0M12 18v3" />
      </svg>
      {compact ? null : label}
    </button>
  );
}
