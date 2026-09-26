import AdminPage from "@/src/components/admin/access/AdminPage";
import RoleFormView from "@/src/components/admin/roles/RoleFormView";

export default function Page() {
  return (
    <AdminPage requires="superAdmin">
      <RoleFormView />
    </AdminPage>
  );
}
