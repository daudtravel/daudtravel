import AdminPage from "@/src/components/admin/access/AdminPage";
import InsuranceSubmissionsView from "@/src/components/admin/orders/InsuranceSubmissionsView";

export default function Page() {
  return (
    <AdminPage requires={{ module: "ONLINE_ORDERS", action: "view" }}>
      <InsuranceSubmissionsView />
    </AdminPage>
  );
}
