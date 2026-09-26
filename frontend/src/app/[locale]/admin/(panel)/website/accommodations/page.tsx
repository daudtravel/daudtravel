import AdminPage from "@/src/components/admin/access/AdminPage";
import AccommodationsListView from "@/src/components/admin/website/AccommodationsListView";

export default function Page() {
  return (
    <AdminPage requires={{ module: "WEBSITE", action: "view" }}>
      <AccommodationsListView />
    </AdminPage>
  );
}
