import RoleNav from "@/components/RoleNav";

export default function RolesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <RoleNav />
      <main style={{ padding: 16 }}>{children}</main>
    </div>
  );
}
