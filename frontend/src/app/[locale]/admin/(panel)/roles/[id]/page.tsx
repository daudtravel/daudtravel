import AdminPage from "@/src/components/admin/access/AdminPage";
import RoleFormView from "@/src/components/admin/roles/RoleFormView";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdminPage requires="superAdmin">
      <RoleFormView id={id} />
    </AdminPage>
  );
}
