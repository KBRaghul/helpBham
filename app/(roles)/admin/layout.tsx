import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  description: "Monitor reports, shelters and cold-night mode across Birmingham.",
  alternates: { canonical: "/admin" },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
