import AdminShell from "@/src/components/admin/shell/AdminShell";

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
