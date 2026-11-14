"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import type { Role, Session } from "@/lib/types";
import WeatherBadge from "./WeatherBadge";

const ROLES: { role: Role; label: string }[] = [
  { role: "reporter", label: "Reporter" },
  { role: "helper", label: "Helper" },
  { role: "missionary", label: "Missionary" },
  { role: "admin", label: "Admin" },
];

export default function RoleNav({ session }: { session: Session }) {
  const pathname = usePathname();
  const router = useRouter();
  // Admin can view every role's screen; everyone else sees only their own.
  const tabs = session.role === "admin" ? ROLES : ROLES.filter((r) => r.role === session.role);

  return (
    <nav className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-slate-200 bg-white text-slate-900">
      <strong className="mr-3">helpBham</strong>
      {tabs.map((r) => {
        const href = `/${r.role}`;
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              active ? "bg-slate-900 text-white" : "bg-slate-100 hover:bg-slate-200"
            }`}
          >
            {r.label}
          </Link>
        );
      })}
      <span className="ml-auto text-sm text-slate-600 hidden sm:inline">
        <WeatherBadge />
      </span>
      <span className="text-sm font-medium">{session.name}</span>
      <button
        onClick={() => {
          logout();
          router.replace("/");
        }}
        className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100"
      >
        Sign out
      </button>
    </nav>
  );
}
