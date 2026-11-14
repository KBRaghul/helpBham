import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Helper",
  description: "Claim open reports, check on people and request shelter beds.",
  alternates: { canonical: "/helper" },
};

export default function HelperLayout({ children }: { children: React.ReactNode }) {
  return children;
}
