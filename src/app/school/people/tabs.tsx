"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Avatar, Close } from "@/components/brand";
import { pressProps } from "@/components/motion";
import { approveCompany, invitePeople, setMember } from "@/lib/actions/school";
import { spell } from "@/lib/format";
import type { Role } from "@/lib/types";

export type Person = { id: string; name: string; email: string; role: Role; scope: string; status: "Active" | "Paused" | "Invited"; last: string; self: boolean; editable: boolean };
export type CompanyCheck = { id: string; name: string; verified: boolean; checks: Array<{ n: string; v: string; ok: boolean }> };

const ROLE_LABEL: Record<Role, string> = { student: "Student", coordinator: "Coordinator", supervisor: "Supervisor", admin: "Admin" };
const AV: Record<Role, [string, string]> = {
  student: ["var(--soft)", "var(--accent)"],
  coordinator: ["var(--lilac-soft)", "var(--lilac-ink)"],
  supervisor: ["var(--soft)", "var(--accent)"],
  admin: ["var(--lilac-soft)", "var(--lilac-ink)"],
};
const ROLES_CAN: Array<{ name: string; can: string[] }> = [
  { name: "Student", can: ["Build and edit their resume", "Apply to verified companies", "Sign their own forms"] },
  { name: "Coordinator", can: ["See their programs' students", "Approve placements and forms", "Export CHED reports"] },
  { name: "Supervisor", can: ["Approve intern hours", "Move applicants and send offers", "Sign MOAs for their company"] },
  { name: "Admin", can: ["All coordinator permissions", "Manage people and roles", "Approve companies"] },
];

export function PeopleTabs({ isAdmin, people, companies, audit, emailDomain }: { isAdmin: boolean; people: Person[]; companies: CompanyCheck[]; audit: Array<{ id: number; t: string; who: string; what: string }>; emailDomain: string }) {
  const router = useRouter();
  const tabs = ["People", "Roles", ...(isAdmin ? ["Company verification"] : []), "Activity"];
  const [tab, setTab] = useState(tabs[0]!);
  const [invite, setInvite] = useState(false);
  const [toast, setToast] = useState("");
  const [pending, start] = useTransition();
  const [approved, setApproved] = useState<string[]>([]);

  function flash(m: string) {
    setToast(m);
    setTimeout(() => setToast(""), 3200);
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div role="tablist" aria-label="Sections" className="relative flex gap-8" style={{ borderBottom: "1px solid var(--line)" }}>
          {tabs.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              className="relative h-12 cursor-pointer border-0 bg-transparent p-0"
              style={{ font: "inherit", fontSize: 15, fontWeight: 500, color: tab === t ? "var(--ink)" : "var(--muted)" }}
              onClick={() => setTab(t)}
            >
              {t}
              {tab === t ? <motion.span layoutId="ul" className="absolute left-0 right-0 rounded" style={{ bottom: -1, height: 3, background: "var(--mark)" }} transition={{ type: "spring", stiffness: 380, damping: 30 }} /> : null}
            </button>
          ))}
        </div>
        <motion.button className="btn btn-sm btn-p" {...pressProps} onClick={() => setInvite(true)}>
          Invite
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.25 }}>
          {tab === "People" ? (
            <section aria-label="People list" className="card overflow-x-auto">
              <table className="table" style={{ minWidth: 820 }}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Scope</th>
                    <th>Status</th>
                    <th>Last seen</th>
                    <th>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {people.map((p) => (
                    <tr key={p.id} className="row">
                      <td style={{ height: 68 }}>
                        <span className="flex items-center gap-3">
                          <Avatar name={p.name} bg={AV[p.role][0]} fg={AV[p.role][1]} />
                          <span className="flex flex-col gap-0.5">
                            <span style={{ fontWeight: 500 }}>
                              {p.name}
                              {p.self ? <span style={{ color: "var(--muted)", fontWeight: 400 }}> (you)</span> : null}
                            </span>
                            <span style={{ fontSize: 13, color: "var(--muted)" }}>{p.email}</span>
                          </span>
                        </span>
                      </td>
                      <td>
                        {p.editable ? (
                          <label>
                            <span className="sr-only">Role for {p.name}</span>
                            <select
                              className="field"
                              style={{ height: 40, borderRadius: 12, width: "auto" }}
                              defaultValue={p.role}
                              onChange={(e) =>
                                start(async () => {
                                  const res = await setMember(p.id, { role: e.target.value as Role });
                                  flash(res.ok ? `${p.name} is now ${e.target.value === "admin" ? "an admin" : `a ${e.target.value}`}.` : res.error);
                                  router.refresh();
                                })
                              }
                            >
                              <option value="student">Student</option>
                              <option value="coordinator">Coordinator</option>
                              <option value="admin">Admin</option>
                            </select>
                          </label>
                        ) : (
                          <span>{ROLE_LABEL[p.role]}</span>
                        )}
                      </td>
                      <td style={{ color: "var(--ink-2)" }}>{p.scope}</td>
                      <td style={{ color: p.status === "Paused" ? "var(--lilac-ink)" : "var(--accent)", fontWeight: 500 }}>{p.status}</td>
                      <td style={{ color: "var(--muted)" }}>{p.last}</td>
                      <td>
                        {p.editable ? (
                          <button
                            className="link-btn"
                            style={{ height: 36, fontWeight: 500 }}
                            disabled={pending}
                            onClick={() =>
                              start(async () => {
                                const res = await setMember(p.id, { status: p.status === "Paused" ? "active" : "paused" });
                                flash(res.ok ? `${p.name} ${p.status === "Paused" ? "reactivated" : "paused"}.` : res.error);
                                router.refresh();
                              })
                            }
                          >
                            {p.status === "Paused" ? "Reactivate" : "Pause"}
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : null}

          {tab === "Roles" ? (
            <section aria-label="What each role can do" className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(240px,100%),1fr))" }}>
              {ROLES_CAN.map((r) => (
                <div key={r.name} className="card flex flex-col gap-3 p-6">
                  <span style={{ fontSize: 18, fontWeight: 600 }}>{r.name}</span>
                  <ul className="m-0 flex flex-col gap-2 pl-4" style={{ fontSize: 15, lineHeight: 1.45, color: "var(--ink-2)" }}>
                    {r.can.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ) : null}

          {tab === "Company verification" ? (
            <section aria-label="Company checks" className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(300px,100%),1fr))" }}>
              {companies.map((c) => {
                const ok = c.verified || approved.includes(c.id);
                return (
                  <motion.div key={c.id} layout className="flex flex-col gap-4 rounded-xl p-6" style={{ border: `1px solid ${ok ? "var(--line-2)" : "var(--line)"}`, background: ok ? "var(--surface-2)" : "var(--paper)" }}>
                    <div className="flex items-baseline justify-between">
                      <span style={{ fontSize: 18, fontWeight: 600 }}>{c.name}</span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: ok ? "var(--accent)" : "var(--lilac-ink)" }}>{ok ? "Verified" : "Needs review"}</span>
                    </div>
                    <div className="flex flex-col gap-2" style={{ fontSize: 15 }}>
                      {c.checks.map((k) => (
                        <span key={k.n} className="flex justify-between">
                          <span style={{ color: "var(--muted)" }}>{k.n}</span>
                          <span style={{ fontWeight: 500, color: ok || k.ok ? "var(--accent)" : "var(--lilac-ink)" }}>{ok ? (k.n === "Phone check" ? "Done" : k.n === "Work email" ? "Confirmed" : "Matches") : k.v}</span>
                        </span>
                      ))}
                    </div>
                    {!ok ? (
                      <div className="flex gap-2">
                        <motion.button
                          className="btn btn-sm btn-p"
                          {...pressProps}
                          disabled={pending}
                          onClick={() =>
                            start(async () => {
                              const res = await approveCompany(c.id);
                              if (res.ok) setApproved((a) => [...a, c.id]);
                              flash(res.ok ? `${c.name} is verified. Its jobs are live.` : res.error);
                              router.refresh();
                            })
                          }
                        >
                          Approve
                        </motion.button>
                        <a className="btn btn-sm" href={`mailto:?subject=${encodeURIComponent(`Unisync verification for ${c.name}`)}`}>
                          Request details
                        </a>
                      </div>
                    ) : null}
                  </motion.div>
                );
              })}
            </section>
          ) : null}

          {tab === "Activity" ? (
            <section aria-label="Activity" className="card">
              {audit.length === 0 ? (
                <p className="m-0 p-5" style={{ color: "var(--muted)" }}>
                  No activity yet.
                </p>
              ) : null}
              {audit.map((a) => (
                <div key={a.id} className="flex flex-wrap items-baseline gap-x-5 gap-y-1 px-5 py-4" style={{ borderBottom: "1px solid var(--line-3)", fontSize: 15 }}>
                  <span className="flex-none" style={{ color: "var(--muted)", width: 130 }}>
                    {a.t}
                  </span>
                  <span>
                    <span style={{ fontWeight: 500 }}>{a.who}</span> {a.what}
                  </span>
                </div>
              ))}
            </section>
          ) : null}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>{invite ? <InviteDialog isAdmin={isAdmin} emailDomain={emailDomain} onClose={() => setInvite(false)} onDone={(m) => { flash(m); router.refresh(); }} /> : null}</AnimatePresence>

      <AnimatePresence>
        {toast ? (
          <motion.div key="t" role="status" className="toast" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}>
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function InviteDialog({ isAdmin, emailDomain, onClose, onDone }: { isAdmin: boolean; emailDomain: string; onClose: () => void; onDone: (m: string) => void }) {
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState<Role>(isAdmin ? "coordinator" : "student");
  const [scope, setScope] = useState("");
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  return (
    <>
      <motion.button key="s" className="scrim" aria-label="Close invite" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div key="d" role="dialog" aria-modal="true" aria-labelledby="inv-h" className="dialog" style={{ transform: "none" }} initial={{ opacity: 0, scale: 0.94, x: "-50%", y: "-46%" }} animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }} exit={{ opacity: 0, x: "-50%", y: "-48%" }} transition={{ type: "spring", stiffness: 320, damping: 24 }}>
        <div className="flex items-start justify-between">
          <h2 id="inv-h" className="display m-0" style={{ fontSize: 24 }}>
            Invite people
          </h2>
          <button className="icon-btn" aria-label="Close" onClick={onClose}>
            <Close />
          </button>
        </div>
        <label className="label">
          Emails
          <input className="field" value={emails} onChange={(e) => setEmails(e.target.value)} placeholder={`name@${emailDomain}`} />
        </label>
        <label className="label">
          Role
          <select className="field" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {isAdmin ? (
              <>
                <option value="coordinator">Coordinator</option>
                <option value="admin">Admin</option>
              </>
            ) : null}
            <option value="student">Student</option>
          </select>
        </label>
        {role !== "student" ? (
          <label className="label">
            Programs (optional)
            <input className="field" value={scope} onChange={(e) => setScope(e.target.value)} placeholder="BSIT, BSCS" />
          </label>
        ) : null}
        {err ? (
          <p role="alert" className="m-0" style={{ fontSize: 14, color: "var(--lilac-ink)" }}>
            {err}
          </p>
        ) : null}
        <div className="flex justify-end gap-2 pt-1">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-p"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await invitePeople(emails, role, scope);
                if (!res.ok) return setErr(res.error);
                onDone(`Invited ${spell(res.data.count)} ${res.data.count === 1 ? "person" : "people"}.`);
                onClose();
              })
            }
          >
            {pending ? "Sending…" : "Send invites"}
          </button>
        </div>
      </motion.div>
    </>
  );
}
