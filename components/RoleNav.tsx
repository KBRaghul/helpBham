"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ROLES = [
  { href: "/reporter", label: "Reporter" },
  { href: "/helper", label: "Helper" },
  { href: "/missionary", label: "Missionary" },
  { href: "/admin", label: "Admin" },
];

export default function RoleNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        padding: "10px 16px",
        borderBottom: "1px solid #ddd",
        background: "white",
        color: "#111",
      }}
    >
      <strong style={{ marginRight: 12 }}>helpBham</strong>
      {ROLES.map((r) => {
        const active = pathname === r.href;
        return (
          <Link
            key={r.href}
            href={r.href}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              textDecoration: "none",
              background: active ? "#111" : "#f1f1f1",
              color: active ? "white" : "#111",
            }}
          >
            {r.label}
          </Link>
        );
      })}
    </nav>
  );
}
