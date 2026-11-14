import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reporter",
  description: "Report someone sleeping rough in Birmingham so a volunteer can reach them.",
  alternates: { canonical: "/reporter" },
};

export default function ReporterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
