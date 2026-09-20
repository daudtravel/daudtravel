import AdminPage from "@/src/components/admin/access/AdminPage";
import TransferOrdersView from "@/src/components/admin/orders/TransferOrdersView";

export default function Page() {
  return (
    <AdminPage requires={{ module: "ONLINE_ORDERS", action: "view" }}>
      <TransferOrdersView />
    </AdminPage>
  );
}
