import AdminPage from "@/src/components/admin/access/AdminPage";
import ToursOrderList from "@/src/app/[locale]/admin/_components/orders/ToursOrderList";

export default function Page() {
  return (
    <AdminPage requires={{ module: "ONLINE_ORDERS", action: "view" }}>
      <ToursOrderList />
    </AdminPage>
  );
}
