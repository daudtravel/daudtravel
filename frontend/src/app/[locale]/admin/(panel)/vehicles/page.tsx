import AdminPage from "@/src/components/admin/access/AdminPage";
import VehiclesListView from "@/src/components/admin/vehicles/VehiclesListView";

export default function Page() {
  return (
    <AdminPage requires={{ module: "DRIVERS", action: "view" }}>
      <VehiclesListView />
    </AdminPage>
  );
}
