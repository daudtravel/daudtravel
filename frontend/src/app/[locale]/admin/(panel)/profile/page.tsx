import AdminPage from "@/src/components/admin/access/AdminPage";
import ProfileView from "@/src/components/admin/profile/ProfileView";

export default function Page() {
  return (
    <AdminPage requires="authenticated">
      <ProfileView />
    </AdminPage>
  );
}
