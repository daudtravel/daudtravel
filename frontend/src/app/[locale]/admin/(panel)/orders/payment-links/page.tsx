import AdminPage from "@/src/components/admin/access/AdminPage";
import QuickOrdersView from "@/src/components/admin/orders/QuickOrdersView";

export default function Page() {
  return (
    <AdminPage requires={{ module: "ONLINE_ORDERS", action: "view" }}>
      <QuickOrdersView />
    </AdminPage>
  );
}
