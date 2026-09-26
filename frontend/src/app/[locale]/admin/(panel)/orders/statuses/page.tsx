import AdminPage from "@/src/components/admin/access/AdminPage";
import PaymentStatusesView from "@/src/components/admin/orders/PaymentStatusesView";

export default function Page() {
  return (
    <AdminPage requires={{ module: "ONLINE_ORDERS", action: "view" }}>
      <PaymentStatusesView />
    </AdminPage>
  );
}
