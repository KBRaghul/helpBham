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
  const allowed = !!session && (session.role === "admin" || session.role === section);

  useEffect(() => {
    if (session === null) router.replace("/");
    else if (session && !allowed) router.replace(homeFor(session.role));
  }, [session, allowed, router]);

  if (!session || !allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <RoleNav session={session} />
      <ColdBanner />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
