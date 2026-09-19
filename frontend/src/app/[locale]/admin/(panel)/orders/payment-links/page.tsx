import AdminPage from "@/src/components/admin/access/AdminPage";
import { QuickPaymentOrders } from "@/src/app/[locale]/admin/_components/quick-payment/QuicPaymentOrders";

export default function Page() {
  return (
    <AdminPage requires={{ module: "ONLINE_ORDERS", action: "view" }}>
      <QuickPaymentOrders />
    </AdminPage>
  );
}
