import AdminPage from "@/src/components/admin/access/AdminPage";
import UserFormView from "@/src/components/admin/users/UserFormView";

export default function Page() {
  return (
    <AdminPage requires="superAdmin">
      <UserFormView />
    </AdminPage>
  );
}
