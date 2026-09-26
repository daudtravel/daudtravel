import AdminPage from "@/src/components/admin/access/AdminPage";
import DriversListView from "@/src/components/admin/drivers/DriversListView";

export default function Page() {
  return (
    <AdminPage requires={{ module: "DRIVERS", action: "view" }}>
      <DriversListView />
    </AdminPage>
  );
}
