import RoleShell from "@/components/RoleShell";

export default function RolesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleShell>{children}</RoleShell>;
}
