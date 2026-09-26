import AdminPage from "@/src/components/admin/access/AdminPage";
import UserFormView from "@/src/components/admin/users/UserFormView";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdminPage requires="superAdmin">
      <UserFormView id={id} />
    </AdminPage>
  );
}
