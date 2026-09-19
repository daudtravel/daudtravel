import AdminPage from "@/src/components/admin/access/AdminPage";
import PaymentOrdersList from "@/src/app/[locale]/admin/_components/stats/PaymentOrdersList";

export default function Page() {
  return (
    <AdminPage requires={{ module: "ONLINE_ORDERS", action: "view" }}>
      <PaymentOrdersList />
    </AdminPage>
  );
}
