import AdminPage from "@/src/components/admin/access/AdminPage";
import PaymentsDashboard from "@/src/app/[locale]/admin/_components/stats/PaymentsDashboard";

export default function Page() {
  return (
    <AdminPage requires={{ module: "ONLINE_ORDERS", action: "view" }}>
      <PaymentsDashboard />
    </AdminPage>
  );
}
