import AdminPage from "@/src/components/admin/access/AdminPage";
import UsersListView from "@/src/components/admin/users/UsersListView";

export default function Page() {
  return (
    <AdminPage requires="superAdmin">
      <UsersListView />
    </AdminPage>
  );
}
