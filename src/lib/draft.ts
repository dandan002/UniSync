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
