import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Missionary",
  description: "Manage shelter capacity and accept people who need a bed tonight.",
  alternates: { canonical: "/missionary" },
};

export default function MissionaryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
