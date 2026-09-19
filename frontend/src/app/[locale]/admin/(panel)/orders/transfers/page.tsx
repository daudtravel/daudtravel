import AdminPage from "@/src/components/admin/access/AdminPage";
import TransfersOrderList from "@/src/app/[locale]/admin/_components/orders/TransfersOrderList";

export default function Page() {
  return (
    <AdminPage requires={{ module: "ONLINE_ORDERS", action: "view" }}>
      <TransfersOrderList />
    </AdminPage>
  );
}
