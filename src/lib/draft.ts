"use client";

import { EMPTY_DRAFT, type Draft } from "@/lib/resume";

// The onboarding draft lives on this device until the student saves it.
const KEY = "unisync:draft:v1";

export function loadDraft(): Draft {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY_DRAFT };
    return { ...EMPTY_DRAFT, ...(JSON.parse(raw) as Partial<Draft>) };
  } catch {
    return { ...EMPTY_DRAFT };
  }
}

export function saveDraft(d: Draft) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...d, updatedAt: Date.now() }));
  } catch {
    // Private mode or storage full: the flow still works for this visit.
  }
}

export function clearDraft() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export function hasDraft(d: Draft): boolean {
  return d.updatedAt > 0 && (d.course.length > 0 || d.name.length > 0);
}
