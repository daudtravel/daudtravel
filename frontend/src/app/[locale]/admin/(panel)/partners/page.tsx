import AdminPage from "@/src/components/admin/access/AdminPage";
import PartnersListView from "@/src/components/admin/partners/PartnersListView";

export default function Page() {
  return (
    <AdminPage requires={{ module: "PARTNERS", action: "view" }}>
      <PartnersListView />
    </AdminPage>
  );
}
