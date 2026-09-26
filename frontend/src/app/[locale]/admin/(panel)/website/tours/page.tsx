import AdminPage from "@/src/components/admin/access/AdminPage";
import ToursListView from "@/src/components/admin/website/ToursListView";

export default function Page() {
  return (
    <AdminPage requires={{ module: "WEBSITE", action: "view" }}>
      <ToursListView />
    </AdminPage>
  );
}
