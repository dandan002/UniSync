"use client";

import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useSignIn, useSignUp } from "@clerk/nextjs/legacy";
import { useState } from "react";

type Channel = "email" | "phone";

function message(err: unknown): string {
  if (isClerkAPIResponseError(err)) {
    const e = err.errors[0];
    if (e?.code === "form_code_incorrect") return "That code didn't work. Check it and try again.";
    if (e?.code === "verification_expired") return "That code expired. Send a new one.";
    if (e?.code === "form_identifier_exists") return "That account already exists. Sign in instead.";
    return e?.longMessage || e?.message || "Something went wrong. Try again.";
  }
  return err instanceof Error ? err.message : "Something went wrong. Try again.";
}

function notFound(err: unknown): boolean {
  return isClerkAPIResponseError(err) && err.errors.some((e) => e.code === "form_identifier_not_found");
}

// Normalize a Philippine mobile number to E.164 (+639XXXXXXXXX).
export function toE164(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("63")) return `+${digits}`;
  if (digits.startsWith("0")) return `+63${digits.slice(1)}`;
  return `+63${digits}`;
}

// Passwordless sign-in or sign-up with a one-time code. New people get an
// account; returning people are signed in. Calls onDone once a session exists.
export function CodeAuth({
  channel,
  initial = "",
  fullName,
  onDone,
  submitLabel,
  autoFocus,
}: {
  channel: Channel;
  initial?: string;
  fullName?: string;
  onDone: () => void | Promise<void>;
  submitLabel?: string;
  autoFocus?: boolean;
}) {
  const signInState = useSignIn();
  const signUpState = useSignUp();
  const [value, setValue] = useState(initial);
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"enter" | "code">("enter");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const ready = signInState.isLoaded && signUpState.isLoaded;
  const identifier = channel === "phone" ? toE164(value) : value.trim().toLowerCase();
  const valid = channel === "phone" ? /^\+639\d{9}$/.test(identifier) : /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(identifier);

  async function send() {
    if (!signInState.isLoaded || !signUpState.isLoaded || !valid) return;
    setBusy(true);
    setError("");
    try {
      const si = await signInState.signIn.create({ identifier });
      const factor = si.supportedFirstFactors?.find((f) => f.strategy === (channel === "phone" ? "phone_code" : "email_code"));
      if (!factor) throw new Error("This account can't get a code that way. Try the other option.");
      if (factor.strategy === "email_code") {
        await si.prepareFirstFactor({ strategy: "email_code", emailAddressId: factor.emailAddressId });
      } else if (factor.strategy === "phone_code") {
        await si.prepareFirstFactor({ strategy: "phone_code", phoneNumberId: factor.phoneNumberId });
      }
      setMode("signin");
      setStage("code");
    } catch (err) {
      if (!notFound(err)) {
        setError(message(err));
        setBusy(false);
        return;
      }
      try {
        const [firstName, ...rest] = (fullName ?? "").trim().split(/\s+/);
        const su = await signUpState.signUp.create({
          ...(channel === "phone" ? { phoneNumber: identifier } : { emailAddress: identifier }),
          ...(firstName ? { firstName, lastName: rest.join(" ") || undefined } : {}),
        });
        if (channel === "phone") await su.preparePhoneNumberVerification({ strategy: "phone_code" });
        else await su.prepareEmailAddressVerification({ strategy: "email_code" });
        setMode("signup");
        setStage("code");
      } catch (err2) {
        setError(message(err2));
      }
    }
    setBusy(false);
  }

  async function verify() {
    if (!signInState.isLoaded || !signUpState.isLoaded || code.trim().length < 6) return;
    setBusy(true);
    setError("");
    try {
      if (mode === "signin") {
        const res = await signInState.signIn.attemptFirstFactor({ strategy: channel === "phone" ? "phone_code" : "email_code", code: code.trim() });
        if (res.status !== "complete" || !res.createdSessionId) throw new Error("Finish the remaining steps to sign in.");
        await signInState.setActive({ session: res.createdSessionId });
      } else {
        const res =
          channel === "phone"
            ? await signUpState.signUp.attemptPhoneNumberVerification({ code: code.trim() })
            : await signUpState.signUp.attemptEmailAddressVerification({ code: code.trim() });
        if (res.status !== "complete" || !res.createdSessionId) throw new Error("We couldn't finish creating your account. Try again.");
        await signUpState.setActive({ session: res.createdSessionId });
      }
      await onDone();
    } catch (err) {
      setError(message(err));
      setBusy(false);
    }
  }

  if (stage === "code") {
    return (
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void verify();
        }}
      >
        <label className="label" style={{ fontSize: 15, fontWeight: 600 }}>
          Enter the six-digit code we sent to {channel === "phone" ? value : identifier}
          <input
            className="field field-lg"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            autoFocus
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            style={{ letterSpacing: "0.3em" }}
          />
        </label>
        <button className="btn btn-p" type="submit" disabled={busy || code.length < 6}>
          {busy ? "Checking…" : "Continue"}
        </button>
        <button
          type="button"
          className="link-btn self-start"
          onClick={() => {
            setStage("enter");
            setCode("");
            setError("");
          }}
        >
          Use a different {channel === "phone" ? "number" : "email"}
        </button>
        {error ? (
          <p role="alert" className="m-0" style={{ fontSize: 14, color: "var(--lilac-ink)" }}>
            {error}
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        void send();
      }}
    >
      {channel === "phone" ? (
        <label className="label" style={{ fontSize: 15, fontWeight: 600 }}>
          Mobile number
          <span className="flex gap-2">
            <span className="field field-lg flex flex-none items-center" style={{ width: "auto", background: "var(--surface)" }}>
              +63
            </span>
            <input
              className="field field-lg"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="917 123 4567"
              value={value}
              autoFocus={autoFocus}
              onChange={(e) => setValue(e.target.value)}
            />
          </span>
        </label>
      ) : (
        <label className="label" style={{ fontSize: 15, fontWeight: 600 }}>
          Email
          <input
            className="field field-lg"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="name@school.edu.ph"
            value={value}
            autoFocus={autoFocus}
            onChange={(e) => setValue(e.target.value)}
          />
        </label>
      )}
      <button className={`btn ${valid ? "btn-p" : "btn-off"}`} type="submit" disabled={!ready || busy || !valid}>
        {busy ? "Sending…" : (submitLabel ?? (channel === "phone" ? "Text me a code" : "Email me a code"))}
      </button>
      {error ? (
        <p role="alert" className="m-0" style={{ fontSize: 14, color: "var(--lilac-ink)" }}>
          {error}
        </p>
      ) : null}
      <div id="clerk-captcha" />
    </form>
  );
}

// One-click demo personas, signed in with short-lived sign-in tokens.
export function useTicketSignIn() {
  const signInState = useSignIn();
  const start = async (persona: string) => {
    if (!signInState.isLoaded) throw new Error("Still loading. Try again in a second.");
    const res = await fetch("/api/demo", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ persona }) });
    const body = (await res.json()) as { ticket?: string; error?: string };
    if (!res.ok || !body.ticket) throw new Error(body.error ?? "Demo sign-in is off.");
    const si = await signInState.signIn.create({ strategy: "ticket", ticket: body.ticket });
    if (si.status !== "complete" || !si.createdSessionId) throw new Error("Demo sign-in didn't finish.");
    await signInState.setActive({ session: si.createdSessionId });
  };
  return { ready: signInState.isLoaded, start };
}
