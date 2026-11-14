"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { homeFor, useSession } from "@/lib/auth";
import RoleNav from "./RoleNav";
import ColdBanner from "./ColdBanner";

export default function RoleShell({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const section = pathname.split("/")[1];
  const allowed =
    !!session && (session.role === "admin" || session.role === section);

  useEffect(() => {
    if (session === null) router.replace("/");
    else if (session && !allowed) router.replace(homeFor(session.role));
  }, [session, allowed, router]);

  if (!session || !allowed) {
    return <div className="p-6 text-slate-500">Loading…</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <RoleNav session={session} />
      <ColdBanner />
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
