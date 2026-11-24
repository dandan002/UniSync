"use client";

import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/brand";

export function NavTabs({ items }: { items: Array<{ href: string; label: string }> }) {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="flex flex-1 gap-6">
      {items.map((it) => (
        <Link key={it.href} className="tab" href={it.href} aria-current={path === it.href || path.startsWith(`${it.href}/`) ? "page" : undefined}>
          {it.label}
        </Link>
      ))}
    </nav>
  );
}

export function SideLinks({ items }: { items: Array<{ href: string; label: string; exact?: boolean; download?: boolean }> }) {
  const path = usePathname();
  return (
    <>
      {items.map((it) => {
        const on = it.exact ? path === it.href : path === it.href || path.startsWith(`${it.href}/`);
        return it.download ? (
          <a key={it.href} href={it.href}>
            {it.label}
          </a>
        ) : (
          <Link key={it.href} href={it.href} aria-current={on ? "page" : undefined}>
            {it.label}
          </Link>
        );
      })}
    </>
  );
}

export function AccountMenu({ name, detail, align = "right" }: { name: string; detail?: string; align?: "right" | "up" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`Account for ${name}`}
        className="flex cursor-pointer items-center gap-3 rounded-full border-0 bg-transparent p-0 text-left text-ink"
      >
        <Avatar name={name} />
        {detail ? (
          <span className="flex flex-col">
            <span style={{ fontSize: 14, fontWeight: 500 }}>{name}</span>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>{detail}</span>
          </span>
        ) : null}
      </button>
      {open ? (
        <div
          className="card card-shadow absolute z-30 flex min-w-[200px] flex-col gap-1 p-2"
          style={align === "up" ? { bottom: "calc(100% + 8px)", left: 0 } : { top: "calc(100% + 8px)", right: 0 }}
          role="menu"
        >
          <span className="px-3 py-2" style={{ fontSize: 13, color: "var(--muted)" }}>
            Signed in as {name}
          </span>
          <SignOutButton redirectUrl="/">
            <button type="button" role="menuitem" className="btn btn-sm btn-ghost" style={{ justifyContent: "flex-start" }}>
              Sign out
            </button>
          </SignOutButton>
        </div>
      ) : null}
    </div>
  );
}
