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
    window.localStorage.removeItem(PENDING_SAVE_KEY);
  } catch {
    // ignore
  }
}

export function hasDraft(d: Draft): boolean {
  return d.updatedAt > 0 && (d.course.length > 0 || d.name.length > 0);
}

// Set when the student submits their sign-in code: "save the draft as soon
// as I'm signed in". Survives a reload during sign-in. Expires so an old
// draft never overwrites a resume later.
const PENDING_SAVE_KEY = "unisync:pending-save:v1";
const PENDING_SAVE_MS = 10 * 60_000;

export function markPendingSave() {
  try {
    window.localStorage.setItem(PENDING_SAVE_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

export function hasPendingSave(): boolean {
  try {
    const at = Number(window.localStorage.getItem(PENDING_SAVE_KEY));
    return at > 0 && Date.now() - at < PENDING_SAVE_MS;
  } catch {
    return false;
  }
}

export function clearPendingSave() {
  try {
    window.localStorage.removeItem(PENDING_SAVE_KEY);
  } catch {
    // ignore
  }
}

// Sync chat transcripts, one per student, and the "mid-chat" marker.
export const CHAT_PREFIX = "unisync:sync-chat:v1:";
export const REFINING_KEY = "unisync:refining:v1";

// After deleting a resume: the old conversation no longer applies.
export function forgetChat(studentId: string) {
  try {
    window.localStorage.removeItem(`${CHAT_PREFIX}${studentId}`);
    window.localStorage.removeItem(REFINING_KEY);
  } catch {
    // ignore
  }
}

// On sign-out, so the next person on a shared computer doesn't see the chat.
export function clearChats() {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && (k.startsWith(CHAT_PREFIX) || k === REFINING_KEY)) keys.push(k);
    }
    for (const k of keys) window.localStorage.removeItem(k);
  } catch {
    // ignore
  }
}
