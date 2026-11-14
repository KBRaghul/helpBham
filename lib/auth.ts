"use client";

import { useEffect, useState } from "react";
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

function read(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

/** Returns undefined while loading, null when signed out. */
export function useSession(): Session | null | undefined {
  const [s, setS] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    const sync = () => setS(read());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return s;
}

export function homeFor(role: Role) {
  return `/${role}`;
}
