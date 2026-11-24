"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { pressProps } from "@/components/motion";
import { AgreeLine } from "@/components/site-footer";
import { registerCompany } from "@/lib/actions/employer";

export function RegisterForm({ email }: { email: string }) {
  const router = useRouter();
  const [f, setF] = useState({ name: "", registration_type: "SEC", registration_no: "", work_email: email, phone: "", city: "", about: "" });
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));
  const personal = /@(gmail|yahoo|outlook|hotmail|icloud|live|ymail|proton(mail)?)\./i.test(f.work_email);

  return (
    <form
      className="card flex flex-col gap-4 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        setErr("");
        start(async () => {
          const res = await registerCompany(f);
          if (!res.ok) return setErr(res.error);
          router.push("/employer");
        });
      }}
    >
      <label className="label">
        Company name
        <input className="field" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Kalye Logistics Inc." required />
      </label>
      <div className="grid gap-3" style={{ gridTemplateColumns: "140px 1fr" }}>
        <label className="label">
          Registered with
          <select className="field" value={f.registration_type} onChange={(e) => set("registration_type", e.target.value)}>
            <option value="SEC">SEC</option>
            <option value="DTI">DTI</option>
          </select>
        </label>
        <label className="label">
          Registration number
          <input className="field" value={f.registration_no} onChange={(e) => set("registration_no", e.target.value)} placeholder={f.registration_type === "SEC" ? "CS201912345" : "3345521"} required />
        </label>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
        <label className="label">
          Work email
          <input className="field" type="email" value={f.work_email} onChange={(e) => set("work_email", e.target.value)} placeholder="hr@company.ph" required />
          {personal ? <span style={{ fontSize: 13, color: "var(--lilac-ink)", fontWeight: 400 }}>Personal email addresses take longer to verify.</span> : null}
        </label>
        <label className="label">
          Phone
          <input className="field" type="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+63 2 8123 4567" required />
        </label>
        <label className="label">
          City
          <input className="field" value={f.city} onChange={(e) => set("city", e.target.value)} placeholder="Pasig" required />
        </label>
      </div>
      <label className="label">
        About your company (optional)
        <textarea className="field" value={f.about} maxLength={600} onChange={(e) => set("about", e.target.value)} placeholder="A same-day delivery company serving online sellers in Metro Manila." />
      </label>
      {err ? (
        <p role="alert" className="m-0" style={{ fontSize: 14, color: "var(--lilac-ink)" }}>
          {err}
        </p>
      ) : null}
      <motion.button className="btn btn-p self-start" {...pressProps} disabled={pending}>
        {pending ? "Submitting…" : "Submit for review"}
      </motion.button>
      <AgreeLine action="submitting" />
    </form>
  );
}
