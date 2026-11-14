"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_USERS, homeFor, login, useSession } from "@/lib/auth";
import { Button, Field, Input, Notice, SectionLabel } from "./ui";

const ROLE_LABEL = { reporter: "Reporter", helper: "Helper", missionary: "Missionary", admin: "Admin" };

export default function LoginForm() {
  const router = useRouter();
  const session = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) router.replace(homeFor(session.role));
  }, [session, router]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const s = login(username, password);
    if (!s) {
      setError("Incorrect username or password.");
      return;
    }
    router.replace(homeFor(s.role));
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-zinc-900">Sign In</h2>
      <p className="mt-1 text-sm text-zinc-500">Use one of the demo accounts below.</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="Username">
          <Input
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </Field>
        <Field label="Password">
          <Input
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </Field>
        {error && <Notice tone="danger">{error}</Notice>}
        <Button type="submit" block>
          Sign In
        </Button>
      </form>

      <div className="mt-8">
        <SectionLabel>Demo Accounts</SectionLabel>
        <ul className="mt-3 divide-y divide-zinc-100 rounded-lg border border-zinc-200">
          {DEMO_USERS.map((u) => (
            <li key={u.username}>
              <button
                type="button"
                onClick={() => {
                  setUsername(u.username);
                  setPassword(u.password);
                  setError(null);
                }}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-zinc-50"
              >
                <span className="font-medium text-zinc-900">{u.username}</span>
                <span className="text-xs text-zinc-500">{ROLE_LABEL[u.role]}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-zinc-500">
          Passwords: <span className="font-mono">reporter123</span>,{" "}
          <span className="font-mono">helper123</span>,{" "}
          <span className="font-mono">missionary123</span>,{" "}
          <span className="font-mono">admin123</span>
        </p>
      </div>
    </div>
  );
}
