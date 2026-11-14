import type { Metadata } from "next";
import RoleShell from "@/components/RoleShell";

// Signed-in workspaces: keep them out of search results.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function RolesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleShell>{children}</RoleShell>;
}
