import AdminPage from "@/src/components/admin/access/AdminPage";
import RolesListView from "@/src/components/admin/roles/RolesListView";

export default function Page() {
  return (
    <AdminPage requires="superAdmin">
      <RolesListView />
    </AdminPage>
  );
}
