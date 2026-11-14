"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_USERS, homeFor, login, useSession } from "@/lib/auth";
import WeatherBadge from "@/components/WeatherBadge";

export default function LoginPage() {
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
      setError("Wrong username or password.");
      return;
    }
    router.replace(homeFor(s.role));
  }

  function quick(u: (typeof DEMO_USERS)[number]) {
    setUsername(u.username);
    setPassword(u.password);
    setError(null);
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold">helpBham</h1>
          <p className="text-sm text-slate-600">
            Get people sleeping rough in Birmingham to a warm bed on cold nights.
          </p>
          <div className="mt-2 text-sm text-slate-700">
            <WeatherBadge />
          </div>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium">Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="w-full rounded-lg bg-slate-900 text-white py-2 font-medium hover:bg-slate-700">
            Sign in
          </button>
        </form>

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
            Demo accounts (tap to fill)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_USERS.map((u) => (
              <button
                key={u.username}
                type="button"
                onClick={() => quick(u)}
                className="text-left rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50"
              >
                <div className="text-sm font-medium">{u.username}</div>
                <div className="text-xs text-slate-500">{u.password}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
