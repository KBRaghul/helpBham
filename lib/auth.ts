"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Role, Session } from "./types";

// Hackathon demo accounts. NOT real authentication.
export type DemoUser = {
  username: string;
  password: string;
  role: Role;
  name: string;
};

export const DEMO_USERS: DemoUser[] = [
  { username: "reporter", password: "reporter123", role: "reporter", name: "Riley (Reporter)" },
  { username: "helper", password: "helper123", role: "helper", name: "Hannah (Helper)" },
  { username: "helper2", password: "helper123", role: "helper", name: "Hugo (Helper)" },
  { username: "missionary", password: "missionary123", role: "missionary", name: "Firehouse Shelter" },
  { username: "missionary2", password: "missionary123", role: "missionary", name: "Jimmie Hale Mission" },
  { username: "admin", password: "admin123", role: "admin", name: "Ada (Admin)" },
];


const KEY = "helpbham.session";
const EVENT = "helpbham:session";

export function login(username: string, password: string): Session | null {
  const u = DEMO_USERS.find(
    (d) => d.username === username.trim().toLowerCase() && d.password === password,
  );
  if (!u) return null;
  const s: Session = { username: u.username, role: u.role, name: u.name };
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
  return s;
}

export function logout() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function readRaw(): string {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

/** Returns undefined while loading (server render), null when signed out. */
export function useSession(): Session | null | undefined {
  const raw = useSyncExternalStore<string | undefined>(subscribe, readRaw, () => undefined);
  return useMemo(() => {
    if (raw === undefined) return undefined;
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Session;
    } catch {
      return null;
    }
  }, [raw]);
}

export function homeFor(role: Role) {
  return `/${role}`;
}
