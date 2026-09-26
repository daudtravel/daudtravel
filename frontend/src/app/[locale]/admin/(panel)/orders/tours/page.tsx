import AdminPage from "@/src/components/admin/access/AdminPage";
import TourOrdersView from "@/src/components/admin/orders/TourOrdersView";

export default function Page() {
  return (
    <AdminPage requires={{ module: "ONLINE_ORDERS", action: "view" }}>
      <TourOrdersView />
    </AdminPage>
  );
}
