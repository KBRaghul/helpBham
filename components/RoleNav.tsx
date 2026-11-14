"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAndReload } from "@/lib/auth";
import type { Role, Session } from "@/lib/types";
import Logo from "./Logo";
import WeatherBadge from "./WeatherBadge";
import { Button } from "./ui";

const ROLES: { role: Role; label: string }[] = [
  { role: "reporter", label: "Reporter" },
  { role: "helper", label: "Helper" },
  { role: "missionary", label: "Missionary" },
  { role: "admin", label: "Admin" },
];

export default function RoleNav({ session }: { session: Session }) {
  const pathname = usePathname();
  // Admin can view every role's screen; everyone else sees only their own.
  const tabs = session.role === "admin" ? ROLES : ROLES.filter((r) => r.role === session.role);

  const links = (mobile: boolean) =>
    tabs.map((r) => {
      const href = `/${r.role}`;
      const active = pathname === href;
      return (
        <Link
          key={href}
          href={href}
          aria-current={active ? "page" : undefined}
          className={`relative flex h-full items-center text-sm font-medium transition-colors ${
            mobile ? "flex-1 justify-center" : "px-3"
          } ${active ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-900"}`}
        >
          {r.label}
          {active && (
            <span
              className={`absolute bottom-0 h-0.5 rounded-full bg-zinc-900 ${mobile ? "inset-x-2" : "inset-x-3"}`}
            />
          )}
        </Link>
      );
    });

  return (
    <header className="sticky top-0 z-[1100] border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href={`/${session.role}`} aria-label="helpBham home">
          <Logo />
        </Link>
        <nav aria-label="Workspaces" className="hidden h-full items-center gap-1 sm:flex">
          {links(false)}
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <span className="hidden text-sm text-zinc-500 md:inline">
            <WeatherBadge />
          </span>
          <span className="hidden text-sm text-zinc-900 sm:inline">{session.name}</span>
          <Button variant="secondary" size="sm" onClick={signOutAndReload}>
            Sign Out
          </Button>
        </div>
      </div>
      {/* Phones: tabs get their own full-width row so none are cut off. */}
      {tabs.length > 1 && (
        <nav aria-label="Workspaces" className="flex h-11 border-t border-zinc-100 px-2 sm:hidden">
          {links(true)}
        </nav>
      )}
    </header>
  );
}
