"use client";

import { useSyncExternalStore } from "react";
import { getSession, SESSION_CHANGED_EVENT, type Session } from "@/lib/mock-api/auth";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  window.addEventListener(SESSION_CHANGED_EVENT, listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
    window.removeEventListener(SESSION_CHANGED_EVENT, listener);
  };
}

// getSnapshot must return a referentially stable value when nothing has
// changed, or useSyncExternalStore will re-render in an infinite loop. We
// cache the last snapshot and its serialized form to compare cheaply.
let cachedSnapshot: Session | null = null;
let cachedRaw: string | null = null;

function getSnapshot(): Session | null {
  const session = getSession();
  const raw = session ? JSON.stringify(session) : null;
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSnapshot = session;
  }
  return cachedSnapshot;
}

function getServerSnapshot(): Session | null {
  return null;
}

/** Reactively reads the current auth session from localStorage. */
export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
